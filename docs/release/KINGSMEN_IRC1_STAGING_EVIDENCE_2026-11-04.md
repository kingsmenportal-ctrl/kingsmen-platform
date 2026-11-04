# Kingsmen IRC-1 — staging evidence and release blockers

**Snapshot date:** 4 November 2026  
**Repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Release review PR:** [#316 — integrated frontend product slice](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/316)  
**Supabase staging:** `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`)  
**Netlify staging:** `kingsmen-portal-staging` (`fb27d0db-b116-4890-8f7f-14e654c27dbc`)

This file records a point-in-time inspection. It deliberately distinguishes source implementation, CI evidence, live backend state, and runtime/deployment evidence. It is not a release approval.

## 1. GitHub integration and controls

The active integration stream is PR #316, based on `main`. Its product surface remains the existing Next.js application under `apps/web/src/app`; the static `apps/web-frontend/` prototype/reference surface is not the production application.

The candidate workbench route contains six-step navigation and the authenticated `CandidateApplicationWorkbench` component. The PR now also tracks the exact staging source for all four candidate Edge Functions and the PayFast sandbox Edge Function; these were byte-compared against their currently deployed staging sources. The component calls the deployed `candidate-application-preparation` Edge Function to load saved parent targets, parent application records, preparation trackers and checklist items. Preparing a parent application is a backend action; it does not submit to a provider.

The verified-opportunity save path calls `candidate-save-verified-opportunity`. Its implementation persists the candidate's saved opportunity, reconciles a master application target, invokes the guarded parent-application preparation RPC, and links a preparation tracker. It does not claim provider submission or receipt.

**Exact-head CI history:**
- PR head Latest exact PR head at the time of this update: `1022a354cf45bc7849f161844953e456137205fc`.
- `validate`: passed.
- `test-and-build`: passed, including repository validation, API build, and Next.js production build.
- `verify-main-branch-protection`: passed.
- `Jarvis Live Runtime`: passed.
- The release suite now also runs canonical finance catalogue checks, PayFast sandbox source-level proof/validation, migration source-integrity checks, and the review-table access contract.
- The independent review record on PR #316 is a `COMMENTED` review, not an approval. The reviewer requested authenticated Candidate A/B, profile persistence, private document ownership/expiry, PayFast ITN replay/recovery, and deployment-tied browser evidence.

The main protection verifier succeeded on the latest exact head. The active main ruleset requires one approving review and the strict `validate` and `test-and-build` contexts; bypass actors are empty, force-push and branch deletion are disabled. No direct-`main` commit or protection bypass was used. A successful evidence workflow is not itself a substitute for an independent approving review.

## 2. Supabase source synchronisation

Staging is active and healthy on PostgreSQL 17.11. The following Edge Function source files in the PR #316 branch were compared byte-for-byte with the deployed staging function source; each pair was identical at inspection:

| Function | Deployed version | Gateway JWT verification |
|---|---:|---|
| `candidate-application-preparation` | 16 | Enabled |
| `candidate-master-profile` | 3 | Enabled |
| `candidate-private-documents` | 16 | Enabled |
| `candidate-save-verified-opportunity` | 3 | Enabled |
| `payfast-sandbox` | 9 | Disabled at gateway; the function has its own request/ITN validation logic |

Source equality proves that the tracked code matches the deployed function source. It does not prove authenticated browser execution or settlement outcomes.

## 3. Migration ledger and recovery gate

The live staging migration ledger returned **130 rows**. Its latest recorded version is:

`20261029193124 — candidate_self_service_profile_bootstrap_0095`

Two migration names have duplicate ledger entries:
- `candidate_application_preparation_readiness_0078`: versions `20261019112452` and `20261019112511`.
- `seed_verified_labour_vacancy_deadlines_0093`: versions `20261029180632` and `20261029180642`.

