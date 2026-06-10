# N14 â€” Integrations / Workflow Connector Runtime

Status: Built and validation-ready.

Backend remains the controller and PostgreSQL remains the truth.

N14 creates:
- integration connectors
- workflow connector registry
- integration outbox
- integration inbox
- workflow result events
- webhook security events
- n8n workflow dispatches
- Airtable mirror events
- Playwright probe events
- integration DLQ
- integration health snapshots
- non-secret runtime example
- integrations API module
- integration UI panels
- N14 validator
- N14 DB migration runner

Locked doctrine:
- n8n is stateless thin worker only.
- every workflow follows the eight-node contract.
- every workflow may perform one Airtable mirror write.
- every workflow must POST exactly one backend result to `/workflow/result`.
- Airtable is mirror only and cannot override PostgreSQL truth.
- Playwright is scout/probe only and routes CAPTCHA, OTP, portal down, blocked, manual-only cases to MAP/manual fallback.
- PayFast provides payment evidence and cannot decide refunds.
- Email is primary.
- WhatsApp is urgent-only.
- Webhooks must be verified or blocked.
- Connector failures go to retry or DLQ with cause, reason, fix path, and evidence.
- No secret values may be committed.

Workflow coverage:
W00, W01, W02, W03, W04, W05, W06, W07, W08, W09, W10, W11, W12, W13, W14, W15, W16, W17, W24.

Special route:
W24 -> W17 -> worker -> /workflow/result.

Optional DB apply:
powershell -ExecutionPolicy Bypass -File C:\Kingsmen\kingsmen-platform\scripts\db\Run-N14Migration.ps1

Next:
N15 - Opportunity Engine / External Source Intelligence.