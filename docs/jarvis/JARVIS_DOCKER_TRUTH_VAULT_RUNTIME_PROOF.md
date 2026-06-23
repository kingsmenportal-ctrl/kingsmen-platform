# Jarvis Docker / API / Truth Vault Runtime Proof Gate

## Status

Live proof batch 1 source gate created. Runtime proof is not accepted yet.

## Purpose

This gate prevents Jarvis from being called live until Docker, API, and PostgreSQL Truth Vault evidence is real.

## Source routes

- `/api/jarvis/docker-truth-vault-runtime-proof`
- `/founder/launch-control/jarvis-docker-runtime-proof`

## Required accepted evidence

- Docker engine reachable.
- `kingsmen-truth-vault-local` container running.
- `kingsmen-redis-local` container running.
- API health returns HTTP 200.
- Backend reports `postgres_truth_vault` storage mode.
- Jarvis command creates command log evidence.
- Jarvis command creates audit event evidence.
- Runtime proof output is redacted.
- Browser does not run shell.
- Browser does not read or write the database directly.

## Rejection rules

Reject the runtime proof if:

- Health endpoint returns 500.
- Storage mode is memory or mock.
- Evidence is only a web/source route.
- A screenshot is used instead of API/Truth Vault evidence.
- Raw secrets are printed.
- Browser code writes directly to the database.
- Airtable or n8n becomes authority.

## Validator

```powershell
node scripts\validators\validate-jarvis-docker-truth-vault-runtime-proof.mjs
```

Expected source result:

```text
JARVIS_DOCKER_TRUTH_VAULT_RUNTIME_PROOF_GATE_VALIDATED
runtimeProofAccepted: false
productionReady: false
publicLaunchAllowed: false
```

Runtime proof remains blocked until Docker/API/Truth Vault evidence is captured.
