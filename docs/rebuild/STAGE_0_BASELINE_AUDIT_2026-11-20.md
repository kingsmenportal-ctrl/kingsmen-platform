# Stage 0 — Evidence-backed baseline audit

**Observed:** 20 November 2026, during the connected GitHub/Supabase inspection  
**Repository:** `kingsmenportal-ctrl/kingsmen-platform`, default branch `main`  
**Supabase project:** `kingsmen-portal-staging` / ref `euhubhhnumtibbyufghm`  
**Audit mode:** read-only inspection; no database DDL, data mutation, project pause/restore, payment activation or deployment was performed.

## 1. Corrected live environment status

The connected Supabase API currently reports `kingsmen-portal-staging` as **ACTIVE_HEALTHY**, PostgreSQL 17.11.0.003, region `eu-west-1`. This supersedes older notes that described it as inactive; the project did not require reactivation during this audit.

The same connected Supabase account lists three other projects as INACTIVE:
- `KINGSMEN N8N` — ref `iwtwxxglgnrmttathmsu`
- `ndabenhlemvelo@gmail.com's Project` — ref `nbroufcylcceiwtjwuvq`
- `Ndabenhle` — ref `wjryxydctmqwbjlplkza`

Do not wake or repurpose those projects without reviewing their purpose, data, ownership and cost. No new Supabase project was created.

## 2. Database state

Read-only live metadata/SQL observations:

| Measure | Observed value |
|---|---:|
| Public base tables | 230 |
| Migration-ledger entries | 130 |
| Latest ledger version | `20261029193124` |
| Latest ledger name | `candidate_self_service_profile_bootstrap_0095` |
| Duplicate migration names | 2 pairs |
| Candidate rows | 2 |
| `candidate_profiles` rows | 0 |
| `applications` rows | 2 |
| `candidate_applications` rows | 0 |
| `candidate_master_application_targets` rows | 0 |
| `candidate_auth_identity_links` rows | 0 |
| Candidate identity review requests | 0 |
| Candidate identity review evidence | 0 |
| `document_files` rows | 0 |
| `source_authorities` rows | 56 |
| `opportunity_providers` rows | 0 |
| `opportunity_programmes` rows | 0 |
| Finance plan catalogue rows | 8 |
| Finance orders | 0 |
| PayFast payment intents | 0 |
| Candidate route applications | 0 |
| Audit events | 3 |
| RLS-enabled public tables without policies (advisor result) | 17 |

The data confirms the project is live, but it does not yet demonstrate a working candidate application journey: the two candidate rows have no corresponding profile or Auth identity-link records, the document and identity-review workflow tables observed are empty, and no opportunity providers/programmes are present in those catalogue tables.

The migration ledger contains 130 entries but its last applied record is numbered `0095`. Two migration names are duplicated:
- `candidate_application_preparation_readiness_0078` appears under `20261019112452` and `20261019112511`.
- `seed_verified_labour_vacancy_deadlines_0093` appears under `20261029180632` and `20261029180642`.

Do not replay, rename, delete or rewrite migration history to make it look clean. Reconcile every version, source file, commit, effective database change and dependency. In particular, determine whether the duplicate-named migrations are semantically identical and whether the repository has a valid baseline for the live `candidate_auth_identity_links` table before any new migration is proposed.

## 3. Edge Functions

The project reports 23 active Edge Functions, including candidate profile, master application, identity-review, document, opportunity-source, Founder health and PayFast-sandbox functions. Most report JWT verification enabled. The `payfast-sandbox` function reports `verify_jwt=false`; that may be necessary for a provider ITN callback, but its independent signature, merchant, amount, currency, reference, replay and callback-origin controls must be inspected before treating it as safe. Function activation alone is not proof of end-to-end correctness.

## 4. Security advisor findings observed at audit time

The latest live security-advisor response observed at 20 November 2026 13:56:52 UTC reported:

### RLS enabled with no policy — 17 findings

- `candidate_identity_review_audit`
- `candidate_identity_review_evidence`
- `candidate_identity_review_requests`
- `candidate_private_document_reviews`
- `founder_command_catalog`
- `founder_command_requests`
- `founder_command_results`
- `founder_daily_briefs`
- `founder_decision_log`
- `founder_escalation_threads`
- `founder_mobile_cards`
- `founder_operator_profiles`
- `founder_ops_audit_events`
- `founder_report_sections`
- `founder_reports`
- `founder_runtime_config`
- `founder_watchlist_items`

