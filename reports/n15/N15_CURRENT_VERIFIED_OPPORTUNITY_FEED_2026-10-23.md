# N15 current verified opportunity feed — implementation evidence

Date: 2026-10-23
Migration: `db/migrations/0092_n15_current_verified_opportunity_feed.sql`
Staging project: `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`)

## What changed

Added the server-side read model `public.current_verified_route_opportunities`. It only includes programme records when all of these conditions hold:

- programme status is VERIFIED and availability is OPEN;
- confidence band is A/B or an explicitly high/official verified band;
- programme source URL uses HTTPS;
- programme record was updated within 90 days;
- provider is VERIFIED and marked public-safe;
- private providers requiring accreditation checks carry explicit verified accreditation metadata;
- no verified deadline for the programme is already past in the Africa/Johannesburg timezone.

The view exposes only opportunity/provider fields needed by the application API. It does not include candidate data, claim eligibility, submit applications, or assert provider-confirmed outcomes. A source-authority directory is not proof of an open programme.

## Staging verification

- Migration applied successfully.
- View returned 6 eligible rows.
- Returned rows with non-HTTPS sources: 0.
- Returned rows older than 90 days: 0.
- Returned rows not marked OPEN: 0.
- Eligible records with expired verified deadlines excluded by the deadline guard: 0 in this snapshot.
- Privilege check: `anon SELECT=false`, `authenticated SELECT=false`, `service_role SELECT=true`.

These checks prove the database read-model contract and access boundary at the time of the query. They do not prove API integration, UI rendering, candidate-personalised matching, or full authenticated end-to-end completion. The API must call this view server-side and preserve human review and provider-outcome truth boundaries.
