# UNIPaaS OpenAPI

The canonical, versioned OpenAPI spec for the UNIPaaS Platform API. This repo is the source of
truth that downstream consumers (the developer docs, generated SDKs, the OpenAPI->MCP server) pull
from. It is not where the spec is authored: the spec is generated from `platform-api` and published
here by that repo's CI.

## What is here

- `openapi.json` / `openapi.yaml` - the latest published spec in both formats (HEAD always serves
  current). JSON for tooling, YAML for human-readable diffs and language-agnostic codegen.
- Releases - each publish cuts a GitHub Release with the immutable `openapi.json` and `openapi.yaml`
  assets, tagged
  `v<info.version>+<YYYYMMDD>.<shortsha>` so every spec traces back to the platform-api commit that
  built it.
- `CHANGELOG.md` - human-readable diff between releases (generated).
- `.spectral.yaml` - the lint ruleset shared by producer and consumers.

## Consuming the spec

Pin a specific version:

    gh release download v1.12+20260610.abc1234 --repo UNIPaaS/openapi --pattern openapi.json

Or always-latest from HEAD:

    curl -fsSL https://raw.githubusercontent.com/UNIPaaS/openapi/main/openapi.json -o openapi.json

This repo is public, so reads need no authentication.

## How it is published

`platform-api` CI generates the spec on a successful production deploy, compares it to the last
release, and on a real change runs `scripts/publish.ts` here to commit latest and cut a release.
