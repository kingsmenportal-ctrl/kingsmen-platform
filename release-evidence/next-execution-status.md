# Live Execution Status — 2026-10-28

This is an evidence index, not a release approval.

## Work actually committed to PR #207

PR: https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/207  
Branch: `release/kingsmen-90-day-evidence-pack-2026-10-28`  
The current PR head SHA is the source of truth; it changes as commits are added. Re-read the PR head before certification.

### Deliverable 1 — PR #206 migration 0097
- Full dry-run, pre/post assertion, application, DML-grant comparison and corrective-migration procedure: `release-evidence/pr206-0097-migration-package.md`.
- Read-only ACL audit with exact target scope: `release-evidence/0097-privilege-audit.sql`.
- Standalone fail-closed SQL post-assertion: `release-evidence/0097-post-assertion.sql`.
- Candidate migration branch currently revokes non-DML privileges from PUBLIC/anon/authenticated on current public tables and public default ACLs for postgres and supabase_admin.
- No independent approval or fresh exact-head CI has been established; migration is not applied.

### Deliverable 2 — 0078 migration reconciliation
- `release-evidence/0078-full-reconciliation.md` and `release-evidence/0078-parity-findings.md`.
- Canonical body recovered from PR #120 and PR #122 references, identical blob SHA `9fdabdde36c981ae305e57df589c168471b7d974`.
- Semantics reconciled substantially: current helper-schema move aligns with later migration `20261022031206`; additional indexes align with 0081 blob `5713c8821777223349b882e4e9e20af63fac3256`.
- Exact executed SQL body for each ledger version remains unproven. The two rows store only version/name and no body hash, and no deployment execution artifact was surfaced. No second body has been invented.

### Deliverable 3 — combined verification
- `release-evidence/combined-release-verification.md`
- `scripts/release/run-rc1-combined-suite.sh`
- `scripts/staging/run-kingsmen-authenticated-e2e.mjs`
- `scripts/staging/test-kingsmen-authenticated-e2e.mjs`
- `scripts/validators/validate-staging-authenticated-e2e-runner.mjs`
- The runner now supports the separate Netlify app origin and Supabase Edge Functions origin, limits Supabase requests to `/functions/v1/`, supplies the Supabase public `apikey` header, requires role tokens where needed, and records the tested origins without emitting response bodies or tokens.
- The suite has not been executed in a real checkout/CI run in this session. Do not call this a passing test suite.

### Deliverable 4 — test identities
- `release-evidence/authenticated-test-identities.md`
- `manifests/staging/authenticated-e2e-plan-v1.json`
- The plan checks anonymous denial, candidate A/B own-scope routes and reviewer-queue authorization through PR #190's real `candidate-identity-review-queue` Edge Function, with the dedicated `IDENTITY_REVIEWER` role. It explicitly avoids granting `PLATFORM_ADMIN` simply to make an older route pass.
- No identities, sessions or synthetic rows were created. The plan is read-only preflight, not full application create/update/reload and reviewer-decision E2E.

### Deliverable 5 — Netlify readiness
- `release-evidence/netlify-deployment-readiness.md`
- `scripts/release/verify-netlify-published-rc1.sh`
- Site exists/claimed, but the connector response has an empty currentDeploy object. No published deploy ID, exact commit SHA or published timestamp has been established; no deploy was triggered.

### Deliverable 6 — backup/restore drill
- `release-evidence/backup-restore-drill.md`
- `docs/ops/KINGSMEN_BACKUP_RESTORE_PROOF.md`
- `scripts/backup/Test-KingsmenTruthVaultRestore.ps1`
- `scripts/validators/validate-backup-restore-proof.mjs`
- Backup creation now retains database/object ACL statements while normalizing ownership, and the manifest explicitly discloses that the archive contains sensitive candidate data and is not encrypted by the script. Restore requires the companion manifest, checks checksum/size/TOC and source/restore database fingerprints, restores ACLs without `--no-privileges`, checks core tables/counts, and fails closed. These scripts are not executed here; no real restore is claimed.

## Fresh live environment evidence

- Supabase project `euhubhhnumtibbyufghm`: ACTIVE_HEALTHY; PostgreSQL `17.11.0.003`.
- Staging migration ledger contains versions `20261019112452` and `20261019112511`, both named candidate application preparation readiness 0078. Migration 0097 does not appear in the last queried migration list.
- The only Supabase branch returned was `main`, `with_data=false`; this is not backup/restore evidence.
- Read-only aggregate using the exact `pg_tables` population targeted by 0097 checked 230 public tables. `anon`: TRUNCATE 171, REFERENCES 171, TRIGGER 171, MAINTAIN 172. `authenticated`: TRUNCATE 181, REFERENCES 181, TRIGGER 181, MAINTAIN 182. Public table default ACLs for both `postgres` and `supabase_admin` also grant these privilege types to anon/authenticated. Direct PUBLIC non-DML grant rows returned zero; explicit PUBLIC revocation in 0097 prevents future inherited grants.
- Netlify `kingsmen-portal-staging`: site ID `fb27d0db-b116-4890-8f7f-14e654c27dbc`, Team ID `69467d1afdbcc37d0e708e37`, plan `nf_team_dev`, claimed `true`, password protection `false`, team SSO `false`, Forms not enabled. Metadata reported a primary URL and unstable branch preview hash, but no published deploy ID or commit ref. No deployment action occurred.
- PR #206 remains open; last observed head `9079794bc02990a7888ab14508b26c31d2aae1a9`. Earlier PASS runs were on an older head and are stale after PUBLIC-hardening edits. Current exact-head CI is not yet confirmed. Only an author COMMENT review was recorded; independent approval is absent.
- PR #207 remains open/unmerged. Its actual workflow/test status must be checked against the latest head; no CI pass is claimed based on code being committed.

## Non-actions and remaining human gates

- No migration applied; no candidate/reviewer identities created; no synthetic staging rows added; no PR merged; no deployment triggered.
- Required human actions: independent review of PR #206 and PR #207 artifacts; approve/execute an isolated backup/restore drill and provide the target environment; identify/reuse or authorize creation of synthetic test identities; provide authorized short-lived sessions/API key via secret manager; retrieve Netlify published deploy object/commit binding; provide deployment-runner artifacts for both 0078 bodies or formally record the provenance gap.
- RC1 remains blocked until ordered integration produces one immutable SHA, fresh combined CI passes on that exact SHA, authenticated E2E and candidate A/B isolation pass, backup/restore passes, and the published Netlify commit equals that SHA.
