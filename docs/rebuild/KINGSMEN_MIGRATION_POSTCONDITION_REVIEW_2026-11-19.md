# Kingsmen Migration Source Postcondition Review

**Audit date:** 19 November 2026  
**Live project:** `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`)  
**Scope:** Read-only postcondition comparison for two historically located migration candidates. No SQL was applied.

## Result summary

Two entries previously listed as source gaps now have historical candidate files, and their expected postconditions were compared with the current live schema.

| Ledger entry | Source candidate | Read-only live result | Provenance conclusion |
|---|---|---|---|
| `20261012155914 rls_helper_search_path_hardening_0020` | `db/migrations/0020_rls_helper_search_path_hardening.sql`, commit `303d692b60f36d6a5f26f6ba45e397d8500b1852`, blob `f0c7000903ab0a414866a89912747b3afc6571b9` | All 7 target helper functions exist under `kingsmen_security`. Their live `proconfig` includes `search_path=pg_catalog`; anonymous EXECUTE is false for all seven. | **Postconditions match.** This is not proof that the original SQL bytes equal the candidate file. |
| `20261012160432 foreign_key_index_hardening_0021` | `db/migrations/0021_foreign_key_index_hardening.sql`, commit `303d692b60f36d6a5f26f6ba45e397d8500b1852`, blob `99cc79aaea2e3b4f7f8a47211949396d9f4cb114` | All 36 listed indexes exist by exact name. Each expected table and column exists, and the index's leading key column matches the migration's column. | **Postconditions match.** This is not proof that the original SQL bytes equal the candidate file. |

## 0020 — RLS helper search-path hardening

The candidate sets `search_path = pg_catalog` for these seven helpers:

- `current_runtime_role()`
- `current_service_context()`
- `current_candidate_public_ref()`
- `is_backend_service_role()`
- `is_founder_or_operator()`
- `is_founder()`
- `current_candidate_id()`

For all seven live functions, the catalog check returned the intended fixed search path and no `anon` EXECUTE privilege. `authenticated` does have EXECUTE for these helpers, which is consistent with an RLS helper design in which the functions make their own role/identity decision; it is not enough on its own to establish application security.

## 0021 — FK index hardening

The live catalog contains all 36 expected indexes from the candidate source, including indexes on Airtable sync, application workbench, approval requests, audit events, candidate messages/sessions/success/support, CAO choices, command logs, dead-letter queue, document readiness/requests, finance invoices/orders/payments/refunds, founder command requests, MAP packages, NSFAS cases, PayFast intents, route programmes/providers/snapshots/sources and workflow runs.

The comparison checked exact index name, table existence, column existence, and the leading index key column. It did not run performance tests or prove that the historical SQL was the exact migration that produced each index.

## Limits and next action

- These are source-candidate and catalog-postcondition findings; no applied-SQL hash exists in the live migration ledger.
- The current database contains the expected end state for these two migrations, so they should not be blindly replayed.
- Review the other 28 historical branch candidates individually. Preserve their source commit and blob reference; compare their postconditions against catalog facts where practical.
- The only two entries still without a matching source in the checked branch inventory remain:
  - `20261029143144 canonical_package_benefits_universal_accommodation_20261029`
  - `20261029143414 seed_canonical_public_package_cards_20261029`
- Do not apply migrations, change grants or restore a backup to the live project as part of this review.

## Change record

Read-only GitHub source retrieval and Supabase catalog queries only. No live tables, indexes, functions, grants, application data, or Edge Functions were changed.
