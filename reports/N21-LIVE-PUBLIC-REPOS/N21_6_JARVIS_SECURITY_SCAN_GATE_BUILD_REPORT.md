# N21.6 Build Report — Jarvis Security Scan Gate

Branch: `n21-live-public-repo-adapters`

Status: committed.

## Purpose

N21.6 adds a Jarvis-controlled security scan gate for the public security-tool stack. It is detection/report-only and does not perform destructive actions.

## Built files

- `apps/web/src/lib/public-repos/live/adapters/SecurityScanGate.contract.ts`
- `apps/web/src/lib/jarvis/security/JarvisSecurityScanGate.ts`
- `apps/web/src/app/api/jarvis/security/scan/route.ts`
- `apps/web/src/lib/jarvis/security/JarvisSecurityScanGate.api-example.json`
- `scripts/validators/validate-n21-jarvis-security-scan-gate.mjs`

## Runtime files updated

- `apps/web/src/lib/jarvis/runtime/types.ts`
- `apps/web/src/lib/jarvis/runtime/intent-router.ts`
- `apps/web/src/lib/jarvis/runtime/command-registry.ts`
- `apps/web/src/lib/jarvis/runtime/adapter-selector.ts`

## Public repo references

- `gitleaks/gitleaks`
- `aquasecurity/trivy`
- `semgrep/semgrep`

## Safety boundaries

- Detection/report only.
- No automatic fix.
- No automatic commit or push.
- No deployment block without policy decision.
- No private-value echoing in the gateway response.
- PostgreSQL evidence ledger remains Kingsmen authority.

## Live route

- `GET /api/jarvis/security/scan`
- `POST /api/jarvis/security/scan`

Required POST fields:

- `source`
- `actor`
- `scope`

Optional POST fields:

- `tools`
- `scanText`
- `changedFiles`
- `commandId`
- `approvalToken`

## Local validation

```powershell
cd C:\Kingsmen\kingsmen-platform
git pull --ff-only
node .\scripts\validators\validate-n21-jarvis-security-scan-gate.mjs
```

## Local API test

```powershell
Invoke-RestMethod "http://127.0.0.1:3000/api/jarvis/security/scan"
```

## Next

N21.7 should connect these public-repo gateways into the Jarvis HUD so Commander can see Docling, Playwright, Voice, Trace, and Security status in one board.
