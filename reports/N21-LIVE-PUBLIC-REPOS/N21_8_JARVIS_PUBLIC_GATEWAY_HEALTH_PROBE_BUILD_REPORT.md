# N21.8 — Jarvis Public Gateway Health Probe Build Report

## Status

Completed on branch `n21-live-public-repo-adapters`.

## Purpose

N21.8 adds a safe local health probe for the public-repo gateways built in N21.2 through N21.6. It gives the Commander a green/yellow/red readout for local GET/status routes without executing risky actions.

## Built files

- `apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayHealthProbe.ts`
- `apps/web/src/app/api/jarvis/public-repos/health/route.ts`
- `apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayHealthProbe.api-example.json`
- `scripts/validators/validate-n21-jarvis-public-gateway-health.mjs`

## Updated files

- `apps/web/src/app/jarvis/JarvisAgentClient.tsx`

## Live route

- `GET /api/jarvis/public-repos/health`

## Gateways probed

- N21.2 Docling Smart Intake
- N21.3 Playwright Scout Gateway
- N21.4 Jarvis Voice Gateway
- N21.5 Jarvis Trace Evidence Gateway
- N21.6 Jarvis Security Scan Gate

## Safety doctrine

The health probe performs GET status checks only.

It does not:

- send POST requests
- run browser automation
- trigger document extraction
- trigger voice command execution
- run native scanner binaries
- mutate data
- submit applications
- handle payments
- approve or reject anything
- bypass policy gates

## Output

Each gateway receives:

- `green` when the route returns 2xx
- `yellow` when the route responds but needs review
- `red` when the route fails or cannot be reached

Each item includes route, adapter ID, HTTP status, latency, checked timestamp, and safe-probe evidence flags.

## Commander HUD update

The existing `/jarvis` HUD now includes:

- a `Health Probe` command card
- health summary beside the integration HUD count
- per-gateway green/yellow/red status
- HTTP status and latency display

## Validation command

```powershell
cd C:\Kingsmen\kingsmen-platform
git pull --ff-only
node .\scripts\validators\validate-n21-jarvis-public-gateway-health.mjs
```

Expected result:

```json
"passed": true
```

## Local API test

With `npm run dev` running:

```powershell
Invoke-RestMethod "http://127.0.0.1:3000/api/jarvis/public-repos/health"
```

## Honest limitation

This health probe checks only local GET/status route responsiveness. It does not prove that external binaries such as Docling, native Playwright browsers, openWakeWord, whisper.cpp, Piper, gitleaks, trivy, semgrep, or Langfuse export are installed or enabled.

## Next build

N21.9 should add a local installation readiness checker that reports which optional native tools are installed on the founder machine without installing or changing them automatically.
