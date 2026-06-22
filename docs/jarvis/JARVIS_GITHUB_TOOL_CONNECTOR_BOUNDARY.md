# Jarvis GitHub Tool Connector Boundary

This module adds the source-safe boundary for the Jarvis GitHub Tool Connector.

## Route

`/api/jarvis/github-tool-connector-boundary`

The route reports the GitHub connector readiness state without calling GitHub directly from the web route.

## Required local credentials

Credentials must stay outside Git.

- `KINGSMEN_GITHUB_REPOSITORY` or `GITHUB_REPOSITORY_FULL_NAME` or `GITHUB_REPOSITORY`
- `GITHUB_TOKEN` or `GH_TOKEN`

The proof must show `present_redacted` and must never print the token.

## Boundary rules

- no fake status
- no raw secrets
- no provider credentials printed
- no direct provider calls from web
- no local shell execution from web
- no direct database access from web
- backend command envelope required
- PostgreSQL Truth Vault command evidence required when runtime is available

## Proof command

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\staging\Invoke-KingsmenJarvisGitHubToolConnectorBoundaryProof.ps1
```

## Evidence output

`reports/jarvis/jarvis-github-tool-connector-boundary-proof-latest.json`

## Production boundary

This boundary does not claim GitHub is live until a redacted repository metadata read is proven through an approved backend or tool boundary and evidence is written to the Kingsmen Truth Vault.
