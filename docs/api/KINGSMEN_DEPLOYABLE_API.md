# Kingsmen Deployable Backend API

This is the first deployable Kingsmen backend API runtime. It turns the existing API modules into a server process with real HTTP boundaries.

## Status

**Built:** deployable API package and HTTP server.

**Still pending:** durable PostgreSQL/Supabase persistence. The current runtime intentionally reports `memory_development_only` so nobody mistakes it for the final Truth Vault write layer.

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
```

## Routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Runtime health check |
| GET | `/api/system/health` | API health and route inventory |
| POST | `/api/commands` | Validates and accepts a Kingsmen command envelope |
| POST | `/api/workflow/result` | Validates and accepts one normalized worker result |
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
    "candidateId": "candidate_demo",
    "source": "portal",
    "createdAt": "2026-06-16T00:00:00.000Z",
    "payload": { "displayName": "Demo Candidate", "email": "demo@example.invalid" }
  }'
```

Then read the candidate model:

```bash
curl -s http://localhost:8080/api/candidates/candidate_demo/status
```

## Workflow result example

```bash
curl -s -X POST http://localhost:8080/api/workflow/result \
  -H "content-type: application/json" \
  -d '{
    "workflowRunId": "wf_demo_001",
    "workflow": "W01",
    "candidateId": "candidate_demo",
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

## Safety boundaries preserved

- No local PowerShell shell-out.
- No `psql.exe` dependency.
- No `C:\Kingsmen` path dependency.
- Command envelopes require `idempotencyKey` and `correlationId`.
- Sensitive commands are accepted only as pending approval; they are not executed by this runtime.
- n8n remains a thin worker layer that reports results back through the workflow-result endpoint.

## Next required build

Replace `memory_development_only` with real Truth Vault persistence for command log, idempotency, workflow result, evidence, audit events, worker heartbeat, dead-letter queue, and approval records.
