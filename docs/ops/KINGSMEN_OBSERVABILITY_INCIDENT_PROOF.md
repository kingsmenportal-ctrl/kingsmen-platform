# Kingsmen Observability + Incident Proof

Production ready: **false**  
Public launch allowed: **false**  
Live monitoring connected: **false**  
Live paging configured: **false**

This document defines the source-level observability and incident boundary for Kingsmen. It does not prove that live monitoring is connected. Staging runtime proof is still required before public users.

## Non-negotiable rules

1. API health, database health, worker/queue health, and DLQ health must be observable before public users.
2. Structured logs must include `correlationId`, safe event type, component, severity, and timestamp.
3. Logs must not include raw candidate PII, raw message bodies, provider secrets, token prefixes, private keys, database URLs, or payment secrets.
4. Dead-letter queue entries must be reviewed by founder/operator and never silently discarded.
5. Incident reports must include redacted evidence, timeline, severity, owner, action taken, and follow-up.
6. SEV1/SEV2/SEV3 definitions must exist before public launch.
7. Founder escalation is required for production-risk incidents.
8. Alerts must exist for payment failure, RLS/security denial, backup/restore failure, communications failure, worker failures, and high API error rate.

## Source proof commands

```bash
npm run observability:prove
npm run observability:validate
```

These commands only prove source-level boundaries and write:

```txt
reports/ops/observability-incident-proof-latest.json
reports/ops/observability-incident-validation-latest.json
```

## Staging proof still required

Before public traffic, Kingsmen must capture redacted staging evidence for:

```txt
API health endpoint
Truth Vault database health
queue and DLQ health
structured logs with correlationId
payment failure alert
RLS/security alert
backup/restore alert
communications failure alert
SEV1/SEV2/SEV3 runbook drill
founder escalation path
no PII or secrets in logs proof
```

## Incident severity

| Severity | Meaning | Required action |
|---|---|---|
| SEV1 | Data exposure, payment integrity risk, public outage, unsafe automation, or legal risk | Stop affected flow, escalate founder/operator, preserve evidence, publish internal incident report |
| SEV2 | Candidate-impacting degradation, failed worker pipeline, communications failure, payment mismatch, backup failure | Pause affected capability, investigate, record timeline, close with evidence |
| SEV3 | Non-critical degraded monitoring, delayed queue, validator warning, missing non-launch evidence | Track, repair, and record follow-up |

## Runtime runbook checklist

```txt
1. Confirm incident source and correlationId.
2. Stop unsafe automated writes if needed.
3. Check API health, DB health, queue health, and DLQ.
4. Confirm whether candidate data, payment state, document evidence, or provider secrets are affected.
5. Escalate founder/operator for SEV1 or production-risk event.
6. Record redacted evidence only.
7. Repair, validate, and rerun the relevant proof command.
8. Add follow-up actions to launch readiness before reopening the flow.
```

## What this does not prove

This does not prove live Grafana, Prometheus, Uptime Kuma, Better Stack, PagerDuty, Slack, email alerts, SMS alerts, or provider dashboards are configured. Those are staging/runtime evidence tasks.
