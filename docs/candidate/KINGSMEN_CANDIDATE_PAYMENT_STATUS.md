# Kingsmen Candidate Payment Status

Production ready: **false**  
Status: candidate-visible payment status surface is source-built; live backend fetch and deployed runtime proof are still required.

## Purpose

Candidates must be able to see whether their Kingsmen package is pending, paid, or active without Kingsmen falsely opening service access from a browser return page.

## Candidate route

```text
/candidate/payment-status
```

## Candidate-visible statuses

```text
pending  - Kingsmen is waiting for verified PayFast ITN evidence.
paid     - PayFast evidence has been accepted and entitlement activation is in progress.
active   - A Kingsmen service entitlement has opened from verified finance truth.
blocked  - PayFast evidence failed validation and no package was opened.
```

## Locked safety rules

- Browser return cannot activate a Kingsmen package.
- Browser cancel cannot activate a Kingsmen package.
- Candidate access opens only after accepted PayFast ITN evidence is persisted.
- The candidate must see the merchant reference, package name, entitlement reference, and evidence reference when available.
- The UI must not show raw PayFast credentials.

## Source files

```text
apps/web/src/finance/CandidatePaymentStatusPanel.tsx
apps/web/src/app/candidate/payment-status/page.tsx
scripts/validators/validate-candidate-payment-status.mjs
```

## Next runtime wiring

1. Fetch `/api/payments/payfast/status/:merchantReference` from the backend.
2. Map backend finance status to `pending`, `paid`, `active`, or `blocked`.
3. Show the active entitlement limits from `finance_service_entitlements`.
4. Add authenticated candidate filtering so a candidate only sees their own payment status.
5. Capture staging proof with pending, cancelled, rejected, paid, and active states.
