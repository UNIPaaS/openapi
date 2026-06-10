# UNIPaaS OpenAPI

The canonical, versioned OpenAPI spec for the UNIPaaS Platform API, in both JSON and YAML. It is the
source of truth that downstream consumers (the developer docs, generated SDKs, the OpenAPI->MCP
server) pull from.

The spec is generated from the UNIPaaS Platform API and published here automatically; it is not
authored here, so do not hand-edit it. It conforms to the
[OpenAPI Specification v3.0](https://spec.openapis.org/oas/v3.0.0.html).

## Consuming the spec

Always-latest from HEAD:

    curl -fsSL https://raw.githubusercontent.com/UNIPaaS/openapi/main/spec/openapi.json -o openapi.json

Or pin a release (each publish cuts one, tagged `v<info.version>+<YYYYMMDD>.<shortsha>`):

    gh release download v1.12+20260610.abc1234 --repo UNIPaaS/openapi --pattern openapi.json

The repo is public, so reads need no authentication. See `CHANGELOG.md` for the diff between releases.
