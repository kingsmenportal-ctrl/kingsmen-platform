# PR #86 — Phase A.1 candidate bridge CI gate

Date: 2026-10-17  
Branch: `feat/phase-a1-public-destiny-auth-foundation`

## Batch outcome

- Added `candidate:validate:application-identity-bridge` so the existing identity-bridge validator has a first-class package command.
- Added `auth:validate:provider-boundary` and a static validator for HTTPS provider configuration, bounded request parsing, same-origin guards, HttpOnly/SameSite cookies, no-store responses, server-side session verification, recovery non-enumeration, bounded access/refresh token sizes, and no service-role key in the web auth boundary.
- Added a pure token-bounds helper and regression tests for missing, partial, non-string, undersized and oversized access/refresh tokens; login, registration and refresh share that validator before storing tokens. Provider HTTP calls have an eight-second timeout, and the cookie/session helper rejects invalid token sizes.
- Added `candidate:validate:phase-a1-bridges`, a single deterministic command that chains the auth provider boundary, candidate transaction, identity-link lifecycle/admin runtime, ownership/application reads, application identity/tracker, document ownership/vault/upload/review/metadata/request, and support-ticket source validators.
- Added a dedicated `candidate-bridge-source-guards` job to `.github/workflows/kingsmen-application-builds.yml` to run the suite on pull requests targeting the configured branches.
- The existing API build/test job remains responsible for TypeScript compilation and unit tests. The new job complements it; it is not a substitute for a real database integration test.

## Scope of checks

The suite covers:
- web authentication provider/session boundary checks;
- backend transaction boundaries;
- operator authorization and identity-link lifecycle predicates;
- server-verified Supabase Auth identity propagation;
- candidate ownership scoping and active-candidate checks;
- internal API service-key protection;
- document metadata projections and absence of file links;
- open document-request read boundaries;
- read-only support-ticket projection.

## What this does not prove

- This commit does not run the validators by itself. The new workflow job must execute and return a successful result on the current head.
- Run IDs `39008225972` (Jarvis Live Runtime) and `39008226020` (Kingsmen Application Build Checks) on head `8b1de029d3ed08735e898d78b6acdedde1156ec5` reported failures within about two seconds; all jobs had `runner_id=0`, no steps, and their logs returned `BlobNotFound`. Reruns showed the same no-runner/no-log condition. This is insufficient to diagnose source failures and does not count as a test result.
- No database migration is applied. `db/migrations/0040_candidate_auth_identity_link.sql` remains pending.
- No live operator identity provider, candidate Auth session, file-storage provider, email delivery, upload/download, or end-to-end staging path is enabled by this change.
- Source validators cannot replace PostgreSQL integration tests for RLS, uniqueness, concurrent state transitions, rollback, or staging data integrity.
- The API package lockfile gap remains open until a real lockfile is generated and checked into the repository; it must not be fabricated.

## Acceptance gates

1. New CI job succeeds on the latest PR head.
2. API compile and unit-test job succeeds on that same head.
3. API dependency installation is reproducible from committed lockfiles.
4. Authorized operator workflow and real Auth-to-candidate mapping are reviewed.
5. Migration is applied only by an authorized operator after backup/recovery and schema reconciliation gates.
6. Staging integration tests verify RLS, uniqueness, transaction rollback, and concurrency before candidate reads depend on the new mapping.


## Follow-up — bounded provider calls and shared token validation

- Commit `78ff11ba3e970e8361de7646dfe869b85dcd0493` adds an eight-second timeout for provider calls, rejects invalid access/refresh token lengths before writing cookies, and bounds tokens read from cookies before provider use.
- Commits `d22ab0fc70d1cf9b63ab4b7719433d66d7179f4c`, `453da73e8c41ce834eaec82ada00f5f0993f0296`, and `431fb8276eddf060fb9d6e41c98268d2ae9f221d` use the shared token-pair validator for login/refresh and align the source guard with registration's invalid-provider response.
- The last known Actions run on earlier head `1bb1d148266ed2395eaa70540ee58cabaa788c10` failed with all jobs showing no steps and `runner_id=0`; log retrieval returned `BlobNotFound`. That is not enough to attribute the failure to source or infrastructure conclusively.
- Latest head `431fb8276eddf060fb9d6e41c98268d2ae9f221d` has no workflow runs returned by the current Actions query. These edits remain unverified until a real run completes.
