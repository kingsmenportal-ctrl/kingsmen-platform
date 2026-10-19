# Kingsmen Repository Component Inventory — 2026-10-17

## Scope and evidence boundary

- Repository: `kingsmenportal-ctrl/kingsmen-platform`
- Audited branch: `feat/phase-a1-public-destiny-auth-foundation`
- Source commit: `2e1d4a24d75ea93e82b1601c82624cae80cbab6f`
- Inventory captured: 2026-10-17
- Method: read-only GitHub tree and selected source/manifest/package/workflow reads, plus read-only Supabase migration/advisor metadata.
- This is a **source inventory**, not proof that every feature runs correctly. No build, test suite, browser E2E, migration, payment, provider send, deploy, or production action was executed in this pass.

## Executive disposition

**Public launch remains BLOCKED.** The repository contains a broad implementation footprint, but launch-readiness documentation explicitly requires staging runtime evidence and founder review. Keep PR #86 open/draft/unmerged until required gates have evidence.

## Repository inventory snapshot

| Area | Observed count | Interpretation |
|---|---:|---|
| Tree entries | 3,332 | Complete recursive tree response for the audited source commit |
| Tracked blobs/files | 2,794 | Repository file inventory size at audited commit |
| Web App Router page files | 69 | UI page source exists; visual and behavior checks remain separate |
| Web App Router API route files | 83 | Same-origin API route source exists; runtime and security behavior remain unverified |
| API TypeScript/JavaScript source files | 233 | Broad backend source footprint |
| Test/spec source files | 39 | Includes unit/regression and E2E specs; presence is not a passing result |
| Validator scripts under `scripts/validators/` | 247 | Large validation library; some are source validators, not live integration proof |
| SQL migration files across repository paths | 28 | Found across `db/migrations/`, `database/migrations/`, and `supabase/migrations/`; history must be reconciled |
| GitHub Actions workflows | 4 | Workflow definitions exist; successful runs for this audited commit were not established in this pass |

## User-facing route inventory

### Candidate and identity
- Pages: `/auth/login`, `/auth/register`, `/auth/passwordless`
- Candidate pages: dashboard, onboarding, profile, applications, documents, finance, payments, messages, support, outcomes, mobile, workbench.
- Candidate API areas: registration/login/logout/recovery/refresh/session, candidate session/profile/applications, document requests/upload/read/status, support tickets, workbench readiness/choice/Cao optimization.
- Required verification: registration, login, logout, recovery, session expiry, verified identity binding, ownership checks, CSRF/body/token bounds, and candidate A/B cross-account denial.

### Public entry and Destiny Map
- Pages: root, Kingsmen public page, free Destiny Map.
- API: local free-Destiny-Map intake route.
- Required verification: public intake validation, rate limiting/abuse controls, consent/privacy messaging, safe public-to-candidate handoff, persistence, and no accidental personal-data leakage.

### Personal Jobs
- 35 page files under `/personal-job-desk` and 20 API route files in the `/api/personal-jobs` family were present in the audited tree.
- Areas include application tracker, apply-now, apply-pack builder, daily worklist, document pack index, follow-up inbox, job finder, manual submission, opportunity quality/queue/scout, proof review, readiness, response library, review ledger, source discovery, status advancement/timeline, and public snapshot.
- Required verification: opportunity source provenance, candidate consent, deduplication, idempotency, status-transition integrity, application ownership, evidence/audit trail, and no real submissions during testing.
- Dependency warning: `apps/api/src/personal-jobs/application-state.ts` has previously been identified as using a state model that needs reconciliation with the database `applications.current_state` constraint before transitions are wired or migrated.

### Founder, admin, and Jarvis
- Pages include admin Jarvis gates/live/readiness/switch, founder control plane/commands/digest, build proof, master index, proof centre, and provider/Airtable screens.
- API families include founder readiness/control-plane/commands/approval/stop-selling, Airtable health/sync, alerts, and multiple Jarvis command/status/evidence/provider/runtime routes.
- Required verification: role and authority matrix, approval boundaries, stop-selling behavior, no public access to privileged actions, secrets redaction, and evidence for every mutating operation.

## Backend and integration domains identified

Source paths show modules for candidate identity/session/credentials, candidate applications, document vault and review, finance/PayFast, opportunity matching, AI decision boundaries, communications, Airtable sync/outbox/webhooks, mobile candidate features, and Truth Vault repositories.

These are implementation areas identified by file paths, not certification that external integrations are configured or functional. In particular:
- PayFast must remain sandbox-only until success/cancel/failure, duplicate, replay, invalid signature, amount mismatch, and refund-review evidence is captured.
- Airtable and communication providers must not receive live writes/messages as part of this audit.
- PostgreSQL/Supabase remains the declared Truth Vault authority; candidate data must not silently fall back to ephemeral in-memory storage for production use.

## Migration source/history reconciliation

The repository contains SQL under:
- `db/migrations/` (core numbered migrations including RLS, finance, candidate documents, sessions, credentials and identity linking),
- `database/migrations/` (including a Jarvis Truth Vault migration),
- `supabase/migrations/` (including a PayFast finance transaction migration).

