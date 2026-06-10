import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalJson, specsEqual, classify } from './publish-logic';

test('canonicalJson sorts object keys but preserves array order', () => {
  assert.equal(canonicalJson({ b: 1, a: 2 }), canonicalJson({ a: 2, b: 1 }));
  assert.notEqual(canonicalJson([1, 2]), canonicalJson([2, 1]));
});

test('specsEqual ignores key order, catches value changes', () => {
  assert.ok(specsEqual({ info: { version: '1' }, a: 1 }, { a: 1, info: { version: '1' } }));
  assert.ok(!specsEqual({ a: 1 }, { a: 2 }));
});

const spec = { info: { version: '1.12' }, paths: { '/x': { get: {} } } };

test('classify: a strictly older deploy is stale', () => {
  assert.equal(classify({ sequence: 99, lastSequence: 100, currentSpec: spec, incomingSpec: spec }), 'stale');
});

test('classify: equal sequence is NOT stale, so a re-run can self-heal', () => {
  assert.equal(classify({ sequence: 100, lastSequence: 100, currentSpec: spec, incomingSpec: spec }), 'unchanged');
});

test('classify: a newer deploy with identical content is unchanged (no release churn)', () => {
  assert.equal(classify({ sequence: 200, lastSequence: 100, currentSpec: spec, incomingSpec: spec }), 'unchanged');
});

test('classify: changed content publishes even on a newer deploy', () => {
  const changed = { info: { version: '1.12' }, paths: { '/y': { get: {} } } };
  assert.equal(classify({ sequence: 200, lastSequence: 100, currentSpec: spec, incomingSpec: changed }), 'changed');
});

test('classify: no current spec (first publish) publishes', () => {
  assert.equal(classify({ sequence: 1, lastSequence: -1, currentSpec: null, incomingSpec: spec }), 'changed');
});

test('classify: a rollback (newer deploy, older content) publishes so HEAD mirrors live', () => {
  const older = { info: { version: '1.11' }, paths: { '/x': { get: {} } } };
  assert.equal(classify({ sequence: 300, lastSequence: 100, currentSpec: spec, incomingSpec: older }), 'changed');
});
