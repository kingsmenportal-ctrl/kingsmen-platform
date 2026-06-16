# Kingsmen Payment Proof — PayFast Sandbox Boundary

Status: foundation built pending sandbox run  
Production Ready: false

## Purpose

This document locks the Kingsmen payment proof boundary. Kingsmen may prepare payment intents and verify PayFast Instant Transaction Notification evidence, but Kingsmen does not treat browser return/cancel navigation as proof of payment.

Payment truth must be stored in PostgreSQL/Supabase finance tables. PayFast is the payment processor and evidence provider, not the Kingsmen source of truth.

## Non-negotiable laws

- No live payments are enabled by this proof.
- No candidate is charged by source-level proof scripts.
- No PayFast merchant secret, passphrase, or private key may be committed.
- No paid status may be granted from a return URL alone.
- No paid status may be granted from a cancel URL.
- Paid status requires accepted ITN evidence.
- ITN evidence must verify signature, amount, source, status, and idempotency.
- Duplicate and replay ITNs must be rejected.
- Refunds require human review; no AI/system auto-refund approval.
- Payment and refund communications remain email-primary.

## Required sandbox proof scenarios

| Scenario | Required outcome |
|---|---|
| sandbox_success_complete_itn | COMPLETE ITN accepted only when signature, amount, source, and idempotency are valid |
| sandbox_cancel_return_no_status_change | Cancel navigation does not mark an order as paid |
| sandbox_return_pending_until_itn | Return navigation can show pending, not paid, until ITN is accepted |
| sandbox_failed_payment_rejected | FAILED ITN must not activate a package |
| sandbox_duplicate_itn_rejected | Duplicate ITN is rejected idempotently |
| sandbox_invalid_signature_rejected | Invalid signature is rejected |
| sandbox_amount_mismatch_rejected | Amount mismatch is rejected |
| sandbox_replay_idempotency_rejected | Replay uses same idempotency key and second receipt is rejected |
| refund_requires_human_review | Refund remains pending review until human approval |
| secrets_redacted_from_evidence | Merchant key and passphrase are not returned in evidence |

## Existing finance truth tables

The N10 finance migration already defines the required runtime truth surfaces:

- finance_plan_catalog
- finance_orders
- finance_invoices
- payfast_payment_intents
- finance_payments
- payfast_itn_receipts
- payfast_signature_audit
- finance_refund_requests
- finance_ledger_entries
- payment_evidence_ledger

## Provider boundary

PayFast provides payment processor evidence. Kingsmen decides internal package activation only after accepted evidence is recorded. Browser redirects are user-navigation events only.

```text
Candidate checkout -> PayFast sandbox -> return/cancel navigation
                                      -> ITN notify URL -> verification -> PostgreSQL finance truth
```

## Environment boundary

Required runtime variables must be environment-only and must never be committed:

```text
PAYFAST_ENVIRONMENT=sandbox
PAYFAST_MERCHANT_ID=env only
PAYFAST_MERCHANT_KEY=env only
PAYFAST_PASSPHRASE=env only if configured
PAYFAST_NOTIFY_URL=staging backend URL
PAYFAST_RETURN_URL=staging web URL
PAYFAST_CANCEL_URL=staging web URL
```

## Proof commands

Run source-level proof:

```bash
npm run payments:prove:sandbox
```

Run validator:

```bash
npm run payments:validate:sandbox
```

The proof writes:

```text
reports/finance/payfast-sandbox-proof-run-latest.json
```

The validator writes:

```text
reports/finance/payfast-sandbox-proof-latest.json
```

## What remains before taking money

This source-level proof does not replace real sandbox provider testing. Before Kingsmen can take paid pilot money, the founder must run a real PayFast sandbox checkout against a staging backend notify URL and capture evidence for:

- successful checkout
- cancel flow
- return flow
- failed payment
- duplicate ITN
- invalid signature
- replay receipt
- amount mismatch
- refund review process

Until those are captured, the launch gate remains blocked for live payments.
