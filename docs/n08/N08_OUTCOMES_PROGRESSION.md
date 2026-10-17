# N08 — Candidate Outcomes & Progression

N08 extends N07 with an evidence-backed outcomes ledger, candidate-visible timeline, correction/dispute requests, and a reviewer correction queue. An application or Kingsmen status alone does not prove a provider outcome. Kingsmen does not guarantee admission, funding, placement, employment, or any provider decision.

## Outcome recording
An explicitly provisioned APPLICATION_REVIEWER or PROVIDER_OPERATOR records an outcome only when the application status is compatible with the selected outcome and a matching evidence record is VERIFIED and of type PROVIDER_OUTCOME_NOTICE. The ledger retains application, candidate, opportunity, provider, evidence reference, reviewer, confirmation timestamp, summary and next step.

Supported types: PROVIDER_OFFER, PROVIDER_ACCEPTANCE, PROVIDER_REJECTION, ENROLMENT_CONFIRMED, PLACEMENT_CONFIRMED, EMPLOYMENT_STARTED. Acceptance/enrolment/placement/employment-started entries require N07 application status ACCEPTED; provider-specific semantics may need further tailoring.

## Candidate privacy and corrections
Candidate GET resolves the signed-in candidate through the existing Supabase Auth-to-candidate mapping and filters records by that candidate ID. Candidates may submit correction/dispute requests. The original outcome is not silently overwritten. Reviewer decisions are audited; accepted corrections require a separately evidenced correction or supersession.

## Routes
- GET /api/reviewer/outcomes — open correction requests.
- POST /api/reviewer/outcomes action RECORD_OUTCOME — record evidence-backed outcome.
- POST /api/reviewer/outcomes action RESOLVE_CORRECTION — record review decision.
- GET /api/candidate/outcomes — candidate-owned outcomes and correction requests.
- POST /api/candidate/outcomes — request correction/dispute.

## Data model
Migration 0062 depends on N06 (0060) and N07 (0061). It adds RLS-protected outcomes and correction-request tables. Outcome evidence and identity fields are immutable; outcomes cannot be deleted. Correction requests are separate records.

## Release gates
Apply migrations 0060, 0061 and 0062 in order through approved staging operations. Configure server-side Supabase secrets and provision reviewer roles. Run TypeScript build, source validator, and seeded staging tests for two-candidate isolation, verified-evidence enforcement, status/type mismatches, duplicate outcomes, correction decisions, and audit-failure handling. Evidence authenticity depends on independently checking the original artefact. productionReady remains false until gates are evidenced.
