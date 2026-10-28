# N10 — Finance / PayFast Runtime

Status: canonical catalogue and sandbox source boundary reconciled; staging migration and real provider checkout remain pending evidence.
Production Ready: false
Live Payments Enabled: false

## Finance truth and runtime

PayFast is the payment processor. PostgreSQL/Supabase is Kingsmen's finance truth. The deployed `payfast-sandbox` Edge Function (version 5 at last inspection) contains authenticated checkout-intent creation and an ITN handler. The handler calls PayFast's sandbox validation endpoint, checks signature, configured merchant, exact gross amount, status, and idempotency, then uses the server-side settlement RPC. This is source inspection, not proof that the function secrets are configured or that a real sandbox transaction has completed.

## Canonical package schedule

- Foundational Accord — R169.99; 5 managed applications; up to 8 accommodation routes where relevant.
- Collegiate Ordinance — R299.99; 10 managed applications; up to 8 accommodation routes where relevant.
- Chancellor's Writ — R399.99; 15 managed applications; up to 8 accommodation routes where relevant.
- Regency Mandate — R469.99; 15 managed applications; up to 8 accommodation routes where relevant.
- Artisan Charter — R149.99; 5 managed career applications; up to 8 accommodation routes where relevant.
- Guildmaster's Charter — R199.99; 8 managed career applications; up to 8 accommodation routes where relevant.
- CV Revamp — R49.99; 15 truthful CV versions and 15 matching motivation letters; no managed applications; a later eligible package upgrade receives the approved +2 managed-route bonus once.
- Accommodation Support — R179.00; 8 accommodation routes; zero managed education/employment applications; no rent/deposit handling and no accommodation guarantee.
- Free Destiny Map — R0; preview only; zero managed applications.

Amounts are ZAR cents in the finance database. The browser cannot choose or override the amount; checkout must read the active canonical plan row and copy its price and entitlement snapshot into the order.

## Implemented source changes

- Canonical finance plan catalogue now defines all nine plan codes, prices, and quantities.
- Reconciliation migration `20261027120000_reconcile_canonical_package_catalogues.sql` updates both `finance_plan_catalog` and `service_packages`, and preserves historical order snapshots.
- Repository regression checks validate canonical plan prices/quantities and migration integrity.
- The existing PayFast Edge Function's settlement RPC writes paid status and finance evidence only after server-side validation.

## Live staging observations at 2026-10-27

- `finance_plan_catalog` contained the six core plans, Free Destiny Map and CV Revamp, but managed-application quantities did not match the canonical package schedule; accommodation route counts were zero.
- `service_packages` contained seven entries with incorrect managed quantities (Foundational 1, Collegiate 2, Chancellor 3, Regency 4, Artisan 3, Guildmaster 5), and did not contain Accommodation Support as a standalone product.
- `finance_orders`, `payfast_payment_intents`, `payfast_itn_receipts`, and `finance_payments` each had zero rows at inspection. No real checkout/ITN transaction has been proven.
- No PayFast requests appeared in the queried last-24-hour Supabase logs.
- Netlify's published deployment did not expose a verified commit SHA for this release.

## Release gates still open

1. Review and merge PR #193 through normal branch protection.
2. Apply the reviewed reconciliation migration to staging and query back all nine finance plans and nine service-package rows.
3. Confirm the PayFast sandbox secrets are present in Supabase secret storage without exposing values.
4. Run a real sandbox checkout; capture signature, provider-validation, merchant, amount, duplicate/replay, failed-payment, return/cancel and database reconciliation evidence.
5. Verify that only the matching paid order activates its stored package privileges; test idempotent retry/recovery.
6. Run authenticated candidate A/B tests for own-only orders, entitlements, documents and applications.
7. Map each advertised premium feature to a live workflow or mark it unavailable in candidate-facing copy.
8. Deploy the reviewed commit to Netlify and verify the actual public pricing and authenticated candidate routes.

No live payments are enabled by this source batch. Do not claim production readiness until all gates above pass.
