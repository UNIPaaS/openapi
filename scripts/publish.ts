// Usage: tsx scripts/publish.ts --spec <path> --sha <platform-api-sha> --date <iso8601>
// Commits the new spec as latest, pushes, and cuts a GitHub Release with the provenance tag.
// Requires: gh CLI authenticated with contents:write on this repo; run inside a clone of it.
// (Phase 3 extends this to also generate a CHANGELOG.md entry via oasdiff.)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
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

interface OpenApiSpec {
  info: { version: string };
}

const specPath = arg('spec');
const sha = arg('sha');
const isoDate = arg('date');

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8')) as OpenApiSpec;
const tag = releaseTag({ infoVersion: spec.info.version, isoDate, sha });

fs.copyFileSync(specPath, 'openapi.json');
run('git', ['add', 'openapi.json']);
const dirty = capture('git', ['status', '--porcelain']).trim();
if (dirty) {
  run('git', ['commit', '-m', `chore: publish spec ${tag}`]);
  run('git', ['push', 'origin', 'HEAD']);
} else {
  console.log('working tree clean; skipping commit');
}
run('gh', [
  'release',
  'create',
  tag,
  'openapi.json',
  '--repo',
  'UNIPaaS/openapi',
  '--title',
  tag,
  '--notes',
  `Published from platform-api ${sha.slice(0, 7)} on ${isoDate.slice(0, 10)}.`,
]);
console.log(`published ${tag}`);
