# Jarvis Final Command HUD

## Status

Jarvis source/design HUD is complete for Docker-independent use. This is not production readiness.

## Routes

- `/jarvis/final`
- `/api/jarvis/final-command-hud`
- `/api/jarvis/completion-board`
- `/api/jarvis/provider-credential-checklist`
- `/api/jarvis/live-index`

## What the HUD proves

- The founder has one Jarvis command HUD for source readiness, provider readiness, launch gates, and runtime blockers.
- Docker/API runtime proof is separated from source completion.
- Provider checklist shows credential names only and no secret values.
- Production readiness remains false.
- Public launch remains false.
- Browser does not run local shell.
- Browser does not read the database directly.
- Browser does not call providers directly.
- PostgreSQL Truth Vault remains authority.
- Airtable remains mirror only.
- n8n remains thin relay only.
- Playwright remains scout/probe only.
- WhatsApp remains urgent-only; SMS remains backup-only.
- Email remains primary tracked channel.
- OpenClaw remains operator-only.

## Validate

```powershell
node scripts\validators\validate-jarvis-final-command-hud.mjs
npm --prefix apps/web run build
```

## Runtime gate

When Docker/API becomes stable, rerun runtime proofs. Do not set `productionReady=true` until provider credentials, accepted runtime evidence, branch protection, staging proof pack, and launch audit all pass.
