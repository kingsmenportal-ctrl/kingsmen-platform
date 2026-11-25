# Kingsmen One — Rebuild Decision and Initial Audit
**Date:** 17 November 2026  
**Repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Source baseline:** `main` at `cb1b98243d46c9a790030af041f78113558e3f30`  
**Rebuild branch:** `rebuild/kingsmen-one-foundation-2026-11-17`

## 1. Decisions

1. Preserve the existing repository, all history, `main`, existing branches and pull requests. Do not rewrite history or delete old work.
2. Use the existing repository as the source of truth. The clean rebuild is isolated on `rebuild/kingsmen-one-foundation-2026-11-17`, created from the exact current `main` SHA above.
3. Do not create another production database. Recover `kingsmen-portal-staging` first; migrate to a clean schema only after the current database and data have been inventoried.
4. Keep the repository public temporarily to retain GitHub Free's public-repository branch rulesets/protection and avoid changing a working governance surface before the GitHub subscription is known. This is an interim cost-control decision, not a declaration that Kingsmen source should remain public permanently. No secrets, candidate data, payment data or private documents belong in Git.
5. Supabase organisation `iiyscijqwapbqdxshzbq` is on the Free plan. A restore request for `euhubhhnumtibbyufghm` succeeded. At the last check the project was `COMING_UP`, not yet `ACTIVE_HEALTHY`. Do not run SQL, migrations, seed data, deploy functions or modify storage until it is healthy and inspected.
6. Keep the first release centred on the complete candidate-to-founder-to-candidate application journey. Jarvis and provider automation follow after the underlying workflows are dependable.
7. Do not merge PR #316 or any stacked feature branch wholesale. Review and transplant useful components and contracts selectively, with tests.

## 2. Live verified baseline

### GitHub
- Repository exists and is accessible: `kingsmenportal-ctrl/kingsmen-platform`.
- Default branch: `main`.
- Repository visibility: `public`.
- GitHub repository metadata reports admin/push access for the connected `kingsmenportal-ctrl` account.
- Current main SHA: `cb1b98243d46c9a790030af041f78113558e3f30`.
- A new rebuild branch was created from that exact SHA: `rebuild/kingsmen-one-foundation-2026-11-17`.
- The GitHub branch API returned `protected: true` for main, but its accompanying legacy protection details reported `enabled: false` and no required status checks. Treat effective ruleset/branch enforcement as requiring fresh verification. A combined status query returned no status rows for the main SHA; this is not proof that tests never passed.
- The branch search returned at least 100 existing branches and a pagination cursor, showing a substantial historical branch inventory. Preserve these until each branch is classified.
- There are many open PRs. Relevant examples: #316 integrated frontend slice (open/unmerged); #292 application draft persistence (open and stacked); #209 backend simplification baseline (open); #312 six-path dashboard navigation (merged).

### Supabase
- Organisation: `iiyscijqwapbqdxshzbq`; plan reported by Supabase: `free`.
- Original staging project: `kingsmen-portal-staging`; ref `euhubhhnumtibbyufghm`; region `eu-west-1`; PostgreSQL 17.11.
- Project initially reported `INACTIVE`. A restore action returned success. Subsequent status was `COMING_UP`; it had not yet reached `ACTIVE_HEALTHY` during this audit.
- No schema or application data was changed by this audit.
- The Supabase project list previously returned four projects in the organisation; all were reported inactive at the time of inspection.

