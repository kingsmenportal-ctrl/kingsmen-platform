# Kingsmen PayFast Live Runtime Gate

Production ready: **false**  
Public payment launch: **blocked until provider verification and runtime proof**

## Purpose

This file defines the real-world PayFast activation gate for Kingsmen. It exists so Kingsmen can build the payment system accurately without pretending that PayFast is live before PayFast account verification, runtime configuration, sandbox ITN proof, and founder approval are complete.

## Non-negotiable payment rule

A PayFast return URL is not proof of payment. A PayFast cancel URL is not proof of payment. A Kingsmen package may only become paid or active after an accepted ITN has been verified, recorded, and linked to the correct order, amount, provider source, status, and idempotency key.

## Required runtime values

The following values must be configured outside Git, in runtime environment settings, platform secrets, or a future vault:

```text
PAYFAST_ENVIRONMENT=sandbox or live
PAYFAST_MERCHANT_ID=runtime only
PAYFAST_MERCHANT_KEY=runtime only
PAYFAST_PASSPHRASE=runtime only if configured in PayFast
PAYFAST_NOTIFY_URL=https://<backend>/api/payments/payfast/itn
PAYFAST_RETURN_URL=https://<web>/payments/return
PAYFAST_CANCEL_URL=https://<web>/payments/cancel
PAYMENT_PROVIDER_SECRET=runtime only
```

Live activation also requires these status flags, set outside Git only after real evidence exists:

```text
PAYFAST_ACCOUNT_VERIFIED=true
PAYFAST_SANDBOX_ITN_PROOF_REVIEWED=true
PAYFAST_FOUNDER_PAYMENT_APPROVAL=true
```

## What Kingsmen must prove before live payments

1. PayFast account verification is complete in the PayFast dashboard.
2. Merchant credentials are configured outside Git.
3. Notify URL points to the Kingsmen backend ITN endpoint.
4. Return and cancel URLs point to the Kingsmen web payment status pages.
5. Sandbox checkout succeeds.
6. Cancel flow does not mark the order as paid.
7. Return flow shows pending until ITN is accepted.
8. COMPLETE ITN is accepted only after signature, amount, source, status, and idempotency checks pass.
9. FAILED ITN is rejected.
10. Duplicate or replay ITN is rejected.
11. Amount mismatch is rejected.
12. Invalid signature is rejected.
13. Evidence reports are redacted.
14. Founder payment approval is recorded.

## Commands

Validate the source-level live gate:

```bash
npm run payments:validate:runtime-gate
```

Run the sandbox payment proof:

```bash
npm run payments:prove:sandbox
npm run payments:validate:sandbox
```

Run the final launch gate:

```bash
npm run kingsmen:launch:gate
```

## Current status

The source-level gate is built, but live payments stay blocked until real PayFast verification and runtime evidence pass. This is intentional. It protects Kingsmen from false payment activation, double-charging, fake paid status, and unsafe launch claims.
