# Kingsmen PayFast Server Mount and Persistence

Production ready: **false**  
Status: API server routes are source-mounted; live provider sandbox proof and deployed runtime evidence are still required.

## Purpose

This build step wires PayFast payment confirmation into the Kingsmen backend without allowing unsafe live activation. The backend now owns the real payment boundary: browser navigation can inform the user, but only accepted provider evidence can update finance truth.

## Mounted API routes

```text
POST /api/payments/payfast/itn
GET /api/payments/payfast/return
GET /api/payments/payfast/cancel
GET /api/payments/payfast/status/:merchantReference
```

## PostgreSQL finance truth

Accepted ITN evidence is written through the PayFast finance repository into these existing N10 tables:

```text
payfast_itn_receipts
payment_evidence_ledger
payfast_payment_intents
finance_orders
finance_invoices
finance_payments
finance_ledger_entries
```

## Required payment behaviour

- The expected merchant reference and amount are loaded from `payfast_payment_intents` before validation.
- Accepted ITN updates the PayFast intent, order, invoice, payment record, evidence ledger, and finance ledger.
- Rejected ITNs are persisted without changing paid status.
- Duplicate ITNs are handled idempotently and do not activate the same order twice.
- Return and cancel routes do not mark services as paid.
- Payloads are redacted before evidence persistence.

## Source verification

PayFast ITN source validation is required. Runtime must provide one of the following controlled settings:

```text
PAYFAST_ITN_ALLOWED_IPS=<comma separated provider/source IP list>
PAYFAST_ITN_SOURCE_VERIFIED=true only inside reviewed staging proof
PAYFAST_ITN_SOURCE_MODE=local_sandbox_only only for local sandbox proof
```

## Runtime requirements before live traffic

1. `KINGSMEN_FINANCE_MODE=postgres` or `KINGSMEN_TRUTH_VAULT_MODE=postgres`.
2. `KINGSMEN_DATABASE_URL` or `DATABASE_URL` configured outside Git.
3. N10 finance migration applied.
4. PayFast notify URL configured to `/api/payments/payfast/itn`.
5. Return URL configured to the Kingsmen web `/payments/return` page.
6. Cancel URL configured to the Kingsmen web `/payments/cancel` page.
7. Real PayFast sandbox checkout and ITN evidence captured.
8. Founder review completed before live activation.

## Validation command

```bash
npm run payments:validate:server-persistence
```

This validator is source-level only. It does not replace real PayFast sandbox provider testing.