### Current repository structure and findings
- `apps/web` is the Next.js/React frontend.
- `apps/api` is a separate API package. The root README explicitly describes its current storage mode as `memory_development_only` and says durable PostgreSQL/Supabase persistence remains a launch task.
- `apps/workers/src` contains only a placeholder at the inspected main revision.
- `apps/web/src` has distinct feature areas for candidate portal, control plane, documents, finance, communications, opportunity, public site, integrations, Jarvis/orchestration and related work. These are reuse candidates, not proof of completed runtime capability.
- `apps/web/src/app` contains separate public, auth, candidate, founder, control-plane, Jarvis, operator, partner, pricing, CV and other route areas. Consolidate navigation and shared patterns without discarding useful journeys.
- The web package and its lockfile both declare `next: latest` and `react: latest`. Pin tested framework/runtime versions during foundation hardening.
- Root package scripts contain many specialised validators and proof scripts. Keep strong coverage, but make the default developer path and CI pipeline small, predictable and layered.
- Root and app-level package lockfiles both exist. Define one coherent workspace/install strategy.

### Migration and function inventory
- `db/migrations` contains 35 SQL files, including numbered groups `0001–0018`, `0045–0055`, `0072`, and `0082–0086`.
- `database/migrations` contains `000004_jarvis_postgresql_truth_vault.sql`.
- `supabase/migrations` contains a timestamped PayFast migration and a placeholder file.
- `db/seeds` contains 18 seed files.
- Therefore, migration ownership is split across three locations. This is the most urgent source-level database governance problem. Do not simply move files and run them: build a migration provenance map and compare to live migration history after the project is healthy.
- `supabase/functions` on main has two function directories for N15. PR #316 proposes additional candidate identity, document, profile, application and payment function source files. Deployed functions must be byte-compared/reconciled against source before reuse or redeployment.
- `.github/workflows` contains several specialised workflow files, including Kingsmen CI, source guard, branch-protection evidence and release evidence. Consolidate overlapping release checks after reviewing dependencies.

## 3. Reuse candidates and release caveats

### PR #316 — frontend product slice
- State at audit: open and unmerged; base is current main SHA; head SHA `e46eba56e6b425bce711a5b58f116bdd21982018`.
- 63 changed files; 7,413 additions and 760 deletions; 124 commits.
- PR file inventory includes public home, pricing, auth, candidate dashboard, profile, opportunity feed, tracker/workbench, document vault, identity review, finance, payment return/cancel, candidate components, Supabase function source and release workflows.
- Its description states that it implements candidate profile/consent, N15 feed, saved opportunity/application draft, private document handling, PayFast sandbox checkout and Free Destiny Map intake.
- Its description also states that authenticated Candidate A/B isolation, document runtime ownership, full PayFast ITN/idempotency browser flow and an exact-SHA Netlify staging deployment were not yet proven. These are PR-authored claims and remain to be independently re-tested.
- Decision: use PR #316 as a major code-reuse source. Review changed files and contracts in manageable slices; do not merge its 124-commit history as a single product release.

### PR #292 — application draft persistence
- State at audit: open and unmerged; stacked on another feature branch; 22 changed files, 43 commits.
- Its description documents parent-application draft answers, optimistic versions, resume behavior, audit events and CAO child-choice preservation.
- It explicitly states that the migration was dry-run/rolled back and that authenticated concurrent-edit and identity-isolation runtime proofs remain outstanding.
- Decision: preserve the model and useful code, but reconcile dependencies and migration provenance before porting.

### PR #209 — backend simplification baseline
- State at audit: open and unmerged; 149 changed files.
- Decision: review as an architecture/reuse source. Do not accept its entire migration or API surface without a target-domain mapping.

### PR #312
- Closed and merged into main; one changed file. Retain as current candidate navigation work.

## 4. Rebuild architecture

Target:
- One Next.js application for public site, candidate portal, founder control plane and Jarvis UI.
- One Supabase/PostgreSQL project as operational source of truth.
- Supabase Auth, RLS, private Storage and a deliberately small set of Edge Functions.
- Next.js server routes for ordinary application server operations; separate worker only when a durable workload proves it is needed.
- GitHub for source, migration ownership, review and CI.
- Existing Netlify site for frontend hosting after its Git/deploy pipeline is independently verified.
- Email as primary candidate communication.
- Notion as governance/evidence index, not live database.
- No Neon database; no second production backend; no mandatory Hercules/Lovable/Replit dependency; no default n8n dependency.

