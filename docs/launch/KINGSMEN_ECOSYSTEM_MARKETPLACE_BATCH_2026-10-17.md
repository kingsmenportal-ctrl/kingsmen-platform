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

- Database migrations `0041` through `0055` applied to staging successfully.
- Supabase security advisor returned no security lint findings immediately after the schema change.
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
