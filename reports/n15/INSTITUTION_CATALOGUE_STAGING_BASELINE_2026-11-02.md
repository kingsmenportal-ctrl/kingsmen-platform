# Kingsmen Institution Catalogue — Staging Baseline

**Observed:** 2026-11-02  
**Supabase project:** `kingsmen-portal-staging`  
**Purpose:** Read-only baseline for source-first institution and provider data work.

## Live row-count census

Counts were queried from the live staging database; they are not inferred from repository files.

| Table | Rows |
|---|---:|
| `opportunity_providers` | 0 |
| `opportunity_programmes` | 0 |
| `opportunity_source_authorities` | 21 |
| `source_authorities` | 21 |
| `route_providers` | 3 |
| `route_programmes` | 8 |
| `organisations` | 0 |

## What this means

1. N15 has its provider/programme schema, but no N15 provider or programme records are currently present in staging.
2. The older route domain already has 3 provider rows and 8 programme rows. They must be reconciled before bulk import to avoid duplicate institutional identities or broken provider/programme links.
3. `organisations` is not a safe bulk-import target in its current shape: it requires `contact_email` and `created_by`, and its workflow is reviewer-oriented. Do not invent contact emails or impersonate an authenticated creator to make the import pass.
4. The existing N15 provider record has identity, provider type, sector, province, official website, accreditation review state, source confidence, evidence refs, and a fail-closed recommendation flag. It does not model campuses/branches, aliases, registry effective dates, integration state, partnership state, or provider receipt state as first-class fields.
5. Therefore the first public-university seed is an N15 directory-anchor batch, not the final canonical institution master. Before full production catalogue rollout, reconcile `route_providers`, `opportunity_providers`, and institution identity/campus needs against the simplified backend contract.

## Safety contract

- Institution existence is not an open opportunity.
- A website homepage is not an application endpoint.
- The import does not create programme rows, deadlines, eligibility claims, fees, application submissions, provider integrations, partnerships, or outcome claims.
- Seeded public-university anchors stay `accreditation_status='NEEDS_REVIEW'` and `safe_to_recommend=false`.
- No live rows were inserted, updated, or deleted as part of this census or this PR.

## Migration blockers that remain

- Reconcile source migration files with the actual Supabase migration ledger and live schema before applying any seed.
- Resolve known duplicate 0078 ledger entries and source/ledger mismatches.
- Complete protected backup/restore and migration change-control gates.
- Validate seed SQL against staging schema on a controlled branch or approved staging change.
- Run the validator and CI on the final immutable commit.
- Verify candidate-safe filters and authenticated Candidate A/B isolation after staging import.
- Founder review before promotion.

## Source inventory for subsequent batches

Use DHET's live institutional resources as the authoritative entry point, then reconcile each class against its own register and applicable quality authority:

- Public universities: https://www.education.gov.za/FurtherStudies/Universities/tabid/393/Default.aspx
- DHET institutional registers and TVET/CET lists: https://www.dhet.gov.za/
- Private higher education register: https://www.dhet.gov.za/Registers_DocLib/Register%20%20Private%20Higher%20Education%20Institutions.pdf
- CHE: https://www.che.ac.za/
- SAQA: https://www.saqa.org.za/
- QCTO: https://www.qcto.org.za/
- NSFAS institution directory: https://nsfas.org.za/content/institutions.html

Source snapshots must preserve retrieval timestamp, source title/URL, institution name and aliases, legal/register state, province/location, parent/campus relationships, and the evidence needed to justify any candidate-facing claim.