Initial domain boundaries:
1. Identity, profile and consent.
2. Provider registry and verified opportunities.
3. Unified applications, CAO choices and application events.
4. Private documents and identity review.
5. Plans, orders, payments and usage ledger.
6. Jobs, email outbox and operational audit.
7. Founder operations, approvals and controlled Jarvis commands.

The first schema should be small, referentially sound and RLS-first. Table count is not a success metric. Add entities only when a real business boundary or security rule requires them.

## 5. Build sequence

1. Complete source and runtime inventory; classify reusable code and open PR dependencies.
2. Wait for Supabase to report `ACTIVE_HEALTHY`; read table definitions, migration history, extensions, policies, functions, storage buckets and advisors. Export recoverable schema/data/storage before any migration.
3. Reconcile the live schema with all three source migration locations; nominate one canonical migration directory and write a tested baseline/upgrade plan.
4. Establish the simplified Next.js workspace, pinned dependencies, design tokens, auth shell and CI.
5. Implement candidate identity/profile/consent and Candidate A/B isolation.
6. Implement provider/opportunity catalogue and source evidence across all six pathways.
7. Implement unified application form, parent application, CAO child choices, drafts, events and truthful statuses.
8. Implement private Document Vault and human identity review.
9. Implement Founder Control Plane queues and permissions.
10. Implement plan catalogue, orders, PayFast sandbox verification, entitlements, usage and email outbox.
11. Add durable jobs and Jarvis after their underlying commands are real and permissioned.
12. Run authenticated E2E, RLS, payment, restore and operational tests; release an independently verified candidate pilot.

## 6. Safety and change controls

- No destructive migration, reset, project deletion, data overwrite or production deployment without a specific reviewed plan.
- No schema writes until Supabase reports `ACTIVE_HEALTHY` and the live migration history is captured.
- No live PayFast charging during rebuild; sandbox only.
- No service-role keys, payment secrets, candidate records or private documents in Git or chat.
- No provider submission without provider authority, candidate consent and founder approval.
- Candidate-reported submission, Kingsmen submission, provider receipt and provider outcome remain distinct states.
- No self-approval, branch-protection bypass or force merge.
- A source validator is not runtime proof. A successful build is not an authenticated E2E result. A deploy is not accepted without exact commit/deploy evidence and a browser smoke test.
- Each product stream can be released independently when its own security and business acceptance criteria pass.

## 7. Repository visibility decision

The repository remains public for now. GitHub's official documentation states that GitHub Free supports rulesets/protected branches for public repositories, while private repository rulesets and protected branches require GitHub Pro, Team or Enterprise. Changing a public repository to private also unpublishes GitHub Pages and leaves existing public forks public and detached.

Since Kingsmen is being rebuilt on a cost-controlled basis and current effective branch enforcement needs verification, do not change visibility until the GitHub plan and protection trade-off are settled. The preferred long-term IP posture is private source with working review/branch controls. Until then, assume all source and documentation in this repository are public; keep every secret and user record out of it.

Official GitHub references:
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility

Official Supabase references:
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://supabase.com/kb/faqs/platform/free-project-pausing

## 8. Immediate next work

1. Recheck the restore status until the staging project is `ACTIVE_HEALTHY`.
2. Capture a read-only database snapshot: tables/columns/FKs, migrations, extensions, policies, functions, buckets and advisors.
3. Generate a migration provenance matrix across `db/migrations`, `database/migrations`, `supabase/migrations` and the live migration ledger.
4. Review the exact files in PR #316 and #209 against the new target architecture.
5. Produce a reuse/retire/replace decision for each significant module.
6. Only then begin the first schema and frontend changes on this rebuild branch.

**Current status:** rebuild branch created; staging restore requested successfully and project is still starting; no schema or data changes made; repository visibility unchanged; no PR merged; no deployment claimed.
