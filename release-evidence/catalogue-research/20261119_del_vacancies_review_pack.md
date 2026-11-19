# Department of Employment and Labour — opportunity review pack

**Snapshot:** 19 November 2026, South Africa  
**Publication state:** `NOT_PUBLISHED`  
**Direct database import:** prohibited  
**Records prepared:** 6  
**Eligible N15 source reviewers observed:** 0  
**Active identity reviewers observed:** 1, but that role is not authorized for N15 source ingestion/review.

## Scope

The official vacancy register and the individual advert pages below list six employment adverts with a closing date of **27 November 2026**. The adverts distinguish **16:00 for walk-in** and **23:59 for online** submissions in the Africa/Johannesburg time zone. Store these as separate deadline-channel records; do not silently collapse them into one deadline.

All six records remain review candidates, not verified Kingsmen opportunities. They are assigned `NEEDS_REVIEW`, `MANUAL_CHECK_REQUIRED` and `candidateFacingSafe=false` as the pack's defaults. Kingsmen N15 must refetch each advert and persist current source evidence before an authorized reviewer considers promotion.

| Review-pack ID | Advert | Official advert | Key requirements captured for review |
|---|---|---|---|
| `DEL-EMP-HR4-4-7-100` | Employment Service Practitioner | [Official advert](https://www.labour.gov.za/employment-service-practitioner-%285%29) | Three-year Social Science/Public Administration/Business/Public Management qualification; two years' client-facing experience; driver's licence; Ermelo |
| `DEL-EMP-HR4-4-4-10-16-18` | Admin Clerk Legal Services (X4) | [Official advert](https://www.labour.gov.za/admin-clerk-legal-services-%28x4-posts%29) | Grade 12; no experience required; three reference/location pairs; the correct per-post email must be verified |
| `DEL-EMP-HR4-4-4-10-26-28` | Records Administrator (X9) | [Official advert](https://www.labour.gov.za/records-administrator-%28x9-posts%29) | Grade 12; no experience required; three reference/location groups; ESSA and postal/hand-delivery routes |
| `DEL-EMP-HR4-4-4-10-09-14` | Claims Processors (X8) | [Official advert](https://www.labour.gov.za/claims-processors-%28x8-posts%29) | NQF 6 qualification in one of the listed fields; claims-processing experience is an added advantage, not mandatory; includes one Krugersdorp post |
| `DEL-EMP-HR4-4-4-10-24-25` | Claims Credit Officer (X5) | [Official advert](https://www.labour.gov.za/claims-credit-officer-%28x5-posts%29) | Grade 12; 0–6 months minimum experience as described by the advert; two reference/location groups |
| `DEL-EMP-HR4-4-11-27` | Client Service Officer: Paymaster | [Official advert](https://www.labour.gov.za/client-service-officer-paymaster) | Grade 12; no experience required; KuGompo City; confirm exact contact/channel from the live page |

The [official vacancy register](https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx) was also observed listing these current references with a 27 November 2026 closing date and an Open label. The label in the official register is evidence for reviewer triage, **not** permission to set the Kingsmen programme row to `OPEN`.

## Important collision guard

An older Records Administrator (X4) advert exists in the prior research notes, but the current X9 advert has different reference numbers and a separate detail page. Do not merge the older X4 record into the new X9 advert, inherit its evidence freshness, or re-use its deadline without rechecking.

## Why publication is still blocked

The live `platform_reviewers` table currently has one active `IDENTITY_REVIEWER`; the N15 ingestion and source-review queue allow only `PLATFORM_ADMIN`, `PROVIDER_OPERATOR`, `APPLICATION_REVIEWER` or `EVIDENCE_VERIFIER`. There are therefore no authorized source reviewers. No role was granted, no ingestion run was fabricated, and no live opportunity/provider/deadline/match rows were inserted for this pack.

## Required next operations

1. An authorized source reviewer uses the existing N15 ingestion and review queue; no direct SQL seeding.
2. Re-fetch the exact source URL, record current check time and freshness boundary, and preserve evidence refs.
3. Confirm eligibility text, post-specific reference/location, exact submission route and each deadline channel.
4. Only after a reviewer decision may an opportunity be promoted to candidate-facing status. The source URL being official is not enough to assert opening, eligibility or suitability for a particular candidate.
