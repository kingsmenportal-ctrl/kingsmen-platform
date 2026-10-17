# N10 — Packages, Payments & Refunds

## Scope
N10 adds an authoritative ZAR package catalogue, candidate-scoped service orders, payment event history, refund requests, restricted finance review and immutable finance audit events.

## Routes
- Candidate UI: `/candidate/finance`
- Candidate API: `/api/candidate/finance`
- Finance reviewer UI: `/reviewer/finance`
- Finance reviewer API: `/api/reviewer/finance`

## Package catalogue
Prices are integer cents (ZAR minor units), not floating point:
- Foundational Accord — R169.99
- Collegiate Ordinance — R299.99
- Chancellor's Writ — R399.99
- Regency Mandate — R469.99
- Artisan Charter — R149.99
- Guildmaster's Charter — R199.99
- CV Revamp — R49.99

The migration seeds the catalogue using insert-on-conflict-do-nothing; existing catalogue prices are not silently overwritten. Any future price changes require an explicitly reviewed migration.

## Financial integrity
- Candidate UI/API never accepts a candidate-provided amount or paid status.
- Candidate order creation snapshots package name, code, price and entitlements.
- Candidate order and refund requests use idempotency keys scoped to candidate.
- A return URL or candidate assertion is not payment proof.
- Candidate checkout now creates a signed PayFast payment form; checkout does not mark an order paid.
- The PayFast ITN endpoint rejects untrusted sources, verifies the ITN signature, requires PayFast server confirmation, checks the merchant reference and exact integer-cent amount, then calls an atomic RPC to record the provider event and move the order to PAID.
- Payment confirmation is idempotent by provider payment ID and event key. The order transition and financial event commit in one database transaction.
- Refund execution is finance-reviewer-only, preflights provider refund eligibility, claims execution atomically to prevent blind duplicate submissions, submits once, then checks the provider refund transaction ledger. The refund is marked COMPLETED only after the cumulative provider ledger reconciles.
- If provider response or ledger state is uncertain, the refund remains PROCESSING and is reconciled without resubmitting automatically.
- Only the PAYMENT_SOURCE refund method is currently automated. Bank-payout refunds fail closed pending a separately reviewed secure banking-details workflow.
- Manual payment confirmation is limited to explicitly provisioned `FINANCE_REVIEWER` / `PLATFORM_ADMIN` roles and requires payment reference, evidence locator, SHA-256 evidence hash and review reason.
- A payment event is recorded before the order is changed to PAID; if the status update fails, the response explicitly reports the partial failure and reconciliation is required.
- Refund request is not approval. Approval is not external refund execution. Marking completed requires a settlement reference, evidence locator and SHA-256 hash. It records a finance assertion but does not independently prove bank settlement.
- Finance audit rows reject update/delete at database trigger level.
- Tables use RLS with no client policies; the server APIs use server-side service-role credentials and candidate identity resolved from verified Supabase sessions.

## Migrations
- `0064_n10_packages_payments_refunds.sql`: package catalogue, orders, financial events, refund requests and finance audit.
- `0065_n10_finance_privilege_hardening.sql`: revoke direct anon/authenticated privileges on finance tables.
- `0067_n10_atomic_payfast_payment_confirmation.sql`: atomic, idempotent verified ITN persistence and PAID transition.
- `0068_n10_payfast_refund_reconciliation.sql`: one-shot refund claim and atomic provider-ledger reconciliation.

Apply migrations in order only after the prior N06–N09 schema has been reviewed and the staging rollout approved. Migration 0066 belongs to the N11 draft and is not part of N10 staging rollout.

## Validation
- `npm run n10:finance:validate`
- `npm run n10:finance:test`

## Required private deployment configuration
Configure privately in the authorized Netlify environment; never commit or paste secrets into issues:
- `PAYFAST_ENVIRONMENT=sandbox` for sandbox only.
- `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`.
- `PAYFAST_RETURN_URL`, `PAYFAST_CANCEL_URL`, `PAYFAST_NOTIFY_URL` (notify URL must target `/api/webhooks/payfast`).
- `PAYFAST_ITN_ALLOWED_CIDRS` as a comma-separated, operator-verified allowlist of PayFast's current documented source ranges.
- `SUPABASE_SERVICE_ROLE_KEY` (or the already supported `SUPABASE_SERVICE_ROLE`) is required by server routes and must remain server-side only.

## Not yet release-ready
The checkout, ITN and refund code paths are implemented but have not been verified against a live-configured sandbox account. The Netlify callback/IP settings and merchant credentials are not available in the verified deployment context, authenticated staging identities are not provisioned, and Actions still does not expose actionable job logs. Do not claim successful sandbox payment/refund execution until a real sandbox run is evidenced. Full Next.js build and authenticated candidate/reviewer integration tests remain gates. `productionReady=false`.
