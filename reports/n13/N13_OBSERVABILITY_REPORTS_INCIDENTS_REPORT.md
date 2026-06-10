# N13 â€” Observability / Reports / Incident Runtime

Status: Built and validation-ready.

N13 gives Kingsmen founder-grade visibility into what is happening, why it is happening, what must be fixed, and what evidence supports the status.

Created:
- observability runtime manifest
- observability SQL migration
- runtime config seeds
- non-secret observability runtime example
- health status engine
- incident runtime
- founder report builder
- Oracle Lite capacity monitor
- workflow observer
- alert router
- report delivery boundary
- observability read model
- dashboard UI panels
- N13 validator
- N13 DB migration runner

Core doctrine:
- No false green health status.
- Founder reports must show cause, reason, fix path, and evidence.
- Email remains primary.
- WhatsApp is urgent-only for SEV1/SEV2 incident escalation.
- Candidate privacy must be protected in reports.
- Incident closure requires cause, reason, fix path, and evidence.
- Active-candidate cap starts at 500.
- Growth readiness depends on outcome quality, system health, and operational evidence.

Operational reports covered:
- morning founder report
- midday founder report
- evening founder report
- incident report
- finance report
- document pipeline report
- matching report
- dispatch report
- Playwright report
- manual fallback report
- portal health report
- risk report
- system health report
- backup report
- capacity report
- weekly report
- monthly report

Optional DB apply:
powershell -ExecutionPolicy Bypass -File C:\Kingsmen\kingsmen-platform\scripts\db\Run-N13Migration.ps1

Next:
N14 - Integrations / Workflow Connector Runtime.