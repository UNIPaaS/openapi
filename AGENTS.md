# UNIPaaS/openapi

Canonical, versioned OpenAPI spec for the UNIPaaS Platform API. Source of truth for docs, SDKs, and
the future MCP server. The spec is generated in `platform-api` and published here by that repo's CI,
authenticating as the `openapi-publisher` GitHub App; do not hand-edit `openapi.json`.

## Layout

- `openapi.json` / `openapi.yaml` - latest published spec, both formats (HEAD = current); the
  producer hands over JSON, `publish.ts` derives the YAML. Do not hand-edit either.
- `provenance.json` - the last publish's deploy `sequence`/`sha`/`tag`; the ordering guard drops
  publishes from an older deploy than this. Generated on publish; do not hand-edit.
- `CHANGELOG.md` - generated diff between releases.
- `.spectral.yaml` - shared lint ruleset.
- `scripts/publish.ts` - change-detect + ordering guard, commits latest + cuts a release; invoked by
  platform-api CI as `npm run publish:spec` after a production deploy.
- `scripts/release-tag.ts` - computes the provenance tag; pure, unit-tested.

Scripts are strict TypeScript run with `tsx` (no build step); `tsc --noEmit` is the typecheck gate.

## Publishing

platform-api's `publish-openapi` CI job generates the spec on a production deploy and runs
`npm run publish:spec -- --spec <file> --sha <sha> --date <iso> --sequence <pipeline-id>`. The hub
owns the logic: it canonically compares the spec to HEAD (no-op if unchanged), drops publishes from an
older deploy than the last recorded `sequence` (so HEAD mirrors what's live; a rollback is a newer
deploy and passes), writes both formats, and cuts an idempotent release. Auth is a short-lived
installation token from the `openapi-publisher` GitHub App (App id `4020207`, key in 1Password),
minted in the producer job; releases are attributed to `openapi-publisher[bot]`.

## Versioning

Two separate concepts. `info.version` inside the spec is a hand-curated human label owned by
platform-api. The release tag `v<info.version>+<YYYYMMDD>.<shortsha>` is the provenance identity and
the thing consumers pin.

## Gates / commands

- `npm install` - install the dev toolchain (tsx, typescript, spectral).
- `npm run typecheck` - strict type-check (`tsc --noEmit`).
- `npm test` - run the unit tests (`tsx --test`).
- `npm run lint:spec` - lint `openapi.json` against `.spectral.yaml`.

## Conventions

Conventional Commits, no attribution trailers. SSH remotes only
(`git@github.com-unipaas:UNIPaaS/openapi.git`).
