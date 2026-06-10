# UNIPaaS/openapi

Canonical, versioned OpenAPI spec for the UNIPaaS Platform API. Source of truth for docs, SDKs, and
the future MCP server. The spec is generated upstream from the UNIPaaS Platform API and published
here automatically by the producer's CI; do not hand-edit the spec.

## Layout

- `spec/openapi.json` / `spec/openapi.yaml` - latest published spec, both formats (HEAD = current);
  the producer hands over JSON, `publish.ts` derives the YAML. Do not hand-edit either.
- `spec/provenance.json` - the last publish's deploy `sequence`/`sha`/`tag`; the ordering guard drops
  publishes from an older deploy than this. Generated on publish; do not hand-edit.
- `CHANGELOG.md` - generated diff between releases.
- `.spectral.yaml` - shared lint ruleset.
- `scripts/publish.ts` - change-detect + ordering guard, commits latest + cuts a release; invoked by
  the producer's CI as `npm run publish:spec` after a production deploy.
- `scripts/release-tag.ts` - computes the provenance tag; pure, unit-tested.

Scripts are strict TypeScript run with `tsx` (no build step); `tsc --noEmit` is the typecheck gate.

## Publishing

The producer's CI generates the spec on a production deploy and hands it to
`npm run publish:spec -- --spec <file> --sha <sha> --date <iso> --sequence <deploy-id>`. The hub owns
the logic: it canonically compares the spec to HEAD (no-op if unchanged), drops publishes from an
older deploy than the last recorded `sequence` (so HEAD mirrors what is live; a rollback is a newer
deploy and passes), writes both formats plus provenance, and cuts an idempotent release. The producer
just generates and hands over; it holds no publishing logic.

## Versioning

Two separate concepts. `info.version` inside the spec is a curated human label. The release tag
`v<info.version>+<YYYYMMDD>.<shortsha>` is the provenance identity and the thing consumers pin.

## Gates / commands

- `npm install` - install the dev toolchain (tsx, typescript, spectral).
- `npm run typecheck` - strict type-check (`tsc --noEmit`).
- `npm test` - run the unit tests (`tsx --test`).
- `npm run lint:spec -- <file>` - lint a spec against `.spectral.yaml` (errors fail; the ruleset,
  engine, and severity are single-sourced here). E.g. `npm run lint:spec -- spec/openapi.json`.

## Conventions

Conventional Commits, no attribution trailers. SSH remotes only (`git@github.com:UNIPaaS/openapi.git`).
