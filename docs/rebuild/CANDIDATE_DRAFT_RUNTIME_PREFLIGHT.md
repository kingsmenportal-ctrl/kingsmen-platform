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

The selected rebuild branch contains proposed migrations 0107–0110, but a filename is not proof of the exact SQL deployed in staging. A follow-up read-only body-hash capture found exact byte-for-byte source-body matches for 30 ledger records (29 distinct SQL bodies). Another 37 have filename candidates whose bodies differ, and 63 have no filename or body candidate in the eight-branch corpus; 100 of 130 remain without an exact body match. Migration replay authorization remains false.

## Candidate identity-to-RPC alignment finding

A separate SELECT-only review of the live candidate/auth catalog and deployed Edge Function/API source found a split identity model:

| Component | Identity source |
|---|---|
| Deployed `candidate-application-preparation` Edge Function | `candidate_auth_identity_links` for the signed-in Supabase user; link must be VERIFIED and `verified_at` not null |
| Five authenticated application RPCs (master-application preparation, manual portal handoff, and CAO parent/list/save) | `kingsmen_security.current_authenticated_candidate_id()`, which reads `candidate_accounts` |
| Legacy account binding helper | `kingsmen_security.bind_candidate_auth_user`; callable only by service_role/postgres; updates an existing `candidate_accounts` row but does not create one |
| Staging table rows at audit time | `candidate_accounts`: 0; `candidate_auth_identity_links`: 0 |

No deployed Edge Function/API source writer or trigger for the legacy `candidate_accounts` binding was found in the source inventory inspected. This is a code/schema integration gap requiring a forward-only RPC alignment; it is not proof of a cross-candidate data leak. The five candidate RPCs are SECURITY DEFINER with fixed search_path and currently include candidate-ownership checks; do not remove those protections or broaden EXECUTE grants.

A review-only replacement proposal is committed at `scripts/staging/proposals/candidate-application-verified-identity-rpc-alignment.proposal.sql`. It resolves `auth.uid()` through `candidate_auth_identity_links` and requires VERIFIED, non-null, non-future `verified_at`, and non-null `verified_by`. Existing consent, candidate ownership, row locks, official-source checks, reviewer evidence, idempotency and provider-submission boundaries are preserved. Its offline contract test is `scripts/staging/test-candidate-application-verified-identity-rpc-alignment.mjs`.

The SQL file is explicitly **not a migration** and must not be applied directly. The Supabase CLI was not available during authoring; after migration provenance, restore rehearsal and disposable-PostgreSQL validation pass, generate the official forward-only migration with the Supabase CLI, review its body/ACL effects, and obtain change-control approval. No staging functions, grants, RLS, Auth settings or data were changed by this audit.

## Release decision

The application draft runtime is **not ready**. Do not enable draft save/resume against staging until migration provenance has been reconciled, backup/restore rehearsal is complete, schema compatibility and RLS/auth isolation have been reviewed, and authorized change control approves the sequence. After that, provision approved non-production test actors and fixture rows; the separate GET-only RLS probe does not create fixtures.


The body-level evidence and repeatable SELECT-only fingerprint query are recorded in `manifests/rebuild/kingsmen-staging-migration-body-provenance-2026-11-25.json` and `scripts/staging/kingsmen-staging-migration-body-provenance.sql`. These hashes strengthen source identification but do not replace commit/deployment evidence or authorize migration replay.
