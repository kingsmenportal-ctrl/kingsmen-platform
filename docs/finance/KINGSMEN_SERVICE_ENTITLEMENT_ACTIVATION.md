# Kingsmen Service Entitlement Activation

Production ready: **false**  
Status: source wiring is built; migration application and staging proof are still required.

## Purpose

This build step connects verified PayFast payment evidence to Kingsmen service-package access. A candidate must not receive paid-package privileges from a browser return page, a cancel page, a manual click, or an unverified payment message.

## Activation rule

A Kingsmen service entitlement opens only when a `finance_payments` row is:

```text
provider = PAYFAST
payment_status = COMPLETE
verified = true
```

That payment row is only written after the PayFast ITN boundary accepts provider evidence.

## Database objects

```text
finance_service_entitlements
finance_service_activation_events
kingsmen_activate_service_entitlement_from_payment()
trg_kingsmen_activate_service_entitlement_from_payment
```

## What activates

When the trigger fires, Kingsmen:

1. Loads the finance order.
2. Loads the active finance plan.
3. Creates or refreshes one entitlement per order.
4. Copies package limits from `finance_plan_catalog`.
5. Writes an activation event.
6. Updates the candidate `active_package_code`.

## Safety rules

- Duplicate payment writes cannot create duplicate entitlements because `order_ref` is unique in `finance_service_entitlements`.
- Package limits come from the official finance plan catalogue, not from PayFast payload text.
- Rejected ITNs do not write verified COMPLETE payment rows, so they cannot open entitlements.
- Browser return and cancel pages cannot open entitlements.
- Refund/revoke behaviour remains a separate controlled workflow and must not be performed by AI alone.

## Validation command

```bash
npm run payments:validate:service-activation
```

## Runtime proof still required

After migrations are applied in staging, run a controlled PayFast sandbox proof that creates a verified payment row and confirms that exactly one entitlement opens with the correct plan limits and evidence reference.
