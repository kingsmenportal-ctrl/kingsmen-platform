# Jarvis WhatsApp Urgent SMS Backup Boundary

## Purpose

This boundary adds a source-safe Jarvis surface for the Kingsmen communications doctrine:

- Email remains primary channel.
- WhatsApp urgent only.
- WhatsApp bulk is not allowed.
- SMS backup only.
- PostgreSQL Truth Vault remains the evidence authority.

## Route

`/api/jarvis/whatsapp-urgent-sms-backup-boundary`

The route reports readiness for WhatsApp urgent-only and SMS backup-only provider activation without pretending that either provider is live. It returns redacted status only and does not expose access tokens, API keys, phone IDs, or provider secrets.

## Required environment names

- `KINGSMEN_WHATSAPP_BUSINESS_ACCOUNT_ID` or `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `KINGSMEN_WHATSAPP_PHONE_NUMBER_ID` or `WHATSAPP_PHONE_NUMBER_ID`
- `KINGSMEN_WHATSAPP_ACCESS_TOKEN` or `WHATSAPP_ACCESS_TOKEN`
- `KINGSMEN_SMS_PROVIDER` or `SMS_PROVIDER`
- `KINGSMEN_SMS_API_KEY` or `SMS_API_KEY`

All values must be configured outside Git.

## Runtime boundary

This is a `backend_api_only` boundary. Browser routes may not call WhatsApp, Meta, SMS providers, or any messaging gateway directly.

The proof script sends only a safe `WHATSAPP_URGENT_SMS_BACKUP_CHECK` command envelope through Jarvis command routing. It does not send WhatsApp messages, does not send SMS messages, and does not run bulk messaging.

## Safety rules

- no fake status
- no raw secrets
- no provider credentials printed
- no direct provider calls from web
- backend command envelope required
- Email remains primary channel
- WhatsApp urgent only
- WhatsApp bulk is not allowed
- SMS backup only
- PostgreSQL remains truth

## Runtime evidence required before activation

A future runtime proof must show:

1. backend command envelope accepted;
2. Truth Vault communication evidence ledger entry created;
3. urgent-only classification enforced;
4. no bulk WhatsApp path enabled;
5. SMS used only as backup;
6. provider response redacted;
7. failed send and retry behaviour captured;
8. candidate notification evidence is visible without exposing secrets.

Until then, this boundary remains source-ready or deferred, not production-ready.
