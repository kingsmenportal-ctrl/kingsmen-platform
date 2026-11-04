# Kingsmen canonical institution and opportunity data contract

Status: proposed contract for independent review; NOT applied to any database.
Applies to: Kingsmen Portal / N15 opportunity catalogue.
Design constraint: keep the current N15 provider registry as the candidate-facing provider index while adding normalized evidence and identity relationships. Do not make older route tables or the organisation-review workflow a competing source of truth.

## 1. Identity model
A provider/institution is a durable legal or operational entity. A campus/branch is a location belonging to that entity. A provider is not a programme, opportunity, application route, partnership, or provider receipt.
Required canonical fields: stable internal UUID and immutable provider_ref; canonical display name and entity kind; parent entity for campus/branch/sub-brand relationships; lifecycle status ACTIVE/INACTIVE/MERGED/DISSOLVED/UNRESOLVED; legal/registration status separately as REGISTERED/PROVISIONAL/CANCELLED/LAPSED/NOT_REQUIRED/UNRESOLVED/NOT_REVIEWED; sector/type, province, municipality and location when evidenced; timestamps and source lineage.
Names and aliases are separate dated claims. A spelling variation, trading name, historic name, acronym, campus name, or duplicate source row must never silently create a second legal entity. Alias resolution is reviewed and auditable.

## 2. Evidence and freshness
Each assertion stores subject entity or programme/opportunity; claim type and normalized value; source authority, exact source URL/document title and source record locator/page where available; retrieval timestamp and source publication/effective date; evidence hash or immutable snapshot reference when feasible; reviewer/state, review timestamp, next-check/expiry boundary; and supersedes links when a register corrects an earlier record.
Freshness is claim-specific. A register snapshot establishes what was listed on that date; it does not prove today's intake is open. A provider homepage is not an application endpoint. Expired evidence must not silently remain current.

## 3. Distinct state machines
Do not collapse these states into one verified boolean:
1. Identity: UNRESOLVED, MATCHED, DUPLICATE_CANDIDATE, MERGED.
2. Legal/register: REGISTERED, PROVISIONAL, CANCELLED, LAPSED, NOT_REQUIRED, UNRESOLVED, NOT_REVIEWED.
3. Programme/qualification authorization: VERIFIED, NOT_VERIFIED, SUSPENDED, WITHDRAWN, UNRESOLVED.
4. Opportunity publication: DRAFT, NEEDS_REVIEW, OPEN, CLOSED, EXPIRED, WITHDRAWN.
5. Application route: OFFICIAL_DESTINATION, AUTHORIZED_ADAPTER, HUMAN_ASSISTED, UNAVAILABLE, NEEDS_REVIEW.
6. Integration: NOT_REQUESTED, PENDING_APPROVAL, APPROVED, DISABLED, TESTED, FAILED, REVOKED.
7. Provider acknowledgement: NOT_SENT, SUBMITTED_CANDIDATE_REPORTED, PROVIDER_RECEIPT_CONFIRMED, PROVIDER_REJECTED, OUTCOME_UNKNOWN.
8. Partnership: NONE, DISCUSSION, MOU_REVIEW, ACTIVE_AGREEMENT, ENDED.
None of these states implies another state.

## 4. Programme and opportunity model
A programme is a relatively stable course, qualification, learning route, or recruitment scheme. An opportunity is a time-bound intake/opening for a programme or role.
Required before an opportunity is OPEN: stable opportunity ref and linked provider/programme or employer/role; pathway HIGHER_EDUCATION, TVET, SETA_LEARNERSHIP, INTERNSHIP, APPRENTICESHIP or EMPLOYMENT; exact official source URL, retrieval/check timestamp, source authority and evidence; open/close dates and timezone when applicable (explicitly unknown when absent); eligibility criteria as structured source-backed claims; location/mode and fee/funding only when evidenced; last verified time, freshness deadline, human reviewer, publication decision; and a separate application route record.
Publish as OPEN only when source, current window, eligibility, freshness and route/next step pass review. Do not invent deadlines. If no deadline is supplied, mark it unknown and use a policy-defined review date.

