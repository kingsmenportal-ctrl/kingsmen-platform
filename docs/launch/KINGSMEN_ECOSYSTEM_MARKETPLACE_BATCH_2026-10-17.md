# Kingsmen ecosystem marketplace batch — 2026-10-17

## Delivered in this batch

- Added a verified opportunity read API at `GET /api/public/opportunities`.
- Added a responsive opportunity directory with search, category and province filters.
- Added direct routes for opportunities, schools/colleges/universities, jobs, funding, accommodation and training/SETA/learnerships.
- Rewired the Personal Job Desk opportunity scout to the verified read-only directory instead of the disabled local Playwright route.
- Connected homepage pathway cards to the new category routes.
- Added marketplace schema for organisations, provider-submitted listings and candidate-saved listings.
- Applied the marketplace schema to the Kingsmen staging Supabase project, with RLS enabled on all new tables.
- Added RLS-limited public reads for route providers and programmes. Public listings require a verified provider, source confidence A/B, verified/open-or-future programme state and an update within 90 days.
- Added indexes for marketplace foreign keys and consolidated listing-read policies.
- Configured Netlify staging with the Supabase project URL, publishable key and public anon JWT. No service-role key is used by the public opportunity route.
- Added a shared strict HTTPS URL validator for public provider links, partner website/source/application URLs, and reviewer evidence. It rejects non-HTTPS schemes, malformed URLs, embedded credentials, local-only hostnames and oversized values.
- Added migration `0057_marketplace_https_url_constraints.sql`; Supabase staging accepted it successfully. Database constraints now reject non-HTTPS, malformed, credential-shaped and local-only public URLs even if a future client bypasses the current web validators.
- Added regression tests and a static integration validator, wired into the web CI workflow before the production build. CI must still run against the latest PR head before this is considered verified.

## Routes

- `/candidate/saved-opportunities`
- `/candidate/application-tracker`
- `/api/candidate/saved-listings` (saved verified route records)
- `/api/candidate/route-applications`
- `/api/candidate/saved-listings` supports both route programmes and partner listings
- `/admin/marketplace-review`
- `/api/admin/marketplace-review`
- `/api/partners/organisations`
- `/api/partners/listings`

- `/opportunities`
- `/schools`
- `/jobs`
- `/funding`
- `/accommodation`
- `/training`
- `/partners`
- `/employers`
- `/personal-job-desk/opportunity-scout`

## Data and safety contract

The public endpoint combines curated `route_programmes`/`route_providers` with partner `organisation_listings`. Both sources require current freshness and database RLS; partner listings additionally require an approved organisation, published status, and source-review evidence. It does not generate sample listings. Opening a provider's source is not represented as an application submission. The organisation listing intake table defaults to pending review and client policies do not permit a submitter to publish or mark a source verified. Candidate saved listings are owner-scoped by `auth.uid()`.

## Current operational status

- Database migrations `0041` through `0058` applied to staging successfully, including review-event audit, database-enforced HTTPS URL constraints, and rejection of raw IP-literal source hosts.
- Supabase security advisor returned no security lint findings after the URL-boundary schema changes. Performance advisor still reports pre-existing informational unused-index findings across the broader database.
- Staging currently contains **zero verified programme records meeting the public directory rules**, and the marketplace tables contain no partner submissions or candidate trackers yet. The directory will therefore show an empty state until authorised staff add and verify real records. No fictional opportunities were inserted.
- Partner onboarding and listing submission are connected, but reviewer role assignment and end-to-end reviewer testing remain unverified.
- The staging Netlify project requires team SSO for non-production deploys; the public preview must not be described as openly accessible.
- The existing GitHub Actions runs inspected during this batch were failed runs for an earlier commit; job logs were unavailable. A green production build, browser journey test, and new CI result for the current head have not been established by this batch.
- The broader launch-readiness gate remains authoritative. This batch does not authorize public launch or claim end-to-end submissions to external institutions.

