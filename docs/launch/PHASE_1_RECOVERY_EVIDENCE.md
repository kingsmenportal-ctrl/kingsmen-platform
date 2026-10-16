# Phase 1 — Database Recovery Evidence

**Status: BLOCKED — Phase 1 exit gate is NOT CLOSED.**  
**Evidence captured:** 2026-10-16 15:54 UTC (live read-only metadata query); PR metadata reviewed 2026-10-16.  
**Repository branch:** `fix/kingsmen-phase0-source-guard-ledger`  
**Scope:** Recovery-gate investigation only. No migrations were applied by this work.

## 1. Backup and recovery record

| Required item | Result |
|---|---|
| Authoritative database identity | **Not established.** The connected Supabase account exposes `kingsmen-portal-staging` (project ref `euhubhhnumtibbyufghm`), but available evidence does not establish that this is the authoritative source database. |
| Backup timestamp | **Not available — no logical backup was created.** |
| Backup size | **Not available.** |
| SHA-256 | **Not available.** |
| Secure backup location | **Not available.** No backup artifact was produced or stored. |
| Isolated restore target | **Not provisioned/verified.** |
| Full restore log | **Not available — no restore was performed.** |
| Recovery gate | **BLOCKED. No verified recovery path; therefore no migrations.** |

The available Supabase integration exposes project metadata, read-only SQL and migration operations, but no logical-dump/download operation or local PostgreSQL client/secure artifact-transfer path. Creating a Supabase development branch is not equivalent to restoring a verified logical backup: the branch workflow creates a fresh database from migration history and explicitly does not carry production data. I therefore did not create a misleading “backup,” did not claim a restore, and did not apply any migration.

Before a real backup can be made, the database owner/operator must identify the authoritative project and provide an approved secure dump/restore execution path with permission to store the dump outside the repository. Do not place database dumps or credentials in GitHub.

## 2. Live read-only inspection — staging project only

Project metadata confirms:
- Project name: `kingsmen-portal-staging`
- Project ref: `euhubhhnumtibbyufghm`
- Region: `eu-west-1`
- Status: `ACTIVE_HEALTHY`
- PostgreSQL: `17.11.0.003`

A read-only metadata query ran at **2026-10-16 15:54:14 UTC** against this staging project. It returned:
- 188 public base tables.
- 188 tables with RLS enabled; zero public tables without RLS.
- 214 public-schema policies.
- 73 foreign-key constraints.
- 542 public-schema indexes.
- 10 functions across `public` and `kingsmen_security`.
- 1 non-internal trigger on public tables.
- PostgreSQL 17.11.

These are a live schema inventory, **not** a backup, restore, authoritative-source confirmation, data-integrity certification, or proof that the schema can be recovered. The trigger/function counts are scoped to the query described above and should not be interpreted as a complete inventory across every schema. Row-level security being enabled also does not, by itself, prove correct grants or candidate isolation.

The returned table-grant inventory includes table privileges listed for `anon` and `authenticated` across many public tables. Effective access must be reconciled with grants, policies, function execute privileges, role inheritance, and actual JWT/RLS probes before any security conclusion. This is a review item, not a claim that those privileges necessarily expose rows.

No candidate row values or personally identifying data were read or recorded in this report.

## 3. Migration history and PR inventory

The staging migration history returned by Supabase currently ends with:
- `20261015153626` — `revoke_anon_candidate_data_access_0029`
- `20261015153651` — `revoke_unneeded_candidate_mutations_0030`

The API/payment migration `20261016151400_payfast_atomic_payment_ledger.sql` is present in draft PR #80's changes but is not listed in the staging migration history returned during this inspection. The fact that a file exists in a PR does not mean it has been applied.

Relevant open draft PRs and migration paths identified through GitHub metadata:

