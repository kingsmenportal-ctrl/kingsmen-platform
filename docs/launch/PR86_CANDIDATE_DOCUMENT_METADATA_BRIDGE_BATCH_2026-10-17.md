# PR #86 — Candidate document metadata bridge

Date: 2026-10-17

## Delivered
- Candidate document status now verifies the Supabase Auth session server-side before requesting records.
- The Next.js server calls a POST-only internal API endpoint using a server-only `KINGSMEN_WEB_INTERNAL_API_KEY`.
- The API uses the existing explicit `candidate_accounts.auth_user_id -> candidate_id` binding, consistent with the staging project's `kingsmen_security.current_authenticated_candidate_id()` RLS helper. It does not infer ownership from email or accept candidate IDs from the browser.
- The metadata query requires an active candidate, omits archived/deleted documents, and returns only display metadata. Storage bucket/path and checksum are not selected or returned.
- The candidate document page now renders a metadata-only list with status, verification/extraction state, size and upload date. No download or signed URLs are exposed.
- The identity query runs in a transaction with transaction-local backend service context and rolls back on failure.

## Live Supabase staging inspection
The connected staging project `kingsmen-portal-staging` was inspected read-only. Its current schema has `document_files`, `candidate_accounts.auth_user_id`, and `candidate_sessions`; the RLS helper `kingsmen_security.current_authenticated_candidate_id()` explicitly maps `auth.uid()` to `candidate_accounts.candidate_id`. The connected project currently records migrations through `revoke_unneeded_candidate_mutations_0030`; repository-only `candidate_documents` metadata schema and the newer identity-link migration are not present in this live schema. This batch therefore uses the live `document_files` model rather than assuming those repository migrations have been applied.

The Supabase security advisor returned no findings at the time checked. The performance advisor reports 162 unused-index informational findings; this batch makes no index changes.

## Required configuration and limitations
- Next.js server: `KINGSMEN_API_BASE_URL` and `KINGSMEN_WEB_INTERNAL_API_KEY`.
- API server: same `KINGSMEN_WEB_INTERNAL_API_KEY`, plus durable PostgreSQL configuration.
- API base URL must use HTTPS outside localhost. Keep the internal key out of all browser-visible variables.
- Metadata listing does not implement upload, download, signed URL, storage-provider access, or document review. Those remain blocked pending real storage authorization and file validation.
- The validator is committed but has not been executed here. No build, end-to-end test, or live authenticated HTTP test is claimed.
