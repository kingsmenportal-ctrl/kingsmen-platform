# Candidate Draft: Live Catalog and Migration Provenance Evidence

**Observed:** 26 November 2026  
**Target project:** `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`)  
**Change performed:** read-only SQL inspection only. No DDL, data writes, grants, policy changes, auth changes, or migration replay.

## Fresh staging observations

The staging catalog was queried directly on 26 November. It confirms the following for the draft persistence contract:

- `public.candidate_applications` exists with `id`, `candidate_id`, `application_ref`, `opportunity_id`, `pathway_type`, `status`, `readiness_status`, `readiness_snapshot`, and timestamps. It has no `kingsmen_status` column.
- `public.candidate_application_events` exists. Its event constraint allows lifecycle events such as `APPLICATION_CREATED`, `STATUS_CHANGED`, and `CAO_CHOICES_UPDATED`, but not `APPLICATION_DRAFT_SAVED`.
- `public.candidate_application_draft_answers` is absent from the catalog.
- `public.candidate_master_profiles`, `public.candidate_master_application_targets`, and `public.candidate_master_application_events` exist. They represent a different profile/target-planning contract and must not be treated as an interchangeable draft-answer store.
- The inspected routine inventory did not return `get_candidate_application_draft(uuid)`, `save_candidate_application_draft(uuid,jsonb,integer,text)`, or `kingsmen_security.current_verified_kingsmen_candidate_id()`. A related `kingsmen_security.current_authenticated_candidate_id()` is referenced by the existing master-application RPC and is not automatically equivalent to verified identity.
- The existing `candidate_applications.status` constraint is a defined lifecycle enum; adding a parallel status column without a migration design would create competing status truth.

## Exact deployed SQL recovered

A read-only query retrieved the stored statement prefixes from the live migration ledger for the two duplicate `candidate_application_preparation_readiness_0078` entries and the three `unified_candidate_master_application*` migrations. The two duplicate entries are not identical:

| Ledger version | Migration name | Stored statement bytes | MD5 of stored SQL |
|---|---|---:|---|
| `20261019112452` | `candidate_application_preparation_readiness_0078` | 6,648 | `29d41244fba46e7bae4f834ac9f45078` |
| `20261019112511` | `candidate_application_preparation_readiness_0078` | 6,983 | `2956a7efc73c46f53baccc1c7365e128` |
| `20261025110908` | `unified_candidate_master_application` | 7,269 | `84389ddd392ac5f18a819bc7d1d23244` |
| `20261025110918` | `unified_candidate_master_application_rpc` | 5,043 | `491adb5beaa0b1134ca21cdd8d09d4bd` |
| `20261025111050` | `unified_master_application_source_confidence_guard` | 584 | `2965fca7cd71b269ebb869cb29c47637` |

This is useful recovery evidence but not a complete archival export of the deployed SQL bodies. The duplicate 0078 records have different statement lengths and hashes, proving that filename identity alone is insufficient. Preserve each as a separate ledger event and do not rewrite ledger history.

## Compatibility decision

**Result: BLOCKED — no candidate-draft migration is safe to apply yet.**

1. Do not replay migrations 0107–0110 or reconstruct a migration from its filename.
2. Do not assume the master-profile RPC is the draft API. It has different semantics and requires `current_authenticated_candidate_id()`.
3. Do not add `kingsmen_status` as an ad hoc patch. The live table already has `status` and a check constraint; decide on one canonical status contract.
4. Before proposing the smallest forward-only migration, recover complete stored SQL bodies (restricted access; preserve hashes), match exact Git blob hashes across all reachable commits/tags and deployment artifacts, and document unresolved records.
5. Compare complete table/constraint/index/trigger/RLS/grant/function definitions against the proposed migration. The inventory query is saved at `scripts/staging/kingsmen-candidate-draft-schema-catalog-audit.sql`.
6. Restore a recent backup to an isolated database, rehearse the exact migration there, and test candidate A/B ownership, anonymous denial, authenticated cross-candidate denial, RPC execution grants, idempotency, event audit, and rollback/restore.
7. Require security review and explicit change-control approval before applying anything to staging.

## Evidence limits

- The staging catalog and selected ledger records were freshly queried on 26 November.
- This was not a full dump of all 130 deployed migration statements.
- No backup restore rehearsal was run because no isolated restored database/backup evidence was available through the inspected project state.
- No candidate fixtures or identity links were created.
- No migrations were applied. Candidate draft persistence remains blocked.
