# Kingsmen Staging Security Advisor Audit

**Captured:** 25 November 2026
**Project:** kingsmen-portal-staging (euhubhhnumtibbyufghm)
**Result:** **REMEDIATION REVIEW REQUIRED — DO NOT CHANGE LIVE POLICIES BLINDLY**

This is a read-only snapshot of Supabase advisor findings. It is not a penetration test, it does not prove an exploit exists, and it does not prove that the listed exceptions are safe. No database, policy, function, authentication setting or production release was changed while capturing the report.

## Summary

| Finding | Count | Priority / meaning |
|---|---:|---|
| Public tables | 230 | Current table inventory |
| Public tables with RLS enabled | 230 | RLS is enabled, but policy correctness still needs review |
| RLS-enabled tables without policies | 17 | INFO from advisor; some founder/review tables may intentionally be backend-only, but access restrictions must be tested |
| SECURITY DEFINER functions callable by authenticated role | 6 | WARN; review execute privileges, search_path, ownership and input validation |
| Multiple permissive-policy findings | 16 | WARN; overlapping SELECT policies need authorization and query-plan review |
| Leaked-password protection disabled | 1 | WARN; authentication configuration action needed |
| Unused index findings | 282 | INFO; not an index-removal plan |

## 1. SECURITY DEFINER functions — live check completed

The live PostgreSQL catalogs were queried read-only using `pg_get_functiondef`, `pg_get_function_identity_arguments`, `prosecdef`, `proconfig`, ACL inspection and `has_function_privilege`. Each deployed function body was compared with the selected candidate source body from a historical branch after collapsing whitespace only.

**Result:** all six deployed bodies match their selected historical source candidates after normalization. All six explicitly deny `EXECUTE` to `anon` and `PUBLIC`; all six allow `authenticated` and `service_role`. Five have the fixed search path `pg_catalog, public, kingsmen_security`; the outcome function has `pg_catalog, public`. The live owner is `postgres`.

This materially narrows the finding: the advisor warning means these functions are callable by signed-in users with definer rights; it does **not** establish anonymous access or a mismatch between the live body and reviewed historical source. The remaining P0 requirement is end-to-end negative testing with real authenticated roles and source-to-deployed grant/lineage sign-off.

| Function | Historical source candidate | Body match | Anonymous/PUBLIC execute | Authenticated execute | Key body guard observed |
|---|---|---:|---:|---:|---|
| `get_candidate_cao_choices` | `0096_candidate_application_cao_choice_bridge.sql` | Exact after whitespace normalization | Denied | Allowed | Verified identity and owned parent application |
| `list_candidate_cao_parents` | `0096_candidate_application_cao_choice_bridge.sql` | Exact after whitespace normalization | Denied | Allowed | Verified candidate identity/linkage; candidate-scoped results |
| `save_candidate_cao_choices` | `0096_candidate_application_cao_choice_bridge.sql` | Exact after whitespace normalization | Denied | Allowed | Verified identity, owned draft, consent and constrained choice validation |
| `prepare_candidate_application_from_master_target` | `0096_candidate_application_cao_choice_bridge.sql` | Exact after whitespace normalization | Denied | Allowed | Owned target, active consent, fresh official-source evidence and approved N15 match; creates draft only |
| `prepare_candidate_manual_portal_submission` | `0092_candidate_manual_portal_handoff.sql` | Exact after whitespace normalization | Denied | Allowed | Verified identity, owned application, fresh HTTPS source; manual handoff only and `provider_submission_sent=false` |
| `record_candidate_application_outcome` | `0095_verified_submission_and_outcome_workflow.sql` | Exact after whitespace normalization | Denied | Allowed | Requires an active `APPLICATION_REVIEWER` or `PLATFORM_ADMIN` and verified same-application evidence |

The snapshot stores the candidate branch, source path, Git blob SHA, normalized body lengths, live owner, search path and ACL for every function. This confirms source-body equality and current catalog privileges; it does not replace browser/API tests for Candidate A versus Candidate B, operator versus founder, direct RPC access, or a formal migration-history review.

## 2. RLS-enabled tables with no policy

The advisor reports the following 17 tables have RLS enabled but no RLS policies:

A separate live privilege query checked SELECT, INSERT, UPDATE and DELETE for both `anon` and `authenticated` on all 17 tables. **All 17 deny all eight direct client-role privileges and have zero policies.** This supports classifying them as backend-only candidates, rather than adding broad client policies. The finding stays in the ledger until each table's intended access boundary and service-role usage has been documented and tested.


