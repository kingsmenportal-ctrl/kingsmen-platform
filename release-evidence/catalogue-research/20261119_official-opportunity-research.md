# Kingsmen One — official opportunity research evidence register

**Research snapshot:** 19 November 2026 (South Africa)
**Purpose:** reviewer triage and catalogue seeding preparation only.
**Publication state:** `NOT_PUBLISHED`
**Database writes performed:** none.
**Important distinction:** these web research observations are not a substitute for the Kingsmen N15 runtime ingestion ledger. No candidate-facing opening claim can be activated from this manifest alone.

## Candidate employment records for N15 refresh

| Research ID | Official source | Current observed deadline | Basic observed requirements | Required next verification | Candidate-facing state |
|---|---|---|---|---|---|
| `DEL-ESP-EML-HR4-4-7-100` | [Employment Service Practitioner — Department of Employment and Labour](https://www.labour.gov.za/employment-service-practitioner-%285%29) | 27 November 2026, 16:00 walk-in / 23:59 online, as displayed on the official advert | Three-year qualification in Social Science (Psychology/Industrial Psychology), Public Administration, Business Management or Public Management; two years’ client-facing functional experience; valid driver’s licence. Reference HR4/4/7/100; Ermelo Labour Centre; R413,001 p.a. | Re-fetch exact advert through N15; verify that it remains open, closing time/time zone, eligibility, location, submission route and Z83/CV instructions; human reviewer confirms evidence references. | `REVIEW_REQUIRED` |
| `DEL-ACL-LEGAL-X4` | [Admin Clerk Legal Services (X4) — Department of Employment and Labour](https://www.labour.gov.za/admin-clerk-legal-services-%28x4-posts%29) | 27 November 2026, 16:00 walk-in / 23:59 online, as displayed on the official advert | Exact per-post reference, centre, essential requirements and submission address must be captured from the linked advert before matching. The page states a new Z83 and CV are required and that each post must use its correct reference and address. | Re-fetch advert and extract per-post references/locations/qualifications; do not infer requirements from similarly titled historical adverts. Confirm whether online submission is via email or official portal for each post. | `REVIEW_REQUIRED` |
| `DEL-RECORDS-ADMIN-X4` | [Records Administrator (X4) — Department of Employment and Labour](https://www.labour.gov.za/Vacancies/Pages/Records-Administrator-%28X4-POSTS%29.aspx) | Not independently captured in this research snapshot. | Grade 12 / Senior Certificate or equivalent; no experience required. Gauteng Provincial Office, including three posts under ref HR 4/4/4/08/05 and one at Sebokeng Labour Centre under ref HR 4/4/4/08/06; R255,450 p.a. | Re-fetch exact page and confirm current closing date/time, post-by-post centre and correct submission channel before any candidate-facing state. | `DEADLINE_RECHECK_REQUIRED` |

### Official employer-application handling requirements observed

The Department’s current adverts specify the new completed, initialled and signed Z83 plus an updated CV and correct post reference. Some adverts route online applications through the Department’s ESSA Online system; others specify post-specific email addresses or walk-in addresses. Kingsmen must preserve the method of the exact advert and must not assume all Department vacancies use one channel. A candidate-reported submission must remain distinct from provider-confirmed receipt.

## Explicitly closed or not suitable for “open” status

| Research ID | Official source | Observed state | Handling |
|---|---|---|---|
| `NSFAS-2027-CYCLE` | [Government announcement for NSFAS 2027](https://www.gov.za/news/media-statements/nsfas-records-over-1-million-applications-2027-funding-cycle-board-joins) | Applications closed 31 October 2026; no extension announced in that source. | Do not show as open. Keep the support and appeal workflow separate from an application-open claim; refresh only against a current official notice. |
| `PUBLIC-TVET-2027-CYCLE` | [DHET Minister’s official statement](https://www.gov.za/news/speeches/minister-buti-manamela-launch-nsfas-2027-application-cycle-18-sep-2026) | Public TVET 2027 application period was stated to close 30 September 2026. | Do not show as open based on the general-cycle announcement. A college-specific fresh extension/reopening notice would be required. |
| `DEL-EMPLOYMENT-SERVICE-COORDINATOR` | [Employment Service Coordinator — Department of Employment and Labour](https://www.labour.gov.za/employment-service-coordinator) | Closing date shown as 6 November 2026. | Closed; retain as historical evidence only unless the exact advert is re-issued with fresh evidence. |

## Verification gate before candidate visibility

For each prospect, N15 must capture the exact official advert URL and current check timestamp; preserve the page/title, source authority, content/evidence reference, opening status, closing timestamp and time zone; parse eligibility and submission instructions; and confirm the source freshness window. Then an authorised reviewer must decide whether the evidence supports an `OPEN` candidate-facing programme and whether it fits one of Kingsmen's six canonical pathways. This register does none of those live steps.

No opportunity records, providers, deadlines or candidate matches were inserted into Supabase from this research. The live `opportunity_programmes`, `opportunity_providers`, `opportunity_deadlines`, `external_source_observations` and `candidate_opportunity_matches` tables remained empty at the read-only check for this stream.
