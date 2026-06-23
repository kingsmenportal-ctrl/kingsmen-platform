# Jarvis AI + Email Provider Live Evidence Capture

## Status

Source-ready capture runner. Not production-ready. Not public-launch-ready.

## Purpose

This runner captures redacted evidence for the AI provider and Email primary channel proof gates.

It does not call providers from browser code. It does not print provider secrets. It does not mark Jarvis live unless accepted redacted evidence files are present and valid.

## Runner

```powershell
node scripts\proof\capture-jarvis-ai-email-provider-live-evidence.mjs
```

## Inputs

The runner checks credential readiness by name only. Secret values are not returned.

AI environment names:

- `KINGSMEN_AI_PROVIDER`
- `KINGSMEN_AI_MODEL`
- one of `OPENAI_API_KEY`, `KINGSMEN_AI_PROVIDER_API_KEY`, or `AI_PROVIDER_API_KEY`

Email environment names:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `EMAIL_FROM`

Evidence file inputs:

- `JARVIS_AI_LIVE_EVIDENCE_FILE`
- `JARVIS_EMAIL_LIVE_EVIDENCE_FILE`

Expected evidence schemas:

- `kingsmen.jarvis-ai-live-call-evidence.v1`
- `kingsmen.jarvis-email-primary-channel-evidence.v1`

## Output

The runner writes:

```text
reports/jarvis/jarvis-ai-email-provider-live-evidence-capture-latest.json
```

## Acceptance boundary

AI evidence must prove:

- backend-controlled AI only
- live call accepted
- policy gate applied
- cost/rate boundary recorded
- redacted output
- no raw secrets returned

Email evidence must prove:

- email primary channel accepted
- test send accepted
- delivery or receive evidence captured
- bounce or failed-send handling captured
- opt-out rule captured
- message evidence ledger captured
- redacted output
- no raw secrets returned

## Validation

```powershell
node scripts\validators\validate-jarvis-ai-email-provider-live-evidence-capture.mjs
```

Expected source validation status:

```text
JARVIS_AI_EMAIL_PROVIDER_LIVE_EVIDENCE_CAPTURE_VALIDATED
```

This validation does not make Jarvis production-ready. It only proves the capture runner and proof wiring exist.
