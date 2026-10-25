# PayFast sandbox runtime setup and verification

Status as of 2026-10-25: staging Edge Function `payfast-sandbox` is ACTIVE at version 5 and the atomic settlement migration is applied. GitHub Source Guard and Release Evidence workflows passed for the current PayFast change. These checks do not prove a provider transaction. A real sandbox checkout/ITN remains unverified.

## Runtime secrets

Configure secrets in Supabase Dashboard → Edge Functions → Secrets (or via the Supabase CLI secrets command). Never commit these values or put them in public Netlify variables.

Required:
- `PAYFAST_MERCHANT_ID` — sandbox merchant ID
- `PAYFAST_MERCHANT_KEY` — sandbox merchant key
- `PAYFAST_NOTIFY_URL` — exact public HTTPS URL ending in `/functions/v1/payfast-sandbox?action=itn`
- `SUPABASE_URL` — Supabase project URL used by the Edge Function
- `SUPABASE_SERVICE_ROLE_KEY` — server-side service-role key; never expose it to the browser

Optional:
- `PAYFAST_PASSPHRASE` — only if the PayFast sandbox account has a passphrase configured
- `PAYFAST_RETURN_URL` — candidate-facing return route
- `PAYFAST_CANCEL_URL` — candidate-facing cancel route
- `KINGSMEN_WEB_ORIGIN` — allowed browser origin

The notification URL must be publicly reachable by PayFast. Do not point it to localhost or a private preview. Use sandbox merchant credentials only. Never paste credentials into a GitHub issue/PR or ChatGPT.

## Implementation safety properties

- The function is sandbox-only; production/live payments must remain disabled.
- Checkout requires a valid Supabase bearer token and exactly one verified candidate identity link.
- Plan price comes from the active database catalogue; the client cannot submit an amount.
- Browser return/cancel navigation cannot mark an order paid.
- ITN settlement checks configured merchant, matching intent/reference and gross amount, signature, PayFast server-side `VALID` response, `COMPLETE` status, and replay conditions.
- Payment settlement uses a service-role-only PostgreSQL function designed to atomically update payment/order/invoice/intent/evidence.
- Caller-supplied HTTP headers are not treated as proof of PayFast source IP. The database records IP validation as unverified; provider-side validation and signature/merchant/amount checks are the settlement gates.
- Secrets and full payment payloads must not be copied into logs or evidence bundles.

## Verification sequence

1. Configure the required secrets in the Supabase Edge Function secret interface. Verify presence without printing values.
2. Request `GET /functions/v1/payfast-sandbox`; expect HTTP 200 and `configuration: configured`. A 503 listing missing key names means setup is incomplete.
3. Use a staging candidate account whose identity link has been authorised through the existing review workflow and is `VERIFIED`. Do not link by email alone or insert an unreviewed link.
4. Create checkout for a current paid ZAR plan using a fresh idempotency key. Verify the order and intent remain pending and the amount matches the active catalogue.
5. Complete a sandbox payment in the PayFast sandbox UI.
6. Verify the ITN reaches the exact notify URL and PayFast's validation endpoint returns `VALID`.
7. Reconcile the same merchant reference across `payfast_payment_intents`, `payfast_itn_receipts`, `finance_payments`, `finance_orders`, `finance_invoices`, and `payment_evidence_ledger`.
8. Replay the same accepted ITN and verify no duplicate payment/ledger settlement is created and recovery remains idempotent.
9. Exercise invalid signature, wrong merchant, wrong amount, failed/non-`COMPLETE` status, unknown reference, cancelled browser return, duplicate fields, and candidate ownership isolation.
10. Restart/retry the relevant runtime path and confirm persisted state remains consistent.
11. Save redacted request/response evidence and database reconciliation results. Only then mark sandbox end-to-end verification complete.

## Observed staging evidence (2026-10-25)

- Supabase project health: `ACTIVE_HEALTHY`.
- Edge Function: `payfast-sandbox` ACTIVE, version 5, `verify_jwt=false` for provider ITN delivery; checkout applies its own bearer-token authentication.
- GitHub Source Guard run 1815: successful. Release Evidence run 439: successful. These include source/contract checks and build/smoke checks, not a PayFast provider transaction.
- Finance orders, invoices, payment intents, ITN receipts, payments, and verified candidate identity links were each observed at zero rows during the staging check.
- The current connector cannot configure Supabase Edge Function secrets or directly invoke the live checkout endpoint. No real sandbox checkout, ITN, or settlement is claimed.

## Release gate

The sandbox gate stays BLOCKED until secrets are configured, an authorised candidate identity link exists, a real sandbox checkout produces a validated ITN, persisted records reconcile, and duplicate/failure/cancel/ownership tests pass. Do not enable production payments based on successful source guard, migration checks, or a deployed function alone.
