# Historical 0078 SQL Body Provenance

Captured 2026-10-28 from Supabase staging PostgreSQL logs using the read-only unified logs query.

| Ledger version | Database log timestamp (UTC) | Log source | Extracted SQL body length (characters) | Preserved file |
|---|---|---|---:|---|
| `20261019112452` | `2026-10-19T11:24:52.425000` | `postgres_logs` | 6647 | `historical-migrations/20261019112452_candidate_application_preparation_readiness_0078.sql` |
| `20261019112511` | `2026-10-19T11:25:11.619000` | `postgres_logs` | 6982 | `historical-migrations/20261019112511_candidate_application_preparation_readiness_0078.sql` |

The query extracts the SQL body from the logged `statement: begin; ... -- apply sql from post body` event, stopping immediately before the Supabase migration-wrapper statement-history insert. The wrapper log also records the same body within its migration `statements` array.

The two bodies were compared directly with the canonical repository file `db/migrations/0078_candidate_application_preparation_readiness.sql`, blob SHA `9fdabdde36c981ae305e57df589c168471b7d974`:
- The first log body exactly matches the canonical body with the final composite index block removed.
- The second log body exactly matches the canonical body when the repository file's terminal newline is excluded.
- The bodies are **not identical**. The second adds the composite unique index `candidate_application_preparation_items(id, candidate_id)`.

## Preserved source artifacts

The files in `historical-migrations/` were created from the bodies returned by the database log query, rather than reconstructed from the current schema.

## Semantic consequence

The first application at `2026-10-19 11:24:52.425 UTC` did not create `candidate_application_preparation_items(id, candidate_id)`. The second application at `2026-10-19 11:25:11.619 UTC` did create it. This is consistent with the subsequent private Document Vault composite ownership foreign key, which requires the candidate owner and preparation-item id to match the same row.

The body capture was read-only. No migration was applied, and this documentation does not establish whether the two applications were a deliberate repair/replay versus an operational retry; the available database event proves the SQL bodies and timestamps, not the operator's intent.
