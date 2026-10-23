# N06/N15 candidate opportunity and pathway-preparation batch — 2026-10-23

## Shipped in source and staging

- Candidate opportunity page now queries `current_verified_route_opportunities`, not a separately assembled client-side filter over the base route table. The view is the single source of the fail-closed rules.
- Opportunity cards use the view's `programme_id` and verified-record timestamp fields, preserving the existing account-save flow.
- The view includes only verified, public-safe providers and programme records marked OPEN, with HTTPS sources and an update within 90 days; it excludes programmes with expired verified deadlines in South African time.
- Staging view SELECT is granted to `anon` and `authenticated` because its output is intentionally public-safe catalogue metadata only. The view is `security_invoker=true`, so underlying table grants and RLS still apply. It contains no candidate data.
- Candidate application preparation Edge Function v11 is deployed with JWT verification still enabled.
- Tracker creation now creates pathway-specific preparation items for higher education, TVET, SETA/learnerships, internships, apprenticeships and employment. Each checklist tells the candidate to confirm the exact provider requirements; it does not claim every listed document is universally mandatory.
- The identity gate remains unchanged: tracker load/create/update requires a valid Supabase user and an authorised verified candidate identity link. Candidate-reported progress remains distinct from provider-confirmed submission/outcomes.

## Live staging checks

- Current verified opportunity view returns 6 eligible records.
- Feed checks: 0 non-HTTPS rows, 0 rows older than 90 days, 0 rows with non-OPEN status.
- Expired verified deadlines excluded in current snapshot: 0.
- Access checks: `anon` and `authenticated` have SELECT on the public-safe view; base route-programme and provider SELECT grants exist. The view remains constrained by its predicate and underlying RLS.
- Edge Function `candidate-application-preparation`: ACTIVE v11, `verify_jwt=true`.

## Explicit verification limits

No authorised candidate identity link currently exists in staging, so the candidate-owned tracker/checklist mutation journey could not be exercised with a real authorised test candidate without provisioning or using an explicitly authorised test account. No fake candidate, reviewer, or document was inserted. The candidate UI/API runtime journey, Netlify published commit match, and production deployment remain unverified. The public view and Edge Function deployment are verified; full E2E is not claimed.
