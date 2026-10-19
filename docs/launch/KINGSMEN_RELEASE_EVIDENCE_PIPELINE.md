# Kingsmen Release Evidence Pipeline

## Purpose

The `Kingsmen Release Evidence` GitHub Actions workflow gives every pull request targeting `main`, every push to `main`, and every manual run a repeatable build/contract-validation/API HTTP smoke-test sequence. It creates downloadable CI evidence artifacts so a green source check is distinguishable from a live staging or production proof.

## What the workflow executes

1. Installs the backend API package dependencies without storing credentials.
2. Runs the repository's existing `npm test` suite.
3. Runs the Jarvis connected-contract validator.
4. Compiles the TypeScript API.
5. Runs the Truth Vault persistence source-contract validator.
6. Checks the safe web-to-backend boundary.
7. Captures the evidence-aware launch-readiness audit report.
8. Starts the compiled API in an isolated in-memory mode and exercises `GET /health`, `GET /api/system/health`, and the unknown-route 404 contract.
9. Uploads the generated API, web-boundary, and launch reports as a 14-day GitHub Actions artifact, including when an earlier step fails.

## What a passing run proves

A passing run proves that the checked-out source passed the configured repository tests and validators, that the API TypeScript compiled, and that the compiled API process answered the health endpoints and rejected an unknown route as expected in an isolated in-memory test process.

## What a passing run does not prove

- It does not prove Supabase/PostgreSQL connectivity or persistence; the smoke process explicitly uses `memory_development_only`.
- It does not prove authorised candidate/reviewer sessions, private document upload/review, identity decisions, payments, communications-provider delivery, or production data correctness.
- It does not prove the Netlify preview or production deployment serves the exact commit.
- It does not open the Kingsmen launch gate. The launch-readiness report remains evidence-driven and may continue to list runtime, governance, privacy, recovery, and provider proof requirements.

## Release handling

- Review the workflow status and download the `kingsmen-release-evidence-<run-id>` artifact.
- Use the artifact's reports and the commit SHA from the GitHub run as the source-bound evidence pair.
- Treat Netlify deployment identity and public-route smoke tests as separate deployment evidence.
- Keep launch blocked until every required runtime and governance proof is captured and reviewed. Never convert missing evidence into a passing result.

## Security properties

The workflow requires read-only repository permission, creates no privileged credentials, does not seed production/staging records, does not weaken RLS or reviewer authorization, and does not deploy directly to production. Pull-request preview behavior remains governed by the repository's existing Netlify configuration and access controls.
