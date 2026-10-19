# Verified route catalogue — activation gate

**Status: BLOCKED pending authoritative source records.** This is an intake and release contract, not permission to mark unverified records as live.

## Staging audit (2026-10-19)

Read-only queries against Supabase project `euhubhhnumtibbyufghm` returned zero rows in each of:

- `route_categories`
- `route_providers`
- `route_programmes`
- `route_sources`
- `opportunity_providers`

Therefore the application-preparation flow has no real verified opportunities to start from. Do not seed illustrative providers, invent canonical pathway names, or mark synthetic listings as verified to make the UI look populated.

## Minimum evidence required before import

For each provider, obtain an authoritative source URL and evidence that the provider is real, its public-facing use is safe, and any required accreditation check has been completed. Populate the provider's canonical key/name/type, official HTTPS base URL, confidence band, verification state, public-safety flag and source-authority reference.

For each programme, retain a stable unique `programme_key`, canonical provider reference, programme name and route type, delivery mode, application method, eligibility summary, province/qualification where applicable, official HTTPS source URL, confidence band, route state, availability state and source review timestamp. Store source-specific provenance in the existing source/metadata model; never represent a candidate's report as provider evidence.

For categories, only load pathway/category names from an authorised Kingsmen source of truth. The sixth pathway remains unconfirmed until that evidence is supplied.

## Import procedure

1. Collect source records and capture retrieval/review timestamps and reviewer identity outside candidate-facing UI.
2. Validate every URL, provider identity, duplicate key, required field, status enum, and foreign-key relationship against the live schema before writing anything.
3. Stage the candidate import as a reviewable diff. No bulk promotion to `VERIFIED` is allowed merely because a row was imported.
4. Have an authorised reviewer approve the provider and programme evidence. Preserve rejection and correction history.
5. Apply an idempotent, transaction-safe import through a controlled migration/import job. Never expose the Supabase service-role credential in browser code or commit it to the repository.
6. Re-query counts and joins; verify that only recently reviewed A/B-confidence records with official HTTPS URLs and safe, verified providers qualify for public display.
7. Run authenticated integration checks for candidate A, candidate B and an unverified account: ownership isolation, saved-route requirements, tracker creation, duplicate retry, checklist recovery and denied access.
8. Record the import batch ID, source manifest checksum, inserted/updated/rejected counts, test run links and rollback procedure. Keep the public catalogue empty rather than displaying unverified data if any gate fails.

## Release acceptance criteria

- At least one genuinely sourced provider and programme exists, and an authorised reviewer has explicitly verified both.
- Catalogue rows are linked by valid foreign keys and pass all status, source freshness and confidence checks enforced by the Edge Function.
- A candidate can save the real verified route and create/update their own application tracker end to end.
- A second candidate cannot read or mutate the first candidate's tracker or checklist.
- The frontend deployment identifies the exact commit and successful deploy URL.
- No test-only or invented record is promoted to the live catalogue.

## Current deployment boundary

The application-preparation Edge Function is active with JWT verification enabled. Static smoke, Source Guard and Release Evidence workflows passed on commit `ca5f1873ccb754717692dd5a4680347a6908ceff`. Those checks do not substitute for a populated catalogue, authenticated browser E2E, or a frontend deploy. PR #134 remains draft and unmerged. The connected Netlify project currently exposes only its existing published deploy; no deploy-trigger action is available through the connected Netlify tools in this session.

## Safe next input

Provide an authorised source-of-truth export (CSV/JSON or source URLs plus the approved canonical pathway list). The import must be validated against the current schema and evidence policy before any catalogue records are written.
