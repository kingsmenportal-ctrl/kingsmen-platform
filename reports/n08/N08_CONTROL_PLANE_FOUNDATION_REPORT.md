# N08 â€” Control Plane Foundation

Status: Built and validation-ready.

Control Plane is not the Data Plane.

N08 creates the founder/operator command side:
- command catalog
- audited command requests
- approval queue
- queue snapshots
- kill switches
- capacity guard
- worker health
- operator audit
- report registry
- control-plane API module
- founder UI panels

Locked boundaries:
- No direct candidate state mutation from UI.
- Backend command bus only.
- Dangerous actions require human approval.
- Every operator action requires audit trail.
- PostgreSQL remains truth.
- Airtable remains mirror only.
- Email primary.
- WhatsApp urgent-only.
- AI may suggest but may not govern money, refunds, official status, submissions, fraud, privacy, or hard blockers.

Oracle Lite guards:
- active_candidates max 500
- daily_application_dispatches max 250
- playwright_concurrency max 3
- email_daily_outbound max 800
- whatsapp_urgent_daily max 25

Next:
N09 - Notifications / Communications Runtime.