# Candidate document-request bridge batch — 2026-10-17

## Delivered on the existing PR #86 branch

- Added a read-only Truth Vault method that resolves an active candidate through the server-verified Supabase Auth UUID binding (`candidate_accounts.auth_user_id`). It never links accounts by email or accepts a candidate ID from the browser.
- Added a POST-only internal API endpoint protected by `KINGSMEN_WEB_INTERNAL_API_KEY` and timing-safe secret comparison.
- Added a same-origin Next.js GET route that verifies the Supabase user server-side, calls the internal API over HTTPS outside loopback, and returns no-store request metadata.
- Added a candidate UI section for open document requests, including type, reason, priority, due date and created date. It has no upload, fulfilment or review mutation controls.
- Added a static ownership-boundary validator and an npm script to run it.

## Security and operational boundaries

- Unlinked, inactive or unauthenticated accounts fail closed.
- The backend reads only `request_status = 'OPEN'` rows for the resolved candidate and caps output at 100.
- No Supabase migrations or staging data were changed.
- This does not enable document upload/download, file storage, signed URLs, reviewer decisions or request fulfilment.
- The new validator is a static source check; it is not a substitute for runtime tests.

## Verification status

A previous GitHub Actions run exposed a TypeScript generic test-fixture cast failure in `candidate-application-read.test.ts`. That was corrected in commit `6153222164b059c60640ded50a744aaec478b599`. The latest CI run was still in progress during this batch; do not treat this batch as build/test-passed until the current head's checks complete successfully.
