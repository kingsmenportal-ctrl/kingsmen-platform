# N11 — Service Fulfilment & Entitlement Management

## Status
Draft implementation on the N10 dependency branch. Do not apply to staging or activate service until N10's Actions, authenticated staging and PayFast sandbox gates are green.

## Invariants
- Creating an order does not create an ACTIVE entitlement.
- An entitlement can become ACTIVE only via `n11_grant_entitlement`.
- Grant requires a PAID order and a matching `PAYMENT_CONFIRMED` event with source `VERIFIED_PROVIDER_WEBHOOK`, provider `PAYFAST`, matching amount, non-empty provider reference, matching merchant reference, `provider_status=COMPLETE`, and `server_validation=VALID`.
- Manual evidence, a return URL, an order row, a candidate assertion or a merely signed-but-unconfirmed notification cannot activate paid service.
- One entitlement per order; grant and transition requests are idempotency-keyed.
- Holds are non-active. A verified grant may release a hold. Revoked entitlements cannot be reactivated.
- Entitlement events are append-only; browser roles and direct service-role table writes are revoked. State transitions occur through audited SECURITY DEFINER functions.
- Every mutation records actor type, reason, from/to status, financial event reference where applicable, and idempotency key.

## Database functions
- `n11_hold_entitlement_for_order`: create a non-active hold or hold an existing entitlement.
- `n11_grant_entitlement`: activate only after the N10 payment event and order satisfy the strict verified-PayFast contract.
- `n11_transition_entitlement`: place an existing entitlement on hold or revoke it. ACTIVE cannot be requested through this function.

## Validation
- `npm run n11:entitlements:validate`
- `npm run n11:entitlements:test`

These are source-contract checks, not authenticated integration tests. Before rollout, add the PayFast ITN caller that writes `merchant_reference`, `provider_status`, and `server_validation` only after signature, trusted source, exact order/amount, and server validation all pass. Run the functions in a rollback transaction with test fixtures, then test the complete workflow against a sandbox-confirmed payment and refund.

## Rollout gate
N10 must have a genuine green Actions run, authenticated candidate-isolation and reviewer-authorization tests, a PayFast sandbox transaction, and refund reconciliation evidence. Only then apply migration 0066 to staging and test hold/grant/revoke behavior.