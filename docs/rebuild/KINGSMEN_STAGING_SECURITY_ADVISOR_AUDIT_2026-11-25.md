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

## 1. SECURITY DEFINER functions — first P0 review

All six listed functions are currently callable by the authenticated role through Supabase RPC and run as SECURITY DEFINER. That fact alone does not prove exploitability. For each function, review the body, fixed search_path, ownership checks (typically candidate identity mapped to auth.uid()), allowed state transitions, input bounds, audit records and exact EXECUTE grants. Verify whether calls should be browser-accessible at all or must be restricted to service role/backend.

| Function | Arguments | Required review |
|---|---|---|
| get_candidate_cao_choices | p_application_id uuid | Confirm caller role, search_path, ownership/state guards, grants and audit semantics |
| list_candidate_cao_parents | none | Confirm caller role, search_path, ownership/state guards, grants and audit semantics |
| prepare_candidate_application_from_master_target | p_target_key text | Confirm caller role, search_path, ownership/state guards, grants and audit semantics |
| prepare_candidate_manual_portal_submission | p_application_id uuid | Confirm caller role, search_path, ownership/state guards, grants and audit semantics |
| record_candidate_application_outcome | p_application_id uuid, p_evidence_ref text, p_outcome_type text, p_provider_reference text, p_summary text, p_next_step text | Confirm caller role, search_path, ownership/state guards, grants and audit semantics |
| save_candidate_cao_choices | p_application_id uuid, p_choices jsonb | Confirm caller role, search_path, ownership/state guards, grants and audit semantics |

Recommended review sequence: inspect the current migration/function definition and deployed function signature; map every browser/API caller; run negative tests as anonymous, Candidate A, Candidate B, operator and founder; then prepare a separate migration to narrow grants or change execution semantics if evidence warrants it. Do not disable a function before callers and safe fallback are understood.

## 2. RLS-enabled tables with no policy

The advisor reports the following 17 tables have RLS enabled but no RLS policies:

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

The advisor reports 16 overlapping permissive-policy combinations. These are not all independent tables; multiple combinations can arise from the same table for different roles. The full policy names, role and action are recorded in the JSON snapshot.

| Table | Role | Action | Policies |
|---|---|---|---|
| applications | unknown | unknown |  |
| candidate_credentials | unknown | unknown |  |
| candidate_credentials | unknown | unknown |  |
| candidate_credentials | unknown | unknown |  |
| candidate_credentials | unknown | unknown |  |
| candidate_credentials | unknown | unknown |  |
| candidate_profiles | unknown | unknown |  |
| candidate_sessions | unknown | unknown |  |
| candidate_sessions | unknown | unknown |  |
| candidate_sessions | unknown | unknown |  |
| candidate_sessions | unknown | unknown |  |
| candidate_sessions | unknown | unknown |  |
| candidates | unknown | unknown |  |
| evidence_ledger | unknown | unknown |  |
| route_sources | unknown | unknown |  |
| workflow_runs | unknown | unknown |  |

First review priorities are candidate data and session tables, where overlapping candidate, founder/operator and backend policies must not be interpreted as granting a candidate cross-account access. Validate candidate A/B isolation with actual authenticated requests. Consolidation should preserve the same access semantics and must be tested before any policy change is applied.

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
