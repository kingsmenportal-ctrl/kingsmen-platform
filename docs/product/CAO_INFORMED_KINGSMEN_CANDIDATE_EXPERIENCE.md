# CAO-informed Kingsmen Candidate Experience

**Status:** implementation specification and candidate-page increment; not a production-readiness declaration  
**Scope:** Kingsmen One candidate journey, N15 opportunity feed, candidate application coordination, Document Vault, status evidence, and future institutional integrations.

## Product decision

Kingsmen adopts proven application-service principles associated with the Central Applications Office (CAO): a guided application journey, multiple choices, programme discovery, clear requirements, supporting-document readiness, explicit statuses, applicant guidance, and clear responsibility boundaries.

Kingsmen does not copy CAO's brand, claim CAO integration, or represent itself as an admissions authority. Its target is a South African national opportunity-access and application-execution platform across six pathways:

1. Higher education
2. TVET
3. SETA programmes and learnerships
4. Internships
5. Apprenticeships
6. Employment

## Canonical candidate data model

- **Candidate identity:** one authenticated Kingsmen identity and candidate profile.
- **Master application:** one Kingsmen service-execution/co-ordination record per candidate journey or service plan.
- **Opportunity choice:** a child record linked to the master application for each selected opportunity.
- **Provider application:** a distinct execution record for each external provider submission; never imply the Kingsmen master record is the provider's application.
- **Evidence event:** an append-only event describing an action, actor, timestamp, source, evidence reference and verification level.
- **Document Vault:** private candidate-owned files, with application-specific selection and explicit sharing controls.
- **Payment and entitlement:** separate records; an entitlement becomes active only after verified settlement, not from a browser redirect.

Avoid duplicate candidate accounts and duplicate master records. Do not collapse different providers' forms, deadlines or eligibility rules into one generic form.

## Opportunity data contract

Each candidate-facing opportunity should expose, where available:

- Stable opportunity and provider identifiers
- Title, pathway, provider and location
- Official URL and source authority
- Published eligibility requirements and required documents
- Opening and closing dates with timezone and supporting evidence
- Last checked timestamp and freshness state
- Opportunity publication state
- Candidate-specific readiness state with reason codes
- Application method and next action
- Evidence references and source-confidence level

A source directory entry is not proof that an opportunity is open. Unknown or stale dates remain unknown; expired, unverified or insufficiently evidenced opportunities must not be presented as open. A recommendation is decision support, not a guarantee of eligibility, admission, funding or employment.

## Candidate status vocabulary

Keep opportunity status, preparation status, submission status and provider outcome separate.

- **Opportunity:** UNVERIFIED, VERIFIED, OPEN, CLOSING_SOON, CLOSED, PAUSED, STALE
- **Preparation:** NOT_STARTED, PROFILE_INCOMPLETE, DOCUMENTS_REQUIRED, READY_FOR_REVIEW, READY_TO_SUBMIT
- **Submission:** NOT_SUBMITTED, AWAITING_CANDIDATE_CONFIRMATION, SUBMISSION_INITIATED, CANDIDATE_REPORTED_SUBMITTED, EVIDENCE_RECORDED, PROVIDER_RECEIPT_CONFIRMED
- **Outcome:** AWAITING_PROVIDER, OFFERED, WAITLISTED, UNSUCCESSFUL, WITHDRAWN, OTHER_PROVIDER_OUTCOME, UNKNOWN

Only authorised provider evidence or an approved integration can establish a provider-confirmed receipt or outcome. Candidate statements remain candidate-reported. A screenshot or timestamp is evidence recorded, not necessarily proof of provider receipt.

## Candidate experience requirements

1. One account and reusable profile across all six pathways.
2. Search and filter verified opportunities by pathway, title/provider, location, deadline and relevant published requirements.
3. Explain match/readiness reasons and missing information.
4. Show source-check time, official source, deadline state and evidence provenance.
5. Provide pathway-specific preparation checklists.
6. Reuse documents only with candidate control and explicit, application-specific sharing.
7. Maintain one unified timeline across linked provider application records.
8. Show the next action and responsible party for each stalled item.
9. Provide a useful empty state when no opportunity passes the publication gates; never fill the page with stale or fabricated records.
10. Keep pages accessible, mobile-friendly and clear about provider authority.

## Security and privacy gates

- Enforce candidate A/B isolation at database/RLS, storage and API layers; UI filtering alone is insufficient.
- Keep documents private; authorise every upload, read, download and share.
- Apply least privilege to reviewers and operators; no email-only identity linking.
- Record consent, purpose and sharing events where required.
- Apply retention and deletion rules to candidate data and uploaded files.
- Keep service-role credentials server-side and never log secrets.
- Fail closed when identity, source freshness, provider authority or evidence is insufficient.
- AI can explain and assist; it cannot make or impersonate provider decisions.

## Operational and commercial requirements

- Jarvis should report observed state, not commands issued: queue backlog, stale sources, submission evidence gaps, payment reconciliation, incidents and recovery.
- Payments require server-side signature, merchant, amount, reference and status validation; duplicate ITNs must be idempotent.
- Candidate package prices and included services must be explicit. Kingsmen service fees must be distinguished from external provider fees. Payment must not imply preferential admission or employment.
- Potential institutional contracts and sponsored cohorts remain prospective until written agreements and revenue evidence exist.
- The initial active-candidate cap is 500. Expansion requires load, reliability, security and support-capacity evidence.

## Phased acceptance plan

### Gate A — Candidate-facing opportunity discovery
- Six pathway values are represented consistently.
- Search, pathway filter and deadline sorting work on the authorised feed.
- Every result shows provider, location when known, official link, source-check timestamp, deadline state and safe eligibility language.
- Empty/error/identity-review states are truthful and accessible.
- Search never promotes unverified or stale records.

### Gate B — Master application and execution records
- A candidate can create/reload/update a master application.
- Multiple opportunity choices link to the correct master application.
- Each provider submission has its own execution state and evidence timeline.
- Duplicate requests do not create duplicate records.
- Candidate A cannot read or mutate Candidate B's records.

### Gate C — Documents and identity review
- Private upload, download/signing, expiry and retention are tested.
- Reviewer access is explicitly granted and audited.
- Candidate A/B isolation is demonstrated with two authenticated test identities.

### Gate D — Payments and entitlements
- Canonical package price and order are persisted.
- PayFast sandbox checkout and ITN are verified end to end.
- Invalid signature, merchant, amount and reference are rejected.
- Duplicate notifications are idempotent; entitlements activate only after verified payment.

### Gate E — release and operational proof
- Build and automated tests pass on the exact release commit.
- Migrations are applied and verified in staging.
- Complete authenticated candidate-to-reviewer journey passes.
- Deployed URL and deployed commit are recorded.
- Security, incident recovery and rollback evidence is retained.
- Production remains blocked until every mandatory release gate has current evidence.

## Current implementation note

The existing candidate opportunity-matches route already calls the authenticated N15 candidate feed, uses all six pathway labels, and withholds matches when the backend publication gates do not pass. This increment adds practical discovery controls and clearer source/deadline evidence presentation. It does not prove that the full candidate journey, provider integrations, all six pathways' live source coverage, or production deployment are complete.
