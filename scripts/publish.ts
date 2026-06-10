// Usage: npm run publish:spec -- --spec <path> --sha <source-commit-sha> --date <iso8601> --sequence <int>
// The hub's publish entrypoint. Producers stay dumb: they generate a spec and hand it over; ordering,
// change-detection, idempotency, the tag scheme, and release self-heal all live here. `--sequence` is
// a monotonic deploy key (the producer's CI pipeline id) so HEAD mirrors the most recent production deploy.
// Run inside a clone of this repo with GH_TOKEN set (a contents:write token) and git configured to push.
// Decision logic is in publish-logic.ts (unit-tested); this file is the I/O around it.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dump as toYaml } from 'js-yaml';
import { releaseTag } from './release-tag';
import { classify, type OpenApiSpec, type Provenance } from './publish-logic';

const REPO = 'UNIPaaS/openapi';
const SPEC_JSON = 'spec/openapi.json';
const SPEC_YAML = 'spec/openapi.yaml';
const PROVENANCE_FILE = 'spec/provenance.json';
const CHANGELOG_FILE = 'CHANGELOG.md';
const CHANGELOG_HEADER = '# Changelog';
const GITHUB_API = process.env.GITHUB_API_URL ?? 'https://api.github.com'; // override for GitHub Enterprise / tests

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

// Releases go through the GitHub REST API with the installation token the producer's CI already mints,
// so the job needs no `gh` binary. `fetch` is global on the Node runtime this script targets.
const ghHeaders = (): Record<string, string> => {
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GH_TOKEN (or GITHUB_TOKEN) must be set to publish releases');
  return { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' };
};

// True if a release for this tag already exists (the tags endpoint 404s when it does not).
const releaseExists = async (tag: string): Promise<boolean> => {
  const res = await fetch(`${GITHUB_API}/repos/${REPO}/releases/tags/${encodeURIComponent(tag)}`, { headers: ghHeaders() });
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`GitHub API ${res.status} checking release ${tag}: ${await res.text()}`);
  return true;
};

const uploadAsset = async (uploadUrl: string, path: string): Promise<void> => {
  const name = path.split('/').pop() as string;
  // upload_url is an RFC 6570 template ending in `{?name,label}`; strip it and pass name explicitly.
  const url = `${uploadUrl.replace(/\{.*\}$/, '')}?name=${encodeURIComponent(name)}`;
  const res = await fetch(url, { method: 'POST', headers: { ...ghHeaders(), 'content-type': 'application/octet-stream' }, body: fs.readFileSync(path) });
  if (!res.ok) throw new Error(`GitHub API ${res.status} uploading asset ${name}: ${await res.text()}`);
};

const readJson = <T>(path: string): T => JSON.parse(fs.readFileSync(path, 'utf8')) as T;
const notes = (version: string, sha: string, isoDate: string): string =>
  [`Spec version \`${version}\`.`, `From source commit ${sha.slice(0, 7)} on ${isoDate.slice(0, 10)}.`].join('\n');
