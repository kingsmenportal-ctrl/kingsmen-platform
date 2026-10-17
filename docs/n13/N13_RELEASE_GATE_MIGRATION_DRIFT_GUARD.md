# N13 — Release Gate & Migration Drift Guard

## Purpose
Keep migration ordering and the most important N11/N12 security contracts mechanically visible while external acceptance work proceeds. This batch does not change database state, grant access, activate checkout, or claim production readiness.

## Included
- `scripts/validators/validate-n13-release-gates.mjs`: checks the ordered 0071/0072 migration chain, critical verified-PayFast activation guards, six reviewed search-path pins, package-script wiring, and explicit release-gate documentation.
- `scripts/tests/n13-release-gates-contract.mjs`: repeatable source-contract assertions.
- `npm run n13:release:validate` and `npm run n13:release:test`.
- Focused GitHub Actions workflow with retained validator/test output.

## Run locally
```sh
npm run n13:release:validate
npm run n13:release:test
```

## Scope and limitations
These are static source and ordering checks. They do not run a Next.js build, execute migrations, authenticate as candidates/reviewers, prove tenant isolation, invoke PayFast, or reconcile a real sandbox refund. A successful result must never be interpreted as a green Actions run or release approval.

## Release gates remain mandatory
1. Genuine green GitHub Actions run with actionable runner logs.
2. Approved staging candidate identities and reviewer identity, followed by candidate cross-access and reviewer-authorization negative tests.
3. PayFast sandbox payment/ITN and full-refund execution with durable reconciliation evidence.
4. Full application build and live transaction/rollback tests.
5. Apply N11/N12 migrations only after the dependency chain is approved and the gates above are satisfied.

Finance tables with RLS enabled and no client policies remain deny-by-default by design; this batch does not weaken that boundary.
