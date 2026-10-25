# N17 authenticated live founder brief — 25 October 2026

## Runtime path
- `GET /api/founder/brief` produces a morning brief; `POST /api/founder/brief` produces an evening brief.
- The API verifies the bearer token against Supabase Auth `/auth/v1/user`; it does not decode JWT claims itself.
- Before any operational query, the verified immutable Auth UUID must match an active `founder_operator_profiles.operator_ref` with `role_key='FOUNDER'`. No email matching or candidate identity fallback is used.
- Runtime requires `KINGSMEN_TRUTH_VAULT_MODE=postgres`, a server-only `KINGSMEN_DATABASE_URL` (or `DATABASE_URL`), `SUPABASE_URL`, and `SUPABASE_ANON_KEY`. Never expose the database URL or privileged credentials to a browser.
- The response uses `Cache-Control: no-store`, returns aggregate candidate-follow-up counts only, and never returns candidate identifiers, notes, documents, or application refs.
- Each request reads persisted N13/N16/N17 operational tables, preserves source timestamp/reference, computes freshness using the existing evidence-aware brief builder, stores a row in `founder_daily_briefs`, and writes a `FOUNDER_LIVE_BRIEF_READ` audit event. The existing brief schema stores each section as JSONB and evidence refs as a text array.
- Source-query errors are named by domain, not SQL message. Missing data remains missing; stale evidence remains stale; the API never reports production readiness.

## Security migration
`202610250004_n17_founder_brief_access_hardening.sql` removes the original permissive N17 RLS policies and revokes table grants from `PUBLIC`, `anon`, and `authenticated`; only server-side `service_role` DB access remains. The HTTP endpoint still requires both a valid Supabase session and an active FOUNDER operator row.

## Known verification gates
- Source contract checks are automated in `npm run n17:founder-brief:integration:check`; they are static source contracts, not runtime proof.
- Live end-to-end verification requires a real active FOUNDER operator mapped by exact Auth UUID and API runtime secret configuration. Do not seed or elevate an arbitrary account automatically.
- Test 401 (no/invalid bearer), 403 (valid non-founder), 200 founder read, history persistence, audit persistence, missing/stale sources, and denial of direct PostgREST access for `anon`/ `authenticated`.
- TypeScript build, root contract chain, live staging HTTP matrix, independent review, deployment, and cockpit UI integration remain separate gates until evidence exists.
