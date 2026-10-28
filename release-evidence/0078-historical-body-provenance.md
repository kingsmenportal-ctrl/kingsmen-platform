# Historical 0078 SQL Body Provenance

Captured 2026-10-28 from Supabase staging PostgreSQL logs using the read-only unified logs query.

| Ledger version | Database log timestamp (UTC) | Log source | Extracted SQL body length (characters) | Preserved file |
|---|---|---|---:|---|
| `20261019112452` | `2026-10-19T11:24:52.425000` | `supabase_migrations.schema_migrations.statements[1]` (correlated `postgres_logs`) | 6648 | `historical-migrations/20261019112452_candidate_application_preparation_readiness_0078.sql` |
| `20261019112511` | `2026-10-19T11:25:11.619000` | `supabase_migrations.schema_migrations.statements[1]` (correlated `postgres_logs`) | 6983 | `historical-migrations/20261019112511_candidate_application_preparation_readiness_0078.sql` |

The exact SQL bodies were retrieved directly from `supabase_migrations.schema_migrations.statements[1]`, which holds the body persisted for each version, and corroborated by timestamped PostgreSQL logs from the underlying migration-wrapper requests.

The two bodies were compared directly with the canonical repository file `db/migrations/0078_candidate_application_preparation_readiness.sql`, blob SHA `9fdabdde36c981ae305e57df589c168471b7d974`:
- The first persisted body has 6,648 characters and matches the canonical SQL with the final composite index block removed.
- The second persisted body has 6,983 characters and exactly matches the canonical file.
- The bodies are **not identical**. The second adds the composite unique index `candidate_application_preparation_items(id, candidate_id)`.

## Preserved source artifacts

The files in `historical-migrations/` were replaced with the exact bodies returned from the ledger `statements[1]` values (including the final newline). They are not reconstructed from the current schema. Git blob SHAs after preservation: first `6f3512d330b99206bad7859318dcaf9fdb461c59`; second `9fdabdde36c981ae305e57df589c168471b7d974`.

## Semantic consequence

The first application at `2026-10-19 11:24:52.425 UTC` did not create `candidate_application_preparation_items(id, candidate_id)`. The second application at `2026-10-19 11:25:11.619 UTC` did create it. This is consistent with the subsequent private Document Vault composite ownership foreign key, which requires the candidate owner and preparation-item id to match the same row.

The body capture was read-only. No migration was applied. The evidence proves the actual SQL bodies and timestamps but does not establish whether the second execution was a deliberate repair/replay or an operational retry.
