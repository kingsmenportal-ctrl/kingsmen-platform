# Candidate Draft Schema Compatibility Gate

**Captured:** 26 November 2026  
**Target:** Supabase staging project `euhubhhnumtibbyufghm` (`kingsmen-portal-staging`)  
**Decision:** `BLOCKED_RUNTIME_PREREQUISITES_MISSING`  
**Policy:** This gate is diagnostic only. It does not authorize applying or replaying migrations.

## Evidence baseline

The last recorded read-only staging preflight on 25 November 2026 found:

- The `public.candidate_applications` parent table exists, but has no `kingsmen_status` column.
- `public.candidate_application_events` exists, but its event-type constraint does not allow `APPLICATION_DRAFT_SAVED`.
- `public.candidate_application_draft_answers` is absent.
- `public.get_candidate_application_draft(uuid)` and `public.save_candidate_application_draft(uuid,jsonb,integer,text)` are absent.
- `kingsmen_security.current_verified_kingsmen_candidate_id()` is absent.
- No approved candidate identity-link rows, reusable profile rows, or application fixtures were found.
- The migration ledger has 130 records. The latest observed ledger entry was `20261029193124` / `candidate_self_service_profile_bootstrap_0095`; no ledger name matches for 0096–0098 or 0107–0110 were found.
- Exact stored-SQL body comparison found 30 exact ledger-row matches (29 distinct bodies); 100 rows have no exact body match in the eight-branch source corpus.

These findings are a dated evidence baseline, not a claim that staging was re-queried on 26 November.

## Compatibility decisions

1. Keep the current candidate application UI fail-closed when draft persistence cannot be proven.
2. Do not add a `kingsmen_status` dependency to the existing edge-function query until a reviewed schema change is approved and staged.
3. Do not call or ship draft read/save RPC assumptions while the functions and verified-candidate ownership helper are absent.
4. Do not relax the event constraint or invent a table/RPC contract from the UI alone.
5. Treat migration filename/sequence matches as candidates only. Exact deployed SQL, deployment commit and approval lineage must be established before a migration is considered for execution.
6. Do not apply migrations 0107–0110 or any reconstructed migration until every gate below is satisfied.

## Required gates before staging change

- [ ] Recover exact deployed SQL for each proposed migration; explain every ledger row without exact source-body match.
- [ ] Reconcile duplicate migration names and sequence collisions across historical branches.
- [ ] Review the proposed schema against the live staging catalog, existing constraints, indexes, grants, RLS policies, triggers, and Postgres version.
- [ ] Produce a minimal forward-only migration with explicit preconditions and postconditions; no destructive backfill inferred from empty-table observations.
- [ ] Restore a recent staging backup into an isolated target and rehearse the exact migration sequence there.
- [ ] Run database security review for candidate ownership, RPC execution grants, RLS isolation, and event writes.
- [ ] Obtain recorded change-control approval and confirm the exact target project in the Supabase dashboard.
- [ ] Only then apply the approved migration to staging and rerun the read-only preflight plus role-isolation tests.

## Current result

**No migration is authorized.** The safe next action is to recover missing migration provenance and build a catalog-based compatibility diff in an isolated/restored database. Do not use the UI contract, migration filename, CI fixture, or an empty table as evidence that live staging is compatible.