## 5. Application route contract
Every route stores provider/opportunity ref, destination URL, route type, authorization basis, consent scope, supported actions, last tested time, test result, failure/fallback instructions and whether a human must complete the step.
- Official destination: verified provider-owned application page, not merely a homepage.
- Authorized adapter: documented permission/terms, least-privilege credentials in secret storage, provider-specific test evidence, timeout/retry policy and human approval for consequential writes.
- Human-assisted: official link plus instructions/checklist; candidate or authorized Kingsmen operator completes submission.
- Never claim provider acknowledgement without provider-generated receipt evidence.
- Playwright may test and assist within approved boundaries; it is not a legal authority, source of truth, or permission to bypass provider controls.

## 6. Registry import policy
Import source records as evidence first, then resolve to canonical entities. Preserve source status verbatim alongside normalized status. Do not overwrite historical status when a later register changes state.
Sources to reconcile:
- Public universities and TVETs: DHET and NSFAS institution directory; compare names, official domains and campuses.
- Private higher education: DHET Register of Private Higher Education Institutions plus CHE programme/accreditation evidence and SAQA qualification evidence.
- Private colleges: DHET register/list and applicable Umalusi/CHE/QCTO/SAQA scope; do not apply one regulator's status to every qualification.
- Occupational providers: QCTO and authorized/delegated quality-assurance evidence; verify qualification and scope.
- CET colleges: DHET official CET list and college/campus records.
- SETAs: DHET sector authority source; existence does not prove a current learnership.
- Government departments/public agencies: official departmental/agency sources and current programme notices.
- Employers/funders/accommodation providers: first-party source plus service/location/terms evidence; do not infer accreditation or endorsement.
For private institutions, current status must be read from the authoritative register, not copied from old lists. The DHET private higher-education register search result available on 2026-11-02 says its own last update was 11 December 2025; preserve that register date and do not represent it as a 2026 update. DHET explains that institution registration and qualification/programme accreditation are distinct requirements.

## 7. Existing staging reconciliation gates
A read-only staging census on 2026-11-02 found:
- opportunity_providers: 0 rows
- opportunity_programmes: 0 rows
- opportunity_source_authorities: 21 rows
- source_authorities: 21 rows
- route_providers: 3 rows
- route_programmes: 8 rows
- organisations: 0 rows
Before applying any seed/schema migration: (1) reconcile repository migrations with live schema and migration ledger; investigate duplicate 0078 ledger entries and source/ledger mismatches; (2) produce and test a protected backup/restore with restore verification; (3) approve exact target schema, recovery path and row-level validation; (4) run validators and CI against exact immutable commit; (5) apply to staging only through approved migration tooling; (6) verify authenticated Candidate A/B isolation, reviewer boundaries, candidate-safe filtering, audit events, freshness and route fallback; (7) obtain independent security/data review and Founder approval before production.

## 8. Import/reconciliation outputs
For every batch, produce raw source snapshot and SHA-256; normalized import with stable source record IDs; identity report (exact matches, aliases, duplicate candidates, unresolved entities); status transition report; row counts and rejected-row reasons; reviewer sign-off/date; and a separate opportunity report. Institution count must never be presented as open opportunity count.

## 9. Immediate implementation order
1. Review and adopt this contract.
2. Reconcile existing opportunity_providers, route_providers and route_programmes without deleting legacy evidence.
3. Build alias/campus/source-assertion support in the approved simplified backend schema.
4. Import official DHET private higher-education and private college registers as dated source snapshots; preserve registered/provisional/cancelled/lapsed/unresolved states.
5. Import CET and occupational provider registers.
6. Add government, employer, funder and accommodation directories.
7. Ingest actual programme/opening records, then validate and publish each opportunity separately.
8. Add route verification and authorized integration only after provider permission and technical path are evidenced.