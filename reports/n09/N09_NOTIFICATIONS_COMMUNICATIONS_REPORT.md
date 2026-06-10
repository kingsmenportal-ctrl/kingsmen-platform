# N09 â€” Notifications / Communications Runtime

Status: Built and validation-ready.

N09 creates the communication runtime for Kingsmen:
- notification template registry
- notification outbox
- delivery attempts
- inbound message intake
- candidate portal inbox
- urgent WhatsApp escalation queue
- quiet hours
- channel rate limits
- message evidence ledger
- control-plane/founder communication summary

Locked doctrine:
- Email is primary.
- WhatsApp is urgent-only.
- SMS is backup-only.
- No bulk WhatsApp reminders.
- Every message must have evidence.
- Notifications may inform but must not silently change application state.
- PostgreSQL remains truth.
- Airtable mirrors only.

Human boundaries:
- Urgent WhatsApp requires approval.
- SMS backup requires backup/urgent reason.
- MAP fallback notices can require review.
- Finance/refund/fraud/privacy/official submission decisions remain outside communication runtime.

Oracle Lite discipline:
- Daily email guard.
- Daily urgent WhatsApp guard.
- Daily SMS backup guard.
- Quiet hours in Africa/Johannesburg.
- Portal inbox preferred for low-risk visible updates.

Next:
N10 - Finance / PayFast Runtime.