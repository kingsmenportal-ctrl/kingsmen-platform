# Jarvis AI + Email Provider Live Proof Gate

## Status

Source gate built. Provider evidence not accepted. Production remains blocked.

## Purpose

This gate defines the exact evidence required before Jarvis may claim AI provider readiness and Email primary channel readiness.

## API

`/api/jarvis/ai-email-provider-live-proof`

The API returns provider proof requirements without returning any secret values.

## Founder page

`/founder/launch-control/jarvis-ai-email-provider-proof`

## AI acceptance requirements

- Provider selected outside Git.
- Model selected outside Git.
- Provider key stored outside Git.
- Backend-controlled live call succeeds.
- Policy gate applies before call.
- Cost and rate boundary recorded.
- Redacted request and response evidence captured.

## Email acceptance requirements

- SMTP or provider credentials stored outside Git.
- Test send proof captured.
- Delivery or receive evidence captured.
- Bounce or failed-send handling captured.
- Opt-out rule captured.
- Message evidence ledger captured.
- Redacted output captured.

## Rejection rules

Reject the proof if:

- The browser calls AI or Email providers directly.
- A mock completion is presented as a live AI proof.
- Raw provider, AI, or SMTP secrets are exposed.
- WhatsApp or SMS replaces Email as the primary tracked channel.
- Email proof lacks bounce/failed-send and opt-out boundaries.
- The message evidence ledger is absent.

## Validation

```powershell
node scripts\validators\validate-jarvis-ai-email-provider-live-proof.mjs
npm --prefix apps/web run build
```

Expected validator status:

```text
JARVIS_AI_EMAIL_PROVIDER_LIVE_PROOF_GATE_VALIDATED
passed: true
productionReady: false
publicLaunchAllowed: false
```