Connected staging migration inventory reports named migrations through `candidate_auth_identity_link_0040`. Because the source uses multiple migration directories and naming styles, **do not infer drift solely from one directory listing**. Build a canonical migration manifest across all tracked SQL files, compare migration versions/checksums to staging history, and resolve duplicates/order/ownership before any DDL. No DDL was applied.

## Build, CI, and test posture

### Package scripts
- Root `npm test` runs two Jarvis validators only; it is not the complete repository test suite.
- `apps/web/package.json` defines `next build`; no web test script is declared in that package.
- `apps/api/package.json` defines TypeScript build and Node tests, but `apps/api/package-lock.json` is absent on the audited branch. Do not fabricate a lockfile or bypass `npm ci` to conceal the reproducibility gap.
- The root lockfile and web lockfile should be checked against the exact install commands in the workflows before running them.

### Workflow triggers require attention
- `.github/workflows/kingsmen-application-builds.yml` triggers on PRs targeting `main` and `fix/kingsmen-phase0-source-guard-ledger`, pushes to `main`, and manual dispatch.
- `.github/workflows/kingsmen-source-guard.yml` triggers on PRs/pushes to `main` and manual dispatch.
- `.github/workflows/jarvis-live-runtime.yml` is path-filtered for Jarvis-related files and package.json.
- `.github/workflows/batch21c-docker-runtime-proof.yml` triggers manually and on selected path changes pushed to `main`.

A PR targeting a different base branch may not trigger all these workflows. Confirm intended PR base and required checks rather than assuming all validators execute. This inventory did not establish a passing run for the audited commit.

## Tracker integrity

`Kingsmen_Build_Tracker.csv` has 189 data rows across 16 phase labels:
- 185 rows marked `Not_Started`
- 3 rows marked `Built`
- 1 row has a blank/other status

Some rows are marked `Not_Started` even though corresponding route/source files exist. Therefore the tracker is not a reliable source-of-truth for implementation status without reconciliation. Do not mass-change rows to `Built` or `Verified`. Adopt evidence-backed states:
- `NOT STARTED`
- `IN PROGRESS`
- `IMPLEMENTED — NOT VERIFIED`
- `VERIFIED` (only with named, repeatable evidence)
- `BLOCKED`
- `NEEDS PRODUCT OWNER CONFIRMATION`

## Supabase advisor snapshot

- Security advisor returned zero lints at the time checked. This does not prove RLS role isolation or business authorization correctness.
- Performance advisor returned 165 informational `unused_index` findings. Do not automatically drop indexes; first inspect workload history, constraints, query plans, and whether an index supports security or integrity paths.
- The staging project was reported healthy, but health does not establish end-to-end application correctness.

## Prioritized next work (component-level, not repeated cosmetic work)

### P0 — Evidence and safety gates
1. Produce canonical requirements register from product doctrine, launch manifest, route inventory, build tracker, and PR requirements. Mark ambiguous requirements for product-owner confirmation.
2. Reconcile all SQL migration files and staging history without applying changes.
3. Fix API dependency reproducibility by generating/committing the correct lockfile from the actual package dependency graph in a controlled runner; do not hand-author it.
4. Run the existing source validators and builds in a controlled runner, record exact commit, commands, exit codes, logs, and artifacts.
5. Verify GitHub workflow triggers and required checks for the intended PR base; inspect branch protection read-only.
6. Build a staging test matrix using synthetic accounts only.

### P1 — Complete end-to-end candidate journeys
7. Registration → verified identity → onboarding/profile → document upload/read/review → application tracking → status history → support.
8. Cross-account ownership/security tests for candidate A vs candidate B and anonymous access.
9. Destiny Map public intake → validated persistence → safe authenticated handoff.
10. Personal Jobs opportunity → quality gate → proof review → apply pack → manual submission tracking → follow-up/outcome, with explicit idempotency and audit events.

### P1 — Founder, payments, communications and recovery
11. Founder/admin permission and approval matrix; stop-selling and emergency controls.
12. PayFast sandbox/ITN failure/replay/idempotency test suite.
13. Provider staging tests for email/urgent WhatsApp/SMS fallback, bounce and opt-out.
14. Backup/restore, secrets, observability, incident handling, privacy/consent/legal and final assembly evidence pack.

### P2 — Experience and polish after behavior is proven
15. Test desktop/mobile route rendering, loading/empty/error/success states, accessibility, navigation consistency and performance.
16. Only then prioritize visual refinements or additional features based on user requirements.

## Safety constraints
- No production data or real candidate PII in tests.
- No live payment, provider message, or third-party write.
- No migrations, resets, schema repairs, deploys, merge, or public launch from this audit.
- Do not weaken CI/branch protection to make checks pass.
- Keep launch blocked until P0 gates have reviewed evidence and founder approval.

## Completion definition for this audit
The repository audit is complete only when every requirement is mapped to source, dependencies, verification evidence, owner, and disposition; every route/module is inventoried; all migration history is reconciled; controlled build/test results are recorded; and every gap is either closed with evidence or explicitly blocked/awaiting product-owner confirmation.
