# Kingsmen Platform

Kingsmen is being built as a South African admissions, opportunities, document, finance, communications, and automation platform.

## Live Kingsmen Jarvis Core

This repository now contains the first live Kingsmen Jarvis foundation. It is not only a reference library.

Built live on `main`:

- `packages/contracts/src/jarvis/index.ts` — typed Jarvis command, authority, channel, mode, tool, policy, and evidence contracts.
- `packages/jarvis-core/src/jarvis-policy-gate.ts` — live policy gate for mode/channel/tool/authority decisions.
- `packages/jarvis-core/src/jarvis-tool-registry.ts` — trusted tool capability cards for repo, validator, GitHub, Airtable, n8n, PayFast, browser scout, and patch planning.
- `packages/jarvis-core/src/jarvis-evidence-ledger.ts` — evidence event ledger for command receipt, policy decisions, tool plans, validator output, approvals, and blocks.
- `packages/jarvis-core/src/jarvis-command-runner.ts` — command planning runner that routes allowed, dry-run, approval-required, and blocked paths.
- `scripts/validators/validate-jarvis-core.mjs` — validator for live Jarvis core invariants.
- `manifests/jarvis/live-jarvis-core.json` — machine-readable live module manifest.

Run validation:

```powershell
npm test
# or
npm run jarvis:validate
```

## Deployable backend API runtime

`apps/api` now contains a deployable backend API package, TypeScript build config, and HTTP server runtime.

It exposes:

- `GET /health`
- `GET /api/system/health`
- `POST /api/commands`
- `POST /api/workflow/result`
- `POST /api/workflow-results`
- `GET /api/candidates/:candidateId/status`
- `GET /api/applications/:applicationId/workbench`

Run from the root after installing the API package dependencies:

```powershell
npm run api:build
npm run api:start
```

Or directly:

```powershell
cd apps/api
npm install
npm run build
npm start
```

Current API storage mode is `memory_development_only`. The next launch build must replace this with real PostgreSQL/Supabase Truth Vault persistence.

## Simplified risk-based release policy

Kingsmen uses three release levels and four shared stages: build, safety checks, release, and runtime verification. Do not make the public-launch gate a universal blocker for unrelated work.

- **Routine changes** (copy, layout, documentation, isolated UI fixes): relevant tests, normal CI, deploy to the intended non-production or approved environment, and smoke-test.
- **Feature changes** (candidate journeys, catalogue, Founder dashboard): relevant automated tests, applicable permissions checks, staging verification, and deployment confirmation.
- **Critical changes** (authentication, candidate isolation, RLS, payments, private documents, production migrations, worker authority): focused security tests, required recovery/change-control safeguards, explicit approval, and post-release verification.

The launch-readiness audit remains available as a diagnostic report:

```powershell
npm run kingsmen:launch:audit
```

Run `npm run kingsmen:launch:gate` as a blocker only for the public launch or release class it explicitly governs—not for independent routine changes. Do not bypass branch protection, required CI, or critical safeguards.

Release evidence lives in:

- `manifests/launch/kingsmen-launch-readiness-v1.json`
- `docs/launch/KINGSMEN_LAUNCH_READINESS.md`
- `scripts/validators/validate-kingsmen-launch-readiness.mjs`
- `reports/launch/kingsmen-launch-readiness-latest.json` generated locally by the validator

A change is not considered deployed or verified solely because a commit exists or a validator passes. Confirm the actual deployment and the relevant runtime journey.

## Locked Jarvis rules

Jarvis helps build Kingsmen, but Jarvis is not the uncontrolled brain.

Authority remains with:

- PostgreSQL Truth Vault
- Backend API state machine
- GitHub repository evidence
- validators and boot-blockers
- founder approval for production-risk actions

Jarvis must preserve:

- email primary communication
- WhatsApp urgent-only
- no secrets in repo/chat/logs
- no bypassing CAPTCHA/OTP/rate limits
- no production action without founder approval
- no useless layers
