# Candidate Support Ticket Read Bridge — 2026-10-17

## Scope
Adds a candidate-facing, read-only status view for support tickets already recorded in `public.candidate_support_tickets`.

## Identity and data boundary
- The web route resolves the current user through server-side Supabase Auth verification; the browser cannot supply a candidate ID.
- The web server calls a POST-only internal API using `KINGSMEN_WEB_INTERNAL_API_KEY`.
- The internal endpoint checks that secret using a length guard and timing-safe comparison.
- The repository binds the verified Auth UUID through `candidate_accounts.auth_user_id`, requires `candidates.is_active = true`, and scopes the ticket query to that linked candidate.
- Only ticket reference, category, priority, status, title, and timestamps are returned. Ticket description, evidence references, and assignee details are not exposed by this bridge.
- The read runs inside a transaction with transaction-local backend service context and rolls back on errors.
- Responses are private/no-store. Internal transport must use HTTPS except loopback development.

## UI
The Candidate Support Centre now displays ticket status metadata with loading, error, empty, and refresh states. It does not create, update, reply to, or close tickets.

## Validation and limitations
Run `npm run candidate:validate:support-ticket-bridge` and the repository's full CI/build checks. This connector change has not been locally compiled or browser-tested. Do not treat the feature as runtime-verified until the checks pass on the PR head. No database migration, data mutation, RLS policy change, deployment, or merge was performed. Existing ticket creation/reply workflow and actual support-team delivery remain outside this batch.
