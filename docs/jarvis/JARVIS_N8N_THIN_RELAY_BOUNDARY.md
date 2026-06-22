# Jarvis n8n Thin Relay Boundary

This document locks the Jarvis n8n Thin Relay Boundary for Kingsmen.

## Doctrine

- n8n is a thin relay only.
- Backend command outbox remains automation authority.
- PostgreSQL Truth Vault remains system truth.
- n8n may not become authority.
- n8n workflows may not write Truth Vault directly.
- Browser routes may not call n8n directly.
- No fake status is allowed.
- No raw secrets are returned.
- No provider credentials printed.
- No direct provider calls from web.
- Backend command envelope required.

## Route

`/api/jarvis/n8n-thin-relay-boundary`

The route reports redacted readiness for:

- `KINGSMEN_N8N_BASE_URL`
- `KINGSMEN_N8N_API_KEY`
- `KINGSMEN_N8N_WEBHOOK_SECRET`
- `KINGSMEN_N8N_RELAY_MODE`

The route does not call n8n directly. It only reports source/runtime boundary readiness and backend health.

## Command envelope

`N8N_THIN_RELAY_CHECK`

The command must pass through the Jarvis backend command boundary. The web route must never execute local shell, directly write files, directly access PostgreSQL, or call the provider.

## Runtime proof

Run:

```powershell
npm run jarvis:runtime:n8n-thin-relay
```

The proof writes:

`reports/jarvis/jarvis-n8n-thin-relay-boundary-proof-latest.json`

Runtime may remain pending until credentials, backend runtime, outbox evidence, and evidence-ledger proof are available.
