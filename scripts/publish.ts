// Usage: npm run publish:spec -- --spec <path> --sha <source-commit-sha> --date <iso8601> --sequence <int>
// The hub's publish entrypoint. Producers stay dumb: they generate a spec and hand it over; ordering,
// change-detection, idempotency, the tag scheme, and release self-heal all live here. `--sequence` is
// a monotonic deploy key (the producer's CI pipeline id) so HEAD mirrors the most recent production deploy.
// Run inside a clone of this repo with gh authenticated (contents:write). Decision logic is in
// publish-logic.ts (unit-tested); this file is the I/O around it.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dump as toYaml } from 'js-yaml';
import { releaseTag } from './release-tag';
import { classify, type OpenApiSpec, type Provenance } from './publish-logic';

const REPO = 'UNIPaaS/openapi';
const SPEC_JSON = 'spec/openapi.json';
const SPEC_YAML = 'spec/openapi.yaml';
const PROVENANCE_FILE = 'spec/provenance.json';

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
const releaseExists = (tag: string): boolean => {
  try {
    execFileSync('gh', ['release', 'view', tag, '--repo', REPO], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const readJson = <T>(path: string): T => JSON.parse(fs.readFileSync(path, 'utf8')) as T;
const notes = (version: string, sha: string, isoDate: string): string =>
  [`Spec version \`${version}\`.`, `From source commit ${sha.slice(0, 7)} on ${isoDate.slice(0, 10)}.`].join('\n');
// Create the release from the committed assets. Idempotent: skip if the tag is already released.
const ensureRelease = (tag: string, body: string): void => {
  if (releaseExists(tag)) {
    console.log(`release ${tag} already exists; nothing to do`);
    return;
  }
  run('gh', ['release', 'create', tag, SPEC_JSON, SPEC_YAML, '--repo', REPO, '--title', tag, '--notes', body]);
  console.log(`released ${tag}`);
};

const specPath = arg('spec');
const sha = arg('sha');
const isoDate = arg('date');
const sequence = Number(arg('sequence'));
if (!Number.isInteger(sequence) || sequence < 0) {
  throw new Error(`--sequence must be a non-negative integer, got ${arg('sequence')}`);
}

const incoming = readJson<OpenApiSpec>(specPath);
const current = fs.existsSync(SPEC_JSON) ? readJson<unknown>(SPEC_JSON) : null;
const provenance = fs.existsSync(PROVENANCE_FILE) ? readJson<Provenance>(PROVENANCE_FILE) : null;
const lastSequence = provenance ? provenance.sequence : -1;

const stage = classify({ sequence, lastSequence, currentSpec: current, incomingSpec: incoming });

if (stage === 'stale') {
  console.log(`stale deploy (sequence ${sequence} < last published ${lastSequence}); skipping`);
  process.exit(0);
}

if (stage === 'changed') {
  const tag = releaseTag({ infoVersion: incoming.info.version, isoDate, sha });
  // Write both formats: JSON for tooling, YAML for human-readable diffs and language-agnostic codegen.
  fs.copyFileSync(specPath, SPEC_JSON);
  fs.writeFileSync(SPEC_YAML, toYaml(incoming, { lineWidth: -1, noRefs: true }));
  fs.writeFileSync(PROVENANCE_FILE, `${JSON.stringify({ sequence, sha, timestamp: isoDate, tag } satisfies Provenance, null, 2)}\n`);
  run('git', ['add', SPEC_JSON, SPEC_YAML, PROVENANCE_FILE]);
  if (capture('git', ['status', '--porcelain']).trim()) {
    run('git', ['commit', '-m', `chore: publish spec ${tag}`]);
    run('git', ['push', 'origin', 'HEAD']);
  } else {
    console.log('working tree clean; skipping commit');
  }
  // Ensure the release exists after the commit/push, so a retry whose commit landed but whose release
  // failed still creates it.
  ensureRelease(tag, notes(incoming.info.version, sha, isoDate));
  process.exit(0);
}

// stage === 'unchanged': HEAD content is already current. The only thing that can still need doing is
// healing a release that a prior run committed but failed to create.
if (provenance && !releaseExists(provenance.tag)) {
  const version = (current as OpenApiSpec | null)?.info?.version ?? incoming.info.version;
  console.log(`spec unchanged but release ${provenance.tag} is missing; healing`);
  ensureRelease(provenance.tag, notes(version, provenance.sha, provenance.timestamp));
} else {
  console.log('spec unchanged and release present; nothing to do');
}
