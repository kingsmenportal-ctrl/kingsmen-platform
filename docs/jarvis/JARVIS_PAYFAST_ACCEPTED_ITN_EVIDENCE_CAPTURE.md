# Jarvis PayFast Accepted ITN Evidence Capture

## Status

Capture runner source is ready. Real evidence is not accepted until the runner passes against backend runtime and accepted redacted PayFast evidence files.

## Runner

```powershell
node scripts\proof\capture-jarvis-payfast-accepted-itn-evidence.mjs
```

## Output report

```text
reports/jarvis/jarvis-payfast-accepted-itn-evidence-capture-latest.json
```

## Required environment variables

The runner checks only credential presence by name and never prints values:

- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- `PAYFAST_NOTIFY_URL`
- `PAYMENT_PROVIDER_SECRET`

## Required evidence file inputs

The runner requires these file paths:

- `JARVIS_PAYFAST_SANDBOX_CHECKOUT_EVIDENCE_FILE`
- `JARVIS_PAYFAST_ACCEPTED_ITN_EVIDENCE_FILE`
- `JARVIS_PAYFAST_REJECTION_EVIDENCE_FILE`
- `JARVIS_PAYFAST_REFUND_APPROVAL_EVIDENCE_FILE`

## Accepted evidence schemas

- `kingsmen.jarvis-payfast-sandbox-checkout-evidence.v1`
- `kingsmen.jarvis-payfast-accepted-itn-evidence.v1`
- `kingsmen.jarvis-payfast-rejection-evidence.v1`
- `kingsmen.jarvis-payfast-refund-founder-approval-evidence.v1`

## Non-negotiable payment rules

- Return URL cannot mark paid.
- Cancel URL cannot mark paid.
- Manual notes cannot mark paid.
- Unverified ITN cannot mark paid.
- Mismatched amount/reference cannot mark paid.
- Duplicate ITN cannot double-credit.
- Failed, pending, or cancelled payment cannot clear a candidate finance task.
- Truth Vault finance state remains authority.
- Email remains the primary evidence channel.

## Validation

```powershell
node scripts\validators\validate-jarvis-payfast-accepted-itn-evidence-capture.mjs
```

Expected source validation status:

```text
JARVIS_PAYFAST_ACCEPTED_ITN_EVIDENCE_CAPTURE_SOURCE_VALIDATED
```

The runner may still return `payfastEvidenceAccepted: false` until real accepted evidence files are supplied.
