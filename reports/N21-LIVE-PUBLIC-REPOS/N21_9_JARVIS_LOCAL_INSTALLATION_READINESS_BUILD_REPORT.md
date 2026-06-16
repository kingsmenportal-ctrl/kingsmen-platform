# N21.9 — Jarvis Local Installation Readiness Checker

Branch: `n21-live-public-repo-adapters`

## Purpose

N21.9 adds a local readiness readout for optional native/public-repo runtimes used by the N21 gateway stack. It answers one question only:

> Which optional tools are actually present on this local machine right now?

It does not install, update, repair, mutate, commit, push, or block deployment.

## Built

- `apps/web/src/lib/jarvis/public-integrations/JarvisLocalInstallationReadiness.ts`
- `apps/web/src/app/api/jarvis/public-repos/local-readiness/route.ts`
- `apps/web/src/lib/jarvis/public-integrations/JarvisLocalInstallationReadiness.api-example.json`
- `scripts/validators/validate-n21-jarvis-local-installation-readiness.mjs`

## Updated

- `apps/web/src/app/jarvis/JarvisAgentClient.tsx`

## Live Route

```text
GET /api/jarvis/public-repos/local-readiness
```

## Covered Local Runtime Checks

- Docling Runtime
- Playwright Browser Runtime
- openWakeWord Runtime
- whisper.cpp Runtime
- Piper Runtime
- gitleaks Runtime
- Trivy Runtime
- Semgrep Runtime

## Safety Boundary

- Allowlisted checks only
- No install commands
- No mutation commands
- No file scanning
- No private environment value output
- No deployment block
- No automatic fix

## Jarvis HUD Surface

The existing `/jarvis` Commander screen now includes:

- `Install Readiness` command card
- `Check Installs` button inside the N21 Public Integration HUD
- installed/missing/unknown summary
- per-gateway local runtime status chips
- right-side Local Installation Readiness panel

## Validation

Run from repo root:

```powershell
node .\scripts\validators\validate-n21-jarvis-local-installation-readiness.mjs
```

Expected:

```json
"passed": true
```

## Local API Test

With Next.js running:

```powershell
Invoke-RestMethod "http://127.0.0.1:3000/api/jarvis/public-repos/local-readiness"
```

## Not Done

N21.9 does not install Docling, Playwright browsers, openWakeWord, whisper.cpp, Piper, gitleaks, trivy, or semgrep. Installation must be handled later under explicit Commander approval and security policy.
