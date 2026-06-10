// Pure decision logic for the publish flow, extracted from publish.ts so the guards (ordering and
// change-detection) are unit-testable without git/gh side effects.

export interface OpenApiSpec {
  info: { version: string };
}

// Provenance of the last publish, committed alongside the spec. `sequence` is the ordering key and
// `tag` is the release the current HEAD content belongs to (used to self-heal a missing release).
export interface Provenance {
  sequence: number;
  sha: string;
  timestamp: string;
  tag: string;
}

// Deterministic JSON with object keys sorted recursively (arrays keep their order), so two specs
// compare equal regardless of incidental key ordering. The input is always parsed JSON, so there are
// no exotic value types to handle.
export const canonicalJson = (value: unknown): string => {
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

export const specsEqual = (a: unknown, b: unknown): boolean => canonicalJson(a) === canonicalJson(b);

export type Stage = 'stale' | 'changed' | 'unchanged';

// Classify a publish attempt from the ordering key and content alone (no I/O):
// - stale: this deploy is strictly older than the last published one -> drop, so HEAD keeps mirroring
//   the most recent deploy (a rollback is a newer deploy and is not stale).
// - changed: the spec differs from HEAD (or HEAD has none) -> publish it.
// - unchanged: identical to HEAD -> nothing to publish; only a missing release may need healing.
// Equal sequence is deliberately NOT stale, so a re-run of the same deploy can still heal a release
// that a prior attempt committed but failed to create.
export const classify = (input: {
  sequence: number;
  lastSequence: number;
  currentSpec: unknown | null;
  incomingSpec: unknown;
}): Stage => {
  if (input.sequence < input.lastSequence) return 'stale';
  if (input.currentSpec === null || !specsEqual(input.currentSpec, input.incomingSpec)) return 'changed';
  return 'unchanged';
};
