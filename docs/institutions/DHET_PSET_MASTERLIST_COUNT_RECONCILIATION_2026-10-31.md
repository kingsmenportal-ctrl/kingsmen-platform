# DHET PSET masterlist count reconciliation — 31 October 2026

**Disposition: source discrepancy recorded; current live register total not yet verified.**

## Why Kingsmen must preserve the discrepancy

Two official DHET publications report different national PSET institution counts. They are useful for scope planning, but neither number alone proves that a source-register extract is the current operational register.

| Official source | Published figures | Interpretation for Kingsmen |
| --- | --- | --- |
| [Statistics on Post-School Education and Training in South Africa: 2024](https://www.dhet.gov.za/Information%20Systems%20Management%20Documents/Statistical%20Reports%20and%20Data/Reports/Statistics%20on%20Post-School%20Education%20and%20Training%20in%20South%20Africa%2C%202024.pdf) (final edition dated 13 May 2026) | 369 institutions: 26 public HEIs, 138 private HEIs, 50 TVET colleges, 146 registered private colleges and 9 CET colleges. | A DHET statistical snapshot for the 2024 reporting period; use for historical context and coverage planning, not as a current live-register row count. |
| [DHET Revised 2025–2030 Strategic Plan](https://www.dhet.gov.za/Strategic%20Plans/Strategic%20Plans/DHET%20TABLED%20REVISED%202025-2030%20STRATEGIC%20PLAN.pdf) | 366 institutions: 26 public HEIs, 137 private HEIs, 50 TVET colleges, 144 private colleges and 9 CET colleges. | A different official snapshot with three fewer institutions overall (one private HEI and two private colleges fewer than the 2024 statistics report). Do not assume the discrepancy is an error without reconciling the registers and publication dates. |
| [DHET MasterLists — Masterlist of Registered and Established PSET Institutions](https://www.dhet.gov.za/SitePages/MasterLists.aspx) | Current official index page; the dynamic listing did not expose a dated downloadable register in this inspection. | Required source of truth for the next registry import once its actual file, date/version and rows can be fetched and preserved. |

## Rules for the institution import

- The current PR batch of 26 public universities and 50 TVET colleges is a **76-record first batch**, not a complete national PSET directory. It excludes the separate 9 CET colleges and private HEI/private-college registries.
- Keep seeded providers at `NEEDS_REVIEW` and `public_safe=false` until their source identity, current registration, canonical name, website and duplicates have been reconciled against the actual dated DHET register.
- Preserve the source URL, file title, publication/valid date, retrieval time and a stable source-record identifier. Do not use one narrative institution count as a database completeness assertion.
- Reconcile name variants and possible duplicates before calculating coverage. Raw mentions, unique names, registry rows and unique legal institutions are different measures.
- A registered institution is not necessarily offering a particular programme now. A programme mention does not prove a live intake, deadline, applicant eligibility, NSFAS support for a particular candidate, partnership or an enabled Kingsmen application route.
- Keep public listing and application automation disabled until source verification, review and destination-specific authorization have passed. Candidate confirmation and provider-origin receipt evidence remain necessary for actual submissions.

## 2026 occupational-qualification PDF caution

The [DHET List of Occupational Qualifications Offered at Public TVET Colleges 2026](https://www.dhet.gov.za/Technical%20and%20Vocational%20Education%20and%20Training%20Co/List%20of%20Occupational%20Programmes%20updated%20for%202026%20for%20website.pdf) text is accessible, but screenshot retrieval for visual row-boundary verification failed in this review environment. Because extracted PDF text can join cells across page breaks and contain spelling variants, every qualification-to-college pairing in the current seed must stay `NEEDS_HUMAN_SOURCE_LAYOUT_REVIEW` until visually checked against the relevant page. Do not publish these associations as verified offerings yet.

## Acceptance criteria for the next source batch

1. Retrieve the actual current MasterLists file(s) and record each file version, URL, last-updated date and checksum.
2. Reconcile the 366-vs-369 snapshot difference against those files and document a source-backed explanation, or leave it explicitly unresolved.
3. Deduplicate legal institutions using stable identifiers and human-reviewed aliases; report raw source rows and unique institutions separately.
4. Run source validators and exact-head CI after the reconciled data update.
5. Keep records private/review-only until verified. Do not apply migration 0099/0100 until independent review, migration ordering, backup/restore and staging change control are approved.
