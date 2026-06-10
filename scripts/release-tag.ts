// Compute the provenance release tag: v<info.version>+<YYYYMMDD>.<shortsha>.
// Pure: all inputs passed in (no Date.now / no git calls) so it is deterministic and testable.
export interface ReleaseTagInput {
  infoVersion: string;
  isoDate: string;
  sha: string;
}

export function releaseTag({ infoVersion, isoDate, sha }: ReleaseTagInput): string {
  if (!infoVersion) throw new Error('releaseTag: infoVersion required');
  if (!sha) throw new Error('releaseTag: sha required');
  const date = isoDate.slice(0, 10).replace(/-/g, ''); // 2026-06-09T.. -> 20260609
  const shortSha = sha.slice(0, 7);
  return `v${infoVersion}+${date}.${shortSha}`;
}
