# Candidate draft runtime preflight

**Scope:** repeatable, read-only verification of the live candidate draft prerequisites before a migration can be considered for staging.
**Target project expected:** `euhubhhnumtibbyufghm` (`kingsmen-portal-staging`).
**Status as observed on 25 November 2026:** blocked; do not replay or apply the draft/status migrations.

## Run procedure

1. Open Supabase and independently confirm that the selected project is `euhubhhnumtibbyufghm`.
2. Open the SQL Editor in that staging project.
3. Run the single query in `scripts/staging/kingsmen-candidate-draft-runtime-preflight.sql`.
4. Save the JSON result as review evidence. Do not run any migrations from this report.
5. Re-run after an approved schema migration or security change; compare the ledger tail and required object results.

The SQL is a single `WITH ... SELECT` statement. It does not insert, update, delete, create/drop objects, change grants/policies, or modify Auth. The `projectRefMustBeConfirmedInSupabaseDashboard` flag is intentional: SQL metadata alone does not prove which Supabase project the operator opened.

Offline contract test:

```bash
npm run db:preflight:candidate-draft:validate
```

This test checks that the SQL remains one SELECT-only statement and includes the required ledger, column, table, RPC, helper and event-type checks. It does not connect to staging.

## Last read-only observation

Direct read-only queries against the stated staging project on 25 November 2026 found:

| Check | Observed result |
|---|---|
| Migration ledger | 130 records; 130 distinct version keys |
| Latest ledger entry | `20261029193124` / `candidate_self_service_profile_bootstrap_0095` |
| Ledger name matches for 0096, 0097, 0098 | None |
| Ledger name matches for 0107, 0108, 0109, 0110 | None |
| `public.candidate_applications` | Present |
| `public.candidate_applications.kingsmen_status` | Absent |
| `public.candidate_application_draft_answers` | Absent |
| `public.get_candidate_application_draft(uuid)` | Absent |
| `public.save_candidate_application_draft(uuid,jsonb,integer,text)` | Absent |
| `kingsmen_security.current_verified_kingsmen_candidate_id()` | Absent |
| `APPLICATION_DRAFT_SAVED` event allowance | Absent from `candidate_application_events_event_type_check` |

The selected rebuild branch contains proposed migrations 0107–0110, but a filename is not proof of the exact SQL deployed in staging. The historical source sweep still reports 63 ledger records without a source-name candidate and zero exact deployed-SQL-body provenance matches. Migration replay authorization remains false.

## Release decision

The application draft runtime is **not ready**. Do not enable draft save/resume against staging until migration provenance has been reconciled, backup/restore rehearsal is complete, schema compatibility and RLS/auth isolation have been reviewed, and authorized change control approves the sequence. After that, provision approved non-production test actors and fixture rows; the separate GET-only RLS probe does not create fixtures.
