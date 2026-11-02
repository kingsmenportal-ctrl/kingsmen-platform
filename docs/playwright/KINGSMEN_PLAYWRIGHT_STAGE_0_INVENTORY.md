# Playwright and controlled browser automation — engineering status

**Snapshot:** 2 November 2026  
**Workstream:** PR #303 — [Kingsmen browser QA and read-only provider scout](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/303)  
**Source of truth:** the existing Kingsmen repository, Supabase/PostgreSQL and protected release workflow. No Neon database or second job queue is introduced.

## Executive status

| Gate | Status | Evidence / remaining condition |
|---|---|---|
| Stage 0 — repository inventory | Complete | Existing QA, N16 queue, policy and worker runtime inventoried. |
| Stage 1 — browser QA | Green on the prior implementation head | [Run 41377233160](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/41377233160), exact head `772d1339b485f1c911524d63bd02aeac1fb819d7). Further changes in this PR must pass their own exact-head CI. |
| Candidate API auth boundary | Implemented in source; CI pending | Supabase bearer verification plus a verified Auth-user-to-candidate link now gates status/workbench reads. |
| Profile persistence across sign-out/sign-in | Test strengthened; staging proof pending | Expected candidate is pinned and the test signs out, performs a fresh password login, reloads, and restores the original profile. |
| Candidate A/B status, application and document isolation | Test strengthened; staging proof pending | Own reads must pass; foreign candidate status is 403; foreign workbench is 404; foreign documents are denied. |
| N16 worker-specific claim boundary | Implemented in migration source; disposable PostgreSQL CI pending | One-worker-code-only claim and evidence-linked same-state result; no generic claim, table SELECT or SENT capability. |
| Isolated operations consumer | Implemented in source and container; CI pending | Dedicated restricted DB login, Chromium contexts per job, DNS validation/pinning, GET-only exact-host access; off by default. |
| Provider adapter controls | Implemented; no real adapter enabled | Provider authorisation, terms review, Founder evidence, version, exact allowlist, expiry and action scope required. The example registry is empty. |
| Security review | Partially complete; release blocker remains | Candidate API authorization corrected in source; Supabase leaked-password protection warning remains. No client grants on the 17 backend-only RLS tables. |
| Staging evidence | Pending | Manual workflow requires protected environment secrets and pre-provisioned dedicated test fixtures. |
| Founder release approval | Pending | Required after exact-head CI, independent review, security closure and staging evidence. |
| Production deployment | Not performed | No migration applied, no worker login provisioned, no provider operation enabled and no production deployment claimed. |

## 1. Queue and runtime architecture

Kingsmen continues to use the existing N16 `orchestrator_dispatch_queue`. A new `browser_jobs` table would split lease, retry, evidence and audit authority and is explicitly rejected.

The existing N16 queue provides atomic claims, bounded leases, idempotent results, retries, dead-letter handling, a manual handoff path and a rule that ambiguous post-SENT work is reconciled rather than automatically replayed.

The global N16 claim RPC is not appropriate for a second independent worker: it does not filter by `worker_code`. The new Playwright RPCs are constrained to `playwright.public_source.scout`, one claim at a time, and require membership in a dedicated NOLOGIN group role. The scoped role has no direct queue/result table privileges and cannot execute the generic claim, generic result or SENT functions.

The new migration is:

`db/migrations/202611020001_n16_playwright_scout_worker_scope.sql`

It creates the group role and scoped functions only. It does **not** create a LOGIN role, password, deployment secret or live Supabase grant. Those remain deployment-time DBA actions after migration review and protected backup/restore.

## 2. API and candidate identity boundary

The standalone API candidate status and application workbench routes previously read records by client-supplied identifier without authenticating the caller. That was a release-blocking authorization defect.

The source fix now:
1. validates the Supabase bearer token against `/auth/v1/user`;
2. resolves its Auth UUID through `candidate_auth_identity_links`;
3. accepts exactly one active, verified, timestamped identity link;
4. never maps by email;
5. scopes candidate reads to the resolved candidate ID;
6. scopes application workbench reads to the same candidate ID;
7. uses no-store response headers and fails closed when the durable Truth Vault or Auth configuration is unavailable.

Expected denial semantics are 401 for missing/invalid session, 403 for an explicit foreign candidate status request, and 404 for a foreign or unknown application workbench.

This is source implementation, not proof of a deployed API. The new API validators and staging E2E assertions must pass on the exact PR head and staging deployment.

## 3. Candidate staging evidence

Manual workflow: `.github/workflows/kingsmen-authenticated-staging-e2e.yml`

It uses two protected GitHub Environments:
- `kingsmen-staging-verification`: read-only Candidate A/B and reviewer tests using dedicated tokens and candidate-owned application/document fixtures;
- `kingsmen-staging-profile-mutations`: separately approved profile save/update/sign-out/fresh-password-login/reload/restore test, pinned to one exact candidate reference.

No staging secret value is stored in the repository or printed by the workflow. These workflows are not automatically dispatched by CI. They require the environment owners to provision the dedicated test fixtures/secrets and approve execution.

## 4. Isolated Playwright operations consumer

Files:
- `apps/workers/src/playwright-operations-worker.mjs`
- `apps/workers/Dockerfile.playwright-operations`
- `apps/workers/src/providers/provider-adapter-policy.mjs`
- `data/providers/playwright-operations-adapters.example.json`

The consumer:
- remains disabled unless `KINGSMEN_PLAYWRIGHT_OPERATIONS_ENABLED=true`;
- stops without connecting when the adapter registry is empty;
- uses only `KINGSMEN_PLAYWRIGHT_DATABASE_URL`, not the generic/service-role application database URL;
- verifies the connected login can `SET ROLE kingsmen_playwright_scout_worker`;
- claims only the scoped N16 worker code, one dispatch at a time;
- uses a fresh browser context per dispatch;
- allows only HTTPS GET navigation to exact approved hosts;
- blocks downloads, service workers, popups, dialogs, cross-host navigation, sensitive URL parameters and non-public DNS destinations; the browser resolver is pinned to validated public addresses;
- never logs page bodies, credentials, cookies or bearer tokens;
- never logs in, fills forms, uploads documents, submits applications, attempts payment or declares provider decisions/receipts.

A deployment must additionally enforce outbound network egress restrictions to the approved provider hosts at the container/network layer. Browser routing and DNS pinning do not replace an egress firewall.

## 5. Adapter and approval model

The adapter registry is intentionally empty. An enabled adapter must declare:
- a unique provider adapter ID and semantic version;
- provider ID and official domain / exact hostname allowlist;
- capability `PUBLIC_SOURCE_INSPECTION`, access mode `public_read_only`, and exactly one action `inspect_public_source`;
- provider authorisation evidence reference;
- provider terms/privacy review evidence reference;
- Founder approval evidence reference, approver, approval time and expiry;
- a matching dispatch payload and evidence references.

No L1/L2/L3/L4 provider submission route is authorised by this work. No university or TVET is enabled merely because its portal is public or can be inspected. Browser form interaction, identity declarations, document upload and submission require a separate provider-specific legal/technical authorisation, candidate consent, target-specific approval and independently reviewed adapter/operation scope.

## 6. Live Supabase security review

The staging project is `kingsmen-portal-staging` (PostgreSQL 17.11). Read-only inspection on 2 November 2026 found:

- The three existing N16 queue recovery migrations are already present in the live migration ledger.
- Supabase Security Advisor reports six exposed-to-authenticated SECURITY DEFINER functions. Direct review of their definitions and ACLs showed owner `postgres`, hardened `search_path` values, and intentional role-specific guards: the candidate CAO/application RPCs resolve the authenticated candidate identity and scope ownership/consent; the application outcome RPC requires an active reviewer registration and verified evidence. These six functions must remain in regression/security review; they must not be blanket-revoked.
- Supabase Security Advisor reports 17 RLS-enabled tables with no client policies. A direct role-grant query found zero table grants to `anon` or `authenticated` across those 17 tables. They are backend-only tables protected by grants as well as RLS; retain the deny-by-default model.
- Supabase Security Advisor reports `auth_leaked_password_protection` as WARN: leaked-password protection is disabled. This requires an authorised Auth configuration change in the Supabase project and a subsequent advisor recheck. It is not repaired by SQL or this repository PR.
- Candidate A/B isolation, reviewer access and browser runtime claims remain unproven until the protected staging workflow has passed.

No live Supabase schema was changed by this work. The new N16 worker migration remains source-only pending review, backup/restore and release change control.

## 7. Release order and hard stops

1. Pass exact-head GitHub Actions: repository regression, API build/auth tests, N16 static and disposable-PostgreSQL scoped-claim integration, Playwright policy tests, browser QA, web build and both Docker image builds.
2. Obtain independent review of API authorization, scoped SQL SECURITY DEFINER functions, least-privilege grants, worker DNS/egress and container secrets.
3. Complete protected backup and isolated restore; reconcile migration provenance; apply the approved migration to staging only through existing change control.
4. Provision the dedicated non-superuser Playwright LOGIN role and secret outside Git. Verify `SET ROLE`, scoped RPC privileges and denial of generic queue/table/SENT access against staging.
5. Run the protected Candidate A/B/reviewer staging workflow and, after separate approval, the profile persistence mutation workflow. Review redacted artifacts and restore evidence.
6. Register a provider adapter only when provider authorisation, terms review and Founder approval evidence are available. Keep the registry empty otherwise.
7. Obtain Founder release approval and deploy only through the existing branch-protected release process. Verify exact Netlify/Supabase/worker commit and runtime evidence.

A green source/CI run is not a staging proof. A staging proof is not a production deployment. This PR does not bypass existing review, backup/restore, branch protection or Founder release gates.
