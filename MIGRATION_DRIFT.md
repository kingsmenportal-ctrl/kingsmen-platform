# Kingsmen Portal — Staging Migration Drift Ledger

Status: investigation in progress. This document records observations from the connected `kingsmen-portal-staging` database and the repository migration intent. It is not authorization to apply schema changes.

## Verified staging observations

Checked 2026-10-16 against project ref `euhubhhnumtibbyufghm` (`kingsmen-portal-staging`).

| Object / control | Staging observation | Interpretation / action |
| --- | --- | --- |
| Project health | `ACTIVE_HEALTHY` | Project is reachable; this does not establish application runtime readiness. |
| Migration history | Contains entries named `candidate_auth_private_storage_0023`, `candidate_owned_application_document_reads_0024`, `explicit_candidate_identity_binding`, `require_verified_candidate_identity`, `candidate_portal_durable_state`, `harden_candidate_document_storage`, `revoke_anon_candidate_data_access_0029`, `revoke_unneeded_candidate_mutations_0030` | History records these migration names. It does not prove every expected RPC from repository migrations is present. |
| `public.candidate_accounts` | Exists | Schema presence only; runtime identity binding still needs tests. |
| `public.candidate_portal_state` | Exists; SELECT/INSERT/UPDATE policies restrict rows to `auth.uid()` matching `auth_user_id` | Policy shape observed; runtime cross-account denial remains untested. |
| `public.document_files` | Exists; authenticated SELECT policy compares `candidate_id` with `kingsmen_security.current_authenticated_candidate_id()`; service-role ALL policy exists | Candidate read policy is present; document lifecycle RPCs are not present under the expected names. |
| `public.document_storage_events` | Exists; service-role ALL policy observed | Persistence is present; candidate upload/deletion event RPCs are absent under expected names. |
| `storage.buckets` entry `candidate-documents` | Exists, `public=false`, 10 MiB file limit, PDF/DOCX/plain-text MIME allowlist | Bucket is private and has an allowlist. Object-policy and actual upload/download isolation tests are still required. |
| `kingsmen_security.current_authenticated_candidate_id()` | Exists as SECURITY DEFINER SQL function with fixed `search_path`; maps `auth.uid()` through `public.candidate_accounts.auth_user_id` to `candidate_id` | EXECUTE observed for `authenticated`; not for `anon` or `service_role`. Test its behaviour with controlled accounts. |
| `public.register_candidate_document_upload(...)` | No matching function found in `pg_proc` | Staging drift / missing runtime contract. Identify intended signature and add a reviewed forward migration only after dependency and backup checks. |
| `public.link_candidate_document_to_application(...)` | No matching function found in `pg_proc` | Repository migration `db/migrations/0022_candidate_document_application_linkage.sql` defines this function, but staging does not currently expose it under this name. |
| `public.retire_candidate_document_upload(...)` | No matching function found in `pg_proc` | Staging drift / missing runtime contract. Inspect application call and intended lifecycle semantics before authoring SQL. |
| `public.record_candidate_document_deletion_result(...)` | No matching function found in `pg_proc` | Staging drift / missing runtime contract. Inspect application call and expected idempotency/audit semantics before authoring SQL. |
| `public.record_founder_document_review(...)` | No matching function found in `pg_proc` | Staging drift / missing runtime contract. Review RPC migration, grants, founder authorization and transaction semantics before authoring SQL. |
| `public.founder_ops_audit_events` policies | Only `founder_ops_audit_events_all` for `service_role` was observed | Differs from repository migration `0016_founder_audit_and_command_intake.sql`, which defines separate founder SELECT and INSERT policies. Do not add founder client policies automatically: determine whether staging is intentionally service-role-only and how the founder audit API accesses it. |
| Finance tables | Finance-related tables were observed in prior inspection | Table existence is not proof of correct ledger semantics or payment-provider reconciliation. Runtime finance tests remain required. |

## Migration numbering / ordering warning

The repository uses four-digit migration filenames such as `0016_...`, `0022_candidate_document_application_linkage.sql`, and `0023_support_operations_audit.sql`. Staging history uses timestamp versions (for example `20261015151555`) with names such as `candidate_auth_private_storage_0023`.

The `0023` suffix therefore does **not** uniquely identify the same SQL file across the repository and deployed history. In particular, the repository's `0023_support_operations_audit.sql` must not be assumed to be the staging migration recorded as `candidate_auth_private_storage_0023`.

Do not reapply existing migrations, edit applied migration history, or create migrations called `0031`–`0035` until the exact SQL and dependency mapping has been reviewed. Prefer the repository's established migration tooling and a unique, monotonically ordered migration version (normally a timestamp prefix), after confirming how this repository deploys migrations.

## Required reconciliation before applying any DDL

