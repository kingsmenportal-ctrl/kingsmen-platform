# Kingsmen South Africa Institution Connection Roadmap

**Status date:** 31 October 2026  
**Status:** Research and integration plan; source anchors are not fully ingested and institutional transactions are not yet connected.

## Answer: when?

The programme starts now. The first meaningful milestone is a complete, reconciled institution directory, not a claim that every portal can already submit applications. A source directory and a live verified opportunity feed are different things.

**Internal target windows, conditional on release/security gates:**

- **By 7 November 2026:** freeze the source contract, close the release/security prerequisites, and prove the ingestion job can record evidence and failures without publishing stale listings.
- **By 14 November 2026:** target a roster import from the current DHET Masterlist of Registered and Established PSET Institutions, with separate counts for imported, updated, retired, unresolved, duplicate and missing-official-site records. The total must come from the retrieved official register; it must not be guessed.
- **By 21 November 2026:** target an initial verified opportunity cohort across higher education/CAO, TVET, skills/SETA and public employment. This is a cohort, not a claim that every opportunity is already covered.
- **November–December 2026:** expand per-institution source checks, programme/deadline monitoring, accommodation discovery and correction workflows.
- **Direct API submission/status sync:** institution-by-institution and partner-dependent. It has no honest universal launch date until the provider authorizes access and supplies an integration contract and test environment.

These dates are planning targets, not achieved milestones. Publishing the website and passing source checks is still not a substitute for exact-SHA staging proof.

## What “connect all institutions” means

1. **National directory coverage:** every institution in the latest official DHET register appears once, with registry type/status, official source reference, verified website and update timestamp.
2. **Opportunity coverage:** each open programme, admission window or vacancy is its own evidence-backed record. A provider directory entry does not prove a current intake, deadline, accreditation, eligibility or offer.
3. **Candidate application continuity:** one Kingsmen login/profile/workbench for all six canonical pathways. CAO choices remain children of the one Kingsmen application. For other institutions, candidates get a verified official portal and guided readiness/document handoff.
4. **Transactional integrations:** direct submission, status polling and provider outcome synchronization only where written authorization, API/feed contract, sandbox and security/privacy review exist.

There is no evidence of one shared API used by every university, TVET college, SETA, employer and accommodation provider. Full directory coverage and full transactional integration are different milestones.

## Live evidence baseline

Read-only staging queries on 31 October 2026 found:

- 21 rows in the source-authority register.
- Legacy route layer: 3 route providers, 8 route programmes and 0 route sources.
- Canonical verified N15 layer: 0 opportunity providers, 0 opportunity programmes, 0 external source observations, 0 confirmed opportunity deadlines and 0 candidate opportunity matches.

Kingsmen therefore has useful official-source anchors and a small legacy route catalogue, but **not a live, broad institution/programme feed yet**. The N15 feed correctly fails closed without required source/provider/programme evidence. Do not populate it with invented or stale opportunities just to increase counts.

## Source order

### 1. National registers — roster completeness

Start with the DHET Masterlist of Registered and Established PSET Institutions. Reconcile university, TVET, CET, private college and private higher education records. Use DHET’s official SETA directory for SETA discovery. Use CHE, QCTO and SAQA registers to validate the relevant registration, qualification and accreditation claims.

### 2. Official programme and application sources

For each verified institution, identify the official admissions/application page, programme list, current academic year/term, requirements, document list, fees and closing-date evidence. Use CAO for member institutions where its published rules apply; do not route every university through CAO. TVET applications remain college-specific unless an authoritative common mechanism says otherwise.

### 3. Funding

Treat NSFAS as a separate funding workflow, not an admission result. The official NSFAS 2027 application information currently states a window of 18 September–31 October 2026, with closure on 31 October at 23:59 South African time. Kingsmen must not claim to have completed an NSFAS submission without a verified authorized handoff/result.

### 4. SETA, skills, learnership and apprenticeship sources

Use DHET’s current SETA directory as the list of authorities, then register the individual SETA official sites. Use QCTO’s skills-development-provider and registered qualification records plus SAQA’s qualification status to verify provider/qualification claims. A provider or qualification register record must not be converted into an assertion that a funded learner intake is open.

### 5. Employment and workplace experience

Begin with the Government Public Service Vacancy Circular, issuing department advert pages and verified Department of Employment and Labour listings. The Presidency’s National Pathway Management Network directory identifies partner networks including ESSA, SA Youth, Tshepo 1 Million, YES4Youth and Khetha/NCAP. This does **not** grant Kingsmen API credentials or permission to import protected candidate data. Partner access must be sought separately.

