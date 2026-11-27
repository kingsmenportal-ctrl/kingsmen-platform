# Candidate Application Journey — Release Package

Date: 2026-11-26  
Scope: candidate draft API contract, frontend validation contract, lifecycle regression checks, database release controls.

## Application journey contract

1. An authenticated candidate opens a draft through `GET /api/candidate/application-draft?application_id=<uuid>`.
2. The server forwards the candidate's bearer token to Supabase using the publishable/anon key. The key is not an authorization substitute; database RPCs must derive the candidate identity from the verified JWT and enforce ownership.
3. A save uses `POST /api/candidate/application-draft` with `application_id`, `answer_data`, `expected_version`, and an idempotency key. The route rejects missing authentication, oversized/invalid JSON, malformed UUIDs, invalid versions, malformed keys, and non-object answers.
4. The database save RPC must be transactional. A matching idempotency key and matching request payload returns the original outcome without another event/write. Reusing a key with a different payload must conflict. Stale versions must conflict.
5. Reload and new-session resume must read persisted server state, not browser-only state.
6. Submission must be rejected until the canonical required fields and evidence/readiness rules pass. A successful submission emits exactly one immutable lifecycle event and updates the canonical status in the same transaction.
7. Candidate A/B isolation is enforced in database functions/RLS from verified identity, never from a client-supplied candidate ID. Anonymous, expired, revoked, and cross-owner requests are denied without revealing answers.

## Frontend validation contract

The shared helper `apps/web/src/lib/candidate-application-draft-contract.ts` defines required-field validation, email/date checks, JSON-value size/depth safety, editability, readiness, optimistic-version comparison, and idempotency-key validation. The UI should use this contract for immediate feedback while treating database/API validation as authoritative.

## Database compatibility assumptions to verify before execution

- `public.applications` is the canonical parent record and has a UUID primary key.
- Candidate ownership can be derived by joining the canonical application record to the authenticated candidate identity through existing verified Kingsmen identity objects.
- `kingsmen_security.current_verified_kingsmen_candidate_id()` must already exist or be implemented against the verified identity model; never derive identity from request JSON.
- The existing application status and event-history contracts are canonical; draft functions must not invent parallel status values or permit mutation/deletion of immutable events.
- Existing migration ledger entries and exact SQL bodies must be reconciled before selecting an execution point.

Do not apply a guessed migration if any assumption is false. The release SQL must use the existing canonical identity and application ownership relations, and must include the draft answer store, versioning, idempotency receipt, transactional save/read functions, submission-readiness enforcement, RLS policies, grants, and immutable event handling.

## Execution order

1. Verify a real backup artifact, source project identity, timestamp, checksum and retention evidence.
2. Restore that artifact into an isolated disposable PostgreSQL target without replaying application migrations.
3. Capture schema inventory and reconcile migration ledger rows to exact SQL body hashes.
4. Finalize the migration against the restored schema and run it only in the disposable target.
5. Run candidate A/B journey, idempotency, stale-version, validation, submission, anonymous-access and event-immutability tests.
6. Run repository CI, web build and API build on the exact candidate commit.
7. Obtain independent security review and explicit change-control approval.
8. Apply the approved exact migration to staging with before/after evidence and rollback procedure.
9. Verify the deployed candidate journey and status readback.

## Rollback contract

- Do not delete candidate draft data as an automatic rollback.
- Prefer a forward-fix for additive objects.
- If rollback is required before any candidate data is created, revoke RPC execution grants first, then drop only newly introduced functions/tables in reverse dependency order after confirming object ownership and dependencies.
- If candidate data exists, preserve it; use a reviewed data-preserving rollback and never drop tables blindly.
- Capture migration identifier, target ref, operator, UTC timestamp, object inventory, test outputs and post-rollback health.

## Current branch boundary

This package and its contract tests do not authorize database writes, migration replay, or deployment. The database migration must be finalized against actual restored schema and identity relations, not guessed from table names. Runtime acceptance must be recorded separately from repository test results.