- candidate_identity_review_audit
- candidate_identity_review_evidence
- candidate_identity_review_requests
- candidate_private_document_reviews
- founder_command_catalog
- founder_command_requests
- founder_command_results
- founder_daily_briefs
- founder_decision_log
- founder_escalation_threads
- founder_mobile_cards
- founder_operator_profiles
- founder_ops_audit_events
- founder_report_sections
- founder_reports
- founder_runtime_config
- founder_watchlist_items

Several are founder-command or identity/document-review audit tables. A deliberate backend-only table may correctly have no client-access policy, provided grants prevent clients from reading or mutating it and the intended service boundary is tested. The audit must classify each table and capture a negative role test; do not add a broad USING (true) policy to silence the advisor.

## 3. Overlapping permissive policies

The live advisor was re-queried read-only on 25 November 2026 at 2026-11-25T14:58:15.089Z. A read-only `pg_policies` query confirmed the active policy names, roles, commands and predicate expressions for the affected tables. The earlier unknown role/action placeholders are replaced below with the actual advisor role/action and policy names; the same structured details and observation time are stored in the JSON snapshot.

The 16 findings are role/action overlap combinations, not 16 proven authorization exploits or 16 independent tables. The `candidate_credentials` and `candidate_sessions` entries repeat public-scoped helper-gated policies across several database roles. Their predicates and real Candidate A/B, operator and founder boundaries still require runtime tests; no live policy changes were made.

| Table | Role | Action | Policies |
|---|---|---|---|
| `applications` | `authenticated` | `SELECT` | `applications_authenticated_own_account_read`, `applications_candidate_read_own`, `applications_founder_operator_read` |
| `candidate_credentials` | `anon` | `SELECT` | `candidate_credentials_founder_operator_read`, `candidate_credentials_service_role_backend_all` |
| `candidate_credentials` | `authenticated` | `SELECT` | `candidate_credentials_founder_operator_read`, `candidate_credentials_service_role_backend_all` |
| `candidate_credentials` | `authenticator` | `SELECT` | `candidate_credentials_founder_operator_read`, `candidate_credentials_service_role_backend_all` |
| `candidate_credentials` | `dashboard_user` | `SELECT` | `candidate_credentials_founder_operator_read`, `candidate_credentials_service_role_backend_all` |
| `candidate_credentials` | `supabase_privileged_role` | `SELECT` | `candidate_credentials_founder_operator_read`, `candidate_credentials_service_role_backend_all` |
| `candidate_profiles` | `authenticated` | `SELECT` | `candidate_profiles_authenticated_own_account_read`, `candidate_profiles_candidate_read_own`, `candidate_profiles_founder_operator_read` |
| `candidate_sessions` | `anon` | `SELECT` | `candidate_sessions_candidate_read_own`, `candidate_sessions_founder_operator_read`, `candidate_sessions_service_role_backend_all` |
| `candidate_sessions` | `authenticated` | `SELECT` | `candidate_sessions_candidate_read_own`, `candidate_sessions_founder_operator_read`, `candidate_sessions_service_role_backend_all` |
| `candidate_sessions` | `authenticator` | `SELECT` | `candidate_sessions_candidate_read_own`, `candidate_sessions_founder_operator_read`, `candidate_sessions_service_role_backend_all` |
| `candidate_sessions` | `dashboard_user` | `SELECT` | `candidate_sessions_candidate_read_own`, `candidate_sessions_founder_operator_read`, `candidate_sessions_service_role_backend_all` |
| `candidate_sessions` | `supabase_privileged_role` | `SELECT` | `candidate_sessions_candidate_read_own`, `candidate_sessions_founder_operator_read`, `candidate_sessions_service_role_backend_all` |
| `candidates` | `authenticated` | `SELECT` | `candidates_authenticated_own_account_read`, `candidates_candidate_read_own`, `candidates_founder_operator_read` |
| `evidence_ledger` | `authenticated` | `SELECT` | `evidence_ledger_candidate_read_own_safe`, `evidence_ledger_founder_operator_read` |
| `route_sources` | `authenticated` | `SELECT` | `route_sources_founder_operator_read`, `route_sources_public_verified_read` |
| `workflow_runs` | `authenticated` | `SELECT` | `workflow_runs_candidate_read_own`, `workflow_runs_founder_operator_read` |

First review priorities are candidate data and session tables, where overlapping candidate, founder/operator and backend policies must not be interpreted as granting a candidate cross-account access. Validate candidate A/B isolation with actual authenticated requests. Consolidation should preserve the same access semantics and must be tested before any policy change is applied.


## 3A. Direct table grants and policy predicates — priority review

A read-only PostgreSQL catalog query inspected 33 live policies on eight high-value tables, 4× privilege matrices for `anon`, `authenticated` and `service_role`, plus seven `kingsmen_security` helper definitions. **Five tables grant all four direct table privileges (SELECT/INSERT/UPDATE/DELETE) to both `anon` and `authenticated` even though RLS is enabled:**

