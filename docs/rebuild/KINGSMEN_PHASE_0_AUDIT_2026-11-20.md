# Kingsmen Rebuild — Phase 0 Evidence-Based Audit

**Audit date:** 2026-11-20  
**Repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Baseline:** `main` (branch preserved; no changes made to main)  
**Working branch:** `kingsmen-rebuild-2026-11-20`  
**Purpose:** Preserve existing work and define a controlled simplification path. This is a read-only source/runtime inspection report; no database writes, restores, project creation, or destructive operations were performed.

## Executive findings

1. **The Supabase staging project is currently active.** The connected account reports `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`) as `ACTIVE_HEALTHY`, database engine PostgreSQL 17. This supersedes older handover notes that said the project was inactive. Runtime status can change; recheck before database operations.
2. **The live schema is large, not empty, and migration history is substantial.** Supabase reports many public tables, all with RLS enabled in the compact listing, and a long applied migration history extending from October 12 through at least late October 2026. The listing reports zero rows for the listed tables; this is not proof that every schema/storage bucket/log is empty or that no data exists elsewhere.
3. **The current repository already contains meaningful business logic.** The README documents a Jarvis command/policy/evidence core, a deployable API runtime, a launch-readiness gate, and source-level proof scripts. These should be audited and selectively reused rather than discarded.
4. **The API README explicitly states that its current storage mode is `memory_development_only`.** The API must not be treated as production-ready until persistent PostgreSQL/Supabase behavior is verified in the actual runtime.
5. **The web package uses floating `latest` versions for Next.js, React, React DOM and the Netlify Next plugin.** Pin compatible versions in a dedicated change after lockfile/build review; do not update dependencies blindly during the audit.
6. **Launch remains blocked by the repository's own readiness document.** It identifies missing runtime evidence for Truth Vault persistence, RLS role isolation, web-to-backend boundary, PayFast sandbox/ITN, backup restore, secrets wiring, communications, observability/incident handling, legal/privacy publication, final evidence pack and main-branch protection.
7. **There are many existing feature and audit branches.** The rebuild must not overwrite or delete them. Branch inventory and commit ancestry should be reconciled before porting work.
8. **No new Supabase project or separate production backend is justified by current evidence.** Keep the existing project as a recovery/investigation target. Any clean replacement or destructive database change requires a separately approved plan.

## Source evidence inspected

- `README.md`: Jarvis core modules, API runtime endpoints, memory-only API caveat, launch gate.
- Root `package.json`: extensive test/validator scripts and existing release checks.
- `apps/web/package.json`: Next.js/React frontend and floating `latest` dependencies.
- `apps/api/package.json`: separate Node/TypeScript API package with `pg` dependency.
- `docs/launch/KINGSMEN_LAUNCH_READINESS.md`: explicit public-launch blockers and required runtime evidence.
- GitHub branch listing: numerous audit, docs, feature and migration branches already exist.
- Supabase project metadata: staging project currently `ACTIVE_HEALTHY`.
- Supabase table listing: substantial public schema; listed tables have RLS enabled and report zero rows.
- Supabase migration listing: extensive applied history; names and timestamps must be reconciled with the checked-in migration files before any migration is applied.

## Architecture decision for the rebuild

**Target:** one Kingsmen web application, one authoritative PostgreSQL/Supabase project, one canonical candidate application model, and one privileged Founder Control Plane.

- Keep Next.js as the primary web app and use server-side route handlers for web-specific server operations.
- Do not remove `apps/api` solely for aesthetic simplicity. First map its contracts and runtime responsibilities; consolidate only where this does not break existing clients, durable worker workflows, or security boundaries.
- Keep Supabase Auth, PostgreSQL, RLS and private Storage as the preferred platform foundation where the existing implementation is secure and usable.
- Keep Jarvis behind deterministic permissions, policy decisions, approval gates and evidence logging.
- Keep email as primary communication; WhatsApp urgent-only; SMS deferred/fallback-only.
- No external provider submission without provider authorization, candidate consent, and the required approval.
- No real payment entitlement from browser redirects; only verified, idempotent server-side payment events.
- Public launch remains blocked until the existing P0 evidence requirements are satisfied and reviewed.

## Initial domain boundaries

These are conceptual domains, not a mandate to create a fixed number of tables:

- Identity, profile and consent
- Providers, opportunities, source evidence and verification
- Applications, application events and CAO choices
- Private documents and identity review
- Plans, orders, payment events and usage ledger
- Jobs, notifications, audit and operational evidence
- Founder workspaces and controlled Jarvis commands

Reuse existing tables and migrations when they already satisfy the contract. Do not create duplicate tables merely to match a proposed table count.

## Risks and required controls

| Risk | Required control |
|---|---|
| Migration drift between Git and live DB | Read-only compare migration files and live migration ledger before changes |
| Accidental loss during rebuild | Preserve main, branches, database state and backups; no destructive changes without approval |
| Candidate data exposure | Test RLS across anonymous, candidate A/B, operator, founder and service roles |
| API state disappears on restart | Prove PostgreSQL persistence and idempotency through actual runtime tests |
| Public repository exposes proprietary implementation | Confirm repository visibility and licensing before adding proprietary rebuild code |
| False opportunity or submission status | Evidence-backed verification and distinct internal/provider-receipt events |
| Payment replay or forged ITN | Signature/merchant/amount/currency validation and idempotent processing |
| Unverifiable deployment claims | Record commit SHA, deployment ID, environment and real browser test evidence |

## Work performed and not performed

**Performed:** read-only GitHub source inspection, branch inventory, Supabase project status inspection, table/migration inventory, creation of the isolated rebuild branch.

**Not performed:** no Supabase writes, restores, migrations, project creation, credential changes, repository visibility changes, branch protection changes, production deployment, payment setup, or candidate-data mutation.

## Next audit actions

1. Inventory repository tree, current migration files, lockfiles, existing candidate vertical-slice work and proof scripts.
2. Compare checked-in migration versions with the live migration ledger; flag gaps, duplicates and naming mismatches without applying anything.
3. Inspect existing candidate/auth/application pages and contracts to select the smallest complete journey.
4. Verify repository visibility and licensing before introducing additional proprietary implementation.
5. Prepare a scoped first implementation PR on this rebuild branch, with tests and no changes to production data.
6. Recheck Supabase status before any database tool operation that is not read-only.
