# Kingsmen One — Phase 0 Live Audit

**Observed:** 2026-11-19  
**Repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Main baseline commit:** `cb1b98243d46c9a790030af041f78113558e3f30`  
**Audit posture:** Read-only; no database DDL, project recovery, project replacement or deployment was performed.

## Source control

- Repository is accessible and currently **public**.
- Default branch: `main`; connected account has repository administration and push access.
- Main contains 3,261 paths at the recorded tree snapshot.
- Existing source includes a Next.js app under `apps/web`, a separate API package under `apps/api`, shared packages/contracts, Jarvis foundations, launch gates, operational scripts, database SQL/migrations and Supabase configuration.
- The root `package.json` has a large accumulated script set. The CI workflow runs a focused test command and builds the API and web packages.
- `apps/web/package.json` uses `next: latest` and `react: latest`; these are a reproducibility risk and should be pinned only after the resolved lockfile/runtime versions are verified.
- The API repository contains a PostgreSQL repository implementation, but explicitly defaults to memory development mode unless `KINGSMEN_TRUTH_VAULT_MODE=postgres` is configured. Production startup currently blocks memory mode. Production persistence is not proven by the presence of the repository code.
- Netlify build configuration targets `apps/web`, Node 22 and the Next.js plugin. Actual connected-site status and deployed commit have not been verified in this audit.

## Supabase staging

The connected Supabase account currently reports `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`) as **ACTIVE_HEALTHY**, PostgreSQL 17.11 in `eu-west-1`. This supersedes the older handover statement that the project was inactive. No restoration was needed or attempted.

Live schema/migration observations:

- 230 public base tables.
- 130 entries in the Supabase migration ledger; latest entry is `20261029193124 candidate_self_service_profile_bootstrap_0095`.
- Migration names repeat: `candidate_application_preparation_readiness_0078` appears twice (versions `20261019112452` and `20261019112511`); `seed_verified_labour_vacancy_deadlines_0093` appears twice (versions `20261029180632` and `20261029180642`). Ledger version IDs were unique in the list result. The `0092`-labelled entry also precedes the `0091`-labelled entry by ledger timestamp. Do not renumber or replay migrations until source and ledger are reconciled.
- Aggregate counts: 2 candidate rows; 0 candidate profile rows; 0 master profile rows; 0 candidate application rows; 2 rows in `applications`; 0 master application targets; 0 opportunity providers; 0 opportunity programmes; 8 finance plan rows; 0 private-document rows.
- The empty provider/programme tables mean a functioning, verified/open opportunity catalogue cannot currently be inferred from schema presence or the landing page.

## Security findings requiring scoped review

Supabase's security advisor reports 17 RLS-enabled public tables without policies and six `SECURITY DEFINER` functions executable by the authenticated role. A parallel table-privilege check found no anon/authenticated SELECT/INSERT/UPDATE/DELETE grants on the 17 no-policy tables; that suggests backend-only tables rather than immediate client table access, but does not replace a complete grants, RPC ownership-check and service-role review.

Do not fix this by blindly adding broad policies or revoking all six RPCs. Some RPCs may support candidate CAO choices or application preparation and contain identity/ownership checks. The follow-up must review each exposed function, test Candidate A/B isolation and verify only the intended roles can execute privileged actions. The staging database was not mutated during this audit.

## Product gaps observed in frontend and rebuild-branch changes

At the baseline commit, the homepage pathway array labelled internships and apprenticeships together, and used “Funding & support” as the sixth category. On the rebuild branch, this has been corrected to the six distinct canonical pathways and a source contract validator is wired into the ordinary test command.

The baseline had no candidate profile page route, despite an active `candidate-master-profile` Edge Function. The rebuild branch now adds `/candidate/profile`, calls that existing authenticated function for load/save/consent withdrawal, adds a dashboard link, and uses a project-scoped Supabase session reader. This is source-only. It has not been deployed, and authenticated browser persistence has not yet been proven. The observed Edge Function CORS allowlist must be checked against the actual staging hostname before runtime testing.

## Decisions intentionally not taken

- Repository visibility remains unchanged. The repository is public today; decide its visibility before adding confidential credentials, private candidate data or sensitive internal threat details.
- No Supabase restore/replacement/project creation, migration application, destructive cleanup, production payment activation, provider automation, branch-rule change or Netlify deployment.
- No claims of successful runtime journeys or deployments; none were executed in this read-only audit.

## Immediate next actions

1. Correct and regression-test the six-pathway taxonomy in the web homepage.
2. Establish this audit/doctrine/backlog on an isolated rebuild branch and open a draft PR.
3. Reconcile the migration source tree against the live ledger, including duplicate names and the 0091/0092 numbering order.
4. Review RLS/table grants and all six authenticated SECURITY DEFINER functions, then add scoped SQL regression tests before any staging hardening.
5. Implement and prove candidate Auth-to-profile binding, profile persistence across re-login, and Candidate A/B isolation.
6. Resolve the empty opportunity provider/programme catalogue through a small authoritative-source ingestion and review flow.
7. Verify the current Netlify site connection and deployed commit only when a real deployment check is performed.