| Table | Anonymous direct grants | Authenticated direct grants | Current policy pattern | Priority |
|---|---|---|---|---|
| `candidate_credentials` | SELECT/INSERT/UPDATE/DELETE | SELECT/INSERT/UPDATE/DELETE | Two `PUBLIC`-scoped policies, guarded by founder/operator or backend-service-context helpers | P0 least-privilege review |
| `candidate_sessions` | SELECT/INSERT/UPDATE/DELETE | SELECT/INSERT/UPDATE/DELETE | Candidate-own read, founder/operator read, backend-service-context ALL, all policy roles `PUBLIC` | P0 least-privilege review |
| `evidence_ledger` | SELECT/INSERT/UPDATE/DELETE | SELECT/INSERT/UPDATE/DELETE | Candidate-safe read is authenticated-only; founder/operator and service-role policies | P0 negative access tests |
| `route_sources` | SELECT/INSERT/UPDATE/DELETE | SELECT/INSERT/UPDATE/DELETE | Public read is restricted to VERIFIED status and confidence A/B; no anon write policy observed | P1 least-privilege review |
| `workflow_runs` | SELECT/INSERT/UPDATE/DELETE | SELECT/INSERT/UPDATE/DELETE | Candidate-own and founder/operator reads; service-role ALL; no anon read policy observed | P0 negative access tests |

The observed helper definitions are JWT-bound: `current_authenticated_candidate_id()` maps `auth.uid()` to `candidate_accounts.auth_user_id`; `current_candidate_public_ref()` reads JWT `app_metadata.candidate_public_ref`; `current_runtime_role()` reads `app_metadata.kingsmen_role` then JWT `role`; `is_founder_or_operator()` checks the resolved role; `is_backend_service_role()` requires both a service-role claim and `service_context=backend_api`. The helper functions deny direct `anon` EXECUTE in the live catalog. These predicates are useful controls, but direct table grants are broader than necessary and they are **not a substitute for real negative API tests**.

The other three reviewed tables—`applications`, `candidate_profiles`, `candidates`—have no direct anon grants. Authenticated access is more narrowly granted and relies on candidate identity, permitted profile update and founder/operator predicates.

**No live privileges, policies or functions were changed.** Do not apply blanket `REVOKE` statements until direct API callers are mapped; some current client flows may call PostgREST directly. The next backend acceptance batch must test anonymous requests, Candidate A against Candidate B records, operator/founder access, and service-role backend context against all five broad-grant tables. Then propose a reviewed forward-only least-privilege migration and apply it only after staging test evidence.

The exact current policy predicates, table grants and helper definitions are stored in `livePolicyOverlapReview` in the machine-readable snapshot. The validator checks their counts and critical privilege findings.

## 4. Authentication setting

Supabase reports leaked-password protection is disabled. Plan an explicit Auth configuration change, verify the setting after change, and test login/registration/password-reset behaviour. This change has not been applied by this audit.

## 5. Unused index report

The advisor reports 282 unused indexes. The snapshot records all 282 entries to provide a review queue.

Do not batch-drop these indexes. Some may support rare but important workflows, foreign-key lookups, release-only paths, or workloads not yet exercised on staging. Use representative query/runtime measurements, constraint and foreign-key checks, and a rollback plan before proposing removal.

## Ordered remediation plan

1. **P0:** Review the six exposed SECURITY DEFINER RPC functions and their grants. Produce a reviewed source-to-deployed function map and negative tests for anonymous, candidate A/B, operator and founder.
2. **P0:** Classify the 17 no-policy RLS tables. Prove backend-only tables are denied to client roles; add least-privilege policies only where a client path is actually required.
3. **P0:** Review overlapping policies and prove candidate A/B and candidate/founder isolation. Consolidate only if equivalent semantics can be demonstrated.
4. **P1:** Enable and verify leaked-password protection in a separately reviewed Auth configuration change.
5. **P2:** Build a measured index review plan. Do not remove indexes from the advisor count alone.
6. Re-run live advisors and staging E2E/security suite; update the release manifest only when each finding has a documented disposition and runtime evidence.

## Artefacts

- Machine-readable advisor snapshot: manifests/rebuild/kingsmen-staging-security-advisor-2026-11-25.json
- Latest audit summary: reports/rebuild/kingsmen-staging-security-advisor-latest.json
- Snapshot validator: scripts/validators/validate-kingsmen-staging-security-advisor.mjs
- Overall Kingsmen status: docs/rebuild/KINGSMEN_SIMPLIFIED_STATUS_AND_COMPLETION_ROADMAP.md
