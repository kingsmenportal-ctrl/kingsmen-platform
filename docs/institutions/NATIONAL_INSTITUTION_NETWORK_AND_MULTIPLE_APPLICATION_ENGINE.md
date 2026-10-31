# Kingsmen National Institution Network and Multiple-Application Engine

**Status:** implementation design and source registry contract; not a claim that every institution is loaded, connected, or currently accepting applications.  
**Research snapshot:** 31 October 2026.  
**Canonical plan owner:** Kingsmen engineering / opportunity intelligence.

## Decision

Build a **single Kingsmen candidate account, profile, Document Vault and application workbench**, backed by a national source/provider register and a separate, versioned adapter per application destination. Reuse candidate answers, credentials and documents where the candidate has consented, but render and validate a destination-specific payload for each provider. One universal Kingsmen form is the candidate's starting point; it is not a licence to replace an institution's required declarations, authentication, fees, application form or choice limits.

Do not build institution-specific “microsites.” The candidate stays in Kingsmen. When a route is not API-enabled or contractually approved for automation, Kingsmen prepares the application and directs the candidate to the provider's official route, then records provider-acknowledged evidence after the candidate returns a receipt/reference or an approved integration confirms it.

## Why it must be split into four verified facts

Each provider, programme, intake, and candidate submission has its own evidence record. Do not collapse these facts into one `verified` boolean:

1. **Provider identity / regulatory status** — official registry record, authority, exact institution/provider, registration or accreditation scope, register date, official site.
2. **Programme existence / delivery authority** — exact programme/qualification record, relevant qualification authority (DHET/CHE/Umalusi/QCTO/SAQA or delegated SETA, as appropriate), provider relationship and evidence.
3. **Intake / deadline / eligibility** — an explicit current programme advert or admissions page, open and close timestamps with Africa/Johannesburg timezone, exact entry requirements, fees and source freshness. A listed institution or programme alone cannot imply an open intake.
4. **Submission and outcome** — separate candidate-reported action, submission attempt, provider receipt/confirmation, and institution decision. A button click, a successful browser fill, a generic HTTP 200, or a candidate's self-report alone never proves that the provider has received an application.

Every observation should preserve official URL, authority host, retrieved time, page/document fingerprint, claim type, evidence reference, check expiry/freshness boundary, reviewer or verification worker, contradictions, and reason for rejection/staleness. Preserve dated snapshots so a changed/deleted listing can be explained later.

## Official-source coverage to ingest

The source manifest at `manifests/institutions/national-institution-network-source-register.json` records the official starting points. The main import order is:

1. **DHET masterlists** as the source directory; official public universities; private higher education register; private college register; TVET and CET official lists/maps.
2. **QCTO** skills-development-provider and assessment-centre databases, occupational qualifications and qualifications open for delivery; **SAQA** exact qualification registration records. Do not make a DHET-only list the universe of training providers: occupational/skills providers can sit within QCTO or delegated SETA accreditation arrangements.
3. **DHET SETA links** → crawl each SETA's official programme/learner/employer pages as separate sources. Keep SETA body identity separate from the employer/provider recruiting learners.
4. **CAO** route and terms; **NSFAS** institutions directory for aid-scope context only. NSFAS membership is not proof admissions are open or that funding is available/approved.
5. **DPSA circulars and the Department of Employment and Labour** for public vacancies; add employers only from their own verified career pages, official feeds or a provider-authorized data exchange.

DHET's 2026/27 performance plan states a baseline of 369 registered/established PSET institutions (26 public universities, 50 TVET, 9 CET, 138 private higher-education institutions and 146 other private colleges). This is a useful reconciliation control, not a complete count of programme records, employers, all skills providers, active intakes or application destinations. Count comparison must respect different register scopes and dates. Track source coverage and uncaptured categories rather than forcing every number to match.

## One candidate, many destination applications

### Shared profile and field map
- Store one canonical profile and reuse existing identity review, consent, private Document Vault, candidate identity link and application workbench.
- Maintain per-field origin and assurance: candidate-entered, document-extracted, externally verified, institution-supplied, or stale; include last verified time and consent purpose.
- A provider adapter maps canonical fields to the exact target fields and rules (for example, title/name order, South African ID/passport format, school/qualification records, programme choices, declared history, disability/demographic fields only where legitimately required, references, documents, signatures, fees and per-institution declarations).
- Never invent a required answer. If data is missing, conflicting, out of date, or asks for a legal attestation, require candidate review. For highly sensitive data, collect only when required and consented.
- The candidate can select multiple opportunities and prepare them in a shared workbench. Each destination receives a separate application child and idempotency key. For CAO, keep one CAO parent submission with choice children under CAO's own limits; do not fan one CAO entry year/term into an application per institution.

### Destination state machine
`DISCOVERED → PROVIDER_VERIFIED → PROGRAMME_VERIFIED → INTAKE_VERIFIED_OPEN → ELIGIBILITY_REVIEWED → SAVED → PREPARING → READY_FOR_CANDIDATE_REVIEW → CANDIDATE_APPROVED → SUBMISSION_STARTED → PROVIDER_RECEIPT_CONFIRMED → INSTITUTION_OUTCOME_CONFIRMED`

