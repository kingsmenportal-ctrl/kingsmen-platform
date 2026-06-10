# N16 â€” Orchestrator / Execution Runtime

Status: Built and validation-ready.

N16 binds the previously created Kingsmen modules into one backend-controlled execution system.

Core law:
Backend controls state. Workers execute. n8n remains thin. Worker results return to the backend before any state transition is accepted.

Created:
- orchestrator runtime config
- worker registry for all 19 Kingsmen workflows
- state transition guards
- execution plans
- orchestrator runs
- orchestrator steps
- dispatch queue
- idempotency claims
- worker result ingestion
- manual handoffs
- execution event trace
- Oracle Lite capacity lanes
- runtime example
- API orchestrator runtime
- UI panels
- DB migration runner
- N16 validator

19 workflows registered:
W00, W01, W02, W03, W04, W05, W06, W07, W08, W09, W10, W11, W12, W13, W14, W15, W16, W17, W24.

Same-state workers:
W00, W04, W05, W08, W09, W13, W14, W15, W16, W17, W24.

Execution discipline:
- W24 routes through W17.
- W05 Playwright is scout/probe only.
- Blocked, CAPTCHA, OTP, down, or manual-only portals create MAP handoff.
- Human approval is required for official submissions, refunds, fraud, privacy, official-status, and hard-blocker decisions.
- Priority lanes affect execution order and intensity only, not user dignity or sector access.
- Failed execution must include reason, evidence, and fix path.
- Retry storms are blocked by capped attempts and visible execution events.

Optional DB apply:
powershell -ExecutionPolicy Bypass -File C:\Kingsmen\kingsmen-platform\scripts\db\Run-N16Migration.ps1

Next:
N17 - Founder Control Plane / Command Ops Runtime.