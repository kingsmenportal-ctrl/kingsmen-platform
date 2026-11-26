# Candidate Draft Schema Compatibility Diff — 26 November 2026

**Target:** Supabase project `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`, PostgreSQL 17.11)
**Method:** direct read-only catalog inspection on 26 November 2026
**Decision:** **BLOCKED — incompatible / missing runtime contract**
**Change control:** no DDL, data writes, grants, RLS edits, auth changes, or migration application performed.

## Scope and proposed contract

The candidate-draft runtime contract under review expects:
- `public.candidate_application_draft_answers` as a candidate/application-scoped draft-answer store;
- `public.get_candidate_application_draft(uuid)`;
- `public.save_candidate_application_draft(uuid,jsonb,integer,text)`;
- `kingsmen_security.current_verified_kingsmen_candidate_id()`;
- draft-save event semantics (including `APPLICATION_DRAFT_SAVED`) and safe idempotent retry behavior.

The table and both RPCs, plus the verified-candidate helper, are **absent** from the inspected live catalog. The exact proposed draft-table column list and the exact migration body have not been established from a provenance-verified migration, so this is a live-schema compatibility diff against the named contract—not approval of a guessed DDL definition.

## Diff by object category

| Category | Live staging | Draft contract / compatibility result |
|---|---|---|
| Draft answers table | `public.candidate_application_draft_answers` absent | **Missing blocker.** No column/type/default/nullability/FK diff can be approved until the exact source contract is recovered. |
| Parent application table | `public.candidate_applications` exists: 14 columns, 9 constraints, 7 indexes, 1 non-internal trigger | Reuse existing parent; do not create a competing parent or add `kingsmen_status`. |
| Parent identity | `id uuid`, `candidate_id uuid NOT NULL`, `opportunity_id uuid NOT NULL`; FK to `candidates(id)` and `candidate_opportunities(id)`; unique `(candidate_id, opportunity_id)`; unique `(id,candidate_id)` | A draft answer FK must bind the parent and candidate together (composite owner FK where the child stores both); do not rely on client-supplied candidate IDs. |
| Application status | `status text NOT NULL DEFAULT 'DRAFT'`; check permits `DRAFT`, `READINESS_BLOCKED`, `READY_FOR_REVIEW`, `READY_TO_SUBMIT`, `SUBMISSION_PENDING`, `SUBMITTED_CONFIRMED`, `PROVIDER_REVIEW`, `SHORTLISTED`, `INTERVIEW`, `OFFERED`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `CANCELLED`, `MANUAL_ACTION_REQUIRED`, `EXPIRED` | **Semantic collision risk.** Use the existing `status` as the canonical lifecycle. A parallel `kingsmen_status` would create competing status truth and is not present in staging. Draft-save should not imply provider submission or advance the application beyond its existing lifecycle rules. |
| Application event table | `public.candidate_application_events` exists: 12 columns, 5 constraints, 4 indexes, 1 trigger | It is an append-only lifecycle audit table today, not a draft-answer store. |
| Event constraint | `candidate_application_events_event_type_check` allows `APPLICATION_CREATED`, `READINESS_CHECKED`, `STATUS_CHANGED`, evidence/submission/provider/outcome events and `CAO_CHOICES_UPDATED`; excludes `APPLICATION_DRAFT_SAVED` | Proposed event is incompatible without an explicit forward-only constraint change or a separately designed draft event stream. Do not weaken/recreate the check blindly. |
| Event integrity | Unique `event_ref`; FK to application and candidate; `n06_application_event_no_update` blocks UPDATE/DELETE | Preserve append-only behavior. Draft event writes must bind to the same application and candidate and remain idempotent. |
| Existing master profile | `candidate_master_profiles`: 8 columns, 5 constraints, 2 indexes; RLS enabled, not forced; 3 owner policies | This is profile persistence, not application draft answers. Its consent/profile fields do not replace the missing draft table. |
| Existing master targets | `candidate_master_application_targets`: 15 columns, 10 constraints, 6 indexes; RLS enabled, not forced; 3 owner policies | This is target planning. It has candidate-scoped target uniqueness and a composite FK `(application_id,candidate_id)` to the parent, but it is not a draft-answer table. |
| Existing master events | `candidate_master_application_events`: 7 columns, 5 constraints, 3 indexes; RLS enabled, not forced; 2 owner policies | Only `PROFILE_SAVED` and `TARGETS_PLANNED` are allowed. Unique `(candidate_id,event_type,idempotency_key)` is useful precedent, not proof of draft-save semantics. |
| Draft read/save RPCs | Both expected signatures absent | **Missing blocker.** No live routine privilege, search_path, ownership, error behavior, or idempotency semantics can be approved. |
| Identity helper | `kingsmen_security.current_authenticated_candidate_id()` exists; it is SECURITY DEFINER, owned by postgres, EXECUTE for authenticated; configured search_path `pg_catalog, public, auth` | It is not equivalent to the absent `current_verified_kingsmen_candidate_id()`. Do not substitute without reviewing the helper definition and the verified identity-link contract. |
| Table RLS/grants | `candidate_applications` and `candidate_application_events`: RLS on, not forced; one `service_role` ALL policy each. Table grants shown for `service_role` and owner `postgres`; no `anon` or `authenticated` grants surfaced. | Direct authenticated table access is not the current route. New candidate access should go through reviewed RPC/API boundaries with explicit grants and ownership checks. |
| Trigger/status guard | `candidate_application_submission_truth_guard` runs before insert or updates of status/candidate; prevents statuses from `SUBMITTED_CONFIRMED` onward without verified provider receipt/reference evidence for the same application and candidate | Preserve this guard. A draft-save must not bypass or falsify provider evidence. |
| Indexes | Parent indexes include unique application ref, unique candidate/opportunity, unique (id,candidate), candidate+updated, status+updated, opportunity; events have unique event_ref and application+created index | Add only indexes justified by the verified draft table access patterns; no duplicate parent indexes. |
| Postgres | 17.11.0.003 | Rehearsal target must match compatible engine and extensions; this observation alone is not a restore rehearsal. |

