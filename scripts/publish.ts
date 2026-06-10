// Usage: npm run publish:spec -- --spec <path> --sha <platform-api-sha> --date <iso8601>
// The hub's publish entrypoint. Given a freshly generated spec, decide whether it differs from what
// HEAD already serves; if so, commit it as latest, push, and cut a provenance-tagged GitHub Release.
// Change-detection, idempotency, and the tag scheme all live here so producers stay dumb (they just
// generate a spec and hand it over). Run inside a clone of this repo with gh authenticated
// (contents:write).
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

const incoming = JSON.parse(fs.readFileSync(specPath, 'utf8')) as OpenApiSpec;
const tag = releaseTag({ infoVersion: incoming.info.version, isoDate, sha });

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
run('git', ['add', 'openapi.json', 'openapi.yaml']);
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