Every transition records evidence and timestamps. Failure or unknowns become explicit states such as `STALE_SOURCE`, `CLOSED_OR_UNKNOWN_INTAKE`, `ELIGIBILITY_UNKNOWN`, `USER_ACTION_REQUIRED`, `BLOCKED_BY_PROVIDER_CHALLENGE`, `SUBMISSION_UNCERTAIN_RECONCILIATION_REQUIRED` or `SUBMISSION_FAILED_REVIEW_REQUIRED`. Never auto-upgrade an application to “submitted” because automation timed out after a POST; reconcile the destination before retrying, to avoid duplicate or paid applications. Preserve candidate-reported and provider-confirmed status as different facts.

## Integration tiers and Playwright's job

| Tier | Route | What Kingsmen does |
|---|---|---|
| A | Official API with published access or provider approval | Use documented endpoints, strong auth, contract tests, idempotency, correlation IDs and receipt verification. |
| B | Institution-authorized data exchange (CSV/JSON/SFTP/webhook) | Agree schema, cadence, ownership, error response, data protection, deletion and service SLA. |
| C | Provider-approved portal adapter | Use Playwright only for that specific approved route, with semantic locators, provider-specific required fields, bounded waits, traces/screenshots with PII redacted, response/status checks and receipt parsing. |
| D | Candidate-controlled official application route | Pre-fill/prepare the packet in Kingsmen and open the official link. Hand control back for CAPTCHA, MFA, signatures, fees, unknown questions or terms requiring an applicant attestation. Track the result after the candidate returns evidence. |

**Exhaust the permitted options, not the institution's controls.** For discovery, prefer official downloadable registers, CSV/XLSX/PDF, published APIs/feeds, sitemaps and public official pages before bounded HTML link crawling. The current N15 ingestion contract already constrains collection to HTTPS, registered authority hosts, timeout/size bounds, review-only observations and deduplication; keep these guardrails. Crawl one authority at a time with conservative concurrency, rate limiting, bounded depth/page count, content-type checks and a source-health/last-checked ledger. Never probe private endpoints, evade throttling, defeat CAPTCHAs, bypass login/MFA or reuse session state without explicit authorization. Do not scrape behind an authentication wall unless the provider has expressly authorized that integration.

For submission automation:
- use provider-specific adapters; no “one generic script submits anywhere” approach;
- use stable role/label/test-id locators, explicit field mapping and validation, and verify the exact target domain at every redirect;
- collect browser/network evidence, response status and any official receipt/reference; HTTP 200 alone is not receipt evidence;
- use per-destination locks and idempotency keys; only automatically retry safe reads or explicitly idempotent operations;
- after an ambiguous submission outcome, stop and reconcile with the provider before retrying;
- halt and request the candidate on CAPTCHA, MFA, legal declarations, signatures, required payment or unknown fields;
- keep Playwright storage state and provider credentials out of Git, logs and public error output; use least-privilege, dedicated test accounts and separate staging/prod origins;
- run authorised end-to-end scenarios in a provider sandbox/test tenant first, including wrong identity, wrong intake, stale listing, duplicate request, timeout-after-submit, rejection, receipt mismatch and recovery.

Playwright proves browser interaction happened, not institutional acceptance. The only “sent/received” state must come from authoritative provider evidence and a correlated audit event.

## Existing Kingsmen foundation and implementation gap

Read-only inspection of staging (31 October 2026) found:
- `route_providers`: 3 rows — CAO, Department of Employment and Labour vacancies, and NSFAS route;
- `source_authorities`: 21 rows; `opportunity_source_authorities`: 21 rows. These are source-authority anchors, not a populated directory of individual institutions/programmes. Only one `source_authorities.last_verified_at` value was non-null at this read. Do not treat the remaining anchors as freshly rechecked merely because `verification_required=true`.
- Source URL reconciliation item: the existing `dhet_universities` source anchor points to `https://www.dhet.gov.za/SitePages/Universities.aspx`, while the official DHET public-universities page found in this research is `https://www.dhet.gov.za/SitePages/UniversitiesinSA.aspx`. Validate the redirect/current owner page before changing the anchor; preserve the former URL as history/evidence rather than silently overwriting it.
- `opportunity_providers`, `opportunity_programmes`, `external_source_observations`, `opportunity_deadlines`, `opportunity_eligibility_rules`, `opportunity_verification_reviews`, and `route_sources`: 0 rows each.
- Existing schema, source-intelligence rules, N15 source ingestion, candidate-feed restrictions, opportunity save and six pathway UI exist in code, but they are not evidence of nationwide populated coverage or current intakes.
- PR #216 is open/unmerged. Its source/build checks passed historically on exact heads, but there is no authenticated candidate journey proof and no Netlify published commit/route verification.
- PR #232 (CAO migration provenance reconciliation on backup/security stack) is open, mergeable and source CI green on head `c56039a31f500d14d25005408a69fa5c096dc781`; review API returned zero independent review records. Do not merge it or apply migrations without required independent review/change control.
- Supabase staging is active/healthy, but prior read-only counts showed 3 Auth users, 2 candidate rows, and zero verified auth-to-candidate links, master profiles, consent, candidate identity-review/evidence, private document reviews, candidate opportunity matches, candidate master targets or CAO choices. Thus profile-to-provider flow is not yet demonstrated with real authenticated test candidates.
- A fresh security advisory shows 17 RLS-enabled tables without policies, six authenticated-callable SECURITY DEFINER RPCs, and leaked-password protection disabled; client non-DML privilege findings are still gate-level. The institution network must not be put ahead of the security release gate for candidate PII or automated submission.

