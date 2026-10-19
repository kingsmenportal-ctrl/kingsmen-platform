# N06 Applications and Pathway Execution

Status: Implementation batch pushed for review; CI, migration, and staging gates remain open.

## Included
- Six pathway types: higher education, TVET, SETA/learnerships, internships, apprenticeships, employment.
- Published opportunity discovery and candidate-scoped saved opportunities.
- Draft creation gated on a verified source and a live deadline.
- Readiness checks against opportunity-required documents and accepted, candidate-confirmed profile fields.
- Explicit status-transition graph with optimistic conflict protection.
- Evidence and provider-reference requirements for provider-originated status claims.
- Manual application action packages for external portal, email, in-person, and manual-only workflows.
- Append-only application event trail, source validator, candidate dashboard and staging isolation probe.

## Candidate application progression
- After a readiness check returns READY, the candidate can explicitly move READY_FOR_REVIEW → READY_TO_SUBMIT → SUBMISSION_PENDING.
- SUBMISSION_PENDING records an attempt/workflow state only; it does not assert a provider submission. Provider-confirmed submission and outcomes remain reviewer-only and require evidence.
- If a status transition audit insert fails, the API attempts a compare-and-set rollback and reports whether rollback was confirmed.

## Truth and safety boundaries
- Candidate identity comes from the authenticated session; browser-supplied candidate IDs are not accepted.
- Readiness is an internal checklist, not a provider decision or submission.
- Creating a draft does not submit it externally.
- Provider submission, interview, offer, acceptance, and rejection cannot be asserted without evidence and provider references.
- Manual packages are guidance; they do not bypass OTP/CAPTCHA or claim success.
- This batch does not invent or seed provider opportunities. Only published records appear, and sources must be verified through an authorised review process.
- SQL migration is not applied by CI or this code push.
- Integration tests must use synthetic staging candidates, never real candidate PII.

## Validation
- Source validator command: npm run n06:applications:validate
- Isolation probe command: npm run n06:applications:test
- Probe requires N06_BASE_URL, N06_CANDIDATE_A_TOKEN, and N06_CANDIDATE_B_TOKEN. Missing values are BLOCKED, not PASS.
- Confirm staging schema field names and migration review before runtime testing.
- productionReady remains false until CI, production build, migration, API contract, and isolation checks pass.