## Index, trigger, policy and grant observations

### Parent and event tables
- `candidate_applications`: RLS enabled; not forced; policy `n06_service_role_applications` grants ALL to `service_role` with `USING (true)` and `WITH CHECK (true)`.
- `candidate_application_events`: RLS enabled; not forced; policy `n06_service_role_application_events` grants ALL to `service_role` with `USING (true)` and `WITH CHECK (true)`.
- Existing event trigger: `n06_application_event_no_update` calls `prevent_candidate_application_event_mutation()`, raising an exception on UPDATE or DELETE.
- Existing parent trigger: `candidate_application_submission_truth_guard` calls `guard_candidate_application_submission_truth()`, a SECURITY DEFINER trigger function with empty search_path. It enforces verified provider evidence for submitted-or-later statuses.

### Master profile / planning tables
- `candidate_master_profiles`: authenticated SELECT/INSERT/UPDATE policies compare `candidate_id` with `kingsmen_security.current_authenticated_candidate_id()`; insert/update also tie `last_saved_by_auth_user_id` to `auth.uid()`.
- `candidate_master_application_targets`: authenticated SELECT/INSERT/UPDATE policies enforce candidate ownership; insert/update constrain planning-only state and unverified source confidence. Composite owner FK prevents linking a target to another candidate's application.
- `candidate_master_application_events`: authenticated SELECT/INSERT policies enforce candidate ownership and `actor_auth_user_id = auth.uid()` on insert. Its idempotency uniqueness is scoped by candidate and event type.

## Status semantics

Canonical live status is `candidate_applications.status`. It is a constrained lifecycle field, not a generic draft-save timestamp. Existing event types distinguish creation, readiness, status changes, evidence, submission attempts/dispatch, provider acknowledgements/outcomes and review decisions. The status guard requires verified provider evidence before setting submitted-or-later states. A draft write should persist answers without claiming submission, and save/retry should not create duplicate audit events.

## Security findings (catalog evidence only)

1. **Candidate ownership:** current parent/application tables are service-role-only at the table policy layer. Existing master tables use the authenticated-candidate helper. The new verified helper and draft RPCs are absent, so draft ownership cannot pass review.
2. **Anonymous denial:** no `anon` table grants were surfaced for the parent/event tables and draft RPCs are absent. This supports a catalog-level deny for direct table grants, but does **not** prove HTTP/API anonymous denial; no anonymous request test was executed.
3. **Cross-candidate isolation:** existing master-table policy predicates are candidate-scoped, and the target-to-application composite FK binds ownership. No Candidate A/B runtime test was run. The draft contract remains unverified.
4. **RPC privileges:** draft RPC privilege review is impossible because the RPCs are absent. Existing unrelated SECURITY DEFINER application RPCs are executable by `authenticated`; Supabase's security advisor flagged six authenticated-callable SECURITY DEFINER routines, including `prepare_candidate_application_from_master_target` and `record_candidate_application_outcome`. Review each routine's ownership check, search_path, effective grants and call boundary before reusing patterns.
5. **Idempotency:** master events have a unique candidate/type/key constraint; master targets have unique candidate/target key and a non-unique candidate/idempotency index. No draft-specific unique request key exists because the draft table/RPC is absent. An index alone does not enforce idempotency.
6. **Event integrity:** parent events are append-only and have unique event_ref; master events are candidate-scoped with unique idempotency key but no user-defined trigger was found on that table. Draft audit design must be explicit about immutable event rows, owner binding, duplicate retries and transactional answer+event writes.

## Required follow-up gates

- [ ] Recover exact full SQL for the proposed migration and resolve historical duplicate-name/source-body collisions.
- [ ] Freeze the exact proposed table columns, keys, constraints, indexes, triggers, RLS, grants, helper and RPC definitions from provenance-verified source.
- [ ] Restore a recent encrypted backup into a separate isolated environment; verify restore timestamp, target identity and data minimization; rehearse the exact reviewed sequence there. A fresh Supabase development branch is not a restored backup.
- [ ] Run anonymous HTTP/API denial and authenticated Candidate A/B reciprocal isolation tests against that isolated target.
- [ ] Test RPC grants with anon/authenticated/service roles, ownership spoof attempts, idempotent identical retry, changed-payload retry, event duplication and event mutation denial.
- [ ] Obtain independent security review and recorded change-control approval.
- [ ] Only then prepare the smallest forward-only migration, re-run compatibility checks, and request staging application authorization.

## Execution record

- Catalog inspection: completed, read-only, 26 November 2026.
- Compatibility result: **BLOCKED**.
- Backup acquired/restored: **not done**.
- Migration rehearsal: **not done**.
- Runtime security tests: **not done**.
- Migration approval/application: **not authorized / not performed**.
