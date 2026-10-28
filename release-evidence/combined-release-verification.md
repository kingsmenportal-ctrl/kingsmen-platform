# Combined RC1 Verification — Operator Runbook

Prepared, **not executed**. A future immutable integrated SHA is required.

## 1. Freeze the release SHA

After authorized dependency integration/reviews, record the release SHA independently in the approved release record. Do not copy it automatically from a moving branch.

```bash
git fetch origin --prune
git checkout --detach "$EXPECTED_RC1_SHA"
test "$(git rev-parse HEAD)" = "$EXPECTED_RC1_SHA"
test -z "$(git status --porcelain)"
export RC1_SHA="$EXPECTED_RC1_SHA"
```

Require a full 40-character SHA. Verify the dependency order: **#204 → #205 → #190 → #202 → #192**. PR #206 has separate independent-review and recovery gates.

## 2. Install, static checks and builds

```bash
node --version
npm --version
npm ci
npm --prefix apps/web ci
npm run web:validate:lockfile
npm run api:build
npm --prefix apps/web run build
```

Root and web package lockfiles are separate, so install both with lockfile enforcement.

## 3. Exact core integration/security commands

```bash
npm test
node scripts/tests/test-candidate-workspace-api.mjs
node scripts/tests/test-candidate-identity-review-api.mjs
node scripts/tests/test-candidate-application-tracker-api.mjs
npm run api:validate
npm run db:validate:migration-integrity
npm run db:validate:migration-integrity:test
npm run security:validate:identity-review
npm run security:validate:review-tables
npm run security:validate:rls
npm run finance:validate:canonical-catalogue
npm run finance:test:canonical-catalogue
npm run payments:validate:sandbox
npm run n14:connectors:check
npm run n15:sources:check
npm run n15:ingestion:check
npm run legal:validate
npm run observability:validate
npm run backup:prove:restore
npm run backup:validate:restore
npm run staging:validate:pack
npm run staging:validate:capture
npm run staging:e2e:validate
npm run kingsmen:launch:audit
```

The backup proof/validator commands above validate source-level controls only; they are **not** evidence of a real restore drill. Runtime auth, storage and payment assertions need an authorized staging E2E run.

## 4. Read-only schema/ACL audit

```bash
psql "$KINGSMEN_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f release-evidence/0078-semantic-parity-audit.sql
psql "$KINGSMEN_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f release-evidence/0097-privilege-audit.sql
```

These scripts inspect only. Do not put DDL application into the combined suite.

## 5. Authenticated staging E2E (separate, post-restore gate)

```bash
npm run staging:e2e:validate
export KINGSMEN_STAGING_BASE_URL='https://<verified-staging-origin>'
export KINGSMEN_E2E_PLAN='manifests/staging/authenticated-e2e-plan-v1.json'
# Inject three short-lived tokens from secret manager; do not paste literal values in history/logs.
export KINGSMEN_E2E_CANDIDATE_A_TOKEN='<securely injected>'
export KINGSMEN_E2E_CANDIDATE_B_TOKEN='<securely injected>'
export KINGSMEN_E2E_REVIEWER_TOKEN='<securely injected>'
export KINGSMEN_E2E_ALLOW_MUTATIONS=true
npm run staging:e2e
```

Use mutations only with approved disposable fixtures, after the final route contract is confirmed. The generic runner does not provision identities or automatically carry response IDs between test cases; its checked-in template is a read-only auth preflight, not a completed full journey.

## 6. Netlify commit binding

```bash
export NETLIFY_AUTH_TOKEN='<secure secret-manager injection>'
export NETLIFY_SITE_ID='fb27d0db-b116-4890-8f7f-14e654c27dbc'
export RC1_SHA="$EXPECTED_RC1_SHA"
bash scripts/release/verify-netlify-published-rc1.sh
```

Requires curl and jq. It retrieves the published deploy ID and deploy metadata; it fails if deploy isn't ready or its commit ref does not exactly equal RC1_SHA, then probes routes.

## 7. Combined wrapper

The branch includes `scripts/release/run-rc1-combined-suite.sh`. Before using it as a certification tool, require both `EXPECTED_RC1_SHA` and `RC1_SHA` to be full 40-character values matching each other and HEAD to be a clean detached checkout. It runs repo/API/web builds, migration integrity, identity-review/RLS checks, payment sandbox validator, privacy/ops checks, and refuses PASS if live E2E is skipped or the authorized session variables are missing.

The combined script has not been run in this session; no CI or build pass is claimed. It records one log per gate and a combined exit record.

## 8. PASS standard

PASS requires the exact immutable SHA, all expected commands exit zero, authorized staging E2E passes, backup/restore is independently demonstrated, all required approvals exist, migrations are reviewed/reconciled, and the Netlify published commit matches the same SHA. Local test green alone cannot close governance/runtime gates.
