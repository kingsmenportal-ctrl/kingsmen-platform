# Migration 0078 — Full Reconciliation Matrix

Date: 2026-10-28. Staging: `euhubhhnumtibbyufghm`, PostgreSQL 17.11.  
Result: **both historical SQL bodies recovered directly from the staging migration ledger and PostgreSQL logs; they differ by one composite unique-index block; live schema matches the second body plus documented later migrations.**

## Recovery result

`db/migrations/0078_candidate_application_preparation_readiness.sql` was retrieved from:
- PR #120 branch `feat/candidate-application-tracker`
- PR #122 branch `feat/authorised-document-review`

Both branch references return Git blob SHA `9fdabdde36c981ae305e57df589c168471b7d974` and 6,983 characters. The actual bodies were then retrieved directly from `supabase_migrations.schema_migrations.statements[1]` and cross-checked against `postgres_logs`:

| Ledger version | Log timestamp (UTC) | Ledger statement length | Git blob SHA of preserved body | Composite prep-item owner index |
|---|---|---:|---|---|
| `20261019112452` | `2026-10-19T11:24:52.425000` | 6,648 chars | `6f3512d330b99206bad7859318dcaf9fdb461c59` | Absent |
| `20261019112511` | `2026-10-19T11:25:11.619000` | 6,983 chars | `9fdabdde36c981ae305e57df589c168471b7d974` | Present |

The preserved exact bodies are `release-evidence/historical-migrations/20261019112452_candidate_application_preparation_readiness_0078.sql` and `release-evidence/historical-migrations/20261019112511_candidate_application_preparation_readiness_0078.sql`. Both ledger entries have one statement in the `statements` array. The body lengths and index-presence results were read from the live migration ledger; the exact text was preserved as reviewable files. The two bodies differ only by the final composite index block added in the second body.

## Side-by-side comparison

| Surface | Canonical 0078 body | Live staging | Assessment |
|---|---|---|---|
| Tracker | Unique index on tracker `(id,candidate_id)` | Tracker exists, RLS true, ownership policies/triggers present | Tracker table established in 0077; composite index is a 0078 target. |
| Preparation items | Creates 13 expected fields: ids, type/title, notes, official URL, evidence, status, candidate-required flag, due date, timestamps | Columns/defaults/nullability observed in catalog match canonical body | Semantic match so far. |
| Preparation item constraints | Owner FKs to candidates and tracker composite owner; type/status enum checks; title/note/URL/evidence bounds; HTTPS source; readiness requires evidence | Live catalog contains expected constraints including candidate FK, tracker-owner FK, allowed type/status, bounded fields and evidence guard | Semantic match so far. |
| Preparation events | Event columns, candidate/tracker/item FKs, candidate-only actor, allowed status/title/evidence checks | Live event relation has expected fields and constraints | Semantic match so far. |
| RLS | Enables RLS on items and events; no FORCE RLS | RLS true on tracker/items/events; FORCE RLS false for all three | Expected: tracker RLS came from 0077; 0078 enables items/events. |
| Policies | Items SELECT/INSERT/UPDATE/DELETE owner policies; events SELECT own; source calls `public.current_verified_candidate_id()` | Same ownership policy shape, current expression calls `private.current_verified_candidate_id()` | Later delta explained by `20261022031206 / move_candidate_identity_helper_to_private_schema`. |
| Audit function/triggers | `public.record_candidate_application_preparation_event()`; SECURITY DEFINER, empty search_path, revoked from PUBLIC/anon/authenticated; insert + targeted update triggers | Function exists; item insert and update triggers call it | Semantic match; retain full function config/ACL/owner output with final evidence. |
| Explicit grants | Authenticated CRUD on preparation items; SELECT events | Live grants and defaults include extra pre-existing client ACLs unrelated to explicit 0078 grants | Compare grants with 0078 explicit grants separately from global 0097 hardening. |
| Indexes | Both historical bodies create tracker `(id,candidate_id)`; only the second creates preparation-item `(id,candidate_id)` | Live contains both unique composite indexes, plus 0081 workflow support indexes | The live index set matches the second body. The first body alone would not satisfy the later private-document composite FK. Additional owner/tracker and events-item/tracker-owner indexes map to 0081. |
| Document Vault relationships | Not the core scope of 0078 | Private-document tables and preparation-item composite FK present in live schema | These are later 0079/0080/0081 changes; do not attribute them to 0078. |

## Later migrations explain visible differences

- `20261022031206 / move_candidate_identity_helper_to_private_schema` explains why live RLS policy expressions call the private-schema helper.
- Migration 0081 recovered from PR #121/#122 has blob SHA `5713c8821777223349b882e4e9e20af63fac3256` and adds `candidate_application_preparation_items_tracker_owner_idx`, `candidate_application_preparation_events_item_idx`, `candidate_application_preparation_events_tracker_owner_idx`, plus tracker/document review indexes.
- Migrations 0079/0080/0081 own private document schema, storage policy, reviewer RPC and attachment behavior.
- Therefore the correct parity method is ordered comparison across 0077 → 0078 → 0079/0080/0081 → helper-schema migration, not comparing current state to 0078 in isolation.

## Exact conclusion

- **Historical SQL bodies:** both recovered from the authoritative `statements[1]` array in the staging migration ledger and independently located in PostgreSQL logs at `11:24:52.425 UTC` and `11:25:11.619 UTC` on 2026-10-19.
- **Difference:** the first has 6,648 characters and lacks the final unique index on preparation-item `(id,candidate_id)`; the second has 6,983 characters and includes that index. The preserved body files are byte-identifiable by their Git blob SHAs in the table above.
- **Live semantic schema:** matches the second body for the required composite index, and includes later deltas explained by 0081 and `20261022031206`.
- **Current grants are broader than the explicit 0078 grants:** the live catalog shows `anon` grants for SELECT/INSERT/UPDATE/DELETE on all three target tables; `authenticated` also has DML grants on the event table beyond the 0078 explicit SELECT-only grant. RLS is enabled on all three, but these extra DML grants remain a separate least-privilege issue and are not removed by migration 0097, which only targets non-DML privileges. Track and review separately; do not silently widen PR #206.
- **Remaining catalog task:** retain sanitized full results from `release-evidence/0078-semantic-parity-audit.sql`, including default ACLs, function owner/config/ACL and complete constraint/policy/trigger definitions tied to future immutable RC1 SHA.
