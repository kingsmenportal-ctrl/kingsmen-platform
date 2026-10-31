# N15 verified-source promotion — migration 0101

## Purpose

N15 now has an explicit human-verification boundary between source discovery and candidate-facing opportunity data. The existing ingestion worker discovers links from registered official authorities and writes NEEDS_REVIEW observations. The candidate feed serves only approved candidate matches supported by current official source evidence.

Migration 0101 and the n15-opportunity-promotion Edge Function add the missing controlled step: an authenticated **EVIDENCE_VERIFIER** or **PLATFORM_ADMIN** can review one discovered source page and promote only the expressly reviewed provider, programme, optional deadline and eligibility statements.

The Browser Scout remains probe-only. It cannot call this promotion operation, it has no database credentials and it cannot create an opportunity.

## Promotion procedure

1. A source observation must exist and be linked to an active opportunity_source_authorities row.
2. The reviewer authenticates through Supabase Auth. An active, non-revoked platform_reviewers grant with role EVIDENCE_VERIFIER or PLATFORM_ADMIN is required. IDENTITY_REVIEWER is not sufficient; candidate identity review and opportunity-source verification are different authorities.
3. The request must contain a provider, programme, review reason, decision notes and the source observation reference. An optional deadline and up to 20 explicit eligibility rules can be included.
4. The Edge Function re-fetches the exact source URL with HTTPS only, rejects redirects, restricts the URL and provider/programme links to the registered authority host, limits the response to 4 MiB, and calculates a SHA-256 hash. It does not persist the fetched HTML/PDF body.
5. The Edge Function calls one service-role-only PostgreSQL RPC. The RPC rechecks reviewer authority, source authority, observation freshness, evidence hash and programme-link equality. It serializes promotions with a transaction-scoped advisory lock.
6. Provider, programme, optional deadline, optional eligibility rules, source-observation promotion and opportunity_verification_reviews audit rows are committed in one transaction. Duplicate provider/programme/deadline/rule references are reconciled by unique-key upsert.
7. A past deadline is recorded as STALE, not CONFIRMED. A programme is marked candidate-facing-safe only when the human-reviewed opening state is OPEN and the provider passes the recommendation-safety gate.

The Edge Function itself performs only reads plus the single RPC call. It never writes directly to the opportunity tables.

## Important limits

- The reviewer must actually inspect the official source content and make the attestation. A successful HTTP fetch and a SHA-256 hash prove which bytes were retrieved; they do not by themselves prove that an intake is open, a provider is accredited, a deadline is correct or a candidate is eligible.
- opportunity_programmes.candidate_facing_safe is not enough to display a candidate match. The existing feed also requires a candidate-scoped match in APPROVED state, OFFICIAL_VERIFIED confidence, human_review_required = false, fresh source evidence and active consent.
- This promotion RPC deliberately creates **zero candidate matches**. Candidate matching needs a separate authenticated candidate context, latest active profile-processing consent, candidate profile evidence, and an independent human decision. AI remains decision support, not an eligibility authority.
- The current staging snapshot had zero source observations, zero providers/programmes/deadlines/eligibility rules/matches, and no active EVIDENCE_VERIFIER or PLATFORM_ADMIN grant. Its one active opportunity-adjacent reviewer record is IDENTITY_REVIEWER, which this function does not accept. No grants or data have been created by this code change.
- No automatic source crawling is scheduled by this migration. Source-owner terms, per-origin limits, freshness and stop switches remain required for any future scheduler.

## Apply and release order

This is a proposed numbered migration and an Edge Function source addition only. It has **not** been applied or deployed. It must follow independent review and the approved backup/restore and change-control gate, then be reconciled with 0097, 0096 and 0098 according to the RC sequence. Do not use a blind supabase db push on the partial migration directory; apply and verify the exact reviewed SQL through the controlled migration path, then read back the migration ledger, function definition, execution grants and table state.

Before a staging positive test, an administrator must separately grant an authorised opportunity evidence-verifier role to a named, approved reviewer using the existing least-privilege process. Do not reuse or elevate a candidate's identity-review permission. Run negative cases for no JWT, candidate JWT, identity-review-only role, inactive/revoked grant, wrong authority, stale observation, unverified/expired deadline and malformed evidence before any positive source promotion.

After verified provider/programme records exist, implement and test the separate candidate match generation/review gate. Do not fabricate a candidate profile or match to make the opportunity page appear populated.
