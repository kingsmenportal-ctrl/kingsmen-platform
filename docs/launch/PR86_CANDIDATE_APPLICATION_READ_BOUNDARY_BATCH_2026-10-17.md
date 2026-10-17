# Candidate Application Read Boundary — 2026-10-17

## Implemented in this batch

- `apps/api/src/candidate/candidate-application-read.ts` adds a parameterized, single-statement read boundary. Applications are joined through the server-verified Supabase Auth UUID → explicitly VERIFIED candidate link → candidate → applications relationship. No candidate ID, public reference, or email is accepted as an ownership selector.
- The query requires a verified link and active candidate, orders the result deterministically, and caps the returned rows.
- The function distinguishes `null` (no verified identity mapping) from `[]` (verified candidate has no applications). This prevents an authorization failure from being presented as an empty tracker.
- `apps/api/src/candidate/candidate-application-read.test.ts` adds mocked database-boundary tests for ownership joins, missing mapping vs. empty list, malformed IDs, and response-field minimization.
- `scripts/validators/validate-candidate-application-read-boundary.mjs` and `npm run candidate:validate:application-read` provide a static source-contract gate.

## Not yet connected or proven

This is a repository read boundary, not a live route. The web applications endpoint remains fail-closed. The current API database repository exposes a pool-level query surface but does not yet establish the trusted RLS context inside a transaction for this identity flow. Do not call this function with a user-controlled ID or an unverified token claim.

Before wiring it to the portal:
1. Add a transaction-capable API database adapter that acquires one connection and sets trusted `app.kingsmen_role=service_role` and `app.service_context=backend_api` with transaction-local settings only; never derive these settings from HTTP input.
2. Ensure all queries and identity resolution execute on that same transaction connection, with rollback on errors and no pooled session-state leakage.
3. Implement an audited, operator/backend-only identity-link provisioning and revocation workflow.
4. Apply migrations only through the approved migration process and prove RLS in a non-production PostgreSQL environment.
5. Run API build/tests and the static validator in a real checkout; add integration tests for two candidates, missing/pending/revoked mapping, inactive candidate, cross-candidate access, and empty-list behavior.
6. Only then replace the web route's 503 response with the backend read boundary.

No migration has been applied and no CI, build, test, or live database result is claimed by this commit.
