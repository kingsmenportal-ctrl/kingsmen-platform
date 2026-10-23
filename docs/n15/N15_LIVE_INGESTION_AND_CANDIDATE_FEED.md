# N15 live ingestion and candidate opportunity feed

## Deployed staging functions

- `n15-source-ingestion` — POST, JWT gateway verification enabled; accepts a service-role JWT for trusted automation or a valid user session with an active `PLATFORM_ADMIN`, `PROVIDER_OPERATOR`, `APPLICATION_REVIEWER`, or `EVIDENCE_VERIFIER` grant in `platform_reviewers`. It fetches only active registered HTTPS authority URLs, refuses credentials, refuses redirects, restricts discovered links to the registered host or its subdomains, uses a bounded timeout and response size, and writes deterministic `external_source_observations` records.
- `n15-candidate-opportunities` — GET, JWT verification enabled. It validates the candidate session with Supabase Auth, requires an authorised `candidate_auth_identity_links` row, and returns only approved matches whose candidate-facing programme/provider and exact-link source observation pass official-confidence and freshness gates.

## Ingestion semantics

A source fetch discovers candidate links, not confirmed openings. Every automatically discovered row is written as `NEEDS_REVIEW`, with `HIGH` confidence for a curated directory anchor, an evidence reference to the source page, a 24-hour freshness boundary, and an explicit warning that deadline, opening, eligibility, fees, accreditation and outcome remain unverified. The crawler never creates a programme, marks an opening as open, promotes an observation to `OFFICIAL_VERIFIED`, publishes a candidate-facing listing, or submits an application.

The `n15_ingestion_runs` table stores the run status and per-authority results. Re-running ingestion upserts by deterministic observation reference and refreshes the observation timestamp; duplicate rows are not created.

## Candidate journey

The candidate page is `/candidate/opportunity-matches`. It uses the candidate's existing browser session and calls `n15-candidate-opportunities`. It offers pathway filtering for higher education, TVET, SETA/learnerships, internships, apprenticeships and employment. It displays source-check time, an evidence-backed confirmed deadline when available, or an explicit not-verified state. It does not infer eligibility or acceptance.

Identity linkage is deliberately fail-closed: unlinked or pending users receive an identity-review response, not another candidate's records. Empty results state that no opportunity passed all current gates; they do not claim that no opportunities exist.

## Operations and remaining proof

1. Open `/operator/opportunities/ingestion` while signed in with an active authorised reviewer account, or invoke the function with a server-side service-role JWT. Never expose the service-role key in the browser.
2. Inspect `n15_ingestion_runs.summary` and `external_source_observations` for the run. Redirects, timeouts, non-HTML sites, and source failures remain visible as per-source statuses.
3. Human reviewers must inspect the actual opportunity page and independently verify the opening, deadline, eligibility and any accreditation/fees. Only then may the relevant records and review state be promoted.
4. Candidate matches must be explicitly approved by authorised review and remain linked to the verified candidate identity.
5. A deployed function does not prove that ingestion has run. Until an authenticated run record exists, live ingestion execution is deployed but runtime execution remains unverified.

## Test

`npm run n15:ingestion:check` checks the security contract and candidate-facing guardrails. CI also runs the web build and repository tests.
