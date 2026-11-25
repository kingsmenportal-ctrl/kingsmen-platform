# Kingsmen Simplified Rebuild — Status and Completion Roadmap

**Status date:** 25 November 2026  
**Canonical repository:** kingsmenportal-ctrl/kingsmen-platform  
**Implementation branch:** rebuild/kingsmen-one-foundation-2026-11-17  
**Overall state:** **REBUILD IN PROGRESS — PUBLIC LAUNCH BLOCKED**  
**Active phase:** **Phase 1 governance + Phase 2 database/security audit (in progress; Phase 2 is the active diagnostic workstream)**

This is the current, evidence-based project status register. It supersedes older summaries when current repository, staging or release-manifest evidence disagrees with an old chat or report. Read this file before beginning Kingsmen work and update it when a meaningful batch lands.

### Latest completed work

- **Candidate application next-step guidance merged (PR #346; merge `096bbb1a7680067efa971b1e3e7a73a065f7250a`):** the tracker and workbench now show status-specific, evidence-bound next steps for all seven candidate-facing statuses. Unknown or missing status keeps draft resume unavailable and explains the safe next step. The status-contract and browser tests passed in [Kingsmen CI #45697633749](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45697633749) and [candidate application contract #45697633803](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45697633803). Frontend/tests only; no backend, database, Auth, RLS or deployment changes.
- **Schema-compatible candidate journey merged (PR #344; merge `aebd079f8072de96d13f675e065c891d2b0bae88`):** the candidate applications entry, dashboard navigation, tracker/workbench, draft editor, shared browser session/expiry logic and document workflow are now in the canonical rebuild branch. Staging schema inspection confirmed `public.candidate_applications` does **not** have `kingsmen_status`, so the edge-function query omits that column until a reviewed migration exists. Unknown/missing candidate-facing status displays `Status not available`; draft resume/edit fails closed. Added `scripts/staging/test-candidate-preparation-schema-compat.mjs`. All four PR-head workflows passed on validated commit `994df9c4d58858a3f096a6979a2031100462e8df`: [Kingsmen CI #45695029317](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45695029317), [candidate contract #45695029373](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45695029373), [RLS offline contract #45695029370](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45695029370) and [Jarvis Live Runtime #45695029333](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45695029333). Status/draft SQL remains a disposable-CI proposal outside `db/migrations/`. No staging schema/data/RLS/Auth or deployment changes; live draft runtime remains blocked by missing table/RPC/security-helper/event-type prerequisites and absent approved fixtures.

- **Candidate application runtime preflight executed against staging (read-only):** repeat SELECT-only queries against Supabase project `euhubhhnumtibbyufghm` on 25 November 2026 confirmed 130 distinct migration-ledger records; latest version/name is `20261029193124` / `candidate_self_service_profile_bootstrap_0095`. There are no ledger name matches for 0096–0098 or 0107–0110. The `candidate_applications` parent table exists but has no `kingsmen_status` column; `candidate_application_draft_answers`, the draft read/save RPCs and `kingsmen_security.current_verified_kingsmen_candidate_id()` are absent, and the event-type constraint does not allow `APPLICATION_DRAFT_SAVED`. No approved candidate identity-link rows, reusable profile rows or application fixtures exist. **Result: runtime blocked.** This was SELECT-only; no schema, data, Auth setting, policies or deployment changed. The repeatable single-statement query and offline no-write contract are now in `scripts/staging/kingsmen-candidate-draft-runtime-preflight.sql` and `scripts/staging/test-candidate-draft-runtime-preflight.mjs`, documented in `docs/rebuild/CANDIDATE_DRAFT_RUNTIME_PREFLIGHT.md`. Do not apply migrations 0107–0110 until exact deployed-SQL provenance, restore rehearsal, schema compatibility, security review and change-control approval pass.

- **Staging RLS API boundary probe merged (PR #343; merge commit `4adb15d963363202cdc6e81715f25dcc3f163857`):** added `scripts/staging/probe-live-rls-api-boundary.mjs`, the 65-check offline contract test, a gated manual GitHub Actions workflow, and operator instructions. All four CI workflows passed on validated PR head `194bc01f442fdc18114314078c6e2f3d19f39bb5`: [RLS probe #45693309444](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45693309444), [Kingsmen CI #45693309467](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45693309467), [application contract #45693309777](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45693309777), and [Jarvis Live Runtime #45693309886](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45693309886). This is source/CI proof only; **live API role-isolation remains untested** because approved fixture rows and non-production actor tokens are not available. The runner is fixed to staging project `euhubhhnumtibbyufghm`, sends GET requests only, and does not create fixtures or change database state. Release gate remains blocked.

- **Status and roadmap register merged:** PR [#327](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/327), merge commit `fbd8420d14ba6ee87174c77de7de58d213254f8c`. The status validator, top-of-README reference, mandatory CLAUDE handoff instructions, and CI status-check step are now on the rebuild branch.
- **Free Destiny Map readiness preview merged:** PR [#326](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/326), merge commit `189b61a74a8c8bf2dace85203954fd5969e66629`. The preview is browser-local, separate from the existing consent-gated submit action, and tested not to call the intake API or save selections.
- **Rebuild CI validator repair merged:** PR [#330](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/330), merge commit `84978bb62981ef41997b1fd23aed47a3cce0de26`. [Its Kingsmen CI run](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45637295249) passed focused tests, the status-register validator, migration-provenance validator, API build and Next.js web build. This was a wording/validator repair only; no staging schema or data changed.
- **Latest fully passed integrated CI:** [Kingsmen CI run #45639299046](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45639299046) passed on commit `af25ba4ecf94fde40739332d7c15a24092874974`: focused tests, status-register validator, migration-provenance validator, security-advisor validator, API build and Next.js web build. The current status documentation/manifest refresh triggers a further run.
- **Verified pre-merge checks:** [PR #327 Kingsmen CI](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45634438774) passed focused tests, status validation, API build and web build. [PR #326 application contract workflow](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45634488651) passed PostgreSQL/UI contract coverage, the Free Destiny Map preview browser test and the N15 source-review browser test.
- **Candidate draft runtime preflight merged (PR #345; merge `712be387cfd5bd2411ba5644e39440f9428df9b8`):** added `scripts/staging/kingsmen-candidate-draft-runtime-preflight.sql`, a single SELECT-only query plus an offline no-write contract test, wired into root and application-contract CI. The exact SQL was executed against staging on 25 November 2026 and returned 130 distinct ledger records, latest `20261029193124` / `candidate_self_service_profile_bootstrap_0095`, zero ledger-name matches for 0096–0098 and 0107–0110, missing status/draft table/RPC/security-helper/event prerequisites, and `candidateDraftRuntimeReady=false`. All four PR workflows passed: [application contract #45696638529](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45696638529), [Kingsmen CI #45696638409](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45696638409), [Jarvis Live Runtime #45696638393](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45696638393), and [RLS offline contract #45696638408](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45696638408). The SQL made no changes; migration replay remains unauthorized.

- **Ruleset-aware branch-protection verifier implemented:** the read-only capture script now falls back to the active repository rulesets API when the classic branch-protection endpoint returns 404, and records the actual ruleset plus any incomplete policy requirements. The evaluator already has classic and ruleset fixtures; their source validator and regression tests are now a mandatory step in the rebuild CI. The repository policy itself has not been changed; main remains protected but the stricter project-manifest requirements remain incomplete.
- **Branch-protection evidence reporting corrected (PR #345; merge `712be387cfd5bd2411ba5644e39440f9428df9b8`):** the capture script now names the list payload count `listedRulesetsMatchingMainInListPayloadCount` and separately records `selectedRulesetVerifiedApplicable` plus `detailVerifiedApplicableRuleSetCount` after the detail endpoint verifies the selected rule. The post-merge evidence workflow is being checked; this source fix does not change GitHub ruleset settings. The active main ruleset remains only partially compliant: source-guard/release-evidence checks, stale-review dismissal, conversation resolution, linear history and admin enforcement remain unresolved.
- **Security advisor snapshot captured and live privileges checked (read-only):** the live staging advisor lists 17 RLS-enabled tables with no policies, 6 SECURITY DEFINER RPC functions callable by authenticated users, 16 overlapping permissive-policy findings, leaked-password protection disabled and 282 unused-index suggestions. A live catalog query verified all six deployed function bodies match candidate historical source bodies after whitespace normalization; anon and PUBLIC cannot execute any of them, while authenticated execution is explicitly granted. A second query verified all 17 no-policy tables deny direct SELECT/INSERT/UPDATE/DELETE to both anon and authenticated. A further read-only check found five RLS-enabled tables (`candidate_credentials`, `candidate_sessions`, `evidence_ledger`, `route_sources`, `workflow_runs`) grant direct CRUD privileges to both anon and authenticated, relying on RLS predicates to narrow access. This is a P0 least-privilege and negative-API-test item—not proof of exposure. No database/security/Auth settings were changed; leaked-password protection remains disabled; do not drop the 282 indexes by count alone. Full policies/grants/helpers are in the audit snapshot.
- **Security overlap audit merged:** PR [#335](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/335), merge commit `9a9e8d0e7d3f00e88a60f7fbbc0d744524f77cda`. [Kingsmen CI run #45640042482](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45640042482) passed root tests, status-register validation, migration-provenance validation, security-advisor validation, API build and Next.js web build. All 16 live policy-overlap combinations now include the exact role/action and overlapping policy names. Candidate A/B, operator and founder runtime isolation tests remain pending. No policy, privilege, schema, Auth setting or candidate data changed.
- **Migration provenance snapshot expanded across history:** the current rebuild branch has 41 tracked SQL files. A sweep of eight rebuild/feature/release branch trees captured 414 branch-file entries, deduplicated to 86 path/hash entries across 83 paths. It found 40 ledger records with core+sequence candidates, 27 with core-only/sequence-different candidates and 63 with no source-name candidate in the branches searched. The current branch alone still has 96 ledger records without a name match; two live ledger names are duplicated. These are filename-derived candidates, not exact SQL-deployment proof. No staging data/schema was changed. Historical sequence reuse in the 0087–0096 range makes blind restore/replay unsafe. The provenance validator passed in PR #330's CI run alongside status-register validation and API/web builds. CI is running again against the latest consolidated rebuild commit.

- **Migration body-level provenance reconciliation — current implementation batch:** a read-only query against staging confirmed all 130 migration ledger entries have one stored SQL statement. Byte-for-byte Git blob comparisons against the current rebuild branch and the eight-branch source corpus found 30 exact matches (29 distinct bodies), 37 filename candidates with a differing body, and 63 records with no filename or body candidate. One hundred records remain unmatched; this does not authorize replay. The hash-only evidence and repeatable SELECT query are being added in `manifests/rebuild/kingsmen-staging-migration-body-provenance-2026-11-25.json` and `scripts/staging/kingsmen-staging-migration-body-provenance.sql`.

## 1. Executive status

Kingsmen is **not a blank project**. The repository contains a substantial Next.js product surface, separate API package, candidate and founder routes, document and application workflows, opportunity-engine code, finance/payment code, Supabase Edge Functions, Jarvis command-centre code, database migrations, validators and release-evidence tooling.

Kingsmen is also **not ready for public production use**. Source code and deployed functions exist, but the critical candidate journey has not yet been accepted end to end on a clean staging run. The canonical launch manifest has **13 required release gates; none is fully evidenced as passed**. The platform must not take live payments or accept public candidate records until those gates are closed.

The rebuild strategy remains: preserve the repository and its history; consolidate around one web app, one API boundary and PostgreSQL/Supabase as the authoritative truth store; reuse valuable code selectively; prove each critical workflow; then enable production actions in stages. Do not merge large stacked pull requests wholesale.

### Current state at a glance

| Area | Current evidence | Status |
|---|---|---|
| Source repository | 3,385 tracked files on the selected rebuild branch at the latest inventory snapshot; 78 app route pages; 73 Next.js API route handlers; 220 validator files | Built, needs consolidation and runtime acceptance |
| Candidate experience | Candidate dashboard, profile, identity review, workbench, tracker, saved opportunities, documents, finance, outcomes, messages and mobile routes exist in source | UI/routes exist; full journey not yet accepted |
| API | Separate apps/api package and typed command/state-machine code exist | Buildable foundation; persistent staging behaviour must be proved |
| Database | kingsmen-portal-staging is ACTIVE_HEALTHY; PostgreSQL 17.11; 230 public tables; RLS reported enabled on all public tables | Database is available; schema/migration/security reconciliation remains open |
| Migration history | 130 staging ledger records; 41 current-branch SQL files; 8-branch sweep: 40 core+sequence candidates, 27 core-only candidates, 63 no source-name candidate; 2 duplicate ledger names | A historical candidate map now exists, but exact applied SQL-body provenance is not proved; sequence reuse across branches requires a reviewed lineage map before any schema change |
| Staging contents | Supabase table inventory reported zero rows for every public table | Inventory signal, not proof that every test flow or storage object is empty; verify with controlled read-only checks |
| Edge Functions | 23 functions reported ACTIVE; 22 have JWT verification enabled, while payfast-sandbox has verify_jwt=false for external callback compatibility | Deployed code exists; compare hashes to source and prove each critical runtime path |
| Security advisor | 17 RLS/no-policy tables, 6 authenticated-callable SECURITY DEFINER functions, 16 policy-overlap findings, leaked-password protection disabled, 282 unused-index suggestions | Live checks show no anon/PUBLIC EXECUTE on the six functions, all six bodies match historical candidates, and no anon/authenticated direct grants on the 17 no-policy tables; role-level E2E tests and Auth setting remain open |
| Hosting | Netlify project exists and last recorded ready production deploy is dated 8 July 2026 | A ready deploy exists; it does not prove the current rebuild branch is deployed |
| Git governance | Active ruleset `main-branch-protection` (ID `26323884`) protects `main`; it requires one approval and strict `test-and-build`/`validate` checks, plus delete/update/creation and non-fast-forward controls. It does not yet meet the full stricter manifest: required `source-guard` and release-evidence checks, stale-review dismissal, conversation resolution and linear history are absent. The classic-API verifier is stale for ruleset-based protection and reports 404. | **Partial; P0 remains until the ruleset and verifier are reconciled** |
| Launch gates | 13 canonical gates remain incomplete or proof-pending | Public launch blocked |

Inventory counts were observed from the selected rebuild branch's GitHub tree and connected Supabase project on 25 November 2026. Code counts are not a percentage of product completion.

### Frontend / backend / integration status — 25 November 2026

| Surface | What is built / verified | What is still missing | Status |
|---|---|---|---|
| **Frontend — Next.js / React** | `apps/web` contains 78 route pages on the last inventory snapshot; candidate/dashboard, profile, identity, workbench, tracker, documents, finance, outcomes, messages and mobile route families exist. PR #326's browser-local Free Destiny Map readiness preview is merged; its browser test passed and verified preview does not submit or persist. The Next.js build passed in PR #335 CI run #45640042482. | A single full authenticated candidate journey has not passed end-to-end on staging; source coverage is not proof that all pages are connected or production-ready. | **Source/build verified; targeted preview browser test passed; full journey pending.** |
| **Backend — API / workers** | Separate `apps/api` package and typed command/state-machine and persistence foundations exist. API build passed in PR #335 CI run #45640042482. `apps/workers` exists. | Prove real staging command persistence, idempotency/retry, worker lease recovery, queue/DLQ behaviour and service-role boundaries. | **API source/build verified; runtime acceptance pending.** |
| **Backend — Supabase / PostgreSQL** | Staging is `ACTIVE_HEALTHY`, PostgreSQL 17.11, 230 public tables, RLS enabled across the public inventory, and 23 Edge Functions reported active. Live security advisor and function/table-privilege checks are snapshotted. | Exact applied migration lineage remains unresolved (130 live records; historical branch naming candidates only). Candidate A/B, operator/founder and RPC negative-access tests are pending. Leaked-password protection still requires a reviewed Auth change. | **Available; read-only diagnostics done; release security gates open.** |
| **Integration / deployment** | PR #335 CI passed root tests, status/migration/security validators, API build and web build; Jarvis Live Runtime has passed on recent rebuild commits. | The active `main-branch-protection` ruleset only partially meets the stricter project specification: source-guard and release-evidence required checks, stale-review dismissal, conversation resolution and linear history remain missing; the classic-API verifier returns 404 for ruleset-based protection. The latest recorded Netlify production deploy is 8 July 2026 on `main`, not this rebuild branch. | **Latest PR checks passed; ruleset alignment and intended production deployment remain open.** |


## 2. What Kingsmen is supposed to deliver

Kingsmen is a South African opportunity and application platform for candidates, operators and the founder. It must take a candidate from initial route discovery through a safely managed application lifecycle, keeping provider facts, privacy, payments and official outcomes evidence-bound.

### Candidate-facing product

1. Public home and the Free Destiny Map entry point.
2. One candidate account and reusable candidate profile, with explicit consent and controlled identity linkage.
3. Six discovery pathways: higher education, TVET, SETA/learnerships, internships/apprenticeships, employment, and funding/support. Discovery should not be restricted by package tier.
4. Opportunity discovery, official-source and deadline verification, saved matches and source confidence.
5. One application workbench with preparation tasks, requirements, documents, deadlines, status and evidence.
6. A master application profile/target model supporting many provider targets without inventing provider submissions.
7. A private document vault with short-lived access, upload validation, quarantine/review where required, human verification and audit history.
8. Candidate messages, support, follow-up, outcomes and correction requests.
9. Plans, orders, verified payment events, entitlements and human-reviewed refunds.
10. Mobile-responsive/PWA access to the same authoritative candidate state.

### Operations and founder controls

- Operator queues for identity, documents, opportunity sources, applications and exceptions.
- Founder command plane with daily briefs, incidents, approvals, release controls and auditable decisions.
- Jarvis as private founder command intelligence, not the public candidate chatbot or the source of truth.
- N00–N20 module visibility, evidence ledger, policy checks and explicit safe/manual fallback paths.
- Email as primary communication, WhatsApp urgent-only, SMS fallback-only.
- One PostgreSQL/Supabase Truth Vault. Airtable is a mirror and n8n is a thin workflow wrapper unless the founder formally changes that doctrine.
- No provider, robot, tool, agent, payment, submission or outcome may be called live without runtime proof.

## 3. Current architecture and evidence boundaries

### Canonical implementation lane

- Repository: https://github.com/kingsmenportal-ctrl/kingsmen-platform
- Selected rebuild branch: rebuild/kingsmen-one-foundation-2026-11-17
- Web: apps/web — Next.js App Router and React.
- API: apps/api — deployable API package, command/state-machine boundary and Truth Vault repository.
- Workers: apps/workers — worker area exists but is not yet accepted as the one proven production worker runtime.
- Database: Supabase project kingsmen-portal-staging, ref euhubhhnumtibbyufghm, PostgreSQL 17.11, currently ACTIVE_HEALTHY.
- Hosting: Netlify project kingsmen-jarvis-command-zungu, public URL https://kingsmen-jarvis-command-zungu.netlify.app/.
- Current staging Edge Functions: 23 reported active. Deployed functions must still be reconciled to source hashes and run through authenticated runtime tests.

The live site is a preview of a previous deployment; it must not be mistaken for a deployment of the current rebuild branch. Netlify's last recorded ready deploy was 8 July 2026.

### Existing pull-request position
- **PR #345 — Add candidate draft runtime preflight and clarify ruleset evidence:** merged at `712be387cfd5bd2411ba5644e39440f9428df9b8`; all four PR workflows passed and the exact SELECT-only SQL query ran successfully against staging. The branch-protection evidence workflow after the merge still needs its final result; the live ruleset policy itself remains incomplete.
- **PR #344 — Reconcile candidate application journey with current staging schema:** merged at `aebd079f8072de96d13f675e065c891d2b0bae88`; all four PR-head CI workflows passed and the seven candidate browser journeys passed. Post-merge Kingsmen CI, Jarvis Live Runtime and branch-protection evidence checks were triggered separately; live staging runtime is still unproven.
- **PR #343 — Read-only staging RLS API boundary probe:** merged into this rebuild branch at `4adb15d963363202cdc6e81715f25dcc3f163857`; all four PR CI workflows passed on validated head `194bc01f442fdc18114314078c6e2f3d19f39bb5`; live staging probe not executed and no staging changes made.

- **PR #342 — Canonical candidate applications entry route/status/session/document journey:** closed as superseded by PR #344. Its earlier draft branch had diverged from the current rebuild base and selected the not-yet-installed `kingsmen_status` column in the live edge-function query. Its safe candidate UI work was ported to PR #344 with the schema compatibility fix and fresh passing checks.



- **PR #327 — Authoritative status and completion roadmap:** merged into the rebuild branch.
- **PR #330 — Rebuild CI status and migration-provenance validator repair:** merged into the rebuild branch; the CI run passed all focused tests, validators, API build and web build.
- **PR #335 — Populate live security advisor overlap evidence:** merged into the rebuild branch; [CI #45640042482](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45640042482) passed focused tests, status/migration/security validators, API build and web build.
- **PR #326 — Browser-local Free Destiny Map readiness preview:** merged into the rebuild branch after its browser/PostgreSQL contract workflow passed.
- **PR #324 — Canonical candidate application status contract:** still open and draft, targets the rebuild branch.
- **PR #323 — Read-only staging preflight for candidate application runtime:** still open and draft, targets the rebuild branch.
- **PR #319 — Kingsmen One foundation and recovered candidate product slice:** the broader draft rebuild integration PR targeting main; still blocked pending release/security evidence.
- **PR #316 — Frontend product slice:** open against main; reuse source selectively, do not merge wholesale.
- **PR #209 — Backend simplification baseline:** open against main; use for architecture/code review, not wholesale merge.
- **PR #292 — Application draft persistence:** stacked on another feature branch; reconcile dependencies before any transplant.
- **PR #325:** closed because it targeted main instead of the selected rebuild branch. Do not treat it as released.

Keep old branches and history until classified. The chosen rebuild branch is the implementation lane, not permission to abandon main, staging data or existing useful work.

## 4. What already exists in the repository

These are source/inventory observations, not claims that every item has passed production tests.

| Module | Existing foundation | Remaining acceptance work |
|---|---|---|
| N00 — Constitution / doctrine | Locked product and safety doctrine | Keep one canonical status and release checklist; enforce in validators |
| N01 — Foundation / runtime | Repository, web/API packages, CI and build scripts | Simplify install/build paths; pin tested versions; protect main and the selected rebuild lane |
| N02 — Backend API kernel | Typed command envelope, policy middleware, state machine, workflow-result intake and API endpoints | Prove health, persistence, idempotency and recovery on staging |
| N03 — Truth Vault / PostgreSQL | Supabase staging database, migrations and repository layer | Map 130 live migration records against tracked source; resolve drift without blind replay; prove backups/restores |
| N04 — Candidate core / portal | Candidate routes, dashboard, profile and session/identity code | Authenticated browser journey and candidate A/B isolation tests |
| N05 — Document vault | Document UI, private-document API/Edge Function and review tables | Prove ownership, signed-link expiry, upload validation, reviewer permissions and retention |
| N06 — Route universe / workbench | Six-path navigation, applications, tracker, preparation/readiness and master application code | Verify one lifecycle from draft to prepared/provider receipt/outcome with evidence |
| N07 — Airtable sync / mirror | Connector registry, mirror targets, durable outbox and enqueue function | Prove retry/idempotency and keep PostgreSQL authoritative |
| N08 — Operator command room | Control-plane tables, health function and operator routes | Prove roles, queues, approval rules and audit trail |
| N09 — Notifications | Communications tables, templates, outbox, delivery attempts and escalation paths | Prove email send/receive, bounce/opt-out, WhatsApp urgent-only and SMS fallback-only |
| N10 — Finance / PayFast | Canonical package/finance tables, payment/refund flows and PayFast sandbox function | Prove sandbox checkout/ITN, duplicate/replay/signature/amount checks and refund review |
| N11 — AI decision engine | Route matching, eligibility, scoring, evidence/review guards and AI decision code | Verify inputs and source confidence; prevent unsupported match/outcome claims |
| N12 — Governance / tribunal | Policy, consent, review and audit schemas | Close or justify security advisor findings; test least-privilege boundaries |
| N13 — Observability / incidents | Health checks, metrics, incident, alert, report and DLQ tables | Demonstrate alerts, correlation IDs, redaction and incident drills |
| N14 — Integrations registry | Provider/workflow connector registry, integration queues and webhook evidence | Runtime health/authentication evidence for every integration claimed live |
| N15 — Opportunity engine | Source authority registry, source ingestion/review functions and opportunity feeds | Verify current source, opening, deadline, eligibility and manual fallback |
| N16 — Execution orchestrator | Worker registry, run/step/queue/idempotency/manual-handoff tables | Prove retries, expired leases, dead-letter recovery and safe manual handoff |
| N17 — Founder control plane | Founder reports, command requests/results, decision log and founder routes | Prove founder-only access, approvals and auditable risk decisions |
| N18 — Public website | Home, Free Destiny Map, packages and public copy controls | Deploy/smoke-test the selected rebuild commit; publish approved legal surfaces |
| N19 — Mobile PWA | Candidate mobile routes, devices/sessions/actions/preferences/status cards | Verify responsive/authenticated flows, accessibility and no duplicate truth store |
| N20 — Final assembly / release | Launch manifest, release lock, validators, staging proof pack and final evidence bundle | Close all 13 release gates and get founder review before public launch |

## 5. Highest-priority blockers

### P0 — must close before public candidate data or live payments

1. **Branch governance:** active ruleset `main-branch-protection` is confirmed, but the existing verifier checks only classic branch protection and is therefore misleading for a ruleset-based repository. Reconcile the verifier and upgrade the active ruleset to match the approved manifest: include the intended source-guard/release evidence controls and decide required stale-review, conversation-resolution and linear-history rules. Keep the release gate blocked until actual settings and CI contexts are verified.
2. **Migration provenance:** the filename/history snapshot is `manifests/rebuild/kingsmen-staging-migration-provenance-2026-11-25.json`; the follow-up body-level capture is `manifests/rebuild/kingsmen-staging-migration-body-provenance-2026-11-25.json`. The read-only SQL-body comparison found exact Git blob matches for 30 ledger rows (29 distinct bodies); 37 filename candidates have a different body and 63 records have no name/body candidate in the eight searched branches. Thus 100 of 130 records still lack an exact body match in the searched corpus. Two ledger names are duplicated. Reconcile remaining records against historical commits, backups/deployment evidence and schema state; no migration replay or schema change is authorized.
3. **Database role security:** review six authenticated-callable SECURITY DEFINER functions. Confirm intended caller, row ownership, argument validation and execute grants; revoke or change unsafe public execution paths.
4. **RLS policy findings:** review 17 RLS-enabled tables without policies and 16 multiple-permissive-policy findings. Backend-only review/founder tables may intentionally have no client policies, but each exception needs explicit role tests and documented justification.
5. **Authentication setting:** enable and verify leaked-password protection or document an approved security exception.
6. **Truth Vault runtime:** prove durable command, idempotency, workflow-run, evidence, approval, audit, heartbeat and dead-letter records through the real API/database boundary.
7. **Candidate role isolation:** staging tests must prove anonymous, Candidate A, Candidate B, operator/reviewer, founder and service-role boundaries.
8. **Web/API integration:** prove the deployed rebuild uses the configured API boundary; no public web request may shell out to a workstation or access the database directly.
9. **Payment sandbox:** prove success/cancel/failure, ITN signature, replay/duplicate, merchant/amount mismatch and refund review against the provider sandbox. No live payment activation until evidence passes.
10. **Backup/restore:** run a real staging backup and restore drill with checksums, source/target separation, recovery measurements and redacted evidence.
11. **Communications:** prove provider delivery, bounce and opt-out; keep WhatsApp urgent-only and SMS fallback-only.
12. **Privacy/legal:** publish versioned Terms, Privacy, Consent, Refund/Payment and Data Subject Request pages; obtain founder/legal review before live personal-data collection or checkout.
13. **Final assembly:** capture a complete redacted staging evidence pack, validate reports, and record founder review before opening the release gate.

### P1 — complete for a reliable beta

- Authenticated candidate journey from registration/login through profile, route choice, application preparation, private documents, status tracking and follow-up.
- One canonical application-status contract used by draft editor, tracker, workbench and backend. Candidate-facing labels must remain distinct from internal workflow states.
- Real source-reviewed opportunities and deadline freshness; no “open” claims from static catalogue rows alone.
- Private founder/operator queues, approvals and corrections.
- Email-first operational messaging and support/follow-up.
- Usable mobile layout and accessible keyboard/screen-reader paths.

### P2 — strengthen after the core journey is dependable

- Expand Jarvis's live tool mesh only when each provider and action has current evidence.
- Consolidate redundant routes and duplicate validators while preserving useful safety tests.
- Tune low-use indexes only after representative query/runtime measurements. The advisor reports 282 unused indexes; do not remove them blindly before workload proof.
- Complete broader mobile/PWA refinements and additional AI decision/automation capabilities.

## 6. Timeline and completion definition

The schedule is expressed as engineering effort plus explicit gates, not as a claim that source files alone make the product complete.

| Phase | Engineering estimate | Outputs | Exit condition |
|---|---:|---|---|
| **0. Project control baseline** | Completed in this batch | Status register, machine-readable manifest, validator, mandatory start-of-chat rule | Status can be read and checked from the repository |
| **1. Repository and architecture consolidation** | 1–2 working days | Confirm rebuild lane, review PRs #323/#324/#326, reduce duplicate install/build paths, pin runtime versions, branch protection | Clean CI on intended rebuild branch; branch protection confirmed |
| **2. Database provenance and security** | 2–3 working days | Applied-to-source migration map, role/policy review, least-privilege fixes, RLS test harness | Migration plan reviewed; Candidate A/B and operator/founder isolation tests pass |
| **3. Candidate foundation journey** | 2–4 working days | Auth, identity binding/review, profile/consent, candidate dashboard and account-backed state | Browser candidate journey passes with persistence and authorization checks |
| **4. Opportunity and application lifecycle** | 2–3 working days | Source-reviewed opportunities, saved matches, master profile, application draft/status/tracker, manual fallback | Application state and provider receipt are evidence-backed end to end |
| **5. Documents, finance and communications** | 2–4 working days | Private document lifecycle, PayFast sandbox/ITN, package entitlements/refunds, email-first communications | Document security, payment sandbox, messaging and audit scenarios pass |
| **6. Founder operations, Jarvis and mobile** | 1–2 working days | Founder/operator controls, release evidence/incident views, voice/status proof and responsive mobile integration | Role-protected control paths and key operations are tested |
| **7. Staging release and private beta** | 2–3 working days | Backup/restore, observability/incident drills, legal/privacy publication, staging pack and final assembly bundle | All 13 gates pass and founder approves a small private beta |

**Working estimate:** 12–21 engineering days assuming code reuse and prompt decisions. External provider accounts, runtime credentials, security remediation, legal review and retesting may add roughly 3–10 working days. A realistic planning window is therefore **about 3–6 calendar weeks**. From 25 November 2026, the tentative planning window for a small private beta is **16 December 2026–6 January 2027**, conditional on the phase exit criteria and provider/legal dependencies; this is not a guarantee date. Re-estimate after Phase 2 and the first full candidate journey. Every phase has an explicit pass/fail exit condition.

### What “complete” means

Kingsmen is complete for a release only when:

- the selected commit builds cleanly on CI;
- candidate and founder journeys pass authenticated browser/API/database tests;
- source/deployed database migrations and Edge Functions are reconciled;
- role isolation, private documents, payments and communications pass staging evidence checks;
- backups, restore, monitoring, privacy/legal and incident handling are proven;
- every required report is current, redacted and reviewed;
- the release manifest says the gate is open and the founder has approved the release.

A page, route, function, migration or validator existing is not a release pass.

## 7. Work ownership and decisions

### Work in the repository

- Inspect/reuse code, implement small vertical slices, add regression tests and make CI prove each change.
- Reconcile source against live staging read-only before suggesting schema changes.
- Track changed files, commits/PRs, actual test results, evidence paths and remaining blockers.
- Maintain this document, its JSON manifest and the validator after each meaningful batch.

### Founder-only or provider-dependent decisions

- Place provider secrets in the relevant provider console or approved secret store; never paste keys into code or commit them.
- Approve/publicly publish legal and privacy terms after suitable review.
- Approve release-risk actions, live payment activation and official provider-submission actions.
- Confirm any formal architecture doctrine change; until then PostgreSQL remains truth, Airtable stays a mirror and n8n stays a wrapper.

No new production database should be created. Do not modify staging data, migrate schemas or deploy production merely to make a status look better.

## 8. Required status format for every Kingsmen work chat

Every response concerning Kingsmen must start with a dated status report, even when the user's request is a follow-up or just says “next”:

1. **Overall status:** active phase, launch state and current completion estimate.
2. **Frontend status:** source/pages changed, what is visible/connected, tests/build that passed, and what remains.
3. **Backend/data status:** API/database/migrations/RLS/auth/Edge Functions/workers changed, tests/runtime proof, and what remains.
4. **Integration/deployment status:** branch/PR/commit, staging state, current CI and whether the current rebuild commit is actually deployed.
5. **This batch:** changed files and whether each change is FRONTEND, BACKEND/DATABASE, INTEGRATION/CI, or DOCUMENTATION/GOVERNANCE.
6. **Evidence:** exact passed/failed/pending test or workflow links. Do not claim a test passed based on source presence or an older commit without saying so.
7. **Blocker and next milestone:** named blocker, next deliverable, acceptance test and engineering estimate/target window.

After that opening report, explain what was built in the batch and what remains. Distinguish source exists, builds, tests pass, works in staging, and deployed to the intended environment. Do not end a Kingsmen batch while a known CI failure is unreported; fix it or explicitly record a concrete failing step. Update this status document, JSON manifest and validators after meaningful work. Never say “complete” without evidence. Do not propose a fresh architecture unless the current architecture is demonstrably wrong and the change is recorded.

## 9. Commands and links

- **Status validator:** npm run kingsmen:status:validate
- **Migration provenance validator:** `npm run kingsmen:migrations:provenance:validate`.
- **Security advisor snapshot validator:** `npm run kingsmen:security-advisor:validate`.
- **Full repository tests:** npm test
- **Build API:** npm run api:build
- **Launch audit:** npm run kingsmen:launch:audit
- **Release boot-blocker:** npm run kingsmen:launch:gate
- Repository: [kingsmen-platform](https://github.com/kingsmenportal-ctrl/kingsmen-platform)
- Selected rebuild lane: [rebuild/kingsmen-one-foundation-2026-11-17](https://github.com/kingsmenportal-ctrl/kingsmen-platform/tree/rebuild/kingsmen-one-foundation-2026-11-17)
- Launch gate definition: [KINGSMEN_LAUNCH_READINESS.md](https://github.com/kingsmenportal-ctrl/kingsmen-platform/blob/rebuild/kingsmen-one-foundation-2026-11-17/docs/launch/KINGSMEN_LAUNCH_READINESS.md)
- Live site (previous deploy; not proof of rebuild branch): [kingsmen-jarvis-command-zungu.netlify.app](https://kingsmen-jarvis-command-zungu.netlify.app/)
