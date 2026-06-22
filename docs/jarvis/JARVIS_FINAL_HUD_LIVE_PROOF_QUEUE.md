# Jarvis Final HUD Live Proof Queue Wiring

## Status

Source-ready. Docker-independent. Not production-ready.

## Purpose

The final Jarvis command room now surfaces the live proof queue directly inside `/jarvis/final`.

The final HUD reads:

- `/api/jarvis/final-command-hud`
- `/api/jarvis/completion-board`
- `/api/jarvis/provider-credential-checklist`
- `/api/jarvis/evidence-collector`
- `/api/jarvis/source-launch-gate`
- `/api/jarvis/proof-pack-index`
- `/api/jarvis/live-proof-queue`

## What this completes

The founder no longer needs separate JSON routes to see why Jarvis is not live. The final HUD now shows:

- Jarvis source/design completion state.
- Live proof queue source/runtime/provider/security blockers.
- Docker/API runtime blocker.
- Pending provider credentials.
- Evidence captured, pending, and blocked.
- Source launch gates.
- Proof-pack index.
- No fake data and no secret exposure locks.

## Still blocked before live

Jarvis remains blocked from production until the live proof queue clears:

- Docker/API/Truth Vault runtime proof.
- AI provider live-call proof.
- Email primary channel proof.
- PayFast sandbox accepted ITN proof.
- n8n thin relay proof.
- Airtable mirror proof.
- GitHub connector proof.
- Branch protection and final launch audit proof.

## Validation

Run:

```powershell
node scripts\validators\validate-jarvis-final-command-room-live-proof-queue.mjs
npm --prefix apps/web run build
```

Expected status:

```text
JARVIS_FINAL_COMMAND_ROOM_LIVE_PROOF_QUEUE_WIRING_VALIDATED
passed: true
productionReady: false
publicLaunchAllowed: false
```
