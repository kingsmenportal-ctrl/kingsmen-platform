# Jarvis PayFast Provider Proof Queue Boundary

## Purpose

This boundary keeps PayFast inside the Kingsmen payment doctrine while Jarvis exposes a safe readiness surface.

Jarvis may show PayFast sandbox readiness, but it may not mark a candidate as paid, approve refunds, call PayFast directly from the browser, or expose provider credentials.

## Route

`/api/jarvis/payfast-provider-proof-queue-boundary`

## Command envelope

`PAYFAST_PROVIDER_PROOF_QUEUE_CHECK`

Backend action:

`payfast_provider_proof_queue_check`

## Non-negotiable doctrine

- PayFast remains sandbox until production launch approval.
- Accepted ITN is required before any paid status can be recorded.
- Return URL cannot mark paid.
- Cancel URL cannot mark paid.
- Refunds require human review.
- PostgreSQL Truth Vault remains the payment authority.
- Browser may not call PayFast directly.
- No raw PayFast credentials may be returned or printed.
- Payment evidence must be written through backend command envelopes.

## Required environment outside Git

- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- `PAYFAST_NOTIFY_URL`
- `PAYMENT_PROVIDER_SECRET`
- `PAYFAST_ENVIRONMENT=sandbox`

## Required runtime evidence before live payments

- sandbox merchant configured proof
- sandbox checkout created proof
- accepted ITN evidence proof
- signature verification proof
- amount verification proof
- duplicate ITN rejection proof
- failed payment rejection proof
- return/cancel cannot mark paid proof
- refund human review proof
- founder payment approval proof

## Forbidden behaviour

- no fake status
- no raw secrets
- no provider credentials printed
- no direct provider calls from web
- no paid status from return URL
- no paid status from cancel URL
- no auto refund approval
- backend command envelope required

## Runtime proof

Run after backend and web runtime are available:

```powershell
npm run jarvis:runtime:payfast-provider-proof-queue
```

Source-only validation:

```powershell
npm run jarvis:validate:payfast-provider-proof-queue
```
