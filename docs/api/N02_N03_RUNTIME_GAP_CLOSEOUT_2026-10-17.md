# N02–N03 runtime gap closeout — 2026-10-17

**Production readiness: false.** This is an evidence ledger, not a release approval.

## 1. Staging migration — completed and catalog-verified

- Target: Supabase project `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`), status was `ACTIVE_HEALTHY` before migration.
- Applied migration: `n03_truth_vault_0002_rls_hardening` through the Supabase migration operation.
- Result: migration operation returned success.
- Post-apply catalog check: all 14 expected policy names were present on their matching tables. Each row reported role `{service_role}`, command `ALL`, `qual=true`, and `with_check=true`.
- No production database was targeted.

This verifies the catalog state, not live RLS behavior under three real request roles.

## 2. Persistence proof and restart — blocked on staging runtime inputs

The proof script now:
- requires explicit staging target and write acknowledgement;
- requires server-side `KINGSMEN_API_SERVICE_TOKEN`;
- checks missing-auth rejection before submitting the synthetic command;
- checks PostgreSQL mode, command/idempotency/audit persistence, candidate read-model response, and replay without duplicate command rows;
- reports restart persistence as unproven.

The live run was not executed because no approved staging API origin, server-side API/workflow tokens, and database connection values were supplied to the executable environment. No tokens or database URLs were committed or printed. Restart/re-read remains outstanding.

## 3. API authentication review

Review of `apps/api/src/server.ts` found the command, workflow-result, Jarvis runtime-control, candidate-status and application-workbench routes had no request authentication. The branch now applies fail-closed bearer checks:
- `KINGSMEN_API_SERVICE_TOKEN` for command, Jarvis runtime-control, and read-model routes;
- `KINGSMEN_WORKFLOW_SERVICE_TOKEN` for workflow-result intake;
- public health routes remain unauthenticated.

A missing server token returns `503 API_AUTH_NOT_CONFIGURED`; missing/incorrect credentials return `401 UNAUTHENTICATED`. Comparisons use `timingSafeEqual`. These are service-to-service credentials only, not candidate identity or candidate-level authorisation. Keep the routes behind a trusted backend boundary; do not expose these credentials to browser clients. Candidate-scoped access requires a separate identity-bound API design before public exposure.

## 4. Workflow concurrency and rollback — still open

The current repository write paths issue multiple statements without an explicit transaction. The existing code therefore does not yet establish atomic rollback for candidate/application upserts, workflow rows, evidence, audit, and idempotency records. Concurrent duplicate command/workflow submissions have not been proven safe. Do not mark these controls complete until the repository uses transaction-scoped locking/unique conflict handling and staging tests prove exactly one logical result and zero partial rows after an induced late failure.

## 5. RLS role-boundary tests — partially evidenced

Catalog checks verified 14 explicit `service_role` policies. The security advisor also reports five other RLS-enabled public tables without policies (`candidate_payment_events`, `candidate_refund_requests`, `candidate_service_orders`, `finance_audit_events`, `service_packages`) and six functions with mutable search paths. These are separate findings to triage; this batch did not modify them or relax the N05 Document Vault controls.

Outstanding live tests:
- anonymous cannot read/write Truth Vault private rows;
- authenticated users cannot read/write other candidates' private rows;
- approved server-side role can perform only intended service operations;
- workflow result survives restart;
- duplicate races and late-failure rollback;
- deployed API service credentials and route-level auth verified after restart.

## N05 Document Vault preservation

No N05 routes, bucket settings, upload/read URL logic, candidate identity binding, document metadata policy, or storage secrets were changed in this batch.
