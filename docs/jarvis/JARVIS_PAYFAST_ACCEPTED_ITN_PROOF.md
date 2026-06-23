# Jarvis PayFast Accepted ITN Proof Gate

## Status

Source gate built. Provider/payment evidence not accepted. Production remains blocked.

## Purpose

This gate prevents Kingsmen from treating payment redirects, screenshots, or manual notes as paid status. Only accepted PayFast ITN evidence may clear a payment state.

## Required proof

PayFast can pass only after all of the following exist as redacted evidence:

1. Credentials are configured outside Git and never returned by web/API responses.
2. Sandbox checkout is backend-created and tied to a Truth Vault finance/order record.
3. Accepted PayFast ITN proof verifies status, amount, merchant reference, and signature/validation.
4. Duplicate ITN proof shows idempotency and no double credit.
5. Failed, cancelled, pending, or mismatched payment proof shows the order remains unpaid or review-only.
6. Refund review boundary and founder approval are captured.

## Rejection rules

The gate rejects:

- Return URL as payment proof.
- Cancel URL as payment proof.
- Screenshots without accepted ITN evidence.
- Manual paid notes without Truth Vault finance evidence.
- Duplicate ITN double-credit.
- Failed/pending/cancelled payments being marked paid.
- Refund or correction without review and founder approval.

## Validation

Run:

```powershell
node scripts\validators\validate-jarvis-payfast-accepted-itn-proof.mjs
npm --prefix apps/web run build
```

Expected status:

```text
JARVIS_PAYFAST_ACCEPTED_ITN_PROOF_GATE_VALIDATED
passed: true
productionReady: false
publicLaunchAllowed: false
```
