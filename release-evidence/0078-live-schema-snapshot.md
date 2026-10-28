# 0078 Live Schema Snapshot — Staging

Captured read-only on 2026-10-28 from Supabase project `euhubhhnumtibbyufghm` (PostgreSQL 17.11.0.003). No data rows were read or modified. This snapshot supplements the reproducible catalog query in `0078-semantic-parity-audit.sql`.

## Relations and RLS

| Relation | Columns | RLS enabled | FORCE RLS | Policies |
|---|---:|---:|---:|---:|
| `candidate_application_tracker` | 8 | yes | no | 4 |
| `candidate_application_preparation_items` | 13 | yes | no | 4 |
| `candidate_application_preparation_events` | 10 | yes | no | 1 |

Current candidate-owned policies call `private.current_verified_candidate_id()`. The historical 0078 body calls `public.current_verified_candidate_id()`; the ledger records the later helper move at `20261022031206 / move_candidate_identity_helper_to_private_schema`.

## Composite keys and indexes

| Relation | Live indexes material to 0078/Document Vault | Origin / interpretation |
|---|---|---|
| `candidate_application_tracker` | Unique `candidate_application_tracker_id_candidate_uidx (id,candidate_id)`; unique `(candidate_id,saved_opportunity_id)`; owner/update and saved-owner indexes | Composite id/owner index is created by both recovered historical 0078 bodies; other marketplace/tracker indexes come from adjacent migrations. |
| `candidate_application_preparation_items` | PK `(id)`; unique `candidate_application_preparation_items_id_candidate_uidx (id,candidate_id)`; `candidate_application_preparation_owner_tracker_idx (candidate_id,tracker_id,created_at)`; `candidate_application_preparation_items_tracker_owner_idx (tracker_id,candidate_id)` | Historical body 20261019112511 creates the unique composite key required by Document Vault; the 20261019112452 body does not. The tracker-owner index is from 0081. |
| `candidate_application_preparation_events` | PK `(id)`; `candidate_application_preparation_events_owner_time_idx (candidate_id,changed_at DESC)`; `candidate_application_preparation_events_item_idx (item_id)`; `candidate_application_preparation_events_tracker_owner_idx (tracker_id,candidate_id)` | Owner/time index is 0078; item and tracker/owner indexes are from 0081. |

## Constraints observed live

Preparation items include:
- primary key on `id`;
- candidate FK with cascade delete;
- tracker-and-owner composite FK `(tracker_id,candidate_id)` to tracker `(id,candidate_id)` with cascade delete;
- `item_type IN ('DOCUMENT','TASK')`;
- title length 2–160; candidate note ≤1200; source URL ≤1000 and either empty or HTTPS; evidence ≤1000;
- status limited to `NOT_STARTED`, `IN_PROGRESS`, `READY_CANDIDATE_REPORTED`;
- readiness evidence required when the status is `READY_CANDIDATE_REPORTED`.

Preparation events include:
- primary key on `id`;
- item FK, candidate FK and tracker-owner composite FK;
- actor restricted to `CANDIDATE`;
- new status restricted to the three preparation statuses;
- title length 2–160 and evidence reference ≤1000.

Tracker constraints and lifecycle checks include:
- candidate FK;
- saved opportunity + candidate composite owner FK;
- unique `(candidate_id,saved_opportunity_id)`;
- status enum includes candidate-reported `SUBMITTED_CANDIDATE_REPORTED` separately from institution/other responses;
- bounded note/evidence and required evidence for candidate-reported submission.

## Policies, functions and triggers

| Object | Live observation |
|---|---|
| Preparation item policies | SELECT/INSERT/UPDATE/DELETE, each constrained by candidate ownership through `private.current_verified_candidate_id()` |
| Preparation event policy | SELECT own only; no INSERT/UPDATE/DELETE policy observed |
| Tracker policies | SELECT/INSERT/UPDATE/DELETE, each constrained by candidate ownership through private helper |
| `public.record_candidate_application_preparation_event()` | Exists; SECURITY DEFINER; `search_path=""`; owner `postgres`; EXECUTE denied to anon and authenticated |
| `public.record_candidate_application_tracker_event()` | Exists; SECURITY DEFINER; `search_path=""`; owner `postgres`; EXECUTE denied to anon and authenticated |
| Preparation triggers | Insert trigger and targeted status/title/evidence update trigger, both enabled, call the preparation event recorder |
| Tracker triggers | Insert trigger and targeted status/note/evidence update trigger, both enabled, call tracker event recorder |
| `private.current_verified_candidate_id()` | Exists; SECURITY DEFINER with empty search path; owner `postgres`; EXECUTE denied to anon and allowed to authenticated |

## Direct/effective role-table grants — extra delta, not 0078 intent

The read-only query over `information_schema.role_table_grants` for the three target tables showed:
- `anon` has SELECT, INSERT, UPDATE and DELETE listed on each of the tracker, preparation items and preparation events tables.
- `authenticated` has SELECT, INSERT, UPDATE and DELETE on each of those three tables. This exceeds 0078's explicit SELECT-only grant for preparation events.
- The same role-table listing also reports REFERENCES, TRIGGER and TRUNCATE on these target relations, consistent with the broader live ACL issue captured by PR #206. `MAINTAIN` was checked with `has_table_privilege` separately because it is not surfaced by the same listing.

RLS is enabled, and the preparation-events table has only a SELECT policy; grants alone do not bypass RLS. However, these grants are broader than the explicit migration intent and should receive a separate least-privilege review. **Do not assume PR #206 fixes DML:** it deliberately revokes only non-DML privileges and preserves DML behavior.

## Parity conclusion

- The historical body for `20261019112511` is the one matching the live preparation-item composite index requirement.
- The earlier body for `20261019112452` is missing that index; the second body adds it before the first private Document Vault migration at `2026-10-19T11:25:16.758Z`.
- Other present-day helper/index differences are explained by later migrations, especially `20261022031206` and `0081_candidate_document_preparation_detach_and_fk_indexes.sql`.
- This is a read-only schema/catalog comparison, not Candidate A/B runtime isolation proof. Runtime isolation, private document URL ownership/expiry, reviewer decisions, and payment E2E remain separate gates.
