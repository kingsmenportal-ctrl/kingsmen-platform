# N16 Worker Recovery Hardening — 2026-10-25

## Scope

This batch adds a pure, testable recovery policy to the existing N16 orchestrator. It does not claim to be a durable queue worker and does not perform network calls or state transitions.

## Locked recovery rules

- Every retry decision requires a stable idempotency key and evidence references.
- Retry only transient/unknown failures, with bounded exponential backoff and a maximum delay.
- Authentication, policy and invalid-payload failures stop without retry and require review.
- CAPTCHA, OTP, portal-down and manual-only conditions create a manual handoff rather than retrying a blocked portal.
- Exhausted retry budgets go to dead-letter handling; no unlimited retry loop.
- Cancelled runs stop.
- An expired LOCKED lease can be reclaimed by a durable queue transaction.
- An expired SENT lease is ambiguous and must be reconciled manually. It must never be automatically replayed because the external side effect may already have occurred.

## Validation

Run from repository root:

    npm run n16:recovery:check

This compiles the API TypeScript and executes deterministic recovery-policy tests. These are not staging queue or worker-runtime evidence.

## Remaining runtime gate

The production worker must persist retry/dead-letter/lease decisions transactionally against the PostgreSQL queue, emit execution events, and demonstrate concurrent-claim safety and crash recovery in staging before this is considered runtime-complete.
