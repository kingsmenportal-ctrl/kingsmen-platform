# Kingsmen Deployable Backend API

This is the first deployable Kingsmen backend API runtime. It turns the existing API modules into a server process with real HTTP boundaries.

## Status

**Built:** deployable API package and HTTP server.

**Updated:** the API now supports PostgreSQL/Supabase Truth Vault persistence when explicitly enabled.

The runtime has two visible storage modes:

```txt
memory_development_only
postgres_truth_vault
```

Memory mode remains available for local/offline development. PostgreSQL mode is the launch/staging path.

## Package

```bash
cd apps/api
npm install
npm run build
npm start
```

Default runtime:

```txt
PORT=8080
KINGSMEN_API_HOST=0.0.0.0
KINGSMEN_API_CORS_ORIGIN=*
KINGSMEN_TRUTH_VAULT_MODE=memory
```

PostgreSQL/Supabase Truth Vault runtime:

```txt
KINGSMEN_TRUTH_VAULT_MODE=postgres
KINGSMEN_DATABASE_URL=postgres://...
KINGSMEN_DATABASE_SSL=true
```

`DATABASE_URL` is accepted as a fallback when `KINGSMEN_DATABASE_URL` is not set.

## Routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Runtime health check |
| GET | `/api/system/health` | API health, storage mode, Truth Vault status, and route inventory |
| POST | `/api/commands` | Validates, policy-checks, idempotency-checks, and persists a Kingsmen command envelope |
| POST | `/api/workflow/result` | Validates and persists one normalized worker result |
| POST | `/api/workflow-results` | Alias for workflow result intake |
| GET | `/api/candidates/:candidateId/status` | Candidate read model |
| GET | `/api/applications/:applicationId/workbench` | Application workbench read model |

## Command intake example

```bash
curl -s -X POST http://localhost:8080/api/commands \
  -H "content-type: application/json" \
  -d '{
    "commandId": "cmd_demo_001",
    "commandType": "candidate.intake.received",
    "idempotencyKey": "idem_demo_001",
    "correlationId": "corr_demo_001",
    "actor": { "type": "candidate", "id": "candidate_demo" },
    "candidateId": "KM-DEMO-001",
    "source": "portal",
    "createdAt": "2026-06-16T00:00:00.000Z",
    "payload": { "displayName": "Demo Candidate", "email": "demo@example.invalid" }
  }'
```

Then read the candidate model:

```bash
curl -s http://localhost:8080/api/candidates/KM-DEMO-001/status
```

## Workflow result example

```bash
curl -s -X POST http://localhost:8080/api/workflow/result \
  -H "content-type: application/json" \
  -d '{
    "workflowRunId": "wf_demo_001",
    "workflow": "W01",
    "candidateId": "KM-DEMO-001",
    "applicationId": "APP-DEMO-001",
    "idempotencyKey": "idem_wf_demo_001",
    "correlationId": "corr_demo_001",
    "previousState": "INTAKE_PENDING",
    "finalState": "EVALUATION_PENDING",
    "status": "SUCCESS",
    "message": "Intake normalized successfully.",
    "createdAt": "2026-06-16T00:00:00.000Z",
    "payload": {}
  }'
```

Then read the application model:

```bash
curl -s http://localhost:8080/api/applications/APP-DEMO-001/workbench
```

## Safety boundaries preserved

- No local PowerShell shell-out.
- No `psql.exe` dependency.
- No `C:\Kingsmen` path dependency.
- Command envelopes require `idempotencyKey` and `correlationId`.
- Sensitive commands are accepted only as pending approval; they are not executed by this runtime.
- Approval-required commands are persisted into `approval_requests`.
- n8n remains a thin worker layer that reports results back through the workflow-result endpoint.
- Memory mode is explicit and cannot be mistaken for Truth Vault mode.

## Validators

```bash
npm run api:validate
npm run api:validate:truth-vault
```

## Next required build

The next launch blocker is **safe web-to-backend boundary**: public Next.js API routes must stop shelling out to local Windows/PowerShell/psql paths and must call the backend API/SDK instead.
