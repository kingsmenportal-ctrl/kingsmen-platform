# Kingsmen Truth Vault Persistence

Status: **built foundation**  
Production ready: **false until DB integration proof passes on staging**

## Purpose

This document records the second launch build item: replacing the backend API's memory-only command/result store with real PostgreSQL/Supabase Truth Vault persistence.

The API can now run in two explicit modes. Business routes require server-to-server bearer authentication; `/health` remains public. Never put either service token in browser code. `KINGSMEN_API_SERVICE_TOKEN` protects command intake, Jarvis runtime-control, and read-model routes. `KINGSMEN_WORKFLOW_SERVICE_TOKEN` separately protects workflow-result intake. Both configured tokens must be at least 32 characters. These service credentials do not establish candidate identity or candidate-level authorisation, so the protected routes are backend-only.

The API can run in these explicit storage modes:

```txt
KINGSMEN_TRUTH_VAULT_MODE=memory
```

or:

```txt
KINGSMEN_TRUTH_VAULT_MODE=postgres
KINGSMEN_DATABASE_URL=postgres://...
```

`DATABASE_URL` is also accepted as a fallback.

## What is persisted

When PostgreSQL mode is enabled, the API writes to the existing N03 Truth Vault tables:

| Runtime event | Truth Vault table |
|---|---|
| Command idempotency | `idempotency_keys` |
| Accepted command | `command_log` |
| Candidate read model seed | `candidates` |
| Application workbench seed | `applications` with `metadata.applicationRef` |
| Workflow result | `workflow_runs` |
| Workflow evidence | `evidence_ledger` |
| Runtime audit trail | `audit_events` |
| Approval-required command | `approval_requests` |
| Worker heartbeat helper | `worker_heartbeats` |
| Dead-letter helper | `dead_letter_queue` |

## Why application refs use metadata

The current N03 migration defines `applications.id` as the UUID primary key and does not include an `application_ref` column. To avoid breaking the existing schema, public/business application IDs from API envelopes are stored in:

```txt
applications.metadata.applicationRef
```

Read routes can therefore look up an application by either:

```txt
applications.id::text
applications.metadata->>'applicationRef'
```

## Environment

Minimum runtime environment for PostgreSQL mode:

```bash
KINGSMEN_TRUTH_VAULT_MODE=postgres
KINGSMEN_DATABASE_URL=postgres://user:password@host:5432/database
KINGSMEN_DATABASE_SSL=true
KINGSMEN_DATABASE_POOL_MAX=8
KINGSMEN_API_SERVICE_TOKEN=<server-only-random-token-at-least-32-characters>
KINGSMEN_WORKFLOW_SERVICE_TOKEN=<separate-server-only-random-token>
```

For local Docker PostgreSQL without SSL:

```bash
KINGSMEN_TRUTH_VAULT_MODE=postgres
KINGSMEN_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/kingsmen
KINGSMEN_DATABASE_SSL=false
```

## Health check

```bash
curl -s http://localhost:8080/health
```

Expected in PostgreSQL mode:

```json
{
  "storageMode": "postgres_truth_vault",
  "truthVault": {
    "ok": true,
    "storageMode": "postgres_truth_vault"
  }
}
```

## Command proof flow

```bash
curl -s -X POST http://localhost:8080/api/commands \
  -H "content-type: application/json" \
  -d '{
    "commandId": "cmd_truth_vault_001",
    "commandType": "candidate.intake.received",
    "idempotencyKey": "idem_truth_vault_001",
    "correlationId": "corr_truth_vault_001",
    "actor": { "type": "candidate", "id": "candidate_demo" },
    "candidateId": "KM-DEMO-001",
    "source": "portal",
    "createdAt": "2026-06-16T00:00:00.000Z",
    "payload": {
      "displayName": "Demo Candidate",
      "email": "demo@example.invalid",
      "activePackageCode": "FREE_DESTINY_MAP"
    }
  }'
```

Then prove the read model:

```bash
curl -s http://localhost:8080/api/candidates/KM-DEMO-001/status \\
  -H "authorization: Bearer $KINGSMEN_API_SERVICE_TOKEN"
```

## Workflow result proof flow

```bash
curl -s -X POST http://localhost:8080/api/workflow/result \
  -H "authorization: Bearer $KINGSMEN_WORKFLOW_SERVICE_TOKEN" \\
  -H "content-type: application/json" \
  -d '{
    "workflowRunId": "wf_truth_vault_001",
    "workflow": "W01",
    "candidateId": "KM-DEMO-001",
    "applicationId": "APP-DEMO-001",
    "idempotencyKey": "idem_wf_truth_vault_001",
    "correlationId": "corr_truth_vault_001",
    "previousState": "INTAKE_PENDING",
    "finalState": "EVALUATION_PENDING",
    "status": "SUCCESS",
    "evidenceRef": "ev_truth_vault_001",
    "message": "Intake normalized successfully.",
    "createdAt": "2026-06-16T00:00:00.000Z",
    "payload": {}
  }'
```

Then prove the application workbench:

```bash
curl -s http://localhost:8080/api/applications/APP-DEMO-001/workbench \\
  -H "authorization: Bearer $KINGSMEN_API_SERVICE_TOKEN"
```

## Safety boundaries

- No secrets are stored in source code.
- PostgreSQL mode requires environment variables.
- Memory mode remains explicit and visible in `/health`.
- Idempotency keys are recorded before command completion.
- Policy-blocked commands still do not execute.
- Approval-required commands are recorded as approval requests.
- n8n remains a thin worker and reports through `/api/workflow/result`.

## Remaining before public production

This closes the **repository stub** blocker, but public launch is still blocked by:

- scoped RLS policies and isolation tests,
- web-to-backend boundary cleanup,
- payment proof,
- backup/restore proof,
- branch protection,
- final staging DB integration run.