### 6. Accommodation and institutional support

Discover each official institution residence/accommodation route from the verified institutional roster. Independently verify non-institutional operators. Availability, price, eligibility and application status must be supported by current records; package accommodation entitlements do not imply that a bed is available.

## Technical connection pattern

- Keep the source-authority register as source-root metadata, not as the opportunity catalogue.
- Populate the canonical N15 provider/programme records from the reconciled institution roster and evidence-backed listings.
- Record each observation with exact URL, title/claim, source family, retrieval/observation/check timestamps, stale-after, evidence references and a reproducible source snapshot/hash where possible.
- Separate provider identity verification from programme status, deadline evidence, qualification/accreditation evidence and eligibility rules.
- Make imports idempotent; archive/expire records rather than silently deleting history. Record connector runs, added/updated/retired/rejected counts, last success and safe error category.
- Expose candidate-facing listings only if authority, provider/programme evidence, human review, source freshness and publication rules pass. Unknown data stays unknown.
- Respect rate limits and source website terms/usage rules. Prefer official APIs/feeds where available. Do not bypass login controls, CAPTCHAs, access controls or rate limits.
- Never reuse or store candidate portal passwords.
- A candidate’s report of clicking submit remains candidate-reported; provider confirmation requires a provider receipt/status feed or verified official evidence.
- Measure coverage quantitatively: official-roster count vs imported active institutions; percent with validated official URL; source checks by pathway; fresh/open listing count; stale/failed source count; and partner connections with signed authorization and sandbox proof.

## Immediate acceptance criteria

- [ ] Retrieve the current DHET source list and record register version/hash.
- [ ] Reconcile every roster entry; separately count duplicates, renamed, deregistered and unresolved records.
- [ ] Every canonical institution record has an official source and last-checked timestamp; no unsupported registration claims.
- [ ] Every published programme has current source evidence, exact application link/mode and deadline status.
- [ ] N15 ingestion has success/failure, retry and dead-letter visibility and cannot publish stale/unverified records.
- [ ] Candidate can discover/save only a current reviewed listing; refresh/re-login preserves profile, saved target and draft application.
- [ ] CAO and other portal handoffs use the correct provider portal; submission/outcome claims require evidence.
- [ ] Candidate A/B isolation, reviewer permissions, document security and source-ingestion security pass in staging.
- [ ] Published site URL, deploy ID and exact commit SHA are recorded; an authenticated journey succeeds on that deployment.

## Official source links

- [DHET PSET Masterlist](https://www.dhet.gov.za/SitePages/MasterLists.aspx)
- [DHET university directory](https://www.dhet.gov.za/SitePages/InstUniversities.aspx)
- [DHET SETA directory](https://www.dhet.gov.za/SitePages/SETAlinks.aspx)
- [DHET resources and registers](https://www.dhet.gov.za/SitePages/Resources.aspx)
- [QCTO skills-development provider database](https://www.qcto.org.za/databases-of-sdps.html)
- [QCTO registered occupational qualifications](https://www.qcto.org.za/RegisteredOccupationalQualificationsandPartQualifications.html)
- [SAQA qualifications register](https://saqa.org.za/services/registration-of-qualifications/)
- [CAO terms and application rules](https://www.cao.ac.za/Apply.aspx?content=Terms)
- [NSFAS how to apply](https://www.nsfas.org.za/content/how-to-apply.html)
- [Government public-service vacancy circular](https://www.gov.za/government-jobs-week)
- [Department of Employment and Labour vacancies](https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx)
- [National Pathway Management Network partners](https://stateofthenation.gov.za/presidential-youth-employment-intervention/linking-young-people-to-opportunities)
- [Khetha / National Career Advice Portal](https://ncap.careerhelp.org.za/)

## Research references

The official source review on 31 October 2026 confirmed:

- DHET publishes the Masterlist of Registered and Established PSET Institutions and separate university and SETA directories.
- QCTO publishes a Skills Development Provider database and registered occupational-qualification registers.
- CAO’s terms give institutions final responsibility for admissions/selection decisions.
- NSFAS lists the 2027 application period as 18 September through 31 October 2026.
- The Presidency describes NPMN as a partner network and identifies ESSA, SA Youth, Tshepo 1 Million, YES4Youth and Khetha; a listed partnership does not itself grant API access.

The next step is integration and runtime proof, not another institution directory inside a separate app.