## Next completion gates

1. Add and source-review actual current provider/programme records, capturing evidence and review dates.
2. Complete the existing candidate identity-to-profile mapping and test application tracking under real signed-in candidate sessions; the new self-service tracker is owner-scoped, while the legacy provider-connected outcomes endpoint still requires the established identity mapping.
3. Configure the authorised reviewer identity/role boundary and implement the review queue, review evidence and publication action; intake exists but cannot self-verify or publish.
4. Verify the Next.js production build and end-to-end journeys in CI and a protected staging environment.
5. Complete the existing candidate identity-to-profile mapping and secure candidate profile/document services; the existing legacy provider-connected application endpoint still requires this mapping and internal API configuration.
6. Continue the launch-readiness checklist: private document upload/download, communications, payment sandbox, backup/restore and final runtime proof.


## Candidate identity, document and application lifecycle boundary status

The same draft PR also contains source-level candidate identity-link lifecycle/admin workflows, owner-scoped application/document metadata reads, transaction-scoped application tracker reads with audit evidence, document-readiness ownership checks, private/no-store response handling, and candidate application state evidence matching. These safeguards are intended to fail closed when identity mapping, ownership, evidence, or database configuration is missing.

**Runtime proof is still outstanding:** the current PR head has no recorded passing commit status in the connected status lookup. TypeScript builds, Node regression suites, static validators, signed-in candidate journeys, reviewer-role checks, and live transaction/RLS behavior must pass before these source changes are treated as runtime-verified. The API manifest is pinned but has no committed apps/api/package-lock.json; the current workflow still installs API dependencies with npm install, so reproducible API dependency installation remains an open gate.


## Batch 13 — Public DNS URL boundary (2026-10-17)

- Tightened the shared URL validator to reject raw IPv4/IPv6 address hosts, single-label intranet hostnames, and reserved local/test/invalid suffixes in addition to non-HTTPS, malformed, credential-bearing, and oversized URLs.
- Added regression cases for loopback/private/link-local IP literals and intranet names; search sanitization tests preserve Unicode, apostrophes, hyphens and whitespace while removing PostgREST grammar/wildcards.
- Added migration 0058 with database checks rejecting raw dotted-quad IP literal hosts for organisation websites, partner source/application links, curated provider base URLs and programme source URLs.
- Applied migration 0058 to staging. A read-only catalogue query confirmed all five constraints exist; the Supabase security advisor still reports zero findings.
- Updated the static integration validator to require both code-level host rejection and the database migration. CI execution remains blocked by the repository's runner assignment problem; no green build or deployment is claimed.
\n\n## Batch 14 — Reviewer audit visibility (2026-10-17)\n\n- Extended the authenticated marketplace review queue API to read the newest 50 `marketplace_review_events` records through the signed-in reviewer session; the database RLS policy remains the access boundary and no service-role key is introduced.\n- Added a read-only audit timeline to the reviewer workspace showing action, before/after state, event timestamp, entity identifier, actor identifier and evidence links.\n- Audit-feed failure is surfaced as an explicit warning and does not fabricate empty audit history; review queue data remains governed by its existing RLS checks.
- Added `scripts/validators/validate-marketplace-review-audit.mjs` and wired it into the application workflow before the production build. It asserts bounded newest-first reads, cache controls, evidence rendering, reviewer RLS and client immutability.\n- This is a source commit only. The repository runner has not been available for TypeScript/build/browser verification, and no new deployment or public staging access is claimed.\n

## Batch 15 — Candidate identity readiness and CI hardening (2026-10-17)