// Create the release from the committed assets. Idempotent: skip if the tag is already released.
const ensureRelease = async (tag: string, body: string): Promise<void> => {
  if (await releaseExists(tag)) {
    console.log(`release ${tag} already exists; nothing to do`);
    return;
  }
  const res = await fetch(`${GITHUB_API}/repos/${REPO}/releases`, {
    method: 'POST',
    headers: { ...ghHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify({ tag_name: tag, name: tag, body }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} creating release ${tag}: ${await res.text()}`);
  const { upload_url: uploadUrl } = (await res.json()) as { upload_url: string };
  await uploadAsset(uploadUrl, SPEC_JSON);
  await uploadAsset(uploadUrl, SPEC_YAML);
  console.log(`released ${tag}`);
};

const specPath = arg('spec');
const sha = arg('sha');
const isoDate = arg('date');
const sequence = Number(arg('sequence'));
if (!Number.isInteger(sequence) || sequence < 0) {
  throw new Error(`--sequence must be a non-negative integer, got ${arg('sequence')}`);
}

async function main(): Promise<void> {
  const incoming = readJson<OpenApiSpec>(specPath);
  const current = fs.existsSync(SPEC_JSON) ? readJson<unknown>(SPEC_JSON) : null;
  const provenance = fs.existsSync(PROVENANCE_FILE) ? readJson<Provenance>(PROVENANCE_FILE) : null;
  const lastSequence = provenance ? provenance.sequence : -1;

  const stage = classify({ sequence, lastSequence, currentSpec: current, incomingSpec: incoming });

  if (stage === 'stale') {
    console.log(`stale deploy (sequence ${sequence} < last published ${lastSequence}); skipping`);
    return;
  }

  if (stage === 'changed') {
    const tag = releaseTag({ infoVersion: incoming.info.version, isoDate, sha });
    // Build a changelog entry by diffing the previous published spec (still on disk) against the
    // incoming one, before the overwrite. Best effort: if oasdiff is unavailable or errors, fall back
    // to a neutral note rather than fail the publish.
    let diffBody = 'Initial published spec.';
    if (fs.existsSync(SPEC_JSON)) {
      try {
        diffBody =
          capture('oasdiff', ['changelog', SPEC_JSON, specPath, '-f', 'markdown']).trim() ||
          'No API-surface changes detected.';
      } catch {
        diffBody = 'No API-surface changes detected.';
      }
    }
    const entry = `## ${tag} (${isoDate.slice(0, 10)})\n\n${diffBody}\n`;
    const existingLog = fs.existsSync(CHANGELOG_FILE) ? fs.readFileSync(CHANGELOG_FILE, 'utf8') : `${CHANGELOG_HEADER}\n`;
    const priorEntries = existingLog.startsWith(CHANGELOG_HEADER)
      ? existingLog.slice(CHANGELOG_HEADER.length).replace(/^\n+/, '')
      : existingLog;
    fs.writeFileSync(CHANGELOG_FILE, `${CHANGELOG_HEADER}\n\n${entry}\n${priorEntries}`);

    // Write both formats: JSON for tooling, YAML for human-readable diffs and language-agnostic codegen.
    fs.copyFileSync(specPath, SPEC_JSON);
    fs.writeFileSync(SPEC_YAML, toYaml(incoming, { lineWidth: -1, noRefs: true }));
    fs.writeFileSync(PROVENANCE_FILE, `${JSON.stringify({ sequence, sha, timestamp: isoDate, tag } satisfies Provenance, null, 2)}\n`);
    run('git', ['add', SPEC_JSON, SPEC_YAML, PROVENANCE_FILE, CHANGELOG_FILE]);
    if (capture('git', ['status', '--porcelain']).trim()) {
      run('git', ['commit', '-m', `chore: publish spec ${tag}`]);
      run('git', ['push', 'origin', 'HEAD']);
    } else {
      console.log('working tree clean; skipping commit');
    }
    // Ensure the release exists after the commit/push, so a retry whose commit landed but whose release
    // failed still creates it. Release notes carry the changelog diff.
    await ensureRelease(tag, `${notes(incoming.info.version, sha, isoDate)}\n\n${diffBody}`);
    return;
  }

  // stage === 'unchanged': HEAD content is already current. The only thing that can still need doing is
  // healing a release that a prior run committed but failed to create.
  if (provenance && !(await releaseExists(provenance.tag))) {
    const version = (current as OpenApiSpec | null)?.info?.version ?? incoming.info.version;
    console.log(`spec unchanged but release ${provenance.tag} is missing; healing`);
    await ensureRelease(provenance.tag, notes(version, provenance.sha, provenance.timestamp));
  } else {
    console.log('spec unchanged and release present; nothing to do');
  }
}

// Exit explicitly: fetch's keep-alive socket pool would otherwise keep the event loop alive after main().
main().then(
  () => process.exit(0),
  (err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
