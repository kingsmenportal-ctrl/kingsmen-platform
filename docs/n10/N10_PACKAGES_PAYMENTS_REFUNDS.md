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
- No payment-provider checkout or webhook is configured in this batch.
- Manual payment confirmation is limited to explicitly provisioned `FINANCE_REVIEWER` / `PLATFORM_ADMIN` roles and requires payment reference, evidence locator, SHA-256 evidence hash and review reason.
- A payment event is recorded before the order is changed to PAID; if the status update fails, the response explicitly reports the partial failure and reconciliation is required.
- Refund request is not approval. Approval is not external refund execution. Marking completed is a finance assertion, not proof of bank settlement.
- Finance audit rows reject update/delete at database trigger level.
- Tables use RLS with no client policies; the server APIs use server-side service-role credentials and candidate identity resolved from verified Supabase sessions.

## Migration
Apply `db/migrations/0064_n10_packages_payments_refunds.sql` only after the prior N06–N09 schema migrations have been applied and verified in staging. It adds `FINANCE_REVIEWER` to the N07 reviewer role constraint.

## Validation
- `npm run n10:finance:validate`
- `npm run n10:finance:test`

## Not production-ready
This is a governed workflow slice, not a live payment integration. Payment-provider checkout, signature-verified webhook handling, external refund execution, entitlement fulfillment, authenticated staging tests, full Next.js build, migration application and finance reconciliation runbook remain release gates. `productionReady=false`.
