# Kingsmen Candidate Payment Status

Production ready: **false**  
Status: candidate-visible payment status surface and backend status lookup mapping are source-built; deployed runtime proof is still required.

## Purpose

Candidates must be able to see whether their Kingsmen package is pending, paid, active, or blocked without Kingsmen falsely opening service access from a browser return page.

## Candidate route

```text
/candidate/payment-status?merchantReference=<PayFast merchant reference>
```

Accepted aliases while wiring PayFast return/status flows:

```text
/candidate/payment-status?m_payment_id=<PayFast merchant reference>
/candidate/payment-status?ref=<PayFast merchant reference>
```

## Backend status route

```text
GET /api/payments/payfast/status/:merchantReference
```

The web page reads this backend route through `fetchCandidatePaymentStatus`. It does not mutate payment state from the browser.

## Candidate-visible statuses

```text
pending  - Kingsmen is waiting for verified PayFast ITN evidence.
paid     - PayFast evidence has been accepted and entitlement processing is in progress.
active   - A Kingsmen service entitlement has opened from verified finance truth.
blocked  - PayFast evidence failed validation and no package was opened.
```

## Locked safety rules

- Browser return cannot open a Kingsmen package.
- Browser cancel cannot open a Kingsmen package.
- Candidate access opens only after accepted PayFast ITN evidence is persisted.
- The candidate must see the merchant reference, package name, entitlement reference, and evidence reference when available.
- The UI must not show raw PayFast credentials.
- Active status requires `entitlementStatus=ACTIVE` from the backend read model.

## Source files

```text
apps/web/src/finance/CandidatePaymentStatusPanel.tsx
apps/web/src/finance/payment-status-api.ts
apps/web/src/app/candidate/payment-status/page.tsx
scripts/validators/validate-candidate-payment-status.mjs
```

## Remaining runtime proof

1. Configure `KINGSMEN_API_BASE_URL` or `NEXT_PUBLIC_KINGSMEN_API_BASE_URL` outside source.
2. Apply finance migrations in staging.
3. Run pending, cancelled, rejected, paid, and active status proof.
4. Add authenticated candidate filtering so a candidate only sees their own payment status.
5. Capture screenshots and redacted evidence for final launch gate.
