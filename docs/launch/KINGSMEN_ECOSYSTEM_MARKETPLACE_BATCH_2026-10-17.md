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

The public endpoint reads existing `route_programmes` and `route_providers` records only when their RLS and query filters allow them. It does not generate sample listings. Opening a provider's source is not represented as an application submission. The organisation listing intake table defaults to pending review and client policies do not permit a submitter to publish or mark a source verified. Candidate saved listings are owner-scoped by `auth.uid()`.

## Current operational status

- Database migrations `0041`, `0042`, and `0043` applied to staging successfully.
- Supabase security advisor returned no security lint findings immediately after the schema change.
- Staging currently contains **zero verified programme records meeting the public directory rules**. The directory will therefore show an empty state until authorised staff add and verify real records. No fictional opportunities were inserted.
- Partner onboarding copy explicitly says the account/listing submission workflow is not yet connected to the page. Do not claim that provider self-service submissions work.
- The staging Netlify project requires team SSO for non-production deploys; the public preview must not be described as openly accessible.
- The existing GitHub Actions runs inspected during this batch were failed runs for an earlier commit; job logs were unavailable. A green production build, browser journey test, and new CI result for the current head have not been established by this batch.
- The broader launch-readiness gate remains authoritative. This batch does not authorize public launch or claim end-to-end submissions to external institutions.

## Next completion gates

1. Add and source-review actual current provider/programme records, capturing evidence and review dates.
2. Connect candidate identity to saved listings and application records through the existing secure backend boundary.
3. Implement authorised organisation onboarding and listing-review UI/API, including reviewer roles and audit evidence.
4. Verify the Next.js production build and end-to-end journeys in CI and a protected staging environment.
5. Continue the launch-readiness checklist: durable application writes, private document upload/download, communications, payment sandbox, backup/restore and final runtime proof.
