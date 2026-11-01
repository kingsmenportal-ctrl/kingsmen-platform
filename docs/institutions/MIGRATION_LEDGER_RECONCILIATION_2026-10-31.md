# Staging migration ledger reconciliation — 2026-10-31

## Scope and safety

Read-only inspection of Supabase staging project `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`). No SQL mutation, migration application, provider import, or migration-ledger edit was performed.

## Verified ledger state

The latest recorded migration is `20261029193124 / candidate_self_service_profile_bootstrap_0095`. No ledger rows are present for migration families 0096–0107.

| Migration / family | Live evidence | Reconciliation result |
|---|---|---|
| 0078 candidate application preparation readiness | Same migration name recorded at versions `20261019112452` and `20261019112511` | Duplicate history provenance unresolved. Compare both exact SQL bodies and schema effects; do not delete or rewrite either ledger row speculatively. |
| 0093 verified labour vacancy deadlines | Same migration name recorded at versions `20261029180632` and `20261029180642` | Duplicate history provenance unresolved. Compare bodies, inserted records and effects before deciding whether the second entry represents a duplicate, follow-up, or divergent content. |
| 0096 CAO bridge / unified application bridge | `cao_choice_items`, `candidate_master_application_targets`, and `candidate_master_application_events` exist; CAO indexes also exist | Structural objects are present, but migration provenance is not recorded. Reconcile definitions, constraints, triggers, RPCs, indexes, data and grants against the exact 0096 migration before any replay. |
| 0097 client non-DML privilege hardening | Migration absent from ledger. Live privilege query shows anon has TRUNCATE/REFERENCES/TRIGGER grants across 171 public tables; authenticated has these grants across 181 public tables. | The intended 0097 hardening is not evidenced as applied. PR #206's migration has preflight checks for public extensions and `supabase_admin` ownership. Independent review and exact runtime test are required before applying. |
| 0098 500-active-candidate enforcement | No matching active-cap trigger/function found in the inspected public/private function/trigger catalogue. `public.candidates` has 2 active rows out of 2. | The cap of 500 is not proven enforced. Inspect the exact 0098 migration and verify its locking/serialization, index/constraint strategy, concurrency test, fail-closed behavior and runtime evidence before application. |
| 0099–0106 source/provider import family | No ledger entries recorded | Treat those import migrations as unapplied until individually reconciled. Existing SQL files and manifests are not proof of staging data. |
| 0107 public universities, TVET, CET and provincial authorities | Migration file exists on the feature branch; no staging ledger row | Not applied. The coverage-gap register identifies 94 prepared targets missing from the current three-row provider inventory. |
| Backup/restore drill | `backup_restore_drills` count was 0 in the prior read-only inventory; no accepted protected restore evidence found in this inspection | Hard release gate. Do not run imports until an encrypted backup is restored in isolation, validated and signed off. |

## Client privilege findings

A read-only query of `information_schema.role_table_grants` across the public schema returned:

- `anon`: 171 tables with at least one of INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, or REFERENCES; 1,026 grant rows across those privilege types; TRUNCATE on 171 tables.
- `authenticated`: 186 tables with at least one of those privileges; 1,087 grant rows; TRUNCATE on 181 tables.

RLS policies exist on the inspected catalogue tables and currently constrain row visibility, but RLS is not a substitute for least-privilege table grants. TRUNCATE is not governed by row-level policies. Treat this as a broad client-privilege remediation gate; do not attempt a global revoke of INSERT/UPDATE/DELETE without table-by-table review of the intended RPC/API contract.

## Ordered recovery plan

1. Obtain independent review for PR #206 / migration 0097 and run its complete SQL runtime test against a protected isolated restore first.
2. Recover and compare both historical SQL bodies for 0078 and 0093; record semantic parity, divergent effects and accepted provenance without editing ledger history speculatively.
3. Compare 0096 exact definitions against live CAO bridge objects, and verify 0097 client privilege state against its SQL contract.
4. Reconcile 0098 against live candidate schema; prove a concurrent-safe 500-active-candidate cap before considering it complete.
5. Generate preflight/postflight and duplicate/provenance checks for 0099–0107; independent review and formal change approval for each ordered batch.
6. Execute an encrypted backup, isolated restore, integrity validation and signed-off restore drill before any staging mutation.
7. Apply only the approved migration sequence; immediately verify ledger, schema, grants, RLS, canonical provider counts and repeat-import idempotency.
8. Verify each provider route individually and persist current opportunity evidence before describing any provider as connected or any programme as open.

## Release rule

Do not bypass branch protection, SSO, independent review or change approval. Do not infer migration success from existing objects, source files, green CI, or directory membership.
