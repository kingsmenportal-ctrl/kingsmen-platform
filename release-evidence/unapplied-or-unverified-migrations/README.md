# Unapplied or unverified migration sources

This directory preserves a historical migration source that does not have a matching row in the live staging `supabase_migrations.schema_migrations` ledger observed on 2026-11-19.

- `0087_consolidate_redundant_rls_policies_and_index.sql`: found on historical branch `audit/institution-migration-and-coverage-reconciliation-2026-10-31` at commit `5d3dfda8bf1563436761a3aeb5b365013d99ac0b`. No matching live migration ledger entry was found. It is stored here for provenance only and MUST NOT be executed or moved into an active migration directory unless an explicit schema diff proves it is needed and a reviewed forward-only migration is approved.

No source file is evidence by itself that its SQL was applied. Check the live ledger and recovered migration evidence before every schema change.