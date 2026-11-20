# Kingsmen One — Supabase Live Audit Supplement
**Date:** 17 November 2026  
**Project:** `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`)  
**Audit mode:** Read-only. No SQL, migration, storage or candidate/payment writes.

## Current state
The existing staging project now reports `ACTIVE_HEALTHY`; no replacement project is presently justified.

## Database evidence
- 230 public tables; RLS enabled on all 230.
- Live migration ledger: 130 entries, latest `20261029193124 candidate_self_service_profile_bootstrap_0095`.
- Two duplicate migration names: `candidate_application_preparation_readiness_0078` (versions `20261019112452`, `20261019112511`) and `seed_verified_labour_vacancy_deadlines_0093` (versions `20261029180632`, `20261029180642`).
- Main branch has 35 SQL files under `db/migrations`, 1 under `database/migrations`, and 1 under `supabase/migrations`: 37 source SQL migrations across three roots, not a complete match for the 130-entry live ledger.

## Aggregate data counts
- `candidates`: 2; `candidate_accounts`: 0; `candidate_auth_identity_links`: 0.
- `candidate_master_profiles`: 0; `candidate_profiles`: 0.
- Legacy `applications`: 2; unified `candidate_applications`: 0; `candidate_application_events`: 0.
- `candidate_opportunities`: 4; `candidate_opportunity_matches`: 0; `opportunity_programmes`: 0; `opportunity_providers`: 0; `external_source_observations`: 0.
- `finance_plan_catalog`: 8; `finance_orders`: 0; `finance_payments`: 0.
- `candidate_private_documents`: 0; identity-review requests/evidence: 0.

These are counts only; no personal candidate data was retrieved. The two candidate rows are not linked to verified Auth identities/master profiles. The two legacy application rows are not in the unified parent-application table.

## Security and storage findings
- 17 public tables have RLS enabled but no policies. Classify each as deliberate backend-only or missing a required policy; do not add broad policies blindly.
- 6 authenticated-executable `SECURITY DEFINER` functions are flagged. No anonymous execute privilege was found for these six. Source review showed candidate identity/ownership/consent or reviewer checks, but all require authenticated integration tests.
- Auth leaked-password protection is disabled (WARN).
- Performance advisor: 16 multiple-permissive-policy warnings and 285 unused-index informational findings. No health lints returned.
- Three private buckets exist: legacy `candidate-documents` (10 MiB, PDF/DOCX/TXT), `kingsmen-candidate-documents` (10 MiB, PDF/JPEG/PNG), and `identity-review-evidence` (8 MiB, PDF/JPEG/PNG). The deployed candidate document function v17 uses the Kingsmen bucket; identity evidence upload v4 uses service-role storage access to the identity bucket.
- 21 deployed Edge Functions report ACTIVE. Twenty require JWT; `payfast-sandbox` has JWT verification disabled as a webhook boundary, and source inspection found signature, merchant, IP, amount, payment-state and replay/idempotency checks. Runtime sandbox proof is still required.
- Main has only two Edge Function source directories, so the 21 deployed functions need source/deployment reconciliation before redeployment.

## Next decisions
1. Capture and verify backup/export evidence before any schema changes.
2. Build migration provenance across the 130 live entries, three source roots and relevant unmerged PR branches.
3. Map all 230 tables to canonical, legacy, service-only, duplicate or retirement-after-migration.
4. Prove Candidate A/B identity isolation and profile persistence before processing real candidates.
5. Reconcile function source and deployed versions; test all privileged functions.
6. Consolidate storage only after object inventory and ownership tests.
7. Build the candidate → verified opportunity → Kingsmen application → founder review → truthful candidate update journey on the rebuild branch.

**No database or storage changes were made in this audit.**
