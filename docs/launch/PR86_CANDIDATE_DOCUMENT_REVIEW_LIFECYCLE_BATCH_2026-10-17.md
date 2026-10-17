# PR #86 — Candidate document review lifecycle

Date: 2026-10-17

## Added
- Audited status transitions: UPLOADED -> UNDER_REVIEW, UNDER_REVIEW -> ACCEPTED/REJECTED, and REJECTED -> ARCHIVED.
- Explicit action-specific permissions, required reason/correlation ID, and optimistic status checks prevent stale concurrent reviewers from overwriting a newer state.
- Each transition inserts an audit_events row in the same database transaction; audit failure propagates and forces rollback through the transaction runtime.
- Added a transaction-bound runtime with an injected trusted server-side reviewer resolver, tests, and source validator.

## Not wired / limitations
- No real founder/operator session resolver is currently configured; the runtime must not trust caller-provided actor IDs or permission claims.
- Founder document review web route remains fail-closed.
- Migration 0019 remains unapplied in staging/production. No database runtime proof, build, or tests are claimed.
- This lifecycle changes metadata only; it does not scan bytes, sign storage URLs, or prove that a document's contents are genuine.
