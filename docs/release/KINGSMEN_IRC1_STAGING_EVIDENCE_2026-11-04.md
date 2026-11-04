# Kingsmen IRC-1 — staging evidence and release blockers

**Snapshot:** 4 November 2026  
**Repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Canonical frontend review:** [PR #316](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/316)  
**Supabase staging:** `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`)  
**Netlify staging:** `kingsmen-portal-staging` (`fb27d0db-b116-4890-8f7f-14e654c27dbc`)

This is a read-only, point-in-time release audit. It distinguishes tracked implementation, CI evidence, live backend state, and authenticated runtime/deployment evidence. It is not a release approval.

## 1. Canonical frontend integration

PR #316 is the only open frontend integration stream, based on `main`. Overlapping PRs #317 and #318 were closed as superseded (not merged); their branches and review history remain available. Selected functional code from #317 and the branch-protection verifier from #318 were reconciled into #316. The static prototype/preview files remain reference material, not the production application. The production application remains the existing Next.js app under `apps/web/src/app`; the static `apps/web-frontend/` prototype surface is not a replacement portal.

The current PR includes:
- Premium Kingsmen homepage and six universally accessible pathways.
- Seven canonical paid products and plan-review handoff; a browser-selected plan is not an order or entitlement.
- Registration, sign-in, auth callback, sign-out and the reusable candidate master-profile UI.
- N15 opportunity matching/filtering and an evidence-labelled save action.
- The authenticated candidate application workbench: one parent-application preparation flow, candidate-owned saved routes, parent records and preparation trackers.
- Private Document Vault for PDF/JPEG/PNG up to 10 MiB. The current component uses a short-lived signed upload capability, raw file-body Storage PUT, server-side finalisation/integrity checks, candidate-reported status, and expiring private read links. It does not let a candidate verify their own document.
- Cross-sector pathway choice for bursary, NSFAS, accommodation and private-college support. The browser must choose a compatible pathway; the save Edge Function validates the choice. It no longer silently picks the first pathway.
- PayFast sandbox checkout and evidence-labelled return/cancel pages. A browser return is not proof of payment; verified ITN settlement is required before entitlement.
- Application tracker route and evidence-bound status language.

The candidate save Edge Function persists a verified opportunity and master target, calls the guarded parent-application preparation RPC, and links the preparation tracker. The application-preparation Edge Function loads saved targets, parent applications, trackers and checklist records. These are source-level/API integrations; actual candidate browser journeys remain to be proven.

## 2. GitHub CI and main branch protection

**Latest inspected PR head:** `f0c8ee4e3e4012acc9d26ea817d1e699d434f70e`.

Exact-head GitHub Actions evidence:
- [Kingsmen CI run 41872617599](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/41872617599): `validate` succeeded and `test-and-build` succeeded, including repository validation, API build and Next.js production build.
- [Main branch protection evidence run 41872617847](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/41872617847): succeeded and uploaded a redacted read-only ruleset artifact.
- [Jarvis Live Runtime run 41872617590](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/41872617590): succeeded. This does not prove the candidate portal runtime.

The latest ruleset artifact `kingsmen-main-branch-protection-41872617847` reported, for `main`, on 4 November 2026 at 16:57:01 UTC:
- Active `main-branch-protection` ruleset, HTTP 200.
- Main branch targeted and ruleset enforced.
- Required status checks enabled: `validate` and `test-and-build`.
- Strict status checks enabled.
- Pull-request review required with **one approving review**.
- No bypass actors.
- Force-push disabled and branch deletion disabled.

This supersedes the older 3 November protection snapshot that reported zero required reviews/checks. The active ruleset is now evidenced; the pull request still requires an actual approving review. PR #316 currently has a `COMMENTED` review from `ndabenhlemvelo-arch`, which is not an approval; a fresh review is requested.
The live ruleset also reports `dismiss_stale_reviews_on_push=false` and `require_last_push_approval=false`. No approval currently exists on PR #316, but these settings should be hardened so a future approval cannot remain valid after a new push without review.
The reviewer requested runtime evidence for Candidate A/B isolation, profile persistence, private document ownership/expiry, PayFast ITN replay/recovery and a deploy tied to the reviewed SHA.