- Added `scripts/validators/validate-candidate-identity-live-readiness.mjs` to enforce explicit one-to-one auth/candidate mappings, verified-only resolution, backend-only RLS, action-specific trusted operator permissions, audited state transitions, and fail-closed candidate/document endpoints. It also prevents a future web API route from directly exposing the operator-only runtime.
- Wired the new readiness validator into the candidate bridge CI job.
- Added per-job timeouts and concurrency cancellation so superseded branch runs do not consume CI indefinitely.
- Live staging read-only check: identity mapping table exists; 2 active candidate rows; 0 verified identity links; 0 pending identity links; 0 verified organisations; 0 published partner listings. This is a blocker/evidence snapshot, not a claim that a real reviewer or candidate journey has passed.
- No migration was applied, no secrets changed, no deployment was triggered, and the PR was not merged. CI/build execution remains unverified until a runner result is available.


## Staging verification correction — read-only inventory (2026-10-17)

The live Supabase migration inventory confirms `candidate_auth_identity_link_0040` and marketplace migrations `0041` through `0058` are recorded. A read-only catalog query confirms RLS is enabled on `candidate_auth_identity_links`, with the backend-only `candidate_auth_identity_links_backend_all` policy. The table currently has zero rows (zero pending, verified or revoked mappings). There are two active candidate rows, but no verified organisation or published partner listing. Schema presence is confirmed; real candidate identity-linking and reviewer workflows are still not proven end to end.


## Phase B — Candidate identity assurance and launch-gate integration (2026-10-17)

### Added in this implementation batch

- Added `scripts/validators/validate-candidate-identity-live-readiness.mjs` as a fail-closed source gate across the identity-link schema, verified resolver, operator lifecycle, legacy profile/application endpoints and private document URL routes.
- The gate checks that Auth-user and candidate IDs are uniquely bound, mappings are RLS-protected and backend-only, only `VERIFIED` links to active candidates resolve, duplicate resolver rows fail closed, and email-based identity matching is absent.
- The gate also checks action-specific trusted operator permissions, transaction-scoped identity mutations, audit event types for create/verify/revoke, and verifies that document signing routes return unavailable rather than fabricate signed URLs while the real identity/storage adapter remains unconfigured.
- Added `npm run candidate:validate:phase-b`, an aggregate gate that runs the existing candidate transaction, identity lifecycle, ownership, application tracker, document and bridge validators plus the new identity readiness gate and both marketplace URL/reviewer-audit validators. CI now invokes this single Phase B gate.
- Added the named root command `npm run candidate:validate:live-readiness` and wired it into the candidate bridge source-guard job, so the same explicit gate can be run locally and in CI.
- Existing API unit coverage already includes verified identity resolution, malformed UUID rejection, duplicate-row fail-closed behavior, operator authorization, pending-only verification, audit writes and transaction rollback. These tests are included by the API's TypeScript build and Node test suite; they have **not** been reported as passing on the current head until CI evidence is returned.
- Read-only staging inspection confirmed the identity-link table exists; the staging project has two active candidate rows, zero verified or pending identity links, zero verified organisations and zero published partner listings. No candidate identities or opportunities were fabricated to make the counts look healthy.
- No additional database migration was required for this batch; the identity-link schema and marketplace migrations through `0058` are already applied to staging.

### Remaining Phase B gates

- The API manifest still has no committed `apps/api/package-lock.json`; the current workflow still uses `npm install`. Reproducible API dependency installation remains unresolved.
- No trusted operator-session adapter is wired to the identity-link lifecycle, so the admin runtime remains deliberately unexposed rather than allowing browser-supplied role claims to bind candidate identities.
- The legacy profile endpoint remains fail-closed until identity resolution is connected to a verified mapping. Candidate document upload/download remains unavailable until real private-storage signing and ownership checks are wired.
- A green current-head CI run, successful Next.js/API production build, signed-in candidate journey, reviewer-session journey and successful current-head Netlify deploy are still required. The Netlify staging site continues to require team SSO.
- The staging opportunity directory currently has no qualifying verified source records. Real source evidence and authorised reviewer decisions are required before listings can appear.

**Status:** source and CI-gate changes committed; staging schema/security state inspected. This is not a production launch certification, and no successful CI, live reviewer session, candidate identity-link operation or deployment is claimed.
