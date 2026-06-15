# N21.5 Build Report — Jarvis Trace / Evidence Gateway

Branch: `n21-live-public-repo-adapters`  
Status: committed  
Public repo reference: `langfuse/langfuse`  
Kingsmen adapter: `LangfuseTraceGateway`

## Purpose

N21.5 adds a privacy-safe trace/evidence gateway for Jarvis, public-repo adapters, document extraction, voice sessions, and Playwright scout events.

It does not make Langfuse the Kingsmen evidence authority. PostgreSQL evidence remains the authority.

## Built files

1. `apps/web/src/lib/public-repos/live/adapters/LangfuseTraceGateway.contract.ts`
2. `apps/web/src/lib/jarvis/trace/JarvisTraceEvidenceGateway.ts`
3. `apps/web/src/app/api/jarvis/trace/evidence/route.ts`
4. `apps/web/src/lib/jarvis/trace/JarvisTraceEvidenceGateway.api-example.json`
5. `scripts/validators/validate-n21-jarvis-trace-evidence.mjs`
6. `reports/N21-LIVE-PUBLIC-REPOS/N21_5_JARVIS_TRACE_EVIDENCE_BUILD_REPORT.md`

## Updated files

1. `apps/web/src/lib/public-repos/live/adapters/index.ts`
2. `apps/web/src/lib/jarvis/runtime/types.ts`
3. `apps/web/src/lib/jarvis/runtime/intent-router.ts`
4. `apps/web/src/lib/jarvis/runtime/command-registry.ts`
5. `apps/web/src/lib/jarvis/runtime/adapter-selector.ts`

## Live route

```text
GET  /api/jarvis/trace/evidence
POST /api/jarvis/trace/evidence
```

Required POST fields:

```text
source
actor
eventName
```

Optional POST fields:

```text
evidenceId
candidateId
commandId
intentId
adapterId
input
output
metadata
```

## Safety boundaries

The gateway is redaction-first and metadata-only.

It does not export to Langfuse yet. The response always keeps:

```text
exportedToLangfuse: false
postgresEvidenceAuthority: true
redacted: true
```

Blocked by doctrine:

- raw sensitive documents in traces
- raw candidate identity values in traces
- raw payment values in traces
- raw audio recordings in traces
- secret values in traces
- external trace export without production approval

## Runtime registration

Jarvis runtime now recognizes:

```text
intent: jarvis_trace_evidence
command: JARVIS_TRACE_EVIDENCE
adapter: langfuse_trace_gateway_adapter
```

The command is review/approval gated and evidence-required.

## Local validation

Run from repo root:

```powershell
node scripts/validators/validate-n21-jarvis-trace-evidence.mjs
```

## Example local API test

```powershell
Invoke-RestMethod -Method POST `
  -Uri http://127.0.0.1:3000/api/jarvis/trace/evidence `
  -ContentType 'application/json' `
  -Body '{"source":"jarvis_kernel","actor":"commander","eventName":"jarvis_command_routed","input":"Show me the public repo board","output":"Board prepared"}'
```

## Not done yet

- Real Langfuse server/client connection is not installed or enabled.
- PostgreSQL evidence table write is not attached in this step.
- Production trace export approval is not enabled.

## Next build

N21.6 — Security Scan Gate using `gitleaks`, `trivy`, and `semgrep` contracts.