1. Inventory every migration file on the PR branch and map its SQL objects to the timestamped staging history.
2. Inspect the five missing RPC call sites and their intended function signatures, table ownership checks, transaction behaviour, idempotency, event/audit writes, SECURITY DEFINER settings, and EXECUTE grants.
3. Compare full deployed function definitions, table constraints, bucket object policies, and RLS policies with repository intent. The current ledger is a point-in-time observation, not a complete schema diff.
4. Verify a staging backup exists and perform a restore rehearsal or document an approved, tested recovery procedure. This has not been verified.
5. Prepare forward-only, additive migration SQL with preconditions and safe failure behaviour; review it before execution.
6. Apply only to staging after the SQL review and recovery gate. Re-query `pg_proc`, `pg_policies`, grants, and constraints after application.
7. Run redacted runtime tests with two dedicated test candidates: own-document upload/read, cross-candidate denial, canonical registration, deletion failure handling, founder review authorization/persistence, and persistence across restart.
8. Keep PR #73 open and unmerged until CI and runtime evidence are reviewed. Do not deploy production from this investigation.

## Evidence still missing

- Complete repository-to-staging migration mapping.
- Backup/restore rehearsal evidence.
- Full `storage.objects` policy inspection and cross-candidate runtime tests.
- Approved signatures and reviewed SQL for the missing RPCs.
- Authenticated runtime proof that founder review decisions persist atomically with audit records.
- Runtime evidence for document upload, download, deletion and candidate isolation.


## Additional schema checks and prepared forward migrations

Further read-only inspection found:

- `public.is_kingsmen_founder()` is absent from staging, as are the five RPCs listed above.
- `public.founder_document_review_decisions` is absent, so the founder review route cannot persist its expected decision rows.
- The deployed `document_storage_events_type_check` does not allow `APPLICATION_LINKED`. Even if the link RPC alone were installed, application linkage would fail when it records the event.
- The `document_files_size_nonnegative` and `document_files_metadata_object` constraints from the repository lifecycle migration are absent. A read-only preflight found zero negative file sizes, zero non-object metadata rows, and zero duplicate `(storage_bucket, storage_path)` pairs at inspection time.
- Storage object policies exist for authenticated candidate-owned INSERT, SELECT and DELETE in the private `candidate-documents` bucket. This is policy inspection only, not proof of cross-candidate runtime denial.

Four **draft forward migrations** have been prepared on this PR branch:

1. `db/migrations/20261016144000_candidate_document_lifecycle_reconciliation.sql` — reinstates the candidate upload registration, retirement/deletion-result and application-link RPCs; adds the missing lifecycle constraints and event type; preflights duplicate storage paths before creating a unique index.
2. `db/migrations/20261016144100_founder_document_review_reconciliation.sql` — restores the founder-role helper, decision table and canonical-validation review RPC. It intentionally does not change the staging `founder_ops_audit_events` service-role-only policy.
3. `db/migrations/20261016144200_founder_command_review_reconciliation.sql` — restores the command intake/decision tables and guarded RPCs. Writes to the audit table are made through SECURITY DEFINER functions that validate the founder role and actor identity; the audit table itself remains service-role-only.
4. `db/migrations/20261016144300_support_operations_reconciliation.sql` — restores the support event table and the candidate-create/operator-update RPCs, with explicit table grants and role-scoped RLS. It uses `kingsmen_security.current_authenticated_candidate_id()` rather than `candidates.owner_user_id`, which does not exist in the deployed `public.candidates` schema.

A further code/schema mismatch was corrected: the private `candidate-documents` bucket is limited to 10 MiB, while the application upload helper previously allowed 15 MiB. The helper and its regression assertion now use 10 MiB to avoid accepting files that the bucket must reject.

These files are **not applied to Supabase**. They still require SQL review against the deployed schema and runtime contract, plus a verified staging backup/restore path. Do not apply them until those gates pass. Migration files use timestamp prefixes to avoid the existing four-digit suffix collisions with the timestamped staging history.

## Newly verified drift beyond the original five RPCs

Read-only checks on 2026-10-16 also found:

- `public.founder_command_intake` and `public.founder_command_decisions` are absent, and `record_founder_command_intake(...)` / `decide_founder_command_intake(...)` are absent. The current founder command queue reads these tables directly, so the missing schema prevents the queue from working end-to-end even though its source regression suite passes.
- `public.candidate_support_ticket_events` is absent, and `create_candidate_support_ticket(...)` / `update_support_ticket_as_operator(...)` are absent. The canonical `candidate_support_tickets` table exists, but its only observed policy is service-role-only, which does not support the current founder route's authenticated PostgREST reads/updates.
- The deployed `public.candidates` table has no `owner_user_id` column. The older repository migration `0023_support_operations_audit.sql` uses that column in its candidate-ticket RPC, so that source migration must not be applied verbatim to this staging schema. The timestamped draft resolves identity through the deployed `kingsmen_security.current_authenticated_candidate_id()` helper.
- The founder operational tables inspected (`founder_command_catalog`, `founder_command_requests`, `founder_command_results`, `founder_daily_briefs`, `founder_decision_log`, `founder_escalation_threads`, `founder_mobile_cards`, `founder_operator_profiles`, `founder_runtime_config`, `founder_watchlist_items`, `founder_reports`, and `founder_report_sections`) currently expose only service-role policies. Do not broadly replace these policies until each active API path and required read/write permissions have been mapped.

The timestamped founder-command and support migrations are drafts for review only. No staging DDL has been applied, and no real-user data or credentials were used for these checks.