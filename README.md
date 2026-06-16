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

## Kingsmen launch readiness gate

The repo now has a strict launch-readiness gate. It does not fake production readiness; it reports the exact blockers that must be repaired before public candidates, payments, or production data.

Run an audit report without failing the shell:

```powershell
npm run kingsmen:launch:audit
```

Run the release boot-blocker:

```powershell
npm run kingsmen:launch:gate
```

Launch evidence lives in:

- `manifests/launch/kingsmen-launch-readiness-v1.json`
- `docs/launch/KINGSMEN_LAUNCH_READINESS.md`
- `scripts/validators/validate-kingsmen-launch-readiness.mjs`
- `reports/launch/kingsmen-launch-readiness-latest.json` generated locally by the validator

Public launch remains blocked until the gate opens.

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
