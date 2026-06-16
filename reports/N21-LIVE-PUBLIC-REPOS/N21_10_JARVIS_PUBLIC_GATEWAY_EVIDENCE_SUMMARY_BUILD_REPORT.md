# N21.10 — Jarvis Public Gateway Evidence Summary

## Status

Built on branch: `n21-live-public-repo-adapters`

N21.10 adds one compact read-only evidence summary for the N21 public-repo gateway chain.

## Files added

- `apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayEvidenceSummary.ts`
- `apps/web/src/app/api/jarvis/public-repos/evidence-summary/route.ts`
- `apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayEvidenceSummary.api-example.json`
- `scripts/validators/validate-n21-jarvis-public-gateway-evidence-summary.mjs`
- `reports/N21-LIVE-PUBLIC-REPOS/N21_10_JARVIS_PUBLIC_GATEWAY_EVIDENCE_SUMMARY_BUILD_REPORT.md`

## Live route

`GET /api/jarvis/public-repos/evidence-summary`

Optional query:

`timeoutMs=2500`

## Source feeds reused

- N21.7 Public Integration HUD
- N21.8 Public Gateway Health Probe
- N21.9 Local Installation Readiness Checker

The summary does not create a new registry. It reads the existing gateway definitions and combines them with current local route health and optional runtime readiness.

## Evidence states

- `ready`: live-ready route, green route health, and required local runtime checks installed or not applicable.
- `review`: route is live but local runtime is missing/unknown, route is yellow, or readiness is contract-only.
- `blocked`: route health is red.

## Safety boundary

The evidence summary is read-only. It does not execute POST actions, browser missions, document extraction, voice commands, scans, installs, fixes, commits, pushes, or deployment blocks.

Kingsmen backend, PostgreSQL Truth Vault, and evidence ledger remain authority.

## Local validation

```powershell
cd C:\Kingsmen\kingsmen-platform
git pull --ff-only
node .\scripts\validators\validate-n21-jarvis-public-gateway-evidence-summary.mjs
```

Expected:

```json
"passed": true
```

## Local API test

With `npm run dev` running:

```powershell
Invoke-RestMethod "http://127.0.0.1:3000/api/jarvis/public-repos/evidence-summary"
```

## Did not do

- Did not install Docling, Playwright browsers, openWakeWord, whisper.cpp, Piper, gitleaks, trivy, or semgrep.
- Did not run scanners.
- Did not mutate local files from the route.
- Did not wire a new dashboard layer.
- Did not make the summary an authority over PostgreSQL evidence.
