# PR #86 — Candidate application tracker API batch

Date: 2026-10-17

## Delivered
- Added `GET /api/candidate/applications` to the existing Node API.
- Requires the existing server-verified candidate session cookie and a durable Truth Vault connection.
- Queries applications by the authenticated principal's internal candidate UUID; caller-supplied candidate IDs and emails are not used.
- Returns a bounded list of tracker-safe application fields and uses private/no-store response headers.
- Added route to health inventory and a source validator.

## Fail-closed behavior
- Missing candidate auth runtime or disabled durable storage returns 503.
- Missing/invalid session returns 401.
- The endpoint does not expose arbitrary application lookup by reference and does not use the separate Supabase Auth identity-link table.

## Verification boundaries
- The source validator is added but has not been run in this chat.
- No API build, integration test, staging database query, or live HTTP smoke test is claimed.
- The endpoint is part of the API service. It is not automatically wired to the Next.js application; deployment routing/configuration must route `/api/candidate/applications` to the API service where appropriate.
