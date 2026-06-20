# Jarvis Email Primary Channel Boundary

Jarvis treats Email as the primary tracked communication channel for Kingsmen. WhatsApp remains urgent-only and SMS remains backup only. This boundary is source-safe and does not mark email runtime live until real provider evidence exists.

## Route

`/api/jarvis/email-primary-channel-boundary`

The route reports readiness for:

- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `EMAIL_FROM`
- `KINGSMEN_SMTP_HOST`
- `KINGSMEN_SMTP_USER`
- `KINGSMEN_SMTP_PASSWORD`
- `KINGSMEN_EMAIL_FROM`

The route uses the Kingsmen backend boundary and reports `backend_api_only`. It never sends email from the web route.

## Doctrine

- no fake status
- no raw secrets
- no provider credentials printed
- no direct provider calls from web
- no local shell execution from web
- no direct database access from web
- backend command envelope required
- Email remains primary channel
- WhatsApp urgent only
- SMS backup only

## Runtime proof

`Invoke-KingsmenJarvisEmailPrimaryChannelBoundaryProof.ps1` checks that credentials are present in local environment files without printing values. It then checks the backend boundary, the route, and the `EMAIL_PRIMARY_CHANNEL_CHECK` command envelope.

The proof intentionally keeps `passed` false until a real provider staging sequence exists for:

1. send proof,
2. receive proof,
3. bounce proof,
4. opt-out proof,
5. evidence-ledger capture.

## Launch rule

Email cannot be marked live merely because SMTP credentials exist. Runtime live status requires redacted provider evidence and Truth Vault evidence capture.
