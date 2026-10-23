# N08 live founder health — staging implementation note

Date: 2026-10-23  
Supabase staging project: `euhubhhnumtibbyufghm`

## Implemented

- Replaced the static founder health API shell with an authenticated proxy to `n08-founder-control-plane-health`.
- Deployed the Edge Function to staging as version 1 with `verify_jwt=true`.
- Requires a valid JWT and an active `PLATFORM_ADMIN` row in `platform_reviewers` for user-token access.
- Uses the server-side service key only inside the Edge Function; the web route forwards the caller JWT and public anon key and does not read a service-role secret.
- Returns aggregate counts only for the Airtable outbox, submission queue, founder command queue, escalation queue, ingestion failures, active mirror targets, and reviewer grants. No candidate records or payloads are returned.
- Computes an Oracle-Lite queue safety signal and a founder-review/stop-selling recommendation without taking automatic destructive action.
- Treats zero active outbound targets and zero active founder reviewer grants as degraded readiness, not healthy.
- Added static source-contract checks to the repository test gate.

## Boundaries and limitations

- This is a read-only aggregate health surface, not a command execution endpoint.
- Staging currently has no active founder reviewer grant; user-token calls should remain forbidden until an authorized grant is created.
- The health route has not been browser-tested with an authorized founder session.
- GitHub Actions status for the current branch has not yet been confirmed.
- No production deployment or production-readiness claim is made.

## Acceptance gates

1. Confirm unauthenticated calls fail and an ordinary candidate token cannot read founder health.
2. Confirm an active PLATFORM_ADMIN can read counts only.
3. Confirm every failed/missing table query is surfaced as degraded, never fabricated as healthy.
4. Verify no candidate PII or document metadata is present in the response.
5. Run the route through the deployed Netlify site after PR review/merge and verify the caller session reaches the Edge Function.
