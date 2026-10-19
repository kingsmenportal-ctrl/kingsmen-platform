# Authenticated staging E2E runner

This runner executes operator-authored HTTP cases against a controlled Kingsmen staging deployment. It does not create users, candidate records, uploads, or reviewer decisions.

## Required environment

- `KINGSMEN_STAGING_BASE_URL`: exact staging origin (HTTPS required outside localhost).
- `KINGSMEN_E2E_PLAN`: path to an authorised case-plan JSON file.
- `KINGSMEN_E2E_CANDIDATE_A_TOKEN`, `KINGSMEN_E2E_CANDIDATE_B_TOKEN`, `KINGSMEN_E2E_REVIEWER_TOKEN`: short-lived authorised staging sessions for roles used by the plan.
- Optional `KINGSMEN_E2E_ALLOW_MUTATIONS=true`: explicitly permits POST/PUT/PATCH/DELETE cases. Leave unset for read-only checks.
- Optional `KINGSMEN_E2E_REPORT`: report destination.

Tokens are read only from environment variables; never place tokens in the plan. Redirects are not followed. Paths cannot escape the configured origin. Reports contain case IDs, HTTP status, duration, plan digest and redacted failure categories—not response bodies, request bodies, or tokens.

## Plan format

```json
{
  "schema": "kingsmen.staging-e2e-plan.v1",
  "cases": [
    { "id": "anonymous-review-queue-denied", "role": "anonymous", "method": "GET", "path": "/replace-with-confirmed-reviewer-route", "expectedStatus": 401 }
  ]
}
```

Replace example paths and expected statuses only after checking the deployed route contract. Add controlled fixture-specific assertions using `assertJsonPath`, `equals`, or `notEquals`. Use candidate A and B cases to assert owner isolation, and candidate A against reviewer-only routes to prove denial. A successful HTTP status alone is not proof of identity or document authenticity.

## Run

```sh
npm run staging:e2e:validate
KINGSMEN_STAGING_BASE_URL=https://your-authorized-staging-origin.example \
KINGSMEN_E2E_PLAN=./staging-e2e-plan.json \
KINGSMEN_E2E_CANDIDATE_A_TOKEN=... \
KINGSMEN_E2E_CANDIDATE_B_TOKEN=... \
KINGSMEN_E2E_REVIEWER_TOKEN=... \
npm run staging:e2e
```

The command fails closed when required configuration is absent or invalid. A source-contract pass is not a live E2E pass. Preserve the generated report as release evidence and review all cases before closing the release gate.
