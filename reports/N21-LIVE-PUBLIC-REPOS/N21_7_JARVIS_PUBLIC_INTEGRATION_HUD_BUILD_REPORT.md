# N21.7 — Jarvis Public Integration HUD Board

Status: built on `n21-live-public-repo-adapters`.

## Purpose

Give the Commander one visible Jarvis HUD board for the live N21 public integration gateways.

This is not a new orchestration layer. It is a read-only status surface and safe route index inside the existing `/jarvis` screen.

## Files added

- `apps/web/src/lib/jarvis/public-integrations/JarvisPublicIntegrationHud.ts`
- `apps/web/src/app/api/jarvis/public-repos/hud/route.ts`
- `scripts/validators/validate-n21-jarvis-public-integration-hud.mjs`

## Files updated

- `apps/web/src/app/jarvis/JarvisAgentClient.tsx`
- `apps/web/src/app/jarvis/JarvisAgent.module.css`

## HUD cards

The HUD displays these gateways:

1. N21.2 — Docling Smart Intake
2. N21.3 — Playwright Scout Gateway
3. N21.4 — Jarvis Voice Gateway
4. N21.5 — Jarvis Trace Evidence Gateway
5. N21.6 — Jarvis Security Scan Gate

Each card shows:

- N-step
- gateway name
- safety boundary
- live route
- readiness
- adapter ID

## Live route

```text
GET /api/jarvis/public-repos/hud
```

## Doctrine

- Kingsmen backend, PostgreSQL Truth Vault, and evidence ledger remain authority.
- The HUD displays status and safe routes only.
- The HUD does not execute tools by itself.
- No public integration may bypass policy gates, approval boundaries, or manual fallback.

## Validator

Run from repo root:

```powershell
node .\scripts\validators\validate-n21-jarvis-public-integration-hud.mjs
```

Expected:

```json
"passed": true
```

## Local test

Keep Next.js running, then open:

```text
http://127.0.0.1:3000/jarvis
```

or test the API:

```powershell
Invoke-RestMethod "http://127.0.0.1:3000/api/jarvis/public-repos/hud"
```

## Did not do

- Did not add a separate dashboard app.
- Did not add a new database table.
- Did not make the HUD execute scans, browser probes, document extraction, trace export, or voice commands by itself.
- Did not mark native sidecars as installed.
