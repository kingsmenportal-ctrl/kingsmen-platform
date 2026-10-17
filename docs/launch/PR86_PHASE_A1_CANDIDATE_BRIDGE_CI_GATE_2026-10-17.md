# PR #86 — Phase A.1 candidate bridge CI gate

Date: 2026-10-17  
Branch: `feat/phase-a1-public-destiny-auth-foundation`

## Batch outcome

- Added `candidate:validate:application-identity-bridge` so the existing identity-bridge validator has a first-class package command.
- Added `candidate:validate:phase-a1-bridges`, a single deterministic command that chains the candidate transaction, identity-link lifecycle/admin runtime, application identity/tracker, document ownership/metadata/request, and support-ticket source validators.
- Added a dedicated `candidate-bridge-source-guards` job to `.github/workflows/kingsmen-application-builds.yml` to run the suite on pull requests targeting the configured branches.
- The existing API build/test job remains responsible for TypeScript compilation and unit tests. The new job complements it; it is not a substitute for a real database integration test.

## Scope of checks

The suite covers:
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
