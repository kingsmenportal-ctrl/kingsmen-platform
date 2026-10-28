# 0078 Historical Body Recovery and Semantic Parity Findings

Date: 2026-10-28  
Environment inspected: Supabase staging `euhubhhnumtibbyufghm`, PostgreSQL 17.11  
Status: **both exact historical bodies recovered from the live migration ledger and correlated with PostgreSQL logs; one index block differs.**

## Historical source recovery

The migration file `db/migrations/0078_candidate_application_preparation_readiness.sql` was retrieved from both:
- PR #120 branch `feat/candidate-application-tracker`
- PR #122 branch `feat/authorised-document-review`

Both references return the exact same Git blob SHA:
`9fdabdde36c981ae305e57df589c168471b7d974`

The staging migration ledger contains two entries with the same name:
- `20261019112452 / candidate_application_preparation_readiness_0078`
- `20261019112511 / candidate_application_preparation_readiness_0078`

Unlike the initial ledger listing, the authoritative `statements` array was also queried. Both rows have `statement_count=1`; `length(statements[1])` is 6,648 for `20261019112452` and 6,983 for `20261019112511`. The first body has no preparation-item composite owner index; the second has it. The PostgreSQL log event timestamps are `2026-10-19T11:24:52.425000` and `2026-10-19T11:25:11.619000`. Exact bodies are preserved at `release-evidence/historical-migrations/`.

## Historical body comparison

- `20261019112452`: `release-evidence/historical-migrations/20261019112452_candidate_application_preparation_readiness_0078.sql`, Git blob SHA `6f3512d330b99206bad7859318dcaf9fdb461c59`, 6,648 chars. Ends at the preparation-item status/title/evidence audit update trigger. It **does not** create the composite unique index `(id,candidate_id)` on preparation items.
- `20261019112511`: `release-evidence/historical-migrations/20261019112511_candidate_application_preparation_readiness_0078.sql`, Git blob SHA `9fdabdde36c981ae305e57df589c168471b7d974`, 6,983 chars. It contains the same body and adds the final composite unique index required by the private Document Vault.
- The canonical source file on PR #120 and #122 is identical to the second body.

## Canonical 0078 semantics

The recovered body:
- creates a unique composite index on `candidate_application_tracker(id, candidate_id)`;
- creates preparation items with owner and tracker-owner constraints, typed items, bounded text fields, HTTPS-only official URLs, allowed status values, and evidence required for `READY_CANDIDATE_REPORTED`;
- creates preparation events with candidate ownership, tracker-owner FK, event-status/title/evidence constraints and timestamp;
- enables RLS on preparation items/events and creates candidate-owner policies;
- grants authenticated users DML on preparation items and SELECT on events;
- creates a SECURITY DEFINER event recorder with empty `search_path`, revokes function execution from PUBLIC/anon/authenticated, and attaches insert/update triggers;
- creates a unique composite index on preparation item `(id, candidate_id)` for the later private Document Vault ownership FK.

## Live semantic parity observations

Read-only staging queries returned:
- all three relations exist: `candidate_application_tracker`, `candidate_application_preparation_items`, `candidate_application_preparation_events`;
- RLS is enabled on all three; `FORCE ROW LEVEL SECURITY` is false, matching the recovered 0078 behavior (the migration only ENABLEs RLS for preparation items/events; tracker was established in 0077);
- preparation item/event columns, defaults and nullability align with the recovered 0078 definitions;
- constraints include the expected tracker-owner composite FK, candidate FK, allowed item type/status/actor checks, HTTPS source constraint, bounded note/evidence fields, and evidence-required readiness constraint;
- insert/update event triggers exist on preparation items and call `public.record_candidate_application_preparation_event()`;
- candidate-owned policies now call `private.current_verified_candidate_id()`, whereas the canonical 0078 body calls `public.current_verified_candidate_id()`.

## Read-only parity snapshot executed against staging

A compact catalog assertion query returned these results:
- all three target tables exist;
- live column counts: tracker 8, preparation items 13, preparation events 10;
- expected 0078 indexes exist: tracker composite `(id, candidate_id)`, preparation-item composite `(id, candidate_id)`, preparation owner/tracker index and event owner/time index;
- expected later-0081 indexes exist: preparation items tracker/owner, preparation events item, and preparation events tracker/owner;
- RLS enabled on tracker/items/events; policy counts are 4/4/1 respectively;
- both preparation-item event triggers exist;
- event recorder is SECURITY DEFINER, has empty search_path, and does not grant EXECUTE to anon or authenticated;
- `private.current_verified_candidate_id()` exists.

These checks support **PASS for the listed structural invariants**. They are not a full byte-for-byte migration reconstruction and do not prove candidate A/B runtime isolation.

## Explained later-migration deltas

The helper schema change is explained by a later migration present in the staging ledger:
`20261022031206 / move_candidate_identity_helper_to_private_schema`.
It is a post-0078 delta, not evidence that the recovered 0078 file itself contains the private-schema helper call.

Additional indexes found in the live schema are accounted for by migration 0081, recovered from PR #121/#122:
`db/migrations/0081_candidate_document_preparation_detach_and_fk_indexes.sql`, blob SHA
`5713c8821777223349b882e4e9e20af63fac3256`.
That migration adds `candidate_application_preparation_items_tracker_owner_idx`, `candidate_application_preparation_events_item_idx`, and `candidate_application_preparation_events_tracker_owner_idx` among other workflow indexes. These must not be attributed to 0078.

## Remaining verification steps

1. Preserve sanitized output from `0078-semantic-parity-audit.sql` with execution time, project ref, operator and future immutable RC1 SHA.
2. Continue the full ordered comparison across 0077 → 0078 → 0079/0080/0081 and later helper-schema migration; do not compare current schema to 0078 in isolation.
3. Separate migration-exact grants from current effective/direct/default ACLs. The current live role-table-grant query shows `anon` has SELECT/INSERT/UPDATE/DELETE on all three tables and `authenticated` has DML grants on preparation events even though 0078 explicitly grants only SELECT there. These extra grants are RLS-gated but should receive a separate least-privilege review; they are not solved by 0097.

## Release decision

The **historical body provenance is now resolved**: both actual SQL statements were retrieved from `supabase_migrations.schema_migrations.statements[1]`, correlated to PostgreSQL log timestamps, and preserved as separate files. The **semantic schema inventory is substantially reconciled**. The remaining work is to attach full catalog output to the exact RC1 SHA and independently review the extra DML grants.
