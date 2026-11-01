# Migration and opportunity freshness reconciliation — 2026-10-31

## Executed staging correction

A read-only audit found six Department of Employment and Labour opportunity rows still marked `OPEN` even though each row's stored official closing date was `2026-10-30`. The current South African date is 2026-10-31.

Those six rows were changed in the staging database from `OPEN` to `CLOSED` using a conditional update that selected only rows where:
- current status was `OPEN`;
- `metadata.closing_date` was a valid date-only value; and
- the stored closing date was before the current date in `Africa/Johannesburg`.

The update appended metadata:
- `availability_guard_action=AUTO_CLOSED_EXPIRED_DEADLINE`
- `availability_guard_checked_at`
- `availability_guard_reason` explaining the fail-closed action and requirement for fresh authoritative evidence before reopening.

Affected programme keys:
- `labour_hr4_26_10_02ho_2026`
- `labour_hr4_4_8_190_2026`
- `labour_hr4_4_8_192_2026`
- `labour_hr4_4_8_193_2026`
- `labour_hr4_4_8_194_2026`
- `labour_hr4_4_9_29_2026`

This is a staging data correction only. It is not a migration, does not claim the opportunities are reopened or still available, and does not verify eligibility or application routes.

## Migration ledger versus source files

The staging migration ledger's latest recorded migration remains `candidate_self_service_profile_bootstrap_0095`. It does not record migrations 0096–0098 or inventory imports 0099–0106.

The following migration files are present in the current GitHub integration branch and were inspected:

### 0096 — CAO choice bridge

Adds a nullable unified-application parent alongside the legacy application parent, composite owner-bound foreign key, exactly-one-parent constraint, partial unique indexes, event type allow-list, and SECURITY DEFINER candidate RPCs. The live database already had the core bridge objects at prior inspection, but the ledger does not prove when/how they were applied. Do not rerun the migration blindly: its ALTER/DROP/ADD statements are not uniformly idempotent. Reconcile every object, constraint definition, index definition, function body and grant against the migration and obtain independent review.

### 0097 — client non-DML privilege revocation

Revokes TRUNCATE, REFERENCES, TRIGGER and MAINTAIN from PUBLIC/anon/authenticated on public tables, and adjusts default privileges for postgres. The migration deliberately fails if public extensions or supabase_admin-owned public objects exist. Prior read-only preflight found public extension/ownership conditions need to be rechecked immediately before any approved application; prior grant audit showed broad non-DML client grants. This is security-sensitive and must not be skipped, modified to bypass its preflight, or applied without backup/restore proof and review.

### 0098 — active-candidate capacity enforcement

Adds an active-candidate partial index and serialized admission trigger based on `KINGSMEN_CAP_ACTIVE_CANDIDATES`. The required initial cap is 500. Prior read-only checks showed the runtime setting is 500 and active candidate count is 2, but the trigger/function/index were absent. Therefore the cap is configured but not yet enforced at the database admission boundary. Reconcile trigger/function/index/config and function grants, then apply only after the change-control and restore gates pass.

### 0099–0106 — inventory source/import migrations

The source files were not all resolvable at the current integration branch under the initially expected filenames, and the staging ledger has no matching entries. Treat this as a source-path/branch reconciliation task, not permission to import from guesses. Resolve the actual migration filenames and exact heads of the reviewed inventory PRs; validate idempotency, uniqueness/provenance conflict behavior, source checksums, row counts, official URLs and postflight queries before approval.

## Current security gate

A fresh Supabase security-advisor read returned:
- 17 RLS-enabled tables with no policies. These include backend-only identity-review audit/evidence and founder-control tables; verify intentional service-role-only access and absence of unintended API exposure rather than blindly adding client policies.
- 6 SECURITY DEFINER functions executable by authenticated users, including CAO-choice and application-preparation/outcome RPCs. Independently verify caller identity binding, candidate ownership, authorization, search_path, grants and negative cross-candidate tests.
- Leaked-password protection disabled. Enable through the supported Auth project configuration before production release and verify the resulting setting.

## Evidence and remaining actions

- The staging correction was performed with a conditional update and returned exactly six changed rows, each now `CLOSED`.
- No migration 0096–0098 was applied by this reconciliation.
- No source inventory 0099–0106 was imported.
- A protected encrypted backup/restore drill, RPO/RTO evidence, formal change approval and independent migration/security review remain mandatory before schema changes or imports.
- Once those gates pass: apply the reviewed migrations, import canonical directory records idempotently, verify each provider route and opportunity independently, connect the readiness engine to authenticated candidate preflight, then prove candidate isolation, reviewer audit, submission evidence and the exact deployed commit.
