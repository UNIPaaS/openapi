# UNIPaaS OpenAPI

The canonical, versioned OpenAPI spec for the UNIPaaS Platform API. This repo is the source of
truth that downstream consumers (the developer docs, generated SDKs, the OpenAPI->MCP server) pull
from. The spec is not authored here: it is generated from the UNIPaaS Platform API and published to
this repo automatically. Do not hand-edit it.

## What is here

- `spec/openapi.json` / `spec/openapi.yaml` - the latest published spec in both formats (HEAD always
  serves current). JSON for tooling, YAML for human-readable diffs and language-agnostic codegen.
- Releases - each publish cuts a GitHub Release with the immutable `openapi.json` and `openapi.yaml`
  assets, tagged `v<info.version>+<YYYYMMDD>.<shortsha>` so every spec traces back to the source
  commit that built it.
- `CHANGELOG.md` - human-readable diff between releases (generated).
- `.spectral.yaml` - the lint ruleset shared by producer and consumers.

## Consuming the spec

Pin a specific version:

    gh release download v1.12+20260610.abc1234 --repo UNIPaaS/openapi --pattern openapi.json

Or always-latest from HEAD:

    curl -fsSL https://raw.githubusercontent.com/UNIPaaS/openapi/main/spec/openapi.json -o openapi.json

This repo is public, so reads need no authentication.

## Versioning

`info.version` inside the spec is a curated human label. The release tag
`v<info.version>+<YYYYMMDD>.<shortsha>` is the provenance identity and the thing consumers pin: it is
monotonic and traces each published spec back to the exact source commit that produced it.
