# N16 process-crash integration — 31 October 2026

## Purpose

This test exercises the real compiled N16 worker process against an isolated PostgreSQL 17 database. It is not a staging worker activation and never contacts a provider.

## Tested database contract

The test applies the existing orchestrator schema migration 0014 and the three N16 recovery migrations to the disposable database:

- 0014 — orchestrator execution queue base schema;
- 202610250001 — atomic queue claims, idempotent results, retry/dead-letter, manual handoff, expired SENT quarantine and least-privilege grants;
- 202610250002 — lease-owner checked LOCKED-to-SENT boundary;
- 202610250003 — dead-letter for expired LOCKED work whose retry budget is exhausted.

The test uses a test-only LOGIN/BYPASSRLS service_role credential inside CI. The credential is generated for a single workflow execution and masked in logs.

## Process-kill scenarios

1. Two independent PostgreSQL sessions race to claim one synthetic dispatch. Exactly one claim must win.
2. The real worker process is killed with SIGKILL after its row is LOCKED but before SENT. The lease is expired inside the disposable database, a second real worker process reclaims the row, executes the synthetic-only handler and writes one result. The row must end ACKED with attempt_count 2 and one result.
3. A second real worker process is killed with SIGKILL after the row crosses SENT but while the synthetic-only handler is delayed. The lease is expired in the disposable database and the real reconciliation RPC must mark it FAILED, create a durable manual handoff, write no success result, and never return that dispatch from claim again.
4. Anonymous/authenticated roles must not have queue-table SELECT or claim-RPC execution; service_role must retain the runtime permissions.

## Safety boundary

- The script refuses non-loopback database hosts and any database name other than `kingsmen_n16_worker_test`.
- Both worker child processes use only the synthetic `n16.staging-recovery-probe` handler with test-only fixture payloads; no external provider call is available.
- The integration workflow is separate from the live staging environment. It creates and drops only its local PostgreSQL service database.
- The test report always includes `stagingDatabaseTouched: false`, `externalProviderAction: false`, and `productionWorkerProven: false`.

## What this proves and what it does not prove

A passing CI run proves the worker process can be killed and recovered correctly around the N16 send boundary against PostgreSQL 17. It does not prove a deployed server runtime, production credentials, production workload, provider submission, monitoring/alert delivery, or a real staging process-kill drill. Those remain separately authorised release gates.

## Staging migration and privilege reconciliation — 1 November 2026

A fresh, read-only inspection of the connected Kingsmen staging Supabase project (euhubhhnumtibbyufghm) was performed on 1 November 2026.

### Live database facts

- PostgreSQL server version: **17.11**.
- The migration ledger contains the three N16 recovery migrations:
  - `20261025004936 n16_durable_worker_recovery_202610250001`
  - `20261025004943 n16_worker_send_boundary_202610250002`
  - `20261025004952 n16_exhausted_lease_recovery_202610250003`
- The five N16 RPCs exist: `n16_claim_dispatches`, `n16_record_dispatch_result`, `n16_mark_dispatch_sent`, `n16_reconcile_expired_sent`, and `n16_deadletter_exhausted_locked`.
- Privilege checks across all five RPCs returned `anon=false`, `authenticated=false`, and `service_role=true` for EXECUTE.
- Privilege checks across `orchestrator_dispatch_queue`, `orchestrator_worker_results`, `orchestrator_execution_events`, and `orchestrator_manual_handoffs` returned no SELECT for `anon` or `authenticated`, and SELECT for `service_role`.

These were read-only metadata, migration-ledger and privilege queries. No N16 migration was applied, no queue row was inserted or changed, and no staging worker was started or killed by this inspection.

### Current deployment boundary

The Netlify `kingsmen-portal-staging` configuration readback currently lists the public Supabase URL and client/publishable keys. It does not list a server-only `KINGSMEN_DATABASE_URL` or `DATABASE_URL` for a worker process. Its current published-deploy metadata also does not provide a usable deploy ID or commit SHA.

The N16 process-kill workflow passed against a disposable PostgreSQL 17 test database in GitHub Actions. It is not a staging-process kill drill. The currently registered runtime handlers are the read-only `evidence.verify` handler and a synthetic-only staging probe; unknown worker codes are handed off. No provider-submission handler is registered.

### Approval-authority hardening required before side-effect handlers

The current runner checks `dispatch.payload.approvalGranted === true` and that `approvalEvidenceRef` is included in the dispatch's evidence-reference array. It does not yet resolve that reference to an authoritative, immutable approval record or verify the approving actor's authority, approved target/action, and approval validity window. That payload check is not sufficient evidence of founder/reviewer approval for a real external side effect.

Accordingly, keep provider-side-effect handlers absent and the worker disabled until approval is validated against the governed approval record and actor authority, an independent security review approves that control, a dedicated runtime host and server-only database credential are configured, and a synthetic-only process-kill drill is completed on staging with redacted evidence.