No direct-`main` commit or protection bypass was performed.

## 2A. Live anonymous authorization smoke

A new read-only staging workflow ran against Supabase staging on 4 November 2026:
- Workflow: [Kingsmen Staging Read-only Authorization Smoke run 41872584250](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/41872584250).
- Commit under test: `da78e9114d8e78a3370da255aa41747f02a137ba`.
- Result: `STAGING_E2E_PASSED`, 6 cases, 6 passed, 0 failed, with mutations disabled.
- Six anonymous requests to candidate master profile, private documents, application preparation, verified-opportunity save, N15 candidate opportunities and identity-review request each returned HTTP 401.
- Redacted report artifact: [kingsmen-staging-anonymous-api-smoke-41872584250](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/41872584250/artifacts/13345970078).

This proves anonymous requests are rejected by those staging API entry points. It does not prove authenticated Candidate A/B ownership, reviewer authorization or successful candidate operations.

## 3. Supabase Edge Function source alignment

Staging is active on PostgreSQL 17.11. The tracked PR #316 source was byte-compared with the currently deployed function source for all five dependencies below; each matched exactly at inspection time:

| Edge Function | Staging version | Gateway JWT verification |
|---|---:|---|
| `candidate-application-preparation` | 16 | Enabled |
| `candidate-master-profile` | 3 | Enabled |
| `candidate-private-documents` | 16 | Enabled |
| `candidate-save-verified-opportunity` | 3 | Enabled |
| `payfast-sandbox` | 9 | Disabled at gateway; function performs its own bearer/ITN validation |

Source equality does not prove authenticated browser operation, reviewer authorization, document ownership/expiry, or successful payment settlement.

## 4. Migration provenance and recovery

The staging migration ledger contains **130 rows**. The latest recorded entry is:

`20261029193124 — candidate_self_service_profile_bootstrap_0095`

The inspected repository migration directories contain 36 SQL files. By normalising the numeric migration suffix in the ledger names to the repository's numbered filenames, 32 ledger rows map to a source file; 98 do not have a matching source file under that convention. This shows that the current repository is not a complete, one-to-one source archive for the staging migration ledger. In particular, migration source files 0096–0106 were not present in the inspected `db/migrations` or `supabase/migrations` tree.

Duplicate ledger entries:
- `candidate_application_preparation_readiness_0078`: `20261019112452` and `20261019112511`.
- `seed_verified_labour_vacancy_deadlines_0093`: `20261029180632` and `20261029180642`.

The duplicate entries require historical provenance and checksum reconciliation. Do not delete ledger rows, invent missing SQL, mark migrations as applied, or apply imports as a shortcut. No schema migration was applied during this inspection.

`public.backup_restore_drills` contains **0 rows**. No protected backup plus isolated restore drill with schema, row, object and checksum verification is evidenced. Database migrations and bulk imports remain gated.

## 5. Security and capacity

The Supabase Security Advisor reported:
- Leaked-password protection disabled.
- Six public-schema `SECURITY DEFINER` functions executable by `authenticated`.
- Seventeen tables with RLS enabled but no policies.

The 17 no-policy tables were checked for table privileges. All 17 deny `anon` and `authenticated` SELECT/INSERT/UPDATE; `service_role` has access. These appear to be backend/reviewer-only deny-by-default tables, not a reason to add broad client policies. Keep them restricted.

The six authenticated-callable `SECURITY DEFINER` functions need individual security-owner review. The function bodies inspected contain candidate ownership/consent checks or reviewer-role/evidence checks, but blanket revocation could break legitimate flows and was not applied.

