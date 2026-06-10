# UNIPaaS/openapi

Canonical, versioned OpenAPI spec for the UNIPaaS Platform API. Source of truth for docs, SDKs, and
the future MCP server. The spec is generated in `platform-api` and published here by that repo's CI;
do not hand-edit `openapi.json`.

## Layout

- `openapi.json` / `openapi.yaml` - latest published spec, both formats (HEAD = current); the
  producer hands over JSON, `publish.ts` derives the YAML. Do not hand-edit either.
- `CHANGELOG.md` - generated diff between releases.
- `.spectral.yaml` - shared lint ruleset.
- `scripts/publish.ts` - commits latest + cuts a release; called by platform-api CI (via `tsx`).
- `scripts/release-tag.ts` - computes the provenance tag; pure, unit-tested.

Scripts are strict TypeScript run with `tsx` (no build step); `tsc --noEmit` is the typecheck gate.

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
