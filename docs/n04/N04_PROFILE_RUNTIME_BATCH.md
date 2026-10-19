# N04 Candidate Profile Runtime Batch

Status: **Implemented on a feature branch; pending CI, migration review/application, and staging proof.** This is a reversible project increment, not a claim that the entire Kingsmen project is finished.

## Included
- Authenticated identity-status endpoint using the shared Supabase session validation and exact authenticated-user-ID mapping.
- Candidate profile read API scoped to the authenticated candidate.
- Candidate correction request submission; sensitive identity, finance, and academic fields are classified for authorised review.
- Direct profile PATCH is deliberately rejected; official outcomes, payment/submission states, verification, and source confidence are not candidate-editable.
- Candidate profile UI showing identity-link state, evidence-backed fields, correction requests, and review status.
- Additive SQL migration for auth_user_id and append-only profile access audit evidence.
- Static source validator and staging contract probe.

## Safety and truth boundaries
- The authenticated Supabase user ID, not email equality or a browser-supplied candidate ID, resolves the candidate.
- Profile reads are not returned unless the privacy access event is recorded.
- Correction requests create a request record; they do not overwrite the accepted profile value.
- The migration must be reviewed and applied using the approved migration process before the APIs can use the new audit table. No migration is applied by this branch commit.
- productionReady remains false until connected staging, privacy, and build gates pass.
- Do not use real candidate PII in contract tests. Use a dedicated synthetic staging candidate only.
- The API contract probe is blocked unless N04_BASE_URL and N04_CANDIDATE_TOKEN are supplied; missing credentials are not a pass.

## Validation
Run the profile runtime source validator and the API contract test syntax check. For live API proof, set N04_BASE_URL and N04_CANDIDATE_TOKEN to an authorised staging origin and dedicated synthetic candidate session, then run scripts/tests/n04-profile-api-contract.mjs.

A successful source validator is not a substitute for TypeScript production build, applied migration proof, or live API contract evidence.
