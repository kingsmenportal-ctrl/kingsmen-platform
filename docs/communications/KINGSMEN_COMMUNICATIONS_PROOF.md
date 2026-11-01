# Kingsmen Communications Proof

Status: **email/portal policy implemented; email-provider staging proof pending**.

Production ready: **false**.  
Public launch allowed: **false**.  
Live messages sent by this proof: **false**.

## Current channel policy

1. **Email** is the only enabled external candidate communication channel.
2. **Secure portal inbox** carries in-account messages, status history and document/support communication.
3. **WhatsApp is disabled** for routine, urgent, ceremonial and bulk purposes.
4. **SMS is disabled** for backup, urgent, routine and bulk purposes.
5. A candidate must not be required to provide WhatsApp or SMS consent to register or use the portal.
6. Marketing still requires explicit consent, lawful purpose, opt-out handling and approved campaign rules.
7. Bulk candidate messaging remains denied.
8. Provider secrets, recipient addresses and raw message bodies must never be printed in reports.

## Source proof

Run:

    npm run communications:prove
    npm run communications:validate

The proof writes:

    reports/communications/communications-proof-latest.json
    reports/communications/communications-validation-latest.json

The source proof checks:

    transactional_email_queued_primary
    marketing_email_without_consent_denied
    bulk_message_denied
    whatsapp_any_purpose_denied
    sms_any_purpose_denied
    portal_message_allowed
    provider_send_requires_staging_proof
    recipient_data_redacted
    live_send_never_executed_by_source_proof

## Required staging proof before candidate notifications

Before real candidates receive email notifications, capture approved provider sandbox send/receive evidence, bounce handling, unsubscribe/opt-out tests, idempotent retries, dead-letter handling and a redacted report without recipient addresses or raw message bodies.

## Non-negotiables

- Do not send or queue WhatsApp messages.
- Do not send or queue SMS messages.
- Do not solicit WhatsApp/SMS channel consent while those channels are disabled.
- No bulk candidate messages from public routes.
- No live send from source proof.
- No provider secret in logs, reports, screenshots or frontend code.
- No raw candidate recipient data in proof reports.
