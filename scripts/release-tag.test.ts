import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseTag } from './release-tag';

test('builds v<version>+<date>.<shortsha> from inputs', () => {
  assert.equal(
    releaseTag({ infoVersion: '1.12', isoDate: '2026-06-09T17:25:47Z', sha: 'a1b3c9d4e5f6' }),
    'v1.12+20260609.a1b3c9d',
  );
});

test('shortens a full 40-char sha to 7 chars', () => {
  const tag = releaseTag({
    infoVersion: '2.0',
    isoDate: '2026-01-02T00:00:00Z',
    sha: '0123456789abcdef0123456789abcdef01234567',
  });
  assert.equal(tag, 'v2.0+20260102.0123456');
});

test('rejects a missing sha', () => {
  assert.throws(
    () => releaseTag({ infoVersion: '1.0', isoDate: '2026-01-01T00:00:00Z', sha: '' }),
    /sha/,
  );
});
