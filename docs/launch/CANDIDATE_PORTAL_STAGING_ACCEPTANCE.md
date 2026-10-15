# Candidate portal staging acceptance

Status: **procedure only; not runtime evidence**.

Use this checklist only against the explicitly verified Supabase staging project and non-production test identities. Do not use real candidate personal data. Do not mark a check passed unless the described action was executed and its result was reviewed.

## Preconditions

- Confirm the target project is `kingsmen-portal-staging` (project ref `euhubhhnumtibbyufghm`).
- Confirm the tested deployment points at that staging project and has production payments disabled.
- Create two distinct, verified test Auth users (A and B) and two candidate records (A and B) using the approved operator provisioning workflow.
- Record the test run ID, operator, UTC start time, deployment commit, project ref, and test identity aliases (A/B only). Never record passwords, access tokens, service-role keys, signed URLs, or real candidate data.
- Use only synthetic documents. The storage policy permits PDF, DOCX, and TXT up to 10 MiB.

## Required positive checks

For each account independently:

1. Sign in with the verified test identity and confirm the session endpoint reports the expected authenticated state.
2. Load the candidate portal and confirm the signed-in user's own durable state loads.
3. Save a harmless test profile change, reload, and confirm it persists.
4. Upload a synthetic allowed document and confirm the portal shows its metadata without exposing a public object URL.
5. Download that document through the authenticated document route and compare its bytes with the uploaded fixture.
6. Sign out, revisit the session endpoint, and confirm the session is no longer accepted.
7. Record HTTP status, timestamp, test alias, and a redacted result for each step.

## Required negative / isolation checks

Run each cross-account check explicitly; do not infer isolation from successful own-account reads.

- While signed in as A, attempt to read B's durable state through the user-scoped API/client path. It must not return B's data.
- While signed in as A, attempt to update B's state. It must not change B's persisted state.
- While signed in as A, attempt to download B's document by substituting B's document identifier. The request must be denied or return not found and must not return document bytes.
- Repeat all three checks with A and B reversed.
- Attempt unauthenticated access to the state and document routes. Protected data must not be returned.
- Verify the bucket is private and the `candidate-documents` object policies scope reads/inserts/deletes to the authenticated user's first path segment.
- Confirm an unverified Auth user cannot be bound to a candidate; identity binding must use the explicit verified Auth UUID and candidate UUID, never email matching.

Capture before-and-after state for the negative write tests so that “denied” also proves no underlying mutation occurred. Redact all tokens and personal data from logs and screenshots.

## Evidence report expectations

Store evidence in the approved staging evidence location, with a unique run identifier. Include:

- schema/version, `status`, `passed`, `reviewed`, `redacted`, `productionReady: false`, and `publicLaunchAllowed: false`;
- target project ref, tested commit/deployment identifier, UTC timestamps, test aliases A/B, and individual assertion results;
- redacted HTTP statuses and database verification outcomes;
- any failures, retries, skipped checks, and reviewer identity/timestamp.

A report is acceptable only when the checks were actually run, the output was reviewed, and secrets/PII were removed. A source validator, policy listing, mock provider, or this checklist alone is not runtime evidence.

## Separate launch gates

This acceptance does not cover backup/restore rehearsal, PayFast sandbox callback verification, branch protection, communications provider delivery, secrets wiring, observability incident drills, legal/privacy publication review, or final evidence-bundle assembly. Those remain separate gates.

## Automated two-user state persistence and isolation runner

The repository includes `scripts/staging/verify-candidate-isolation.mjs`. It exercises the deployed candidate API using two distinct, already-verified staging Auth access tokens. It checks distinct identities, profile-note persistence after a fresh GET, bidirectional marker isolation, resistance to a caller-supplied `auth_user_id`, and unauthenticated denial. It temporarily replaces only each test user's profile notes and attempts to restore their original values in a `finally` block. Run only with dedicated synthetic test accounts.

Run from the repository root with Node.js 22 or newer:

```sh
CANDIDATE_STAGING_BASE_URL='https://<staging-app-host>' \
CANDIDATE_STAGING_SUPABASE_URL='https://euhubhhnumtibbyufghm.supabase.co' \
CANDIDATE_STAGING_PROJECT_REF='euhubhhnumtibbyufghm' \
CANDIDATE_STAGING_USER_A_TOKEN='<short-lived verified staging user A token>' \
CANDIDATE_STAGING_USER_B_TOKEN='<short-lived verified staging user B token>' \
PAYMENTS_LIVE=false \
npm run staging:test:candidate-isolation
```

Supply tokens through a protected local environment or secret manager; never commit them, paste them into tickets, or save them in evidence. The runner rejects a project ref other than the approved staging ref, requires HTTPS except for localhost app URLs, requires distinct tokens, and refuses to run if `PAYMENTS_LIVE=true`. Its report deliberately sets `reviewed: false`, `productionReady: false`, and `publicLaunchAllowed: false`; a successful run is evidence for these specific checks only, not launch approval. Review the report and confirm that both original notes were restored before accepting the evidence. A failed restoration requires manual recovery of the dedicated test account.
