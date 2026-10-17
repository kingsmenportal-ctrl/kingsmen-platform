# N07 — Provider Integration, Submission Evidence & Reviewer Operations

## Scope
N07 extends N06 with an authorised reviewer queue, evidence registration and verification, a controlled submission-task ledger, and evidence-gated provider-status updates. It supports all six N06 pathways without assuming providers expose APIs.

## Truth states
1. **Prepared by Kingsmen:** an application draft/readiness snapshot or submission task exists in Kingsmen.
2. **Actually submitted:** must be established by a provider receipt or equivalent independently reviewed artefact; the N07 task itself is never proof.
3. **Provider outcome:** must be recorded by an authorised reviewer with a verified provider outcome/status notice.

The initial adapter key is NONE_CONFIGURED; submission authorisation creates a MANUAL_REQUIRED job. It does not contact a provider, click a portal, send email, or mark the application submitted. No OTP/CAPTCHA bypass is implemented.

## Reviewer identity and permissions
platform_reviewers maps an authenticated Supabase user UUID to active, explicitly provisioned roles. No email-only matching, candidate self-enrolment, browser service-role key, or client-provided role is trusted. Roles: APPLICATION_REVIEWER, EVIDENCE_VERIFIER, PROVIDER_OPERATOR, PLATFORM_ADMIN. Provisioning must be done through an approved administrative/database process after independent authorisation.

## Evidence workflow
Register an evidence locator, source label, SHA-256 fingerprint and type. New records are PENDING_REVIEW. A reviewer with EVIDENCE_VERIFIER (or PLATFORM_ADMIN) can verify/reject with a substantive note. Verification is an auditable human attestation; the API does not fetch or authenticate the provider artefact and the SHA-256 is a fingerprint supplied at registration, not a trusted checksum unless independently compared with the bytes.

SUBMITTED_CONFIRMED requires a verified PROVIDER_SUBMISSION_RECEIPT and provider-issued reference. Provider progress statuses require verified provider status evidence; OFFERED, ACCEPTED, and REJECTED require verified outcome evidence.

## Controlled submission
POST /api/reviewer/applications/authorize-submission checks readiness READY, current source verification, deadline and a verified pre-submission checklist. It creates an idempotent MANUAL_REQUIRED submission job because no provider adapter is configured. Manual execution, dispatch receipts and actual provider acceptance remain external/operator work.

## Routes
- GET /api/reviewer/applications
- GET|POST /api/reviewer/applications/evidence
- POST /api/reviewer/applications/authorize-submission
- POST /api/reviewer/applications/provider-status
- UI landing page: /reviewer/applications

All routes authenticate the Supabase access token and query platform_reviewers server-side with service-role credentials. Candidate users are not reviewers by default.

## Migration and release gates
Apply db/migrations/0061_n07_provider_review_operations.sql only after reviewing against the deployed N06 schema. The migration expands the N06 append-only event vocabulary. Then provision two dedicated reviewer test accounts and one candidate account, configure server-side secrets, and run N07_BASE_URL, N07_REVIEWER_TOKEN, N07_CANDIDATE_TOKEN against a staging deployment.

Required before production: TypeScript build and source validator; migration application; reviewer role provisioning/least-privilege review; two-candidate data isolation; evidence lifecycle and transition tests; concurrency/idempotency tests; evidence bytes and hash independent validation; real provider adapters with allowlists, rate limits, retry/idempotency and operational ownership; deployment smoke tests. productionReady remains false until all gates are evidenced.
