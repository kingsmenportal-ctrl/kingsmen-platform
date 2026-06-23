# Jarvis Live Proof Acceptance Gate

## Status

Source-ready. Docker-independent. Not production-ready.

## Purpose

The acceptance gate defines what Jarvis may accept as real live evidence, what must remain pending, and what must be rejected before any production-ready claim is allowed.

## Route

- `/api/jarvis/live-proof-acceptance-gate`
- `/founder/launch-control/jarvis-live-proof-acceptance-gate`

## Acceptance rules

Accepted source/design proof does not equal runtime-live proof. Runtime and provider evidence must still pass.

Jarvis may only accept live evidence when it is:

- Real runtime/provider/security evidence.
- Redacted where needed.
- Captured in the evidence ledger or proof pack.
- Bound to backend authority where applicable.
- Not derived from browser-only state.
- Not derived from fake placeholders.
- Not exposing raw secrets.

## Explicit rejects

The gate rejects:

- Payment state from PayFast return/cancel pages without accepted ITN.
- AI proof from browser-side provider calls or mock completions.
- Email proof without bounce/failed-send and opt-out handling.
- n8n or Airtable evidence that makes them authority over Truth Vault.
- GitHub proof that exposes tokens.
- Branch protection claims without review/check evidence.
- Public launch claims while Docker/API/Truth Vault runtime proof is blocked.

## Required validation

```powershell
node scripts\validators\validate-jarvis-live-proof-acceptance-gate.mjs
npm --prefix apps/web run build
```

Expected:

```text
JARVIS_LIVE_PROOF_ACCEPTANCE_GATE_SOURCE_VALIDATED
passed: true
productionReady: false
publicLaunchAllowed: false
acceptanceDecision: BLOCK_LAUNCH
```
