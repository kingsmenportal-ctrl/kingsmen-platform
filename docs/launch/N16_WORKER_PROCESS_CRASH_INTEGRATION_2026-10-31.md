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
