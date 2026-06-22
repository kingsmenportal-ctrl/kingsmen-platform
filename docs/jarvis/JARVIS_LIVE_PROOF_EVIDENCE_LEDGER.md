# Jarvis Live Proof Evidence Ledger

## Status

Source-ready. Docker-independent. Not production-ready.

## Purpose

The Jarvis Live Proof Evidence Ledger defines how remaining live proof is accepted, rejected, missing, or blocked.

It exists at:

- `/api/jarvis/live-proof-evidence-ledger`
- `/founder/proof-centre/jarvis-live-proof-evidence-ledger`

## Ledger states

- `SOURCE_READY` — source evidence exists and does not claim runtime live.
- `ACCEPTED_PREVIOUSLY` — previous runtime/source proof is accepted as supporting evidence.
- `MISSING` — launch-critical proof is not captured yet.
- `BLOCKED` — proof is blocked by local runtime or provider readiness.
- `REJECTED` — proof must not be used for launch.

## Launch-critical missing evidence

- Docker/API/Truth Vault runtime proof.
- AI provider live-call proof.
- Email primary channel proof.
- PayFast accepted ITN proof.
- n8n/Airtable/GitHub runtime proof.
- Branch protection and final launch audit proof.

## Rejection rules

- Reject raw API keys or unredacted provider secrets.
- Reject browser direct provider calls.
- Reject browser direct database writes.
- Reject PayFast return/cancel URL as paid-state proof.
- Reject duplicate accepted ITN.
- Reject n8n direct Truth Vault writes.
- Reject Airtable as authority.
- Reject GitHub token exposure.

## Validation

Run:

```powershell
node scripts\validators\validate-jarvis-live-proof-evidence-ledger.mjs
npm --prefix apps/web run build
```

Expected:

```text
JARVIS_LIVE_PROOF_EVIDENCE_LEDGER_SOURCE_VALIDATED
passed: true
productionReady: false
publicLaunchAllowed: false
```
