# Kingsmen Component Status Ledger

**Repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Default-branch snapshot used for source/path checks:** `main` at `12fc775e8a162dfe25450249c4877151f9e6afa9`  
**Working PR:** [#86 — Phase A.1 public entry and candidate auth UI foundation](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/86)  
**Tracker audit:** [Build Tracker Reconciliation](KINGSMEN_BUILD_TRACKER_RECONCILIATION.md)

## Status rules

- **Implemented** means source exists.
- **Integrated** means connected to its intended dependency/API.
- **Verified** requires an actual successful check or workflow, with evidence.
- **Operational** requires a real end-to-end runtime workflow and evidence.
- **Blocked** means a required dependency, proof, review, or gate is still missing.
- A status applies only to the exact capability named in the row; a passing source validator does not make the product workflow operational.

## Phase 0 — Foundation

| Component | Existing source files on `main` (exact paths) | Related PRs | Current status | Known gaps / evidence | Exact next action | Acceptance evidence |
|---|---|---|---|---|---|---|
| Source Guard workflow | `.github/workflows/kingsmen-source-guard.yml`; `package.json`; `scripts/validators/validate-api-truth-vault-persistence.mjs`; `scripts/proof/prove-payfast-sandbox-boundary.mjs`; `scripts/validators/validate-payfast-sandbox-proof.mjs`; `scripts/proof/prove-rls-security-boundary.mjs`; `scripts/validators/validate-rls-security-proof.mjs`; backup, secrets, communications, observability, legal, staging, final-assembly and branch-protection proof/validator files under `scripts/proof/` and `scripts/validators/` | #73, #82, #85 | **Verified** for Source Guard source/CI checks | [Latest run 38924974016](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/38924974016) completed successfully on PR #85's latest checked merge commit; all 29 workflow steps passed. Earlier run [38924542458](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/38924542458) also passed. The full job log confirms dependency install and all 29 workflow steps passed, including the formerly missing Truth Vault command. [Jarvis Live Runtime run 38924542480](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/38924542480) also passed. These are repository validators, not evidence of real database restore, live payments, provider delivery, or launch readiness. | Re-run after the latest ledger/reconciliation commit; preserve all validators. | Successful workflow on the latest PR head, with complete job log. |
| API build and unit-test workflow | `.github/workflows/kingsmen-api-checks.yml` (introduced through #82's branch); `apps/api/package.json`; `apps/api/tsconfig.json`; `apps/api/src/server.ts` | #73, #80, #82 | **Verified** for the recorded API build/test run; **Blocked** for deterministic API dependency installation | [Run 38914799005](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/38914799005) succeeded: root `npm ci`, API dependency install, API compile and unit tests passed. The API install step uses `npm install --prefix apps/api`; `apps/api/package-lock.json` is absent on main, so API dependencies are not pinned by a committed API lockfile. | Add and commit a valid API lockfile using a clean environment; change CI to `npm ci --prefix apps/api`; rerun build/tests. | Both root and API `npm ci` succeed from committed lockfiles, then build/type-check/unit tests pass on the same commit. |
| Tracker and component ledger reconciliation | `Kingsmen_Build_Tracker.csv`; `manifests/master-build-index.json`; `scripts/tracker/Sync-KingsmenProofTracker.ps1`; this ledger; `docs/launch/KINGSMEN_BUILD_TRACKER_RECONCILIATION.md` | #83, #84, #85 | **Verified** for row-by-row path classification; module acceptance remains separate | Main snapshot has 188 tracker rows: 185 `Not_Started`, 3 `Built`. Exact-path check found 36 tracker paths present and 152 absent. All 152 absent paths are `Not_Started` and are classified as planned/not materialized; 33 present paths remain `Not_Started` pending module evidence; all 3 `Built` paths exist but still require their module-level proof. The complete row-by-row classification is in the linked report. | Use the generated row-by-row classification as the path baseline; as each component is worked, compare its tracker row to its validator/runtime evidence and update the CSV only when status transitions are evidence-backed. | Committed row-by-row report covering all 188 rows and PRs #70–#85; no unsupported tracker status promotions. |
| Pull request inventory #70–#85 | PRs #70, #73–#80, #82–#85 are discoverable; #81 is closed unmerged; #71 and #72 returned 404 from GitHub API. See the reconciliation report for branch/base/title details. | #70–#85 | **Blocked** — inventory captured; integration order not yet reconciled | Most implementation PRs #74–#80 target `fix/kingsmen-ci-real-validation-gates`, not `main`; open PR source is not the same as code on main. #83/#84 are documentation-only. #81 is superseded. #85 remains draft. | Review dependencies and base-branch topology; do not merge migration PRs before recovery gate. Decide whether #71/#72 are deleted/private/unavailable rather than assuming they exist. | Current PR map reviewed; merge order and superseded branches explicitly resolved. |
| Root reproducible install | `package.json`; `package-lock.json`; `.github/workflows/kingsmen-source-guard.yml` | #73, #82, #85 | **Verified** for root `npm ci` within Source Guard | Root lockfile-based install passed in run 38924542458. This does not settle API lockfile reproducibility or all build/test gates. | Keep root lockfile in sync and include it in clean-install CI. | `npm ci` passes from a clean runner on latest commit. |
| Branch protection | `scripts/proof/prove-main-branch-protection-boundary.mjs`; `scripts/validators/validate-main-branch-protection.mjs`; `manifests/repo/main-branch-protection-v1.json` | #73, #85 | **Blocked** — source validation only | Source Guard's branch-protection proof/validator passed, but that is not evidence that GitHub branch protection is actually configured. Connector access does not establish that settings were applied. | Verify repository rulesets/branch protection in GitHub settings or through an authorized rulesets endpoint; configure required checks only with owner authorization. | Actual applied ruleset/branch-protection evidence listing required status checks. |

## Phase 1 — Database recovery and schema integrity (hard gate)

| Component | Existing source files / surfaces | Related PRs | Current status | Known gaps / evidence | Exact next action | Acceptance evidence |
|---|---|---|---|---|---|---|
| Database backup and recovery | `scripts/backup/Test-KingsmenTruthVaultRestore.ps1`; `scripts/proof/prove-backup-restore-boundary.mjs`; `scripts/validators/validate-backup-restore-proof.mjs`; `docs/ops/KINGSMEN_BACKUP_RESTORE_PROOF.md`; `docs/launch/PHASE_1_RECOVERY_EVIDENCE.md` | #74, #76–#80, #85 | **Blocked — backup/restore not performed** | Evidence report records the live staging schema inventory (2026-10-16 15:54 UTC) and explicit blockers. The authoritative database is not confirmed; no logical dump, size, SHA-256, secure backup location, isolated restore target or restore log exists. | Obtain owner-confirmed authoritative DB and an approved secure PostgreSQL dump/restore execution path. Produce the actual backup manifest, restore into a separate isolated instance, retain logs, then compare schema and data. | Actual backup artifact metadata + checksum, isolated restore log, schema/data integrity comparison, and reviewed evidence. |
| Migration and schema reconciliation | `supabase/migrations/20261016151400_payfast_finance_tx.sql`; pending migration files in PRs #74, #76, #77, #78, #79 and #80; `docs/launch/PHASE_1_RECOVERY_EVIDENCE.md` | #74, #76–#80 | **Blocked — preliminary conflict report recorded; no isolated rehearsal** | Staging history returned by Supabase ends at migration 0030. PR #74 uses `db/migrations/` while #76–#80 use `supabase/migrations/`. Outstanding review points include document storage unique-index contract, support-ticket ownership, founder predicate compatibility, audit-log append-only behavior, cross-PR dependencies/order, and effective anon/authenticated grants. No restored baseline or combined-chain execution evidence exists. | Resolve the exact items and dependencies listed in the evidence report after the verified restore; establish the canonical migration root, then rehearse the proposed chain against the isolated restored copy only. | Reviewed schema diff + complete conflict report + successful isolated migration rehearsal. No staging push before gate. |

## Phase 2+ component queue (do not start implementation work that depends on the recovery gate)

| Component | Existing source files on `main` (exact representative paths) | Related PRs | Current status | Known gaps / evidence | Exact next action | Acceptance evidence |
|---|---|---|---|---|---|---|
| Truth Vault persistence | `apps/api/src/db/truth-vault-repository.ts`; `apps/api/src/db/truth-vault-schema.ts`; `apps/api/src/db/database-url.ts`; `scripts/validators/validate-api-truth-vault-persistence.mjs`; `packages/jarvis-core/src/postgresql-truth-vault-boundary.ts`; `manifests/n03/postgres-truth-vault.json` | #73, #80, #85 | **Implemented foundation; operational status Blocked** | Source validator passing is not persistence proof. Project notes flag development-memory mode as a launch blocker; no restart-persistence evidence is recorded. | After Phase 1, trace all read/write paths and wire authoritative PostgreSQL persistence, transactions and durable idempotency without bypassing existing boundaries. | Synthetic writes survive API restart; DB evidence and tests prove transaction/idempotency behavior. |
| Candidate identity, authorization and RLS | `apps/api/src/components/candidate-router.ts`; `apps/api/src/components/founder-guard.ts`; `apps/api/src/components/supabase-user.ts`; `packages/backend/src/n05/document-storage-boundary-policy.ts`; RLS helpers referenced by pending migrations | #74, #76, #78, #80 | **Implemented foundation; runtime isolation Blocked** | No evidenced anonymous-denial, Candidate A/B isolation, founder positive/negative role tests, or proof that untrusted candidates cannot self-assign trusted roles. | After recovery/schema reconciliation, run synthetic-account authorization matrix against the real isolated schema, then staging only after approved gate. | Test logs show allowed owner access and denied cross-candidate/anonymous/non-founder access; trusted-role provisioning verified. |
| Candidate onboarding, KYC and compliance | `apps/api/src/components/candidate-router.ts`; `apps/api/src/components/supabase-user.ts`; `apps/api/src/documents/document-storage.ts`; `apps/api/src/governance/privacy-popia-policy.ts`; candidate document API routes under `apps/web/src/app/api/candidate/documents/`; `apps/web/src/app/candidate/documents/page.tsx` | #76, #80 | **Implemented foundation; end-to-end journey Blocked** | KYC schema/RPC changes are pending in #76; registration-to-KYC lifecycle, review/correction states and candidate dashboard updates lack runtime evidence. | After persistence/security gate, test synthetic registration → onboarding → private document upload → KYC status/review → dashboard without manual DB edits. | Playwright/API journey report plus negative isolation tests. |
| Opportunities, eligibility and applications | `apps/api/src/opportunity/opportunity-engine.ts`; `apps/api/src/opportunity/opportunity-engine.test.ts`; `apps/api/src/opportunity/index.ts`; `apps/api/src/routes/application-workbench.ts`; `apps/web/src/app/personal-job-desk/opportunities/page.tsx`; `apps/web/src/app/personal-job-desk/application-tracker/page.tsx`; `apps/web/src/application-workbench/ApplicationWorkbenchPanel.tsx` | #73, #80, #86 | **Safety hardening committed; tests not yet executed; operational workflow Blocked** | Added fail-closed checks for HTTP(S) source/exact links, malformed stale timestamps, closed/non-open programme visibility, blank candidate references and non-finite fit scores. Added four Node regression tests and wired `npm test`/`npm run validate`; no build/test run is claimed. Opportunity data persistence, freshness provenance, eligibility integration, and Prepared vs Submitted vs Official Decision semantics still lack end-to-end evidence. | Run API clean install/build/tests in CI; then map state transitions and test synthetic opportunity-to-application journey with manual fallback. | Successful CI build/tests plus state-transition tests, freshness evidence, submission proof and accurate candidate status. |
| Founder operations and Jarvis | `packages/jarvis-core/src/`; `packages/contracts/src/jarvis/index.ts`; `apps/api/src/components/founder-router.ts`; `apps/api/src/components/founder-guard.ts`; `apps/web/src/app/founder-command/page.tsx`; `apps/web/src/app/founder/control-plane/page.tsx` | #73, #78, #82, #85 | **Jarvis validators Verified; founder workflow Operational status Blocked** | Jarvis Live Runtime run 38924542480 passed its core/runtime-controller/live-batch validators. This does not prove full founder APIs, persistent backend integration, real provider status, or end-to-end authority boundaries. | After persistent data and RLS pass, connect the command centre to authorized APIs; prove allow / approval-required / deny commands and evidence recording. | Runtime founder journey with audit/evidence trail and unauthorized-action negative cases. |
| Offers, contracts and selection | `apps/api/src/components/candidate-router.ts`; `apps/api/src/components/founder-router.ts`; `apps/api/src/components/http.ts`; pending contract/selection migration files in #76 and #77 | #76, #77, #80 | **Partial; operational lifecycle Blocked** | Metadata signature is not proof of legally valid electronic signature. Version/expiry/replay and decision-to-offer acceptance flow need tests and legal criteria. | Validate decision → versioned offer → candidate acceptance and signature-evidence lifecycle on isolated test data after schema gate. | Full lifecycle and expiry/replay tests; legal review of signing evidence. |
| Invoices, PayFast and refunds | `apps/api/src/finance/finance-ledger.ts`; `apps/api/src/finance/payfast-intent.ts`; `apps/api/src/finance/payfast-itn.ts`; `apps/api/src/finance/payfast-signature.ts`; `apps/api/src/components/payfast-itn.ts`; `apps/api/src/components/supabase-payment-store.ts`; `scripts/proof/prove-payfast-sandbox-boundary.mjs`; `scripts/validators/validate-payfast-sandbox-proof.mjs` | #75, #79, #80; #81 closed superseded | **Source validation Verified; real sandbox workflow Blocked** | Source Guard PayFast boundary checks passed; no real sandbox transaction matrix or refund/reversal reconciliation evidence is recorded. #79 billing metadata is not a payment integration. | Keep live payments disabled; execute sandbox success, cancel, failure, duplicate ITN, invalid signature, amount mismatch, atomic ledger, refund/reversal scenarios after schema gate. | Provider sandbox evidence and internal ledger reconciliation for every scenario. Integer cents only. |
| Communications and consent | `apps/api/src/candidate-mobile/mobile-notification-preferences.ts`; `apps/api/src/candidate-mobile/mobile-notification-preferences.test.ts`; `apps/api/src/candidate-mobile/mobile-policy.ts`; `packages/backend/src/n04/notification-rule-policy.ts`; `packages/contracts/src/n04-notification-rule-contract.ts`; `db/migrations/0007_n09_notifications_communications.sql`; `docs/n04/N04_CANDIDATE_05_MOBILE_EMAIL_FIRST_URGENT_WHATSAPP.md` | #77, #79, #86 | **Channel policy regression tests added; delivery Blocked; tests not yet executed** | Added tests for email-first defaults, WhatsApp urgent-only restrictions, SMS backup-only restrictions, and rejection of unverified official-outcome wording. API test command now discovers compiled test suites under `dist`; no execution result is claimed. No real provider delivery, bounce/retry, opt-out enforcement, consent event evidence or durable portal copy is recorded. | Run API clean install/build/test in CI; then implement/test email delivery first with consent and portal-copy enforcement, safe recipients, provider callbacks, retries, bounce handling and opt-out checks. | Successful CI build/tests plus provider event evidence and retry, bounce, opt-out and consent tests. |
| Search, reporting, support and workers | `apps/api/src/routes/application-workbench.ts`; `apps/api/src/observability/founder-report-builder.ts`; `apps/api/src/observability/report-delivery.ts`; `apps/workers/src/.gitkeep`; `apps/web/src/app/personal-job-desk/application-tracker/page.tsx`; `packages/backend/src/n07/airtable-mirror-worker.ts` | #73, #77, #79 | **Partial; operational workers Blocked** | Search/report metadata does not prove indexing, secure file generation/download, freshness, actual storage deletion, retry/timeout/DLQ handling or complete support lifecycle. | Inventory current worker entry points; implement only missing execution paths and test permissioned results, export expiry, retention deletion, retries and DLQ recovery. | Worker artifacts and authorization/failure-recovery test results. |
| Observability, privacy/legal and final launch evidence | `apps/api/src/observability/alert-router.ts`; `apps/api/src/observability/incident-runtime.ts`; `apps/api/src/governance/privacy-popia-policy.ts`; `apps/api/src/legal/legal-privacy-proof-boundary.ts`; `docs/legal/KINGSMEN_LEGAL_PRIVACY_CONSENT_REFUND_PROOF.md`; `docs/launch/KINGSMEN_STAGING_RUNTIME_EVIDENCE_CAPTURE.md`; `docs/launch/KINGSMEN_FINAL_ASSEMBLY_EVIDENCE_CAPTURE.md` | #73, #83, #84, #85 | **Source validators Verified; launch evidence Blocked** | Source Guard validates proof boundaries, but no complete live staging evidence bundle, legal/data-subject demonstration, incident exercise or repeated recovery drill is recorded. | After product gates, capture environment/timestamp/commit-specific evidence for every blueprint launch gate and present explicit founder go/no-go. | Full synthetic candidate and founder journeys; security/failure tests; all mandatory gates linked to evidence and explicit acceptance. |

## CI evidence and current Phase 0 decision

- **Source Guard:** [run 38924974016](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/38924974016) — completed successfully on the latest checked PR head; all 29 workflow steps passed. [Jarvis Live Runtime run 38924973720](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/38924973720) also passed.
- **Jarvis Live Runtime:** [run 38924542480](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/38924542480) — completed successfully.
- **API build/unit tests:** [run 38914799005](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/38914799005) — completed successfully, but API dependency install used `npm install --prefix apps/api` because `apps/api/package-lock.json` is absent on main.
- **Tracker reconciliation:** row-by-row path classification for all 188 rows and PRs #70–#85 is committed in `docs/launch/KINGSMEN_BUILD_TRACKER_RECONCILIATION.md`; absent paths remain `Not_Started`, and existing paths are not treated as proof.
- **Supabase:** source-level inspection only. No backup or restore is claimed. No migrations have been applied by this work.

### Temporary Phase 0 exception — 16 October 2026

**TEMPORARY EXCEPTION (16 Oct 2026): Phase 0 exit gate is not fully closed due to missing API package-lock.json and unproven npm ci. Decision taken to proceed to Phase 1 (Database Recovery Gate) while this remains open debt. This item MUST be completed and verified before any production deployment or final launch. No claim is made that Phase 0 is complete.**

- **API dependency lockfile:** Blocked / Outstanding — `apps/api/package-lock.json` is missing.
- **API clean lockfile install:** Blocked / Outstanding — `npm ci --prefix apps/api` has not been proven against a committed API lockfile.
- This is a documented sequencing exception only. It does not waive the Phase 0 debt, certify foundation readiness, authorize production deployment, or authorize migrations against staging/production. Phase 1 work remains subject to the isolated-target recovery gate; if no verified recovery path can be established, no migrations may be applied.

### Phase 0 exit gate: **NOT CLOSED**

Source Guard is verified, and a path-by-path tracker report exists. Phase 0 remains open until API dependencies are reproducible from a committed API lockfile and clean `npm ci`, and the required CI result is re-run against the final PR head. The tracker path/status classification is complete; it does not certify component functionality.

### Phase 1 exit gate: **NOT CLOSED — BLOCKED**

The partial investigation is documented in [Phase 1 Recovery Evidence](PHASE_1_RECOVERY_EVIDENCE.md). A read-only schema inventory was captured from `kingsmen-portal-staging` at 2026-10-16 15:54 UTC; this does not establish that staging is the authoritative source. No logical backup was created, no backup timestamp/size/SHA-256 exists, no isolated restore or restore log exists, and no combined migration rehearsal was performed. Migration conflict/compatibility review is preliminary and records unresolved issues. **No staging migrations were applied by this work. Do not apply or push migrations to staging or production until the real backup/restore and isolated rehearsal gates pass.**


## Phase A.1 — Public website and candidate authentication UI foundation (2026-10-16)

| Component | Files | Status | Evidence / limits | Next action |
|---|---|---|---|---|
| Public entry page | `apps/web/src/app/page.tsx` | **Implemented**; runtime **not yet verified** | Added a responsive Kingsmen landing page with navigation to the Free Destiny Map, registration, sign-in and route-category summaries. Source is committed on the Phase 0 working branch. | Run the web app build and browser checks; review responsive layout and accessibility. |
| Candidate registration UI | `apps/web/src/app/auth/register/page.tsx` | **Implemented**; secure registration **Blocked** | Client-side required-field, email, password-length and consent validation. It deliberately does not persist credentials or claim an account was created. | Integrate the approved server-side identity provider, privacy notice link, rate limits, email verification and synthetic-account E2E tests. |
| Candidate sign-in UI | `apps/web/src/app/auth/login/page.tsx` | **Implemented**; authentication **Blocked** | Form and explicit non-connected status message are present; no credentials are transmitted or stored. | Wire secure server-side authentication and session lifecycle; test expiry, logout and protected routes. |
| Account recovery UI | `apps/web/src/app/auth/passwordless/page.tsx` | **Implemented**; recovery delivery **Blocked** | Recovery request form explicitly states no email is sent until delivery and identity verification are integrated. | Integrate anti-enumeration-safe recovery, expiring single-use tokens, delivery provider and end-to-end tests. |
| Free Destiny Map journey | `apps/web/src/app/free-destiny-map/page.tsx`; `apps/web/src/public-site/DestinyMapPreviewPanel.tsx` | **Existing source; integration/runtime verification pending** | Existing intake surface and preview component were inspected. This chunk did not claim that intake is persisted or that a completed candidate journey is operational. | Connect validated intake to the approved backend after the foundation constraints are resolved; add save/resume and synthetic journey tests. |

**Chunk commits:** `8154c92aff926e931425437688b660a41cc2bf56` (public home), `3172e8785257a222d7c9fd64dd8ae3c0a7e42d8d` (registration), `77906736d8076bf00a38ed39ccc6abe2514a5e64` (sign-in), `6470bc123b0ce4b25e7f49e53a44ea08cfa784fd` (account recovery), all on `fix/kingsmen-phase0-source-guard-ledger`.

**Verification:** GitHub accepted the four file commits. No local Next.js build or browser test was run by this connector, so these are not marked Verified or Operational.

**Foundation constraints remain unchanged:** Phase 0 API lockfile debt remains open; Phase 1 backup/restore remains blocked. No database migrations were created or applied. Neither phase is closed.


### Phase A.1 follow-up — Free Destiny Map interaction

Updated `apps/web/src/app/free-destiny-map/page.tsx` in commit `0becaf8a2b190a8b0d61305913283d1261566a81`. The form now validates the route selections and consent boundary, produces an on-page readiness preview with tailored next-step prompts, supports reset, and explicitly states that nothing is sent or persisted. Status: **Implemented; runtime not yet verified; not integrated with backend persistence**. This is a local-only preview, not a live matching or eligibility engine.


### Phase A.1 follow-up — public entry and registration usability (16 October 2026)

- Updated `apps/web/src/app/page.tsx` on branch `feat/phase-a1-public-destiny-auth-foundation`: improved public navigation, route-category entry cards, clearer separation of free browser guidance from paid/managed support, and explicit non-guarantee wording. Status: **Implemented; build/browser verification pending**.
- Updated `apps/web/src/app/auth/register/page.tsx`: added password confirmation and clearer validation/status copy; the form explicitly does not create an account, send details, or store credentials. Status: **Implemented UI; secure registration Blocked pending identity-provider integration**.
- Existing `apps/web/src/app/free-destiny-map/page.tsx` already provides a local-only preview, required route selections, reset, tailored next-step prompts and a clear privacy boundary. Status: **Implemented as browser-only guidance; not backend-integrated; runtime verification pending**. No changes were made to migrations or database state.
- Existing sign-in and recovery surfaces were reviewed: `apps/web/src/app/auth/login/page.tsx` and `apps/web/src/app/auth/passwordless/page.tsx` clearly disclose that credentials are not transmitted and recovery email is not sent. Status: **UI implemented; authentication/session/recovery integration Blocked**.
- This update has not been built or browser-tested in the connector environment. GitHub file writes alone are not build/runtime evidence. Do not label this chunk Verified or Operational until CI/build and synthetic browser flows pass.
- Phase 0 API lockfile remains **OPEN**; Phase 1 real backup/restore remains **BLOCKED**. No migrations were created or applied; neither foundation phase is closed.


## Phase A.2 — Candidate profile, onboarding and dashboard (implementation branch)

| Component | Source files | Status | Evidence / limits | Next acceptance gate |
|---|---|---|---|---|
| Candidate dashboard | `apps/web/src/app/candidate/dashboard/page.tsx` | **Implemented; runtime verification pending** | Reuses the existing dashboard and six-gate structure. It now distinguishes local browser draft progress from authoritative candidate data, uses “Not assessed” rather than implying a decision, and links to onboarding/profile. No real candidate API/session is connected. | Run web build and browser tests; later integrate only after identity, persistence and RLS boundaries are approved. |
| Candidate onboarding | `apps/web/src/app/candidate/onboarding/page.tsx` | **Implemented; runtime verification pending** | Four-step guided flow with required-field validation, progress, previous-step navigation, local save/resume and clear-draft control. Local storage is device/browser-specific; no account sync or server submission occurs. | Add synthetic-account browser tests and verify persistence/reset behaviour in a real browser run. |
| Candidate profile draft | `apps/web/src/app/candidate/profile/page.tsx` | **Implemented; runtime verification pending** | Reuses the same local draft contract as onboarding. Explicitly states that profile is not verified and no correction/audit request is created. Sensitive profile correction workflow remains blocked pending authenticated backend/audit integration. | Implement authenticated candidate-owned profile read/write and auditable correction review only after Phase 0/1 gates and security tests. |
| Candidate persistence / auth integration | Existing candidate routes and identity boundaries | **Blocked** | No migrations were created or applied. Browser storage is not authoritative, is not synced, and may be cleared. No claim of registration, authenticated session, profile persistence, external submission, payment, or outcome verification is made. | Close Phase 0 API lockfile gate and Phase 1 real backup/isolated restore gate; then reconcile schema and test candidate isolation before backend integration. |

Phase A.2 implementation changes are on `feat/phase-a1-public-destiny-auth-foundation` pending review in a separate draft PR. No migration files were added or executed. These source changes have not yet passed a web build or Playwright runtime test, so they are **not Verified or Operational**.


## Phase A.3 — Candidate documents and application tracker (implementation only)

| Component | Source files | Status | Evidence / limits | Next acceptance gate |
|---|---|---|---|---|
| Candidate document workflow page | `apps/web/src/app/candidate/documents/page.tsx` | **Implemented; runtime verification pending** | Reused existing route and replaced implied upload/storage availability with an explicit checklist/review guide. States no upload, signed links, OCR, live document record or verification is connected. Status terms are examples, not candidate-specific statuses. | Integrate private storage and authenticated candidate-owned metadata only after security review; test access denial across synthetic candidates. |
| Application tracker display | `apps/web/src/app/personal-job-desk/application-tracker/ApplicationTrackerClient.tsx` | **Partially implemented; integration blocked** | Reused existing PJ24 tracker and status filters; added human-readable status labels and prominent local-workbench/data-provenance warnings. Proof references are not represented as independent employer confirmation. | Run web build and browser tests. Replace shared local JSON read model with authenticated, candidate-scoped records before production use. |
| Candidate note write from tracker | `apps/web/src/app/api/personal-jobs/application-tracker/route.ts` (existing route reviewed; not changed) | **Blocked** | Existing POST path writes to a shared repository-local JSON file and does not show authenticated candidate ownership enforcement. The tracker UI's note-save action is disabled to avoid implying safe candidate-specific persistence. API route itself still requires a separate security remediation before exposure to untrusted users. | Add server-side authentication, candidate ownership checks, validation, audit trail and cross-candidate negative tests; do not enable UI writes before then. |
| Synthetic-candidate isolation | Existing candidate/document/tracker surfaces | **Not verified; blocked by missing auth boundary** | No runnable end-to-end configuration or evidence of candidate A/B isolation was found during this source inspection. No real candidate data was used. | Add synthetic account browser tests once test auth/provider and an isolated environment are available. Prove A cannot read/write B's records. |

Phase A.2 and A.3 source work remains unverified: no successful web build or Playwright run is evidenced for these commits. Phase 0 API lockfile and Phase 1 backup/isolated restore remain OPEN. No migrations were created or applied.


## Phase A.4 — Candidate security and data integration (fail-closed remediation)

| Component | Files | Status | Evidence / limits | Next acceptance gate |
|---|---|---|---|---|
| Legacy application tracker API | `apps/web/src/app/api/personal-jobs/application-tracker/route.ts` | **Unsafe shared-file path disabled; server-side candidate auth not implemented** | GET and POST now return HTTP 503 with `CANDIDATE_AUTHORIZATION_NOT_CONFIGURED`, `Cache-Control: no-store`, and perform no file reads, syncs, or writes. This closes the previously identified unauthenticated shared-JSON API exposure in source. It intentionally makes the tracker API unavailable rather than simulating authentication. | Integrate the approved server-side identity/session provider and durable owner-scoped data layer; enforce ownership at every query/mutation and add audit logging before re-enabling any route. |
| Tracker API negative-path regression tests | `e2e/candidate-security.spec.ts` | **Test cases authored; execution pending** | Synthetic-only Playwright cases assert unauthenticated GET/POST fail closed and caller-supplied Candidate A/B identifiers cannot access the disabled endpoint. These prove the intended shutdown contract only; they do **not** prove authenticated A/B isolation. | Run against a verified web runtime; then add authenticated Candidate A/B fixtures and prove A cannot read/update/delete B's profile, document metadata, or applications. |
| Candidate profile and onboarding | `apps/web/src/app/candidate/profile/page.tsx`; `apps/web/src/app/candidate/onboarding/page.tsx` | **Browser-local drafts only; server identity/ownership blocked** | These pages use localStorage, not server-side candidate identity or authoritative records. They are not candidate account persistence and cannot enforce server-side ownership. | Keep clearly marked as local-only; replace with authenticated server reads/writes and ownership checks after the foundation gates and storage design are approved. |
| Candidate documents | `apps/web/src/app/candidate/documents/page.tsx` | **Guide only; private storage/metadata integration blocked** | No upload or document record is connected. No candidate-specific metadata endpoint or private storage integration was introduced. | Design private storage and owner-scoped metadata; prove signed URL scope, expiry and A/B denial before enabling uploads. |
| Application tracker client | `apps/web/src/app/personal-job-desk/application-tracker/ApplicationTrackerClient.tsx` | **Non-production / blocked pending secure API** | UI note-saving remains disabled from the prior chunk. Since the backing API now fails closed, any legacy data-loading path cannot return shared tracker data. No real candidate records are claimed. | Ensure the UI renders a clear unavailable state on 503 and only enable candidate notes after authenticated ownership and durable persistence pass. |

**Phase A.4 commits:** `2415a70736991deee7097ee3c835f6c9523923a0` (fail-closed API), `ee3b3670a1ab37b3d67e1662aa7a6b84970828f9` (synthetic negative-path Playwright cases).

**Verification status:** Source commits were accepted by GitHub. This connector has not run the web build or Playwright suite; no runtime result is claimed. Authenticated identity, durable candidate-scoped persistence, document metadata ownership, profile ownership, and true authenticated Candidate A/B isolation remain **not implemented / not verified**.

**Foundation gates:** Phase 0 API lockfile remains **OPEN**. Phase 1 backup/isolated restore remains **OPEN — BLOCKED**. No database migrations were created or applied. Neither phase is closed. Do not enable candidate writes or introduce schema changes until the existing foundation and security gates permit them.


### Phase A.4 follow-up — tracker client fail-closed UX (16 October 2026)

- Updated `apps/web/src/app/personal-job-desk/application-tracker/ApplicationTrackerClient.tsx` in commit `a5c9c4c266ad9a791e51d66f5b81af11ff6aa80a`.
- The client now recognises the API's `503 CANDIDATE_AUTHORIZATION_NOT_CONFIGURED` response, clears any in-memory tracker state, and displays an explicit unavailable/security-integration message. Other load failures also clear displayed tracker records.
- The client no longer claims the disabled endpoint is actively reading the repository-local JSON workbench. Summary counters and application details render only when a successful API response supplies tracker data; when unavailable, the page does not present fabricated zero counts as candidate facts.
- Status: **Fail-closed UI state implemented; runtime verification pending**. This does not establish server-side authentication or ownership. The route remains intentionally unavailable.
- No migrations or database changes were made. Phase 0 remains **OPEN**; Phase 1 remains **OPEN / BLOCKED**. No web build or Playwright execution is evidenced by this source update.


### Phase A.4 — consolidated security boundary audit (16 October 2026)

This audit is the Phase A.4 exit assessment, not a claim that the phase is complete.

| Security requirement | Current finding | Status | Exit evidence required |
|---|---|---|---|
| Trusted server-side candidate identity | Web package has no Supabase client dependency in its declared dependencies; inspected login UI explicitly says auth is not connected. No server session helper or middleware was found at the expected paths. API package currently declares only `pg` as a runtime dependency. | **Blocked** | Approved identity provider/session implementation, server-side token/session validation, logout/expiry handling, and tests against synthetic accounts. |
| Legacy tracker shared-file exposure | `apps/web/src/app/api/personal-jobs/application-tracker/route.ts` GET/POST are disabled with a 503 fail-closed response and no filesystem access. | **Implemented as a shutdown mitigation** | Keep disabled until owner-scoped durable persistence, authorization, audit and isolation tests all pass. |
| Profile/onboarding ownership | Candidate profile/onboarding use browser-local drafts; no server identity is bound to these drafts. | **Blocked** | Authenticated read/write routes derive owner from the verified session, never from request-supplied candidate IDs; negative tests for cross-owner access. |
| Candidate document ownership/storage | Candidate page is a guide only. The active Phase A branch does not expose the previously inventoried document API route paths at the checked ref; no active private upload/read route was confirmed on this branch. | **Blocked / not integrated** | Verify exact branch routes, then implement or keep absent/disabled until verified identity, private bucket policy, scoped metadata and short-lived signed URL enforcement exist. |
| Application tracker A/B isolation | Existing Playwright tests cover only unauthenticated requests to the disabled endpoint. They do not exercise authenticated A/B ownership. | **Not verified** | Seed synthetic Candidate A/B with independent records in isolated test environment; prove A can access own records and cannot read, update, delete, or obtain document URLs for B's records. Capture actual test output. |
| Runtime verification | No web build or Playwright execution is evidenced for this branch head in the current work session. | **Blocked** | Successful clean install/build and executed browser/API security suite on the exact commit; record run IDs and commit SHA. |

**Phase A.4 decision: NOT CLOSED.** The only established security outcome is that the known shared-file tracker API is disabled. Authenticated candidate identity, owner-scoped profile/application/document access, private storage integration, and authenticated Candidate A/B isolation remain incomplete. Do not describe the entire phase as complete, and do not enable candidate writes.

**Implementation constraint:** The repository's declared web dependencies and inspected source do not establish an active server-side identity/session integration. Do not invent a cookie format, trust a client-supplied candidate ID, or use a service-role key as a substitute for identity. The next implementation delivery must integrate the approved identity provider on the server request path, then apply the verified session identity to every candidate-owned data access. If provider configuration or isolated synthetic accounts are unavailable, keep all candidate data APIs disabled and report the precise blocker.

**Foundation gates unchanged:** Phase 0 API lockfile/`npm ci` remains **OPEN**. Phase 1 real backup, isolated restore and migration rehearsal remains **OPEN / BLOCKED**. No database migrations were applied.


### Phase A.4 follow-up — candidate document and founder review API shutdown (16 October 2026)

Source review found four additional API shells that returned `ok: true` despite lacking real identity/ownership enforcement. The upload/read endpoints returned placeholder strings as if they were signed URLs; upload/read/status accepted or reflected caller-selected identifiers; the founder review endpoint treated request-body proof/evidence/audit identifiers as if they were sufficient authority. These responses could mislead callers into believing secure workflows were operational.

The following endpoints now fail closed with HTTP 503, `Cache-Control: no-store`, and no candidate/document identifiers or fake signed URLs in the response:

- `apps/web/src/app/api/candidate/documents/upload-url/route.ts`
- `apps/web/src/app/api/candidate/documents/read-url/route.ts`
- `apps/web/src/app/api/candidate/documents/status/route.ts`
- `apps/web/src/app/api/founder/documents/review/route.ts`

The Playwright suite `e2e/candidate-security.spec.ts` now includes synthetic-only regression cases for those four endpoints in addition to the tracker cases. The tests assert the fail-closed contract and ensure placeholder signed URL fields are not returned.

**Status: shutdown mitigations implemented; runtime execution pending.** These tests are authored only; they have not been executed here. This is not authenticated Candidate A/B isolation evidence and does not implement identity, private storage, founder authorization, or durable audit records. Keep these endpoints disabled until their real server-side identity, ownership, signer, and audit dependencies are implemented and verified.

**Relevant commits:** upload route `a0a99fd6228eaebcb9603e39c130c7daee4f8f11`; read route `88a10c9896efc4521734e5c2e11fbba02cac0b58`; status route `286d50dfe6abc4a9a59e4185228c5cb8ebf94e04`; founder review route `729eec45049854e6192ea95d0aec3bf8dba912af`; tests `f75221a6488e7e3bf007cdb2be1bda8a502a3c22`.

Foundation constraints remain unchanged: Phase 0 is **OPEN**, Phase 1 is **OPEN / BLOCKED**, no database migrations were applied, and no build/Playwright run is claimed.

### Phase A.4 follow-up — server-side identity and ownership readiness audit (16 October 2026)

- Added [PHASE_A4_IDENTITY_OWNERSHIP_READINESS_AUDIT.md](PHASE_A4_IDENTITY_OWNERSHIP_READINESS_AUDIT.md) in commit `f937142408e5b3a18f225bee5af7877704dec4f7`.
- Inspected the web/API dependency manifests, candidate login/registration/recovery disclosures, profile draft implementation, tracker/document/founder endpoints and expected auth middleware/helper/service paths on `feat/phase-a1-public-destiny-auth-foundation`.
- The declared web dependencies do not include an identity-provider SDK; the API runtime declares `pg` only. The expected web middleware, server Supabase helper, web login API, API auth service/routes and candidate profile service/routes returned 404 at the exact inspected branch ref. This is a branch-scoped source finding, not a claim that no related source exists on every branch or deployment.
- Documented the required server-side security contract, synthetic Candidate A/B negative-test matrix, identity/session provider decision, subject-to-candidate mapping, storage prerequisites and actual evidence required to exit A.4.
- **Status: readiness audit documented; identity and ownership implementation still BLOCKED.** No authentication has been fabricated, no endpoint re-enabled, no migration applied, and no build or Playwright execution claimed. Existing tests remain shutdown-contract tests, not authenticated isolation proof.
- Phase 0 API lockfile/`npm ci` remains **OPEN**. Phase 1 verified backup/restore/rehearsal remains **OPEN / BLOCKED**. **Phase A.4 remains OPEN; do not close Phase A or move to Phase B.**


### Phase A.4 follow-up — server-side Supabase Auth integration scaffold (16 October 2026)

- Added `apps/web/src/lib/auth/supabase-rest.ts` and server route handlers for login, registration, recovery, refresh, logout and session validation. The implementation uses Supabase Auth REST and HttpOnly, SameSite=Lax cookies; session validation asks Supabase Auth to verify the access token server-side.
- Connected candidate login, registration and recovery UI to the new routes. Added `apps/web/.env.example` and `e2e/kingsmen-auth-boundary.spec.ts` for required configuration and synthetic API contract checks.
- **Status: auth scaffold implemented; provider configuration, build and runtime verification pending.** Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the deployment environment and confirm staging Auth URL/redirect/email settings before live tests.
- Candidate profile, tracker and document APIs remain fail-closed or local-only. Provider-subject-to-candidate mapping, owner-scoped durable queries, private bucket/signing, founder role authorization, durable audit trail and authenticated A/B isolation are not implemented. Do not re-enable data APIs based on the auth session alone.
- Phase 0 remains **OPEN** (API lockfile / reproducible API `npm ci`); Phase 1 remains **OPEN / BLOCKED** (verified backup, isolated restore and rehearsal). No migrations applied. Phase A.4 remains **OPEN** until auth, ownership, storage and isolation are verified.


### Deployment configuration follow-up — staging auth wiring (16 October 2026)

- Located the Netlify site `kingsmen-portal-staging` (site ID `fb27d0db-b116-4890-8f7f-14e654c27dbc`) and confirmed its non-production visitor controls require team SSO.
- The Netlify environment-variable read returned an empty list. An attempt to write the Supabase URL and publishable key through the connected environment-variable action was blocked; no successful write response exists. **Do not treat staging auth configuration as complete.**
- GitHub Actions lookup for the inspected auth-session commit `11913a0d376f15444c740d6f8ad9fc26a92b5ea4` returned no associated pull-request workflow runs. This does not prove no other workflows exist; it means there is no run evidence for that commit from this query.
- **Next required action:** configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` through an authorized Netlify SSO session or approved deployment workflow, verify Supabase Auth site/redirect/email settings, then trigger and retain a clean build and synthetic auth-contract test run. Do not paste secret values into the repository or chat.
- No environment variable write, deployment, build, Playwright run, database migration, backup, or restore is claimed. Phase 0 and Phase 1 remain open.


### Auth boundary follow-up — bounded recovery requests (17 October 2026)

- Latest pre-follow-up head `d700f9a25f0369016f4dc42e03dd8ef3e510cbf6` completed both **Kingsmen Application Build Checks #55** and **Jarvis Live Runtime #734** successfully. These results verify that exact head only.
- Source review found the password-recovery handler parsed request JSON directly, unlike login and registration, leaving that endpoint without the shared 16 KiB streamed-body limit and common malformed-content handling.
- Commit `d0878518345b66c13239dac1c52cb7dde7c9b73f` updates `apps/web/src/app/api/auth/recovery/route.ts` to use the bounded JSON parser, reject non-JSON/malformed/oversized bodies consistently, validate email format, and preserve no-store responses and non-enumerating success messaging.
- **Verification for the new commit is pending.** Do not infer that the new fix passed just because the preceding head passed CI. This change does not configure Supabase, prove provider delivery, or enable candidate data APIs.
- Phase 0 API lockfile/clean `npm ci` remains **OPEN**. Phase 1 verified backup, isolated restore and migration rehearsal remains **OPEN / BLOCKED**. No migrations, secret changes, or deployments were made.


## PR #86 follow-up verification notes — 2026-10-16

- Latest verified pre-follow-up API build/unit tests and application build checks passed on commit `9a1578efc9a38bf43d6d57c054ff28d6e7ddec28`; this is not verification of later commits.
- Follow-up commit `7889cea965694afef065f69bc61c10108f99952f` adds candidate-auth HTTP regression cases for a missing Origin header, repeated failed login rate limiting (10 attempts per 15-minute window per hashed remote-address/email key), and the session endpoint method/cache policy.
- The follow-up commit's workflow result is pending/not yet available at the time of this note. Do not treat these new tests as passed until CI reports a successful run on that exact commit.
- The API lockfile gap remains open: `apps/api/package-lock.json` is absent; a valid generated lockfile has not been produced. Do not hand-author a lockfile or mark deterministic API installation as complete.


## Follow-up component regression coverage — 2026-10-16

- Candidate credential repository tests now cover database failure rollback/release, rejection of malformed input before database acquisition, and malformed stored password hashes failing closed. Commit: `b3f6558d0fa3dedebd5f0abfcf7674c9f5534a8e`.
- Document storage tests now cover path-separator/unsafe filename sanitization and exact maximum-size boundary handling. Commit: `0884c0c898165e282dc45eba5301238f99a1619e`.
- Candidate mobile notification preference tests now cover email-disabled portal fallback, explicit SMS backup opt-in, and routine-message restrictions. Commit: `3354a8212f654410155074db925b3b0d97a6c39b`.
- CI workflow evidence for these follow-up commits has not yet been returned by GitHub at the time of this note. These are committed tests, not claimed passing tests. Document storage metadata tests do not establish a real private storage provider or signed URL implementation; notification policy tests do not establish message delivery.


### Auth recovery follow-up — CI review and regex correction (17 October 2026)

- GitHub Actions completed successfully for commit `24a1bf9f6b75bb35c50e879ef237c8103a4d325c`: Kingsmen Application Build Checks run #57 and Jarvis Live Runtime run #736. These runs preceded the subsequent email-validation correction.
- Review of the recovery route found its newly added email regex was over-escaped, so it could reject valid addresses. Commit `e2fe63de7b1b50bfb113e381d2c19ca058cf727d` corrects the regex to the intended whitespace and dot escapes.
- The regex correction has **not yet been verified by CI**. Do not treat the prior successful runs as proof for this latest head.
- Recovery now uses the shared bounded JSON parser; provider delivery remains unverified and Supabase configuration remains outstanding. This does not enable candidate data APIs.
- Phase 0 API lockfile/reproducible `npm ci` remains **OPEN**. Phase 1 verified backup, isolated restore and migration rehearsal remains **OPEN / BLOCKED**. No migrations, secret changes, or deployments were made.


### PayFast proof contract regression coverage — 17 October 2026

- Added `apps/api/src/finance/payfast-sandbox-proof.test.ts` in commit `3b67f65b5e9091e78ee1d996d1f42edf354fd557`.
- The new API tests assert the proof report includes all ten required scenario keys exactly once, passes the synthetic source-level validations, remains explicitly non-production/sandbox-only, labels every evidence record as synthetic/no-charge, and keeps secret-redaction assertions explicit.
- GitHub Actions confirmed that commit `12cf7bd6e119f3f8cd5e1b6d5e8239f21b5d696b` passed **Kingsmen Application Build Checks #59** and **Jarvis Live Runtime #738**. These runs validate that prior head, not the newly added PayFast tests or the latest recovery changes.
- **New PayFast test verification is pending** until CI passes on the commit containing this test. This test suite is a source-level proof-contract check only; it does not simulate a real provider checkout, exercise database concurrency, apply migrations, or establish live payment readiness.
- Live payments remain disabled. Migration 0036/0037 remain unapplied pending backup, isolated restore, and rehearsal gates. Phase 0 API lockfile/`npm ci` remains **OPEN**; Phase 1 backup/restore remains **OPEN / BLOCKED**. No secrets, migrations, deployments, or live payment actions were performed.


### Mobile notifications follow-up — explicit urgent-channel opt-in (17 October 2026)

- Changed the default candidate mobile notification preference so WhatsApp urgent messaging is **disabled by default**. WhatsApp is selected only when a preference explicitly enables the urgent-only channel; routine notifications remain email-first, with portal fallback when email is disabled and SMS available only when backup is explicitly enabled.
- Expanded synthetic policy tests to assert the safe default and explicit urgent opt-in behavior. This is channel-selection policy only: no provider is connected, no message delivery is claimed, and quiet-hours enforcement/durable preference storage remain separate integration requirements.
- Source/test commits: `ca4d25a8cbce77d5c07658d4fd66ffb9f26a9be2` and `370abbf9e48915caf9ed1bf751acf0c5b14bd579`. CI must run against the resulting PR head before treating the tests as verified.
- Phase 0 API lockfile/clean `npm ci` remains **OPEN**. Phase 1 backup, isolated restore and migration rehearsal remains **OPEN / BLOCKED**. No migrations, secret changes, deployments or merges were made.


### Opportunities follow-up — missing freshness deadlines fail closed (17 October 2026)

- Updated `apps/api/src/opportunity/opportunity-engine.ts`: an observation without an explicit `staleAfter` deadline is now considered stale instead of implicitly fresh. This closes a source-freshness gap where missing expiry metadata could otherwise leave an opportunity looking current.
- Added a synthetic regression test for observations with no freshness deadline. Existing invalid-timestamp tests remain in place.
- Source and test commits: `fdcf92d64f4ee1127807a4d57eb4532ca0b9329b` and `36002258d55bf6a8db12e6a0910f12b36486f7ff`. CI must pass on the resulting PR head before these changes are considered verified.
- This is a fail-closed freshness rule, not proof that an external source was checked, a deadline is accurate, or an opportunity is actually open. Durable source observations and candidate-facing workflow verification remain outstanding.
- Phase 0 API lockfile/reproducible `npm ci` remains **OPEN**. Phase 1 backup, isolated restore and migration rehearsal remains **OPEN / BLOCKED**. No migrations, secret changes, deployments or merges were made.


### PayFast ITN payload minimisation — 17 October 2026

- Updated `apps/api/src/finance/payfast-itn-route.ts` to pass the received callback fields through `redactPayFastSecrets` before serializing the payload into the durable ITN receipt record. This prevents unexpected `merchant_key` or `passphrase` fields from being persisted in the raw JSON payload.
- The separately stored signature remains part of the existing receipt contract; this change is narrowly about credential-like fields in the JSON payload, not a claim that all payment data is minimised or that retention policy is complete.
- Commit: `6a4703ffd9c1d01456cb51132c6b7d88467268d1`. Verification for this commit is pending; do not infer passing tests from prior successful workflow runs.
- No live payment, provider configuration, database migration, deployment, or merge was performed. PayFast live readiness remains **NOT APPROVED**; sandbox proof remains synthetic source-level evidence only. Phase 0 API lockfile/clean `npm ci` remains **OPEN**; Phase 1 backup, isolated restore, and migration rehearsal remains **OPEN / BLOCKED**.


### Phase A.1 follow-up — candidate bridge CI source gates (17 October 2026)

- Added the package command `candidate:validate:application-identity-bridge`, static `auth:validate:provider-boundary`, and aggregate `candidate:validate:phase-a1-bridges`. The aggregate runs web Auth provider/session guards plus candidate transaction, identity-link lifecycle/admin runtime, ownership/application reads, application identity/tracker, document ownership/vault/upload/review/metadata/request and support-ticket source validators.
- Added bounded access/refresh token validation before login/registration cookies are set, plus a pure token-boundary helper and regression tests included in the web CI job.
- Added the `candidate-bridge-source-guards` job to `.github/workflows/kingsmen-application-builds.yml` so these source boundaries are checked in pull-request CI alongside the existing web build and API compile/test jobs.
- Detailed scope and acceptance criteria are recorded in `docs/launch/PR86_PHASE_A1_CANDIDATE_BRIDGE_CI_GATE_2026-10-17.md`.
- **Status: CI guard authored; execution not yet verified on this head.** The initial run pair on commit `8b1de029d3ed08735e898d78b6acdedde1156ec5` failed before any runner started (`runner_id=0`, empty step lists, logs unavailable as `BlobNotFound`); reruns reproduced the same condition. This does not diagnose code correctness. A configured workflow is not a passing workflow. No authenticated end-to-end candidate ownership isolation or live PostgreSQL/RLS integration test is claimed.
- Migration `0040_candidate_auth_identity_link.sql` remains unapplied. Trusted operator adapter, actual candidate Auth-to-record mapping integration, private document storage/upload/download, and authorized staging tests remain open.
- Phase 0 API lockfile/reproducible `npm ci` remains **OPEN**. Phase 1 backup, isolated restore and migration rehearsal remain **OPEN / BLOCKED**. No deployment, migration, data/policy change, or merge was performed.


### Auth hardening follow-up — bounded provider I/O and token storage (17 October 2026)

- Supabase Auth REST calls now have an eight-second timeout. Session cookies are only written after access/refresh token lengths are validated, and tokens read from cookies are length-bounded before provider use.
- Login, registration and refresh share the pure token-pair validator. Regression tests cover absent, partial, non-string, too-short and oversized token pairs; a static validator checks the route wiring.
- **Verification status: source changes committed; not executed.** The latest head has no workflow runs returned. The last observed workflow attempt failed with zero job steps and no runner IDs; logs were unavailable, so the source-versus-runner cause is unresolved.
- This does not finish the portal. Live provider configuration, identity-to-candidate mapping, trusted operator authorization, owner-scoped durable profile/application reads, private document storage, and authenticated cross-candidate isolation remain open. API lockfile/reproducible installation and Phase 1 isolated migration rehearsal remain blockers. No migration, deployment, staging data/policy change, or merge was performed.
