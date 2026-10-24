# N15 Source Ingestion Authentication Hardening — 2026-10-25

## Change

The source-ingestion Edge Function previously decoded the bearer token payload and trusted its `role` claim to select a service-role bypass. Decoding a JWT payload is not signature verification and must not grant backend privileges.

The endpoint now:
- Removes the unverified JWT-payload role decoder.
- Permits the backend bypass only when the bearer token exactly equals the server-held `SUPABASE_SERVICE_ROLE_KEY`.
- Verifies every other bearer through Supabase Auth `getUser`.
- Resolves reviewer permission using the verified Auth user ID and an active reviewer row.
- Returns 401 for missing/invalid authentication and 403 for a valid user without an allowed active reviewer record.
- Keeps source observations in `NEEDS_REVIEW`; this change does not publish opportunity claims or submit applications.

## Regression coverage

The N15 live-ingestion contract test now asserts:
- No decoded JWT role trust remains.
- Backend bypass requires exact server-held service-key equality.
- Other bearer tokens are verified by Supabase Auth.
- Reviewer privilege is tied to the verified user ID and active reviewer status.

## Evidence status

- Implementation: committed on branch `fix/n15-source-ingestion-auth-hardening-2026-10-25`.
- Regression test: committed; workflow result pending at report creation.
- Supabase deployment: NOT DEPLOYED by this change.
- Live authentication matrix: NOT RUN.
- External source crawl and database persistence: NOT RUN.
- Production readiness: FALSE.

A successful source-contract workflow is not live authentication proof. Deploy only after independent review and required repository checks, then test missing token (401), invalid/tampered token (401), ordinary authenticated user (403), active authorised reviewer, and exact backend service-key path in staging. Keep test credentials and secrets out of logs.
