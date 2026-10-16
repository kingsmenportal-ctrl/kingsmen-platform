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