The current `main` source tree contains numbered SQL migrations in `db/migrations` only through `0086`; `supabase/migrations` has only the timestamped PayFast finance migration and `.gitkeep`. This is not a one-to-one source map for the 130-row staging ledger through 0095. No source migration files 0096–0106 were found in the inspected tree. Do not apply later migrations or imports until repository migration files, historical provenance, checksums and live schema are reconciled. The duplicate entries require explanation; they must not be deleted or rewritten as a shortcut.

A protected backup and an isolated restore drill have not been evidenced in this snapshot. No schema migration was applied during this inspection.

## 4. Security findings

The Supabase Security Advisor returned these items:
- Leaked-password protection is disabled.
- Six public-schema `SECURITY DEFINER` functions are executable by `authenticated`. Their bodies were inspected and include caller/identity or reviewer checks; each function still requires individual security-owner approval of its exposure and intended role.
- Seventeen tables have RLS enabled but no policies. Several are identity-review or founder/reviewer operational tables. These may intentionally be deny-by-default; do not add broad client policies to silence the advisor.

Candidate A/B isolation, reviewer authorization and private document ownership/expiry were not proven by authenticated runtime tests in this snapshot. Leaked-password protection was not changed because the connected Supabase operations available to this workflow do not expose the Auth password-security setting.

## 5. Opportunity catalogue state

A fresh read-only staging query found:
- `public.opportunity_programmes`: **0 rows**.
- `public.candidate_opportunities`: **4 rows**; 2 are `STALE` and unpublished, and 2 are `UNVERIFIED` and unpublished.
- `public.current_verified_route_opportunities`: **0 rows**.
- `public.route_programmes`: **14 rows** (6 `NEEDS_REVIEW / UNKNOWN`, 6 `VERIFIED / CLOSED`, 2 `VERIFIED / MANUAL_CHECK_REQUIRED`).
- `public.route_providers`: 120 records; 3 are both `VERIFIED` and `public_safe`, 115 are `NEEDS_REVIEW`, and 2 are `BLOCKED`.
- The 4 candidate-opportunity rows are all unpublished, so none is currently candidate-facing.

Consequently, the staging candidate feed does not currently have a verified, published open opportunity evidenced by these tables. Provider directory entries and source-authority records must not be presented as live opportunities. Do not fabricate or promote a listing to `OPEN` without official-source, deadline, eligibility, freshness and human-review evidence.

## 6. Netlify deployment state

The existing Netlify project and site ID were found. The deployment-list operation returned:
- no deploy records;
- no active deployment;
- no deploy ID tied to a Git commit;
- no exact deployed source SHA.

The available Netlify connection exposes project/deployment reads but does not expose a Git-repository linking or deployment-trigger operation. Therefore no staging deployment or authenticated browser smoke test is claimed here. The repository's `netlify.toml` points to `apps/web`, runs `npm run build`, publishes `.next`, and uses the Next.js plugin. The root `.gitignore` excludes `.netlify/`.

## 7. Release decision

**IRC-1 is not yet release-approved.** Source implementation and build validation have advanced, but these gates remain open:

1. Latest-head CI must finish green after the most recent validator and ignore-file commits.
2. Obtain the required independent approving review on PR #316.
3. Reconcile migration provenance and duplicates; establish and verify backup/restore evidence before schema changes.
4. Review the six authenticated-callable `SECURITY DEFINER` RPCs individually and enable leaked-password protection through the supported Supabase Auth control.
5. Populate the N15 catalogue through official, current, human-reviewed evidence; current candidate-usable opportunity count remains zero.
6. Obtain a Netlify deploy tied to the reviewed PR head, then run authenticated Candidate A/B, profile reload/re-login, private document upload/read/expiry and PayFast sandbox ITN/replay/recovery tests.
7. The Netlify connection currently exposes project/environment reads but no deployment records or Git-link/deploy-trigger action. Neither the primary staging URL nor the current branch-version URL could be retrieved by the web runtime. No deploy ID or deployed SHA is claimed.

No production release, production payment, provider submission, or successful staging runtime verification is asserted by this document.
