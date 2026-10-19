# Canonical finance catalogue guard

The seven entries in `manifests/business/package-catalogue.json` are the only canonical advertised package prices. The older N10 PayFast finance implementation had a separate R179 accommodation product and asserted an unapproved quantity of eight accommodation routes. That contradicted the business manifest, where accommodation support is a package privilege.

This batch:
- removes the standalone accommodation product from the selectable TypeScript N10 pricing catalogue;
- preserves its code in the type union for historical order reconciliation;
- updates the seed and adds idempotent migration `0083_retire_legacy_accommodation_checkout.sql` to deactivate any existing row without deleting historical finance records;
- updates the runtime manifest and finance report to distinguish canonical package prices from the limited legacy N10 checkout codes;
- adds source-contract validation and regression-test wiring to Source Guard.

**This does not enable the seven packages for checkout.** The manifest does not specify approved managed-route quantities, duration, service limits, or SLA for each package. Those must be approved and mapped before checkout. Paid checkout and production payments remain gated by real PayFast sandbox/ITN tests.

Run:
```bash
npm run finance:validate:canonical-catalogue
npm run finance:test:canonical-catalogue
```

The migration is source-only in this batch; it has not been applied to staging or production.
