# Kingsmen Communications Proof

Status: **foundation built, provider staging proof pending**.

Production ready: **false**.
Public launch allowed: **false**.
Live messages sent by this proof: **false**.

## Doctrine

Kingsmen communications follow this order:

1. **Email is primary** for ordinary candidate notifications, receipts, document requests, status updates, and support trails.
2. **WhatsApp is urgent-only** and must not become the default channel for bulk or casual notifications.
3. **SMS is backup-only** for urgent fallback cases.
4. Marketing requires explicit consent, opt-out handling, and founder-approved campaign rules.
5. Bulk sending is denied by the source proof and requires separate founder approval plus provider staging evidence.
6. Provider secrets, recipient addresses, and raw message bodies must never be printed in reports.

## Source proof

Run:

```bash
npm run communications:prove
npm run communications:validate
```

The proof writes:

```txt
reports/communications/communications-proof-latest.json
reports/communications/communications-validation-latest.json
```

The proof checks:

```txt
transactional_email_queued_primary
marketing_email_without_consent_denied
bulk_message_denied
whatsapp_non_urgent_denied
whatsapp_urgent_queued_only
sms_non_urgent_denied
sms_urgent_backup_only
provider_send_requires_staging_proof
recipient_data_redacted
live_send_never_executed_by_source_proof
```

## Required staging proof before candidate notifications

Before real candidates receive notifications, capture provider evidence for:

```txt
SMTP or provider sandbox send/receive
bounce handling
unsubscribe/opt-out path
WhatsApp urgent-only approval evidence
SMS fallback-only evidence
redacted evidence report with no recipient address or raw message body
```

## Non-negotiables

- No bulk messages from public routes.
- No WhatsApp normal-status spam.
- No SMS normal-status spam.
- No live send from source proof.
- No provider secret in logs, reports, screenshots, or frontend code.
- No raw candidate recipient data in proof reports.