No-policy does not by itself prove external data disclosure; it can also mean a backend-only table deliberately denies client access. For each table, determine intended roles, effective grants, caller path and whether deny-all is deliberate. Do not add broad policies merely to silence the advisor. Keep sensitive reviewer/Founder tables backend-only where that is the intended model.

### SECURITY DEFINER callable by authenticated users — 6 findings

- `get_candidate_cao_choices(p_application_id uuid)`
- `list_candidate_cao_parents()`
- `prepare_candidate_application_from_master_target(p_target_key text)`
- `prepare_candidate_manual_portal_submission(p_application_id uuid)`
- `record_candidate_application_outcome(p_application_id uuid, p_evidence_ref text, p_outcome_type text, p_provider_reference text, p_summary text, p_next_step text)`
- `save_candidate_cao_choices(p_application_id uuid, p_choices jsonb)`

Inspect definitions, owners, `search_path`, explicit `auth.uid()`/candidate ownership checks and grants. Run positive and negative Candidate A/B tests. Move genuinely internal functions into a non-exposed schema or revoke inappropriate grants; do not indiscriminately revoke an RPC needed by the UI without providing a protected replacement and tests.

### Auth configuration

Leaked-password protection was reported disabled. Enable through the authorised Supabase configuration workflow and verify signup/password behaviour before public candidate access.

Security findings remain open. No production readiness claim is implied by this audit.

## 5. Repository and frontend

- The canonical repo and `main` are accessible through the connected GitHub integration.
- The web app lives in `apps/web` and uses Next.js App Router / React.
- Current `apps/web/package.json` declares `next`, `react`, `react-dom` and `@netlify/plugin-nextjs` as `latest`.
- The current `apps/web/package-lock.json` resolves Next.js to `15.5.19`, React and React DOM to `19.2.7`, but its root metadata still declares `latest`; it also omits `@netlify/plugin-nextjs` even though the manifest lists it. This is a reproducibility/lockfile-consistency issue to fix in a controlled PR.
- The candidate dashboard presents six pathways and navigation, but explicitly states it does not assert that a profile was saved, an opportunity is open, a provider received an application, or payment settled. The workbench currently presents pathway gates and CAO guidance, not an evidenced complete persisted application journey.
- The separate `apps/api` README says its current storage mode is `memory_development_only`; real Supabase/PostgreSQL persistence remains to be proven. Do not use its memory store for production records.
- `netlify.toml` builds from `apps/web` with Node 22 and references `@netlify/plugin-nextjs`. Repository settings, site-to-repository binding, deploy ID and deployed SHA need explicit verification before a deploy claim.

## 6. Existing product work to preserve

Keep the existing web app, candidate and Founder Control Plane components, application and CAO logic, finance catalogue, Jarvis core contracts/policy/evidence ledger, validators, Supabase migrations/functions, design materials and Notion governance index until a file-by-file reuse decision says otherwise. The fact that the repo is large is not permission to delete code or database records.

## 7. Recovery feasibility and boundaries

The Supabase project is currently reachable and healthy, so recovery begins with a safe inventory—not a reactivation attempt. The connected tooling used in this audit did not expose a complete managed-backup inventory or a one-click isolated restore-evidence report. Backup retention, latest recoverable point, storage-object recoverability, billing/plan and isolated restore capability therefore remain **unverified** and must be confirmed in the Supabase project controls before live migrations.

No destructive operation or staging write is authorised by this report. Before a migration PR can be applied: reconcile source/live migration history, confirm an approved encrypted backup including private Storage/metadata, restore to an isolated target, compare relevant row/object counts and hashes where possible, test RLS and app invariants, measure RPO/RTO, and obtain independent review.

## 8. Immediate next actions

1. Pin framework versions to the versions already represented by the lockfile and make the manifest/lock metadata consistent.
2. Inventory repository routes/components, package scripts, CI workflows, Supabase migration files, Edge Function source and deployment wiring.
3. Reconcile migration provenance, especially 0078, 0093 and `candidate_auth_identity_links`.
4. Review security findings table by table/function by function and define explicit role expectations.
5. Establish a safe, reproducible local/test configuration without requiring any paused cloud project.
6. Build the candidate profile → verified opportunity → persisted application → Founder processing → candidate update vertical slice.
7. Keep staging data changes, repository visibility changes, project recreation, payments and production release behind their respective approvals.

## Evidence boundaries

This is an administrative, schema and metadata audit. It does **not** prove authenticated browser E2E, private document upload/download, provider submissions, PayFast sandbox completion, a backup restore, a Netlify deployment, or a candidate outcome. Claims about any of those require separate recorded evidence.
