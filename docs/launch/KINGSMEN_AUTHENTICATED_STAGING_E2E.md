# Kingsmen authenticated staging verification

This workflow separates read-only Candidate A/B isolation proof from profile mutations. It runs only through manual GitHub Actions dispatch and protected GitHub Environments.

Workflow: \`.github/workflows/kingsmen-authenticated-staging-e2e.yml\`

## Protected environment: \`kingsmen-staging-verification\`

Configure the environment with required reviewers and the following secrets:

- \`KINGSMEN_STAGING_BASE_URL\` — HTTPS candidate portal staging origin.
- \`KINGSMEN_STAGING_API_BASE_URL\` — HTTPS origin of the authenticated backend API.
- \`KINGSMEN_SUPABASE_URL\`, \`KINGSMEN_SUPABASE_ANON_KEY\`.
- \`KINGSMEN_E2E_CANDIDATE_A_TOKEN\`, \`KINGSMEN_E2E_CANDIDATE_B_TOKEN\`, \`KINGSMEN_E2E_REVIEWER_TOKEN\`.
- \`KINGSMEN_E2E_CANDIDATE_A_DOCUMENT_ID\`, \`KINGSMEN_E2E_CANDIDATE_B_DOCUMENT_ID\`.
- \`KINGSMEN_E2E_CANDIDATE_A_APPLICATION_ID\`, \`KINGSMEN_E2E_CANDIDATE_B_APPLICATION_ID\`.

The fixtures must be dedicated staging records with verified Auth identity links and candidate-owned private documents. The workflow checks each candidate's own profile identity, own and foreign candidate-status reads, own and foreign application workbench reads, own and foreign private-document reads, and reviewer-positive/candidate-negative queue access. It does not write staging data.

## Protected environment: \`kingsmen-staging-profile-mutations\`

Configure separate required reviewers. Because GitHub Environment secrets are scoped to their environment, also configure `KINGSMEN_STAGING_BASE_URL`, `KINGSMEN_SUPABASE_URL`, `KINGSMEN_SUPABASE_ANON_KEY`, and `KINGSMEN_E2E_CANDIDATE_A_TOKEN` in this second environment. Then add the variable \`KINGSMEN_PROFILE_E2E_MUTATION_APPROVED=true\` only when the environment owners authorise the mutating test. Configure these additional secrets:

- \`KINGSMEN_E2E_CANDIDATE_A_EMAIL\`
- \`KINGSMEN_E2E_CANDIDATE_A_PASSWORD\`
- \`KINGSMEN_PROFILE_E2E_EXPECTED_CANDIDATE_REFERENCE\`

This job runs only when the workflow input \`run_profile_persistence\` is true and the read-only isolation job has passed. It requires both the initial access token and password login for the same dedicated test candidate. It checks the exact candidate reference before mutation, saves and updates a synthetic profile, signs out, performs a fresh password sign-in, reloads persisted values, and restores the original profile. The test fails closed if the initial authenticated session resolves to another candidate.

No password, bearer token, profile content or document bytes are written to the report. Never use a real candidate account or real candidate document as a fixture. A failed restoration is an incident requiring manual test-account review.

## Evidence and limits

Artifacts contain only redacted test summaries and are retained for 14 days. A successful workflow proves the specific staging revision and fixtures tested; it does not prove production deployment or provider integration. The workflow must be dispatched against the intended staging deployment after the protected environments and secrets have been configured.
