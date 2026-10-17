# PR #86 — Candidate identity-link lifecycle batch

Date: 2026-10-17  
Branch: `feat/phase-a1-public-destiny-auth-foundation`

## Delivered

- Added `candidate-identity-link-lifecycle.ts` with operator-authorized pending-link creation, exact-pair pending-to-verified transition, and reasoned revocation.
- Uses existing `candidate_auth_identity_links` migration and the existing `audit_events` table; no new schema or migration was invented.
- State transition and audit insert use the same injected transaction database. Audit failure throws so the enclosing transaction can roll back.
- Does not link by email, does not permit candidate self-assignment, checks active candidate status, records the trusted actor ID and correlation ID, and rejects malformed UUIDs.
- Added unit tests for authorization, UUID validation, state transition predicates, audit writes, and audit failure propagation.
- Added a source-boundary validator.

## Important integration requirements

1. Callers must execute lifecycle functions inside `withCandidateBackendTransaction(pool, ...)`.
2. `isAuthorizedOperator` must be backed by a real server-verified operator session/permission source. Never pass a boolean or actor ID from an untrusted request body.
3. This is not evidence that PostgreSQL RLS or the migration works in a live database. Migration 0040 is committed but must be applied and tested in staging by an authorized operator.
4. No candidate route has been enabled by this change; existing fail-closed behavior remains.
5. Unit tests and validator are committed but have not been executed in this environment. CI/runtime status must be checked independently.

## Next gates

- Implement a real trusted operator permission adapter and wire it only into a protected backend/admin workflow.
- Add staging DB integration tests for uniqueness, concurrent transitions, RLS context, and transaction rollback.
- Only then connect verified identity mapping to the candidate application/document APIs.
