# Jarvis Docker / API / Truth Vault Runtime Evidence Capture

## Status

Capture runner source-ready. Runtime evidence not accepted yet.

## Purpose

This runner captures redacted runtime evidence for the first live proof batch without letting the browser touch the database, shell, Docker, or provider credentials.

## Runner

```text
scripts/proof/capture-jarvis-docker-truth-vault-runtime-evidence.mjs
```

## Output report

```text
reports/jarvis/jarvis-docker-truth-vault-runtime-evidence-capture-latest.json
```

## Required runtime conditions

- API reachable at `KINGSMEN_BACKEND_BASE_URL` or `http://127.0.0.1:3001`.
- API health returns HTTP 200.
- Health reports `storageMode: postgres_truth_vault`.
- Truth Vault health reports `postgres_truth_vault`.
- A `system.health.requested` Jarvis command is accepted by the backend.
- Command response reports `storageMode: postgres_truth_vault`.
- Output remains redacted.

## Important boundary

The runner calls backend HTTP only. It does not query PostgreSQL directly, does not expose raw secret values, does not use browser shell execution, and does not make provider calls.

## Validation

```text
node scripts/validators/validate-jarvis-docker-truth-vault-runtime-evidence-capture.mjs
```

Expected source validation status:

```text
JARVIS_DOCKER_TRUTH_VAULT_RUNTIME_EVIDENCE_CAPTURE_VALIDATED
```

A captured report can only be accepted when every runtime check passes. Until then Jarvis remains:

```text
jarvisRuntimeLive: false
productionReady: false
publicLaunchAllowed: false
```
