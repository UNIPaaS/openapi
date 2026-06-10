// Usage: npm run publish:spec -- --spec <path> --sha <platform-api-sha> --date <iso8601> --sequence <int>
// The hub's publish entrypoint. Given a freshly generated spec, decide whether it differs from what
// HEAD already serves; if so, commit it as latest, push, and cut a provenance-tagged GitHub Release.
// Change-detection, ordering, idempotency, and the tag scheme all live here so producers stay dumb
// (they just generate a spec and hand it over). `--sequence` is a monotonic deploy key (GitLab's
// CI_PIPELINE_ID) so HEAD mirrors the most recent production deploy, never an older one that lands
// late. Run inside a clone of this repo with gh authenticated (contents:write).
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dump as toYaml } from 'js-yaml';
import { releaseTag } from './release-tag';

function arg(name: string): string {
  const i = process.argv.indexOf(`--${name}`);
  const val = i === -1 ? undefined : process.argv[i + 1];
  if (!val) throw new Error(`missing --${name}`);
  return val;
}

const run = (cmd: string, args: string[]): void => {
  execFileSync(cmd, args, { stdio: 'inherit' });
};
const capture = (cmd: string, args: string[]): string => execFileSync(cmd, args).toString();

// True if a release for this tag already exists. `gh release view` exits non-zero when it does not.
const releaseExists = (releaseTag: string): boolean => {
  try {
    execFileSync('gh', ['release', 'view', releaseTag, '--repo', 'UNIPaaS/openapi'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

interface OpenApiSpec {
  info: { version: string };
}

// Provenance of the last publish, committed alongside the spec. Its `sequence` is the ordering key:
// a publish from an older deploy than the one recorded here is stale and rejected.
interface Provenance {
  sequence: number;
  sha: string;
  timestamp: string;
  tag: string;
}
const PROVENANCE_FILE = 'provenance.json';
const lastPublishedSequence = (): number => {
  if (!fs.existsSync(PROVENANCE_FILE)) return -1;
  return (JSON.parse(fs.readFileSync(PROVENANCE_FILE, 'utf8')) as Provenance).sequence;
};

// Deterministic JSON with object keys sorted recursively (arrays keep their order), so two specs
// compare equal regardless of incidental key ordering. The input is always parsed JSON, so there are
// no exotic value types to handle.
const canonicalJson = (value: unknown): string => {
  const sortKeys = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v !== null && typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      return Object.keys(obj)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = sortKeys(obj[key]);
          return acc;
        }, {});
    }
    return v;
  };
  return JSON.stringify(sortKeys(value));
};

const specPath = arg('spec');
const sha = arg('sha');
const isoDate = arg('date');
const sequence = Number(arg('sequence'));
if (!Number.isInteger(sequence) || sequence < 0) {
  throw new Error(`--sequence must be a non-negative integer, got ${arg('sequence')}`);
}

const incoming = JSON.parse(fs.readFileSync(specPath, 'utf8')) as OpenApiSpec;
const tag = releaseTag({ infoVersion: incoming.info.version, isoDate, sha });

// Ordering guard: HEAD mirrors the most recent production deploy. A publish from an older deploy than
// the last one recorded (a late-landing concurrent pipeline, or a re-run of an old pipeline) is stale
// and dropped. A rollback is a newer deploy, so it passes and the spec follows live.
const published = lastPublishedSequence();
if (sequence <= published) {
  console.log(`stale deploy (sequence ${sequence} <= last published ${published}); skipping`);
  process.exit(0);
}

// If the incoming spec is identical to what HEAD already serves, there is nothing to publish.
if (fs.existsSync('openapi.json')) {
  const current = JSON.parse(fs.readFileSync('openapi.json', 'utf8')) as unknown;
  if (canonicalJson(current) === canonicalJson(incoming)) {
    console.log('spec unchanged since last publish; nothing to do');
    process.exit(0);
  }
}

// Write both formats: JSON for tooling, YAML for human-readable diffs and language-agnostic codegen.
fs.copyFileSync(specPath, 'openapi.json');
fs.writeFileSync('openapi.yaml', toYaml(incoming, { lineWidth: -1, noRefs: true }));
// Record this deploy's provenance; the sequence advances only on an actual publish.
const provenance: Provenance = { sequence, sha, timestamp: isoDate, tag };
fs.writeFileSync(PROVENANCE_FILE, `${JSON.stringify(provenance, null, 2)}\n`);
run('git', ['add', 'openapi.json', 'openapi.yaml', PROVENANCE_FILE]);
const dirty = capture('git', ['status', '--porcelain']).trim();
if (dirty) {
  run('git', ['commit', '-m', `chore: publish spec ${tag}`]);
  run('git', ['push', 'origin', 'HEAD']);
} else {
  console.log('working tree clean; skipping commit');
}
// After the commit/push, so a retry that committed but failed to release still creates the release,
// while a re-run of an already-published tag is a no-op.
if (releaseExists(tag)) {
  console.log(`release ${tag} already exists; nothing to publish`);
  process.exit(0);
}
const notes = [
  `Spec version \`${incoming.info.version}\`.`,
  `From platform-api ${sha.slice(0, 7)} on ${isoDate.slice(0, 10)}.`,
].join('\n');
run('gh', [
  'release',
  'create',
  tag,
  'openapi.json',
  'openapi.yaml',
  '--repo',
  'UNIPaaS/openapi',
  '--title',
  tag,
  '--notes',
  notes,
]);
console.log(`published ${tag}`);
