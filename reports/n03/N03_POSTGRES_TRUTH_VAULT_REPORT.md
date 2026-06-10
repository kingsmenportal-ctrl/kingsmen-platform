# N03 - PostgreSQL Truth Vault

Status: Prepared and validated.

Created:
- manifests/n03/postgres-truth-vault.json
- db/migrations/0001_n03_truth_vault.sql
- db/seeds/n03_source_authorities_seed.sql
- apps/api/src/db/truth-vault-schema.ts
- apps/api/src/db/database-url.ts
- apps/api/src/db/truth-vault-repository.ts
- apps/api/src/evidence/evidence-ledger.ts
- apps/api/src/idempotency/idempotency.ts
- apps/api/src/heartbeat/worker-heartbeat.ts
- scripts/db/Run-N03Migration.ps1
- scripts/validators/Validate-N03.ps1
- reports/n03/N03_VALIDATION_RESULT.json

Truth vault coverage:
- Candidates
- Candidate profiles
- Applications
- Command log
- Idempotency keys
- Workflow runs
- Evidence ledger
- Audit events
- Source authorities
- Route sources
- Worker heartbeats
- Dead letter queue
- Approval requests
- Runtime config

Runtime law:
- PostgreSQL is truth.
- Airtable is mirror only.
- n8n is thin worker only.
- Every command has idempotency protection.
- Every important action has evidence.
- RLS is enabled from the start.
- Source authority uses confidence bands.
- MAP fallback is tracked and evidence-backed.

Optional local DB apply:
powershell -ExecutionPolicy Bypass -File .\scripts\db\Run-N03Migration.ps1

Next:
N04 - Candidate Core & Portal.