This branch now includes an official-source coverage contract, destination-route capability register, and a source-listed seed catalogue of 26 public universities and 50 TVET colleges referenced by the DHET official directory pages. The seed dataset treats the published university/college website as a source lead only; it flags the conflicting UNISA hyperlink and truncated Flavius Mareka URL for review. No programme or intake rows are included.
  
The companion migration `db/migrations/0099_seed_dhet_public_institution_directory.sql` is proposed code only. If independently reviewed and later applied under approved migration change control, it will add the 76 directory entries to the existing `route_providers` table with `NEEDS_REVIEW`, `public_safe=false`, unknown programme/intake/deadline/eligibility, no partnership, and no automation authorization. It will not create programmes, set open deadlines, grant public visibility, or claim submission support. The migration has not been applied to Supabase staging or production. No candidate data or external applications were created, and no production deployment is claimed.

## Rollout

1. **Source registry contract:** merge source metadata and tests after review; owners validate URLs and reconcile register counts/date.
2. **Provider directory batch 1:** ingest official public universities, TVET, private HEI, private college and SETA index records; preserve each register's own status/date. Separately import QCTO providers and SAQA qualification evidence. Mark CET link unavailable until rechecked.
3. **Program/intake verification:** add programme, open/closed state, deadline and eligibility only with field-specific evidence; apply source freshness SLAs and reviewer queue. No bulk-import record defaults to open.
4. **Candidate workbench:** finish secure profile/consent/documents and Candidate A/B/reviewer E2E first; wire six-pathway results to destination-specific applications and choice children.
5. **Integration pilots:** CAO (as one portal application with child choices), selected TVET colleges (direct institution route), selected universities not served through CAO, selected QCTO/SETA providers and public-employer route. Obtain approvals and document route per integration.
6. **Scale:** add provider batches only after success, failure, retry, stale source, duplicate, accessibility, data-retention and provider-receipt proof.

## Success metrics

- Directory coverage reconciled by source, scope and register date; % records with verified official domain and next-check date.
- % programme records with separate proof for existence, open intake, deadline, eligibility and delivery/accreditation authority.
- Source freshness, stale rate, duplication rate, broken official link rate, review queue age and contradiction rate.
- Per route: prepared, candidate approved, submit attempts, confirmed provider receipts, rejected/unknown/failed, ambiguous-after-timeout, duplicate prevention and median time to receipt.
- Candidate A/B isolation, least-privilege negative tests, consent checks, document-access proof, audit completeness and retention/deletion outcomes.
- Partner status only after a written agreement/pilot and recorded scope; directory presence never counts as partnership.


## Executable route contract

The companion manifest `manifests/institutions/institution-application-route-capabilities.json` records the current route strategy without implying a live integration. It distinguishes CAO's parent-with-choice-children flow from one destination-specific child for each direct TVET, non-CAO university, private provider, SETA/employer advert or public-service vacancy. Current integration status remains `NOT_CONNECTED`, automated submission remains disabled, and provider approval/test-environment evidence is absent. The root test suite checks these boundaries via `npm run institutions:routes:check`.

For public service vacancies, DPSA is a discovery source; the official circular says candidates must forward the application to the department in which the vacancy exists and include the reference number. Kingsmen must therefore resolve the exact employer/department channel from each advert rather than “submit to DPSA.” For CAO, the current public application page says only one application is accepted for a specific entry year and term. Kingsmen's existing six-choice draft editor must be reconciled against the current route terms before a live adapter is enabled.


## First registry import batch — proposed, not applied

- Snapshot manifest: `manifests/institutions/seed/public-universities-and-tvet-2026-10-31.json`.
- Coverage in this source-led batch: **26 public universities + 50 TVET colleges = 76 entries**.
- The national DHET 2026/27 landscape baseline lists 369 PSET institutions overall (26 universities, 50 TVET, 9 CET, 138 private HEIs, 146 other private colleges). Therefore 76 entries are not "all institutions"; private HEI, private college, CET and QCTO/SETA-linked provider imports are still required.
- Proposed migration: `db/migrations/0099_seed_dhet_public_institution_directory.sql`. It writes to the existing `route_providers` table only, sets new entries to internal/review-only defaults, and preserves previously verified/manual fields on conflict.
- Validation scripts are wired into `npm test`: `institutions:network:check`, `institutions:routes:check`, `institutions:seed:check`, and `institutions:migration:check`.
- Required before apply: independent source/domain review; current DHET register URL/contents recheck; ordered migration/provenance reconciliation; approved backup/restore and change control; post-migration privilege/RLS checks. The migration is not a substitute for the open security and release gates.
