# Migration 0078 — Full Reconciliation Matrix

Date: 2026-10-28. Staging: `euhubhhnumtibbyufghm`, PostgreSQL 17.11.  
Result: **canonical source recovered; live semantics substantially reconciled; exact per-ledger historical body provenance not recoverable from currently available artifacts.**

## Recovery result

`db/migrations/0078_candidate_application_preparation_readiness.sql` was retrieved from:
- PR #120 branch `feat/candidate-application-tracker`
- PR #122 branch `feat/authorised-document-review`

Both return the exact same Git blob SHA `9fdabdde36c981ae305e57df589c168471b7d974` and 6,983 characters.

The staging ledger contains:
- `20261019112452 / candidate_application_preparation_readiness_0078`
- `20261019112511 / candidate_application_preparation_readiness_0078`

The migration ledger records version/name, not body content or body hash. Commit searches for the filename and second version string returned no historical artifacts establishing two executed bodies. The RC1 base does not have this migration at the queried path, and no deployment runner artifact/body hash was exposed by connected tools. **Therefore the exact SQL executed under each ledger version cannot be individually proven.** Do not fabricate a second historical body or treat current schema as proof of the executed bytes.

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
| Indexes | Tracker composite unique; items owner/tracker/time; events owner/time; unique items `(id,candidate_id)` | Canonical indexes plus later workflow support indexes | Additional items-tracker and events-item/tracker-owner indexes map to 0081. |
| Document Vault relationships | Not the core scope of 0078 | Private-document tables and preparation-item composite FK present in live schema | These are later 0079/0080/0081 changes; do not attribute them to 0078. |

## Later migrations explain visible differences

- `20261022031206 / move_candidate_identity_helper_to_private_schema` explains why live RLS policy expressions call the private-schema helper.
- Migration 0081 recovered from PR #121/#122 has blob SHA `5713c8821777223349b882e4e9e20af63fac3256` and adds `candidate_application_preparation_items_tracker_owner_idx`, `candidate_application_preparation_events_item_idx`, `candidate_application_preparation_events_tracker_owner_idx`, plus tracker/document review indexes.
- Migrations 0079/0080/0081 own private document schema, storage policy, reviewer RPC and attachment behavior.
- Therefore the correct parity method is ordered comparison across 0077 → 0078 → 0079/0080/0081 → helper-schema migration, not comparing current state to 0078 in isolation.

## Exact conclusion

- **Canonical source on PR #120 and #122 refs:** identical (same blob SHA).
- **Two actual executed bodies:** cannot be individually recovered/proven from currently exposed artifacts; ledger has only version/name, no body checksum, and connected historical artifact search produced none.
- **Semantic schema:** substantial observed match for columns, constraints, ownership policies, event function/triggers. Observed helper/index differences are explained by later migrations.
- **Remaining catalog work:** archive full output for grants/default ACLs, function ownership/ACL, all constraints/indexes/policy expressions/triggers, and compare against complete ordered migration chain.

## To close provenance

1. Obtain the migration runner/deployment artifact for `20261019112452` and its exact SQL/body hash.
2. Obtain the corresponding artifact for `20261019112511`.
3. Compare each body/hash to canonical blob `9fdabdde36c981ae305e57df589c168471b7d974`.
4. If artifacts are gone, log an explicit provenance gap; use canonical source as reconstruction reference only, never as proof of what was executed.
5. Run `release-evidence/0078-semantic-parity-audit.sql` read-only and save results with UTC timestamp, staging project ref, operator and future immutable RC1 SHA.