The `system_runtime_config` row `KINGSMEN_CAP_ACTIVE_CANDIDATES` is set to **500**. The live control-plane capacity table and growth-cap review table each return 0 rows. This is a stored configuration value, not proof of an enforced limit. I found no candidate-cap check in the inspected candidate Edge Functions, no candidate-cap triggers on the candidate/identity-link tables, no matching entry in `control_plane_capacity_limits`, and no review rows in `growth_cap_reviews`. The 500-active-candidate guard therefore remains unproven and must be implemented/tested through a reconciled, reviewed migration before onboarding is scaled.

Current staging counts:
- `candidates`: 2
- `candidate_auth_identity_links`: 0
- `candidate_master_profiles`: 0
- `candidate_workspace_saved_opportunities`: 0
- `candidate_private_documents` and `candidate_private_document_reviews`: 0
- `candidate_application_tracker` and preparation items: 0
- `candidate_payment_events` and `payfast_itn_receipts`: 0
- `growth_cap_reviews`: 0

The empty candidate state is why two-candidate isolation, reviewer runtime and persistence tests cannot be claimed from this snapshot. Leaked-password protection has not been changed because the connected Supabase actions expose no Auth password-security setting.

## 6. Opportunity catalogue

A fresh read-only staging query found:
- `public.opportunity_programmes`: **0 rows**.
- `public.candidate_opportunities`: **4 rows**; 2 are `STALE` and unpublished, 2 are `UNVERIFIED` and unpublished.
- `public.current_verified_route_opportunities`: **0 rows**.
- `public.route_programmes`: **14 rows**; 6 need review with unknown availability, 6 are closed, and 2 require manual availability checks.
- `public.route_providers`: 120 records; 3 are both verified and public-safe, 115 need review, and 2 are blocked.
- No candidate-facing verified/open opportunity is evidenced by these rows.
- `public.n15_ingestion_runs`: **0 rows**.

A provider directory, source-authority record or institution register is not a live opportunity. Candidate-facing publication requires official source evidence, current freshness, eligibility, a confirmed deadline where applicable, a valid application route and the required human review. No opportunity was fabricated or promoted during this inspection.

## 7. Netlify deployment state

The existing Netlify project and site ID were found. The connected deployment-list call returned no deploy records, no active deploy, no deploy ID and no commit SHA. There is therefore no exact deployed source revision to test.

The repository `netlify.toml` specifies base `apps/web`, command `npm run build`, publish directory `.next`, Node 22 and the Next.js plugin. The root `.gitignore` excludes local `.netlify/` state.

The connected Netlify actions available in this workflow expose project/deployment reads and environment management, but do not provide Git repository linking or a deploy-trigger operation. I did not create another site, deploy unrelated content, or claim a staging deployment. The deployment must be tied to the reviewed PR SHA before authenticated browser tests can be run.

## 8. Release decision and remaining gates

**IRC-1 is not release-approved.** Source integration and build validation have advanced, and main protection is now evidenced. These release gates remain:

1. Obtain an independent approving review on PR #316; its current review is `COMMENTED`, not `APPROVED`.
2. Reconcile the 130-row migration ledger to authoritative SQL history, including duplicate entries and 0096–0106 provenance; create a protected backup and complete an isolated restore drill.
3. Individually review the six authenticated-callable `SECURITY DEFINER` functions; enable leaked-password protection using a supported Supabase Auth control.
4. Implement and test the 500-active-candidate limit; run authenticated Candidate A/B isolation and reviewer authorization tests.
5. Create test candidate identities and prove profile save/reload/re-login, private document upload/read ownership/expiry, application draft persistence and tracker status boundaries.
6. Populate the N15 catalogue only from official current source evidence; current candidate-usable verified/open opportunity count is zero.
7. Complete PayFast sandbox hosted checkout, ITN signature/merchant/amount/reference verification, duplicate/replay idempotency and failed-settlement recovery with runtime evidence.
8. Link the existing Netlify staging project to the repository or use an authorised deploy mechanism; deploy the reviewed PR SHA, capture deploy ID/source SHA, and run browser smoke tests against that exact deploy.

No production release, live payment, provider submission, successful authenticated candidate runtime test, or verified Netlify staging deployment is asserted by this document.
