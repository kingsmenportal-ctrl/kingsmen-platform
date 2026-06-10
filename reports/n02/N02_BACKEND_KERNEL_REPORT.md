# N02 - Backend API Kernel / State Machine

Status: Prepared and validated.

Created:
- manifests/n02/backend-api-kernel.json
- apps/api/src/state/state-machine.ts
- apps/api/src/kernel/command-envelope.ts
- apps/api/src/kernel/command-bus.ts
- apps/api/src/kernel/api-boundary.ts
- apps/api/src/policy/policy-middleware.ts
- apps/api/src/workflows/workflow-result.ts
- apps/api/src/read-models/candidate-read-model.ts
- apps/api/src/integrations/integration-adapters.ts
- apps/api/src/observability/audit-event.ts
- apps/api/src/index.ts
- scripts/validators/Validate-N02.ps1

Backend laws:
- Backend controls state.
- Commands require commandId, correlationId, and idempotencyKey.
- Workflow results validate previousState and finalState.
- Dangerous commands require approval.
- Playwright blocked routes become MAP fallback.
- n8n remains a thin worker.
- Airtable remains mirror only.

Next:
N03 - PostgreSQL Truth Vault.