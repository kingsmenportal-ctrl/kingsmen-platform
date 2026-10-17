# N09 — Communications & Candidate Follow-up
Status: implementation batch; production release not approved. Migration 0063 is not automatically applied.

## Scope
- Candidate-specific communication history and open follow-up tasks.
- Reviewer preparation queue linked to N06 applications and N08 outcomes.
- Explicit channel preference/consent snapshot and recipient validation.
- Idempotency key prevents duplicate preparation.
- Append-only attempt audit table and guarded state transitions.
- Email is primary. WhatsApp is urgent-only. SMS is backup/urgent-only. In-app is supported as a portal channel.
- Candidate acknowledgement requires the state to be DELIVERED.
- Delivery requires a provider message ID and a provider delivery event ID. SENT alone never means delivered.

## Honest delivery semantics
PREPARED = saved in Kingsmen outbox; no provider call.
QUEUED/SENDING = worker lifecycle states; no sender is shipped by this batch.
SENT = provider send confirmation is recorded with provider message ID.
DELIVERED = matching provider delivery receipt is recorded with delivery event ID.
ACKNOWLEDGED = candidate explicitly acknowledges a delivered message in the authenticated portal.
FAILED = provider/reviewer failure recorded; this batch does not automatically retry.
Retries are bounded by max_attempts (1–3, default 3); automatic retry requires a separately governed worker and provider integration.

## Event rules
Reviewer may prepare notifications with an application ID and/or outcome ID. The API verifies each relationship belongs to the supplied candidate. The event key should be derived from N06 application status and N08 evidence-backed outcome events by a future transactional event/outbox worker. No notification is silently fabricated by this batch.

## Security and operations
- Candidate history filters every read/write by the authenticated session's candidate ID.
- Reviewer APIs require APPLICATION_REVIEWER or PROVIDER_OPERATOR.
- No channel preferences record means no outbound preparation.
- Service role remains server-only via the existing N05 runtime.
- No provider credentials, webhook signature verification, scheduler, email sender, WhatsApp/SMS sender or live database migration is configured here.
- Provider event action is a reviewer-recorded contract, not a public webhook; before production, replace/augment it with authenticated, signature-verified provider webhooks and idempotent event ingestion.
- Verify migration ordering, run database isolation tests with two real candidate sessions, wire a worker, and run full Next.js build and staging smoke tests before release.
