# PR #86 — Candidate identity-link lifecycle batch

Date: 2026-10-17  
Branch: `feat/phase-a1-public-destiny-auth-foundation`

## Delivered

- Added `candidate-identity-link-lifecycle.ts` with operator-authorized pending-link creation, exact-pair pending-to-verified transition, and reasoned revocation.
- Uses the new `db/migrations/0040_candidate_auth_identity_link.sql` mapping table and the existing `audit_events` table.
- The schema now rejects `VERIFIED` links without a non-empty verification actor and timestamp, and rejects `REVOKED` links without a non-empty reason (bounded to 500 characters).
- State transition and audit insert use the same injected transaction database. Audit failure throws so the enclosing transaction can roll back.
- Does not link by email, does not permit candidate self-assignment, checks active candidate status, records the trusted actor ID and correlation ID, and rejects malformed UUIDs.
- Added unit tests for authorization, UUID validation, state transition predicates, audit writes, audit failure propagation, malformed candidate IDs, empty correlation IDs, and overlong revocation reasons.
- Expanded the lifecycle validator to check the non-conflicting migration filename, one-to-one Auth-user/candidate mapping, permitted statuses, backend-only RLS, and verification/revocation metadata constraints.
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