| PR | Draft scope | Files / timestamps identified | Review status |
|---|---|---|---|
| [#74](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/74) | Document storage and support reconciliation | `db/migrations/20261016144000_candidate_document_lifecycle_reconciliation.sql`; `db/migrations/20261016144300_support_operations_reconciliation.sql`; verification SQL | **Blocked:** these files are under `db/migrations/`, unlike the `supabase/migrations/` chain; confirm the canonical migration runner and whether these are executable migrations or review artifacts. PR says the storage index must be verified as unique on exactly `(storage_bucket, storage_path)` and support-ticket ownership must use `candidate_id`. |
| [#76](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/76) | Candidate onboarding, KYC, compliance and selection | `20261016150000`, `20261016150100`, `20261016150200` | **Pending SQL/schema review and execution tests.** |
| [#78](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/78) | Founder RBAC and storage retention | `20261016150500`, `20261016150700` | **Pending:** callers and signature/semantics of `kingsmen_security.is_kingsmen_founder()` must remain compatible; trusted role provisioning/revocation and actual storage deletion lifecycle remain unresolved. |
| [#77](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/77) | Offers/signatures, notifications and audit log | `20261016150300`, `20261016150400`, `20261016150600` | **Pending:** verify existing audit-log schema and append-only trigger behavior; idempotency and SQL execution tests required. |
| [#79](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/79) | Reporting, search, billing and WhatsApp metadata | `20261016151000`–`20261016151300` | **Pending:** validate schema helpers, authorization, state transitions and privacy/retention; these are metadata migrations, not proof of working workers/providers/payments. |
| [#80](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/80) | API components and atomic PayFast payment ledger | `20261016151400_payfast_atomic_payment_ledger.sql` plus API changes | **Pending:** verify atomicity/idempotency, constraints, existing function/grant/RLS contract, and PayFast sandbox separately. PR states no migration has been applied and a backup/restore rehearsal is still required. |

PRs #74 and #76–#80 are draft/open and target `fix/kingsmen-ci-real-validation-gates`, not `main`. Do not treat those branches as one already-integrated, deployable migration chain. PR #81 was reported as closed/superseded by #80 for the PayFast timestamp.

## 4. Preliminary conflict and compatibility report

This is a **preliminary source/metadata reconciliation**, not a completed rehearsal against a restored database.

1. **Migration root inconsistency:** PR #74 uses `db/migrations/`; the other listed database migrations use `supabase/migrations/`. The canonical runner and inclusion policy must be established before ordering.
2. **Existing schema contract dependencies:** PR #74 specifically depends on the actual `document_files` unique index definition and support-ticket `candidate_id` ownership contract. Verify live definitions and exact index validity/columns, not only index names.
3. **Founder predicate compatibility:** PR #78 introduces database-backed founder-role logic. All callers, grants, search path, semantics and provisioning/revocation paths must be reconciled against the currently deployed `kingsmen_security` functions and RLS policies.
4. **Audit-log conflict risk:** PR #77 explicitly requires checking the existing audit-log schema before adding append-only protections. Verify trigger behavior for UPDATE/DELETE/TRUNCATE and ensure required service operations are not accidentally broken.
5. **Cross-PR dependencies:** candidate KYC/selection (#76), offers/notifications/audit (#77), founder roles/retention (#78), reporting/search/billing/WhatsApp (#79), and atomic payment/API (#80) have interdependent identity helpers, authorization, audit, and payment state contracts. Their timestamp order alone does not prove a safe order.
6. **Timestamp order is not approval:** the discovered `20261016150000`–`20261016151400` files sort by timestamp, but the combined chain has not been applied to or tested against a restored copy. No migration order is approved here.
7. **Staging history is behind pending drafts:** the live staging migration listing ends at 0030 and does not show PR #80's 20261016 payment migration. This is consistent with the “do not apply pending drafts” gate, but must be confirmed against the actual authoritative baseline and all migration files before rehearsing.
8. **Security grants require deeper review:** live metadata reports grants for `anon` and `authenticated` on many public tables. RLS is enabled on all 188 public tables, but this alone is not sufficient to approve access. Enumerate effective grants, policies, function execute grants and run authenticated/anonymous isolation tests on the isolated restore.
9. **Data verification is incomplete:** only schema metadata counts were read. No restored data exists to compare, no logical dump was available, and no table-by-table integrity/checksum comparisons were possible.

### Safe proposed sequence — not yet approved for execution

1. Identify and record the authoritative database and environment owner.
2. Create a logical backup using an approved PostgreSQL dump path; record UTC timestamp, byte size, SHA-256 and secured storage reference.
3. Restore into a separate isolated database instance and retain complete restore logs.
4. Compare source and restored schema, constraints, foreign keys, indexes, functions/signatures, triggers, grants, RLS policies and synthetic/non-sensitive integrity checks.
5. Establish the single canonical migration directory and enumerate every pending SQL file across relevant PRs.
6. Resolve the index, ownership, founder-predicate, audit-trigger, grants/RLS, ordering and dependency questions above.
7. Rehearse the combined chain only on the restored isolated copy; capture failures, schema diff, tests and logs.
8. Have a reviewer approve the evidence. Only then reconsider the recovery/migration gate. This document does not authorize staging or production migration.

## 5. Staging change declaration

**No staging migrations were applied by this Phase 1 work.** The only database action performed was a read-only metadata query. No production action, data mutation, live payment, or provider send was performed.

## 6. Phase 0 debt

Phase 0 remains **NOT CLOSED**. The temporary exception recorded in the component ledger remains in effect:
- `apps/api/package-lock.json` is missing.
- `npm ci --prefix apps/api` remains unproven against a committed lockfile.
- Both items remain Blocked / Outstanding and mandatory before production deployment or final launch.

## 7. Exit decision

**Phase 1 exit gate: NOT CLOSED — BLOCKED.**

Reason: no verified logical backup, no isolated restore, no restore log, no data integrity comparison, and no combined migration rehearsal against a restored copy. The staging schema inventory and PR metadata are useful partial evidence but cannot substitute for recovery evidence. **Do not apply migrations to staging or production.**
