# PayFast sandbox runtime setup and verification

Status: the sandbox Edge Function is deployed as version 4 and the atomic settlement RPC is applied to the staging database. A real provider transaction has not yet been proven.

## Runtime secrets

Configure secrets in Supabase Dashboard → Edge Functions → Secrets (or via the Supabase CLI secrets command). Never commit these values.

Required:
- `PAYFAST_MERCHANT_ID` — sandbox merchant ID
- `PAYFAST_MERCHANT_KEY` — sandbox merchant key
- `PAYFAST_NOTIFY_URL` — exact public HTTPS URL ending in `/functions/v1/payfast-sandbox?action=itn`

The Edge Function also uses Supabase's project-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Verify these exist in the Edge Function runtime; do not create a database copy of the service-role key.

Optional:
- `PAYFAST_PASSPHRASE` — only if the PayFast sandbox account has a passphrase configured
- `PAYFAST_RETURN_URL` — candidate-facing return route
- `PAYFAST_CANCEL_URL` — candidate-facing cancel route
- `KINGSMEN_WEB_ORIGIN` — allowed browser origin

The notification URL must be publicly reachable by PayFast. Do not point it to a localhost URL or a private preview. Use the sandbox merchant account only.

## Current implementation safety properties

- The function remains sandbox-only and reports `livePaymentsEnabled: false`.
- Checkout requires a valid Supabase bearer token and exactly one verified candidate identity link.
- Plan price comes from the active database catalogue; the client cannot submit an amount.
- A payment status cannot be marked paid from a return/cancel browser navigation.
- ITN settlement requires the configured merchant, matching intent/reference and gross amount, a valid signature, PayFast's server-side `VALID` response, `COMPLETE` status, and replay checks.
- Payment, order, invoice, intent, and payment evidence updates run through a service-role-only PostgreSQL function in a single transaction.
- The function does not treat a caller-supplied HTTP header as proof of PayFast source IP. The database records IP validation as unverified; provider-side validation and signature/merchant/amount checks are the settlement gates.
- Live payments must remain disabled.

## Verification sequence

1. Confirm the secrets are configured without printing their values.
2. Request `GET /functions/v1/payfast-sandbox`; expect HTTP 200 and `configuration: configured`. A 503 with missing key names means setup is incomplete.
3. Authenticate as a staging candidate with exactly one verified identity link.
4. Create a checkout intent for a current paid plan and confirm the response says `PENDING_PAYMENT`, not paid.
5. Complete a sandbox payment in the PayFast sandbox UI.
6. Confirm the ITN reaches the notify URL and PayFast returns `VALID`.
7. Reconcile the same merchant reference across `payfast_payment_intents`, `payfast_itn_receipts`, `finance_payments`, `finance_orders`, `finance_invoices`, and `payment_evidence_ledger`.
8. Replay the same ITN and verify no second payment or ledger settlement occurs.
9. Test wrong amount, wrong merchant, invalid signature, failed status, unknown reference, cancelled return, and candidate ownership isolation.
10. Save redacted request/response evidence and only then mark sandbox end-to-end verification complete.

## Current blocking status

The connector available to this task can deploy Edge Functions and apply SQL migrations, but does not expose a Supabase Edge Function secret-management action or a direct HTTP invocation action. Therefore I have not asserted that runtime secrets are configured or that a real sandbox checkout/ITN has run. Complete the secret setup through the supported Supabase secret interface, then execute the sequence above.
