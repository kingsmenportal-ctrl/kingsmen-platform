# Kingsmen PayFast HTTP Boundary

Production ready: **false**  
Status: source route boundary built; server mount and provider runtime proof still required.

## Purpose

This boundary defines the backend/web HTTP surfaces Kingsmen needs for PayFast without pretending that live payment collection is already approved.

## Required routes

```text
POST /api/payments/payfast/itn
GET /api/payments/payfast/return
GET /api/payments/payfast/cancel
GET /api/payments/payfast/status/:merchantReference
```

## Real-life payment behaviour

- `POST /api/payments/payfast/itn` is the only route allowed to change paid status.
- ITN may only be accepted after signature, amount, source, status, duplicate, replay, and idempotency checks pass.
- `GET /api/payments/payfast/return` must show pending only. It must not activate a service package.
- `GET /api/payments/payfast/cancel` must not mark paid, failed, or refunded without provider evidence.
- `GET /api/payments/payfast/status/:merchantReference` must show status based on Kingsmen finance truth and provider evidence, not browser navigation.

## Source files

```text
apps/api/src/finance/payfast-http-routes.ts
apps/api/src/finance/payfast-runtime-gate.ts
apps/web/src/app/payments/return/page.tsx
apps/web/src/app/payments/cancel/page.tsx
scripts/validators/validate-payfast-http-boundary.mjs
```

## Required next runtime wiring

1. Mount the ITN endpoint into the API server routing table.
2. Persist accepted ITN evidence to PostgreSQL finance tables.
3. Make return/cancel/status pages read payment status from the backend API.
4. Configure PayFast dashboard notify, return, and cancel URLs to the deployed Kingsmen URLs.
5. Run real sandbox checkout and capture redacted evidence.

No source file may contain raw PayFast credentials. All provider values remain environment-only.
