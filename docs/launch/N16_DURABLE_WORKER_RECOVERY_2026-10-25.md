# N16 Durable Worker Recovery — 2026-10-25

## This batch

Migration `202610250001_n16_durable_worker_recovery.sql` connects the recovery policy to the existing `orchestrator_dispatch_queue` and existing audit/handoff tables.

- `n16_claim_dispatches` uses `FOR UPDATE SKIP LOCKED`, bounds claim count and lease duration, and atomically leases due work. Expired LOCKED leases may be reclaimed; SENT work is excluded.
- `n16_record_dispatch_result` locks the dispatch row and atomically records the worker result, execution event and queue decision.
- Transient/unknown failures are rescheduled with bounded exponential delay until the attempt budget is exhausted, then persisted as DEAD_LETTER.
- Authentication, policy and invalid-payload failures stop without retry. Portal/manual/approval blocks create a durable handoff.
- `n16_reconcile_expired_sent` quarantines expired SENT work for manual reconciliation. It does not replay potentially completed external side effects.
- Queue RPCs are executable only by `service_role`; ordinary/anonymous JWT roles are explicitly revoked.
- Result refs and handoff/event refs are deterministic to support safe repeat calls. State transitions remain separately guarded; an audited result does not automatically authorize a candidate/application state change.

## Checks and release gates

Run `npm run n16:queue:contract` for static migration-contract checks. This does not execute PostgreSQL, simulate concurrent database sessions, prove transaction rollback, or demonstrate worker process crash recovery.

Before release, apply the migration to an isolated/staging database, run two concurrent claimers, test result replay/idempotency and transaction rollback, kill a worker after claim and after send, inspect persisted queue/results/events/handoffs, and verify ordinary authenticated roles cannot execute these RPCs. No staging migration or deployment is performed by this PR.
