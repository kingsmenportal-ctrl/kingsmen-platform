# Kingsmen Platform — Master Build, Reconciliation, and Completion Plan

**Status:** Planning baseline; not a release approval  
**Repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Primary authority:** PostgreSQL/Supabase Truth Vault + backend-enforced state machines  
**Release posture:** Public launch blocked until all mandatory gates have verifiable evidence  
**Hard rule:** No verified recovery path, no migrations. Do not apply or push any migration until a timestamped logical backup has been restored into an isolated database and the restored schema/data have been verified.

## 1. Purpose and how to use this plan

This document reconciles the current repository's documented architecture with the current API/migration pull requests and sets one ordered completion path. It is deliberately explicit about the difference between:
- **Implemented in the default branch:** source exists on `main`; runtime behavior may still need proof.
- **Drafted in an open PR:** proposed source exists, but is not part of the default branch and is not deployed.
- **Foundation/metadata only:** contracts, policy, schema, manifests, or queue records exist, but the end-to-end worker/provider/UI path is incomplete.
- **Planned/gap:** the feature is required by the blueprint but no sufficient implementation/evidence has been established.
- **Verified:** a reproducible test or staging artifact demonstrates the behavior. A file, mock, passing unit test, or “mergeable” PR alone is not runtime proof.

The repository's older build tracker contains many rows marked `Not_Started` alongside newer live modules and later PR work. Treat it as historical inventory, not a reliable single status source, until reconciled against the default branch and open PRs. This plan should become the shared completion ledger; each task must point to source, tests, owner, dependencies, and evidence.

## 2. Executive assessment

Kingsmen is intended to be a South African admissions/opportunities, candidate document, finance, communications, and automation platform. It covers a free public Destiny Map entry point; pathways across university/college, TVET, SETA learnerships, bursaries, employment, and managed packages; a private founder command environment powered by Jarvis; candidate onboarding and support; document/compliance workflows; selection/offers; invoicing/payments; reporting; communications; and controlled automation.

There is meaningful foundation code on `main`, including the Jarvis policy/command/evidence core, a deployable API shell, web application structure, launch-readiness gate, manifests, validators, and documentation. However, the launch-readiness manifest itself explicitly records several gates as built-but-pending-staging-proof. The API README documents `memory_development_only` as the current storage mode until Truth Vault persistence is proven. The current candidate/KYC/contracts/finance/PayFast work is spread across open, unmerged PRs. The database changes have not been applied to staging, the PayFast sandbox has not been proven, and the backup/restore gate remains open.

**Therefore: this is a substantial foundation and partial implementation, not a verified complete product or a public-launch-ready system.** Do not infer readiness from the number of files, PR mergeability, mocked integrations, or schema presence.

## 3. Target system: components and responsibilities

### 3.1 User-facing surfaces

1. **Free Destiny Map / public entry**
   - Explain pathways and next steps without requiring data collection for the free entry surface.
   - Separate general guidance from verified opportunities, deadlines, eligibility, and fees.
   - Do not promise admission, funding, employment, or outcomes.
   - Any later personalization must have an explicit privacy notice and consent boundary.

2. **Candidate portal**
   - Registration/login and secure session handling.
   - Candidate identity/profile, contact preferences, consent, and onboarding status.
   - Candidate dashboard showing current tasks, application/opportunity pathway, document checklist, review state, offers, invoices/payments, notifications, support, and performance/progress.
   - Candidate may only access their own records and authorized files.
   - Provide clear pending/action-required/approved/rejected/expired/error states and a safe appeal/correction path where policy allows.

3. **Founder/admin command centre**
   - Private founder-only surface, distinct from candidate-facing support.
   - Candidate search and review queues; onboarding/KYC/compliance/medical review; eligibility and selection decisions; offer/contract issuance; finance/invoice/payment reconciliation; support cases; notification queue visibility; report/export requests; audit trail; performance/operations dashboards; provider and release health.
   - All sensitive actions require backend authorization, reason/correlation ID, audit evidence, and confirmation/approval where risk policy requires it.
   - Never trust a hidden button or client-side role flag as authorization.

4. **Jarvis command HUD / private command intelligence**
   - Private to the Commander/founder; not a public chatbot or candidate support channel.
   - Explain status and evidence, inspect repository/runtime proof, prepare action packets, route only to allowlisted tools, and block unsafe or unproven actions.
   - AI may recommend; validators/scripts check; backend enforces; GitHub preserves evidence; founder approves high-risk actions.
   - No autonomous production deployment, bulk outreach, payment/refund approval, candidate-data sharing, official submissions, or secret modification without the required explicit approval and proof.

### 3.2 Backend and data authority

5. **Backend API (`apps/api`)**
   - Single trusted business boundary for authentication-aware reads/writes, state transitions, provider callbacks, command intake, workflow result intake, health, reporting, and admin operations.
   - Validate input schemas, identity, authorization, current state, idempotency/correlation identifiers, provider evidence, and output redaction.
   - Fail closed on missing configuration, unknown states, invalid signatures, missing evidence, or unavailable required dependencies.
   - Return stable error codes; never expose service-role keys or internal stack traces.
   - Keep business logic out of the browser and do not let a public web route shell out to a workstation.

6. **PostgreSQL/Supabase Truth Vault**
   - The authoritative record for candidate identities, workflow state, documents metadata, review decisions, offers/signatures, invoices/payments/ledger, notifications, support, audit/evidence, and provider events.
   - Apply schema changes only through reviewed, ordered, tested migrations.
   - RLS and grants enforce tenant/candidate isolation in addition to API checks.
   - Sensitive privileged RPCs must derive identity from trusted auth context or verify founder roles from a trusted database-backed source.
   - Durable idempotency and transactional state transitions are required for payments, selection, offers, notifications, and workflow callbacks.
   - Do not use browser/client writes to set trusted payment status, founder role, review outcomes, or audit records.

7. **Storage and document lifecycle**
   - Store files in private buckets with short-lived authorized access, candidate ownership checks, content-type/size validation, malware/scanning policy, and audit metadata.
   - Store hashes, version, uploader, owner, classification, and retention state in the database.
   - Soft-delete/retention metadata is not actual deletion: a worker must implement scheduled deletion and verify storage-object removal after retention/legal-hold rules.
   - Never expose public URLs for KYC, medical, identity, or contract evidence.

8. **Worker / workflow layer**
   - n8n is a thin orchestrator, not the source of truth and not the place where authorization is trusted.
   - Workers receive durable jobs with idempotency key, correlation ID, bounded payload, retry policy, timeout, and audit context.
   - Worker result callbacks must be authenticated and reconciled against expected job/state.
   - Required worker families: notification delivery; report/export generation; search-index refresh; document lifecycle/retention; provider reconciliation; scheduled health/backup/evidence jobs; dead-letter handling.
   - No worker should silently change candidate eligibility, accept legal terms, mark an invoice paid, or bypass a human review gate.

9. **Integration and provider registry**
   - Provider states must be explicit: not configured, connected, sandbox-proven, staging-proven, controlled-live, blocked, or disabled.
   - A connector being installed/visible/callable is not proof that its provider works.
   - Keep credentials outside Git and logs; validate required env vars at startup; expose masked readiness only.
   - PayFast, email, WhatsApp, SMS, Airtable, n8n, hosting/Oracle, GitHub and browser scout are different capability boundaries and need separate evidence.

### 3.3 Jarvis policy, agents, and evidence

The documented Jarvis foundation includes typed contracts, a policy gate, trusted tool registry, evidence ledger, command runner, repo map, and a live module manifest. The broader blueprint names these agent roles; treat role names as policy modules/agent responsibilities, not proof that each is already a deployed autonomous agent.

- **Founder Command Agent:** interprets founder instructions, reports status, prepares safe action packets, and routes approved allowlisted actions.
- **Doctrine Guardian:** checks commands and changes against locked Kingsmen rules and release gates.
- **Provider Gate Agent:** distinguishes visibility/callability from sandbox and runtime proof.
- **Proof Honesty Agent:** blocks claims such as production-ready, payments-live, Oracle-deployed, email-live, official-submissions-live, or candidate-isolation-proven without matching evidence.
- **Oracle Lite Agent:** reads reports and prepares action packets; no spending or deployment without approval.
- **Candidate Safety Agent:** protects against false guarantees, unverified deadlines/fees, data leakage, and sharing without consent.
- **Finance Guard Agent:** protects invoice/payment/refund/provider event boundaries and requires server/provider proof.
- **Communications Guard Agent:** enforces email-first, WhatsApp urgent-only, SMS backup-only, and no unapproved campaigns.
- **Repo Map / Validator / Patch Planner:** selects safe repository context, runs deterministic validators, proposes bounded patches, and records evidence.
- **Evidence Ledger:** records command receipt, policy decisions, plans, validator output, approvals, blocks, correlation IDs, and final outcomes.

All agent outputs are advisory until validated. The API/database enforce final authorization and state. Evidence must be append-oriented and redacted; never log tokens, credentials, full payment secrets, or unnecessary candidate PII.

### 3.4 Opportunity and candidate lifecycle domain

The end-to-end product lifecycle should connect these modules:
1. Public user learns about pathways through the free Destiny Map.
2. Candidate registers, authenticates, provides required profile/consent, and selects goals/pathways.
3. The portal creates a candidate-owned onboarding case and checklist.
4. Candidate submits documents/evidence; file access is private and ownership-scoped.
5. The system tracks KYC and relevant eligibility/compliance/medical review separately, with review status, reviewer, timestamps, rationale, and correction path.
6. Founder/operator reviews eligible cases and records an idempotent selection decision with rationale.
7. The system issues a versioned offer/contract; candidate sees exact terms and expiry.
8. Candidate acceptance is recorded with immutable document hash and evidence. Metadata-only signing is not equivalent to a legally sufficient e-signature; integrate an appropriate provider and obtain legal review before relying on it.
9. Finance issues an itemized invoice in integer cents (ZAR where applicable); the server creates checkout; PayFast sandbox event/ITN is verified server-side and matched to merchant, invoice, amount, currency, and expected state.
10. A single database transaction records the provider event/payment ledger and invoice state, with duplicate/concurrent events safely idempotent. Refunds/reversals are explicit compensating ledger entries, never silent edits.
11. Notification jobs are queued and then delivered through verified providers; failures retry safely and eventually enter a dead-letter queue.
12. Candidate and founder views update from authoritative persisted state.
13. Reporting/search/exports derive from authorized data; exports are logged, access-controlled, time-limited, and redacted as appropriate.
14. Audit, retention, monitoring, incident response, and backup/restore protect the whole lifecycle.

Opportunity discovery, official submission, external institution integrations, and actual placement outcomes must be treated as separate capability levels. Never claim official submission or partner delivery until the specific external integration and evidence exists.

## 4. Current build comparison: established evidence versus gaps

### 4.1 Default branch / documented foundation

The repository README documents these modules on `main`:
- Jarvis contracts in `packages/contracts/src/jarvis/index.ts`.
- Jarvis policy gate, tool registry, evidence ledger, command runner in `packages/jarvis-core/src/`.
- Jarvis core validator and `manifests/jarvis/live-jarvis-core.json`.
- Deployable API shell and routes including health, command intake, workflow result intake, candidate status, and application workbench.
- Web application in `apps/web` for the portal entry, Destiny Map, admin surface, Jarvis HUD, and backend boundary.
- Launch-readiness manifest, docs, validator, and fail-closed launch gate.
- Environment example and broader comprehensive guide/build tracker.

**Important limitation:** the README explicitly says the API storage mode is `memory_development_only` and that the next launch build must replace it with real PostgreSQL/Supabase Truth Vault persistence. The launch manifest lists the persistence, RLS, web boundary, payment, backup/restore, secrets, communications, observability, legal/privacy, staging proof pack, and final assembly gates as pending evidence. Source presence does not mean these have passed.

### 4.2 Open implementation PRs (not merged; not deployed)

- **PR #82 — API CI bootstrap:** proposes the API build/test workflow on the base branch so it can validate later API changes. Must merge through normal review and then demonstrate a real green run; do not claim it passes before a recorded successful run.
- **PR #80 — API/security/PayFast foundation:** authenticated candidate/founder route work, CORS allowlist, PayFast callback/ITN/webhook validation, payment store/atomic ledger migration, candidate KYC start route, API tests, and workflow proposal. Still requires green CI, schema/security helper compatibility review, concurrency/ledger tests, a real PayFast sandbox transaction, and backup/restore proof.
- **PR #76 — candidate onboarding/KYC, compliance/medical eligibility, performance/selection migrations:** includes candidate-owned KYC start/submit behavior and idempotent selection decision draft. Requires full migration-chain review, SQL execution/integration tests, RLS proof, and restore drill.
- **PR #77 — offers/contracts, notification queue, audit log:** conflict-safe offer/sign/notification logic and mutation-blocking audit triggers. Requires audit table compatibility review, SQL tests, provider delivery integration, and evidence that the intended roles cannot mutate audit data.
- **PR #78 — founder RBAC and storage retention metadata:** database-backed founder role predicate and retention/soft-delete metadata. Requires trusted role provisioning/revocation design, compatibility checks for existing function signatures and file ownership columns, real storage lifecycle worker, and isolation tests.
- **PR #79 — reporting/search/billing/WhatsApp metadata:** report export/snapshot metadata, search index, ZAR invoices/line items/payments, and WhatsApp session/message metadata. The PR itself says there is no report worker/export generation, no search worker/API, no PayFast processing in that PR, and no WhatsApp provider/webhook/delivery.
- **PR #74 — staging reconciliation/safety review:** fail-closed storage index check, candidate support-ticket SELECT policy, read-only verification query. Not applied; schema compatibility and RLS evidence remain pending.
- **PR #75 — finance baseline tests:** records integer-cent/ZAR, negative amount, blank description, and balanced-total expectations. Durable idempotency, PayFast signature verification, and refund-reversal posting remain TODOs; no test result is established by the draft.
- **PR #73 — older mega-PR:** retain as historical/reference until replacement PRs are integrated and source guard confirms the replacement coverage. Do not merge overlapping migration sets blindly.
- **PR #81:** closed as superseded; PR #80 is the canonical owner for migration `20261016151400`.

**Current shared state from the inspected PR records:** these implementation PRs remain open/unmerged; the proposed database migrations have not been applied to staging; no successful CI result or real PayFast sandbox transaction has been established in this planning baseline.

### 4.3 Domain readiness matrix

| Domain | Current evidence | Remaining work | Completion proof |
|---|---|---|---|
| Jarvis core | Core files, contracts, policy gate, tool registry, evidence ledger, runner, validator documented on main | Test policy cases, command routing, redaction, fail-closed behavior, approval/replay boundaries | CI logs + validator report + policy tests |
| API runtime | Server, build configuration, initial endpoints documented | Green CI; consistent auth and error handling; no memory-only production path; real DB integration | build/test logs + staging health and persistence report |
| Web portal | Next.js surface documented | Verify every page, route protection, responsive UI, accessibility, real API integration, candidate/founder separation | browser E2E screenshots/reports and route tests |
| Candidate identity/onboarding | Draft migrations/API routes in PR #76/#80; historical UI tracker | Reconcile real schema; registration/login; profile and consent; KYC upload/review; state machine and UI | candidate A/B isolation, happy-path and failure-path E2E |
| Documents | File metadata/storage lifecycle foundations are referenced in manifests/PR #78/#74 | Confirm bucket, ownership schema, upload/download authorization, scanning, versioning, actual retention/deletion worker | private bucket tests, unauthorized-access negatives, restore/deletion evidence |
| Compliance/medical | Draft migration PR #76 | Field minimization, consent, reviewer permissions, expiration/review rules, protected evidence | policy matrix tests, candidate isolation, audit evidence |
| Selection/performance | Draft PR #76 and API route draft in PR #80 | Define state transitions, reviewer rationale, access controls, candidate-visible progress and data source | SQL/API integration and E2E decision/replay tests |
| Offers/contracts | Draft PR #77 and API route draft in PR #80 | Versioning, legal copy, expiry/revocation, provider-backed e-signature or explicit manual workflow | exact-document-hash acceptance test + legal approval |
| Billing/payments | Invoice/payment schema draft PR #79; PayFast API/atomic migration draft PR #80; finance tests PR #75 | Invoice state machine, server-owned amount, sandbox checkout/ITN, atomic ledger, duplicate/concurrent event tests, refund/reversal | real sandbox evidence + ledger reconciliation + idempotency test |
| Founder RBAC | Draft PR #78; founder guard draft PR #80 | Trusted role provisioning, revocation, deny-by-default, MFA/session controls if supported, no client role trust | negative candidate tests and founder authorization report |
| Support | Existing support-ticket schema/policy reference in PR #74 | Verify candidate ownership, founder queue, replies/attachments, notifications, SLA/status lifecycle | cross-candidate access denial + E2E ticket flow |
| Notifications | Queue schema and idempotent enqueue draft PR #77 | Provider adapter, template/version management, consent/preferences, delivery status, retries, rate limits, DLQ | staging email delivery evidence; WhatsApp only after urgent-only policy tests |
| Reporting/export | Snapshot/request metadata draft PR #79 | Report API, worker, formats, permission checks, expiry/download control, audit, retention | generated file hash + access-denial + redaction tests |
| Search | Search index metadata draft PR #79 | Search API, indexing trigger/worker, stale index recovery, founder-only candidate search, PII minimization | index freshness and access-scope tests |
| WhatsApp/SMS | Metadata-only schema draft PR #79; doctrine exists | WhatsApp urgent-only adapter/webhook/signature checks; SMS backup-only; opt-in, templates, suppression and delivery reconciliation | provider sandbox evidence and policy-negative tests |
| Workflow automation | n8n and worker authority documented | Durable jobs, signed/authenticated callbacks, retries, idempotency, correlation, DLQ, least-privilege credentials | failure/retry/replay tests and workflow audit report |
| Audit/evidence | Jarvis evidence ledger on main; audit schema/trigger draft PR #77 | Align application/database evidence model; ensure append-only grants/triggers, redaction, correlation, retention | attempted mutation rejection and event completeness report |
| Truth Vault/RLS | Launch manifest and security validators/docs | Restore baseline; compare actual schema; review grants, helper functions, RLS, service role and migrations | restored DB schema comparison + SQL role-isolation report |
| Backups/recovery | Scripts/manifests referenced in launch gate | Create real logical backup; timestamp/size/SHA-256; restore to isolated target; verify row counts/schema/constraints; document RPO/RTO | reproducible signed/dated restore drill report |
| Secrets/config | `.env.example` and secret-wiring proof plan | Strict startup validation, hosted secret wiring, masked health proof, rotation procedure, scan Git history/artifacts | secret scan + masked staging health report |
| CI/repository governance | Validators/launch gate documented; PR #82 proposes API workflow | Green workflow; lockfiles; branch protection required checks; dependency/security scans; PR gates | GitHub required checks and verified protection config |
| Observability/incident | Launch manifest/docs references | Structured redacted logs, metrics, alerting, traces, queue lag, payment failures, restore alarms, incident runbooks/drill | staging monitoring and incident drill report |
| Legal/privacy/consent | Launch gate requirements documented | Publish/version terms, privacy notice, consent records, retention, refund policy, data-subject process and legal review | reviewed policy artifacts + consent/refund E2E proof |
| Deploy/hosting | Oracle Lite/hosting path referenced in docs/manifests | Confirm actual target, reproducible build, runtime config, TLS, health, resource limits, rollback and smoke checks | deployment manifest + health/rollback evidence |
| Launch assembly | Readiness manifest and final evidence collector references | Capture all redacted staging reports, hash bundle, founder review, 10 end-to-end test journeys | final assembly bundle + signed review; gate passes |

## 5. Security and correctness requirements applying to every module

1. **Identity:** resolve candidate identity from the authenticated session using a trusted server/database mapping. Never accept a client-supplied candidate ID as proof of ownership.
2. **Authorization:** deny by default; enforce in API and database/RLS. Founder access must derive from a trusted role record, not self-editable profile metadata.
3. **Idempotency:** every retryable mutation/provider callback/job must carry an idempotency key and correlation ID. Replaying the same payload returns the original result; reusing a key with a different payload is a conflict.
4. **Transactions:** payment ledger, provider event, invoice state, and audit event must commit atomically or roll back together. Concurrent duplicates must not double-credit or double-mark paid.
5. **Money:** use integer minor units (cents), validate currency and amount server-side, reject negative/zero amounts where business rules prohibit them, and reconcile provider values against the stored invoice.
6. **External callbacks:** verify signatures and expected host/provider semantics; reject missing, duplicate, malformed, stale, or mismatched parameters. Do not treat a browser return URL as proof of payment.
7. **Documents:** private storage, ownership checks, minimal metadata, safe download links, and explicit retention/deletion; medical/KYC material receives stricter access and logging minimization.
8. **Audit:** log who/what/when/why/result/correlation ID for privileged actions; protect audit data against ordinary update/delete/truncate; redact secrets and unnecessary PII.
9. **Communications:** email primary; WhatsApp urgent-only; SMS backup-only. Enforce consent, suppression, rate limits, template review, and no bulk WhatsApp.
10. **Secrets:** never commit credentials or include them in output, reports, logs, screenshots, fixtures, or browser bundles. Fail closed when required secrets are absent.
11. **AI/agents:** model output is untrusted input. Tool registry, policy gate, schema validation, deterministic validators, backend authorization, and human approval remain mandatory.
12. **Privacy and truthfulness:** do not collect data on the free Destiny Map unnecessarily; do not make guarantees about admissions, scholarships, employment, official submissions, provider delivery, or payment success without evidence.
13. **Recovery:** no migrations or production data until backup/restore is proven. Restore must be isolated and must not overwrite staging/production.
14. **No false green:** mocked tests validate local logic only. Provider/runtime claims require real sandbox/staging evidence. A successful build is not a successful end-to-end flow.

## 6. Ordered implementation and completion programme

The order below is intentional. Complete a coherent component, prove it, then move to the next. Do not keep polishing a previously completed component while other components remain unbuilt, unless a blocking defect is found.

### Phase 0 — Inventory, freeze, and release-control baseline
**Goal:** establish one trustworthy map of actual source, open PRs, migrations, and launch blockers.

Tasks:
- Inventory default-branch files, package scripts, migration files, manifests, validators, UI routes, API routes, tests, provider adapters, workflow definitions, and deployment files.
- Reconcile `Kingsmen_Build_Tracker.csv` against current source and PRs; mark each row as implemented/draft/missing/verified and remove stale duplicate entries only after review.
- Build a migration registry showing timestamp, branch/PR, dependencies, tables/functions/policies touched, and overlap/conflict warnings.
- Preserve PR #73 as historical until replacement coverage is merged; identify the one canonical owner for every migration timestamp.
- Establish branch protection and required checks. Do not bypass a failing gate.
- Record current staging project identity, plan/cost, configuration, and data sensitivity without exposing secrets.
**Exit:** component inventory, migration dependency graph, PR map, baseline audit, and required CI check are reviewed. No database changes yet.

### Phase 1 — Backup/restore recovery gate (hard prerequisite to migrations)
**Goal:** prove the team can recover before altering database state.

Tasks:
- Create a timestamped logical backup of the verified staging database using approved credentials.
- Record file size and SHA-256 checksum; ensure backup is stored securely outside Git and access is restricted.
- Restore it into an isolated test database/project, not the source project.
- Verify schema objects, migration history, extensions, functions, triggers, grants, RLS policies, indexes, representative row counts, and referential constraints.
- Run the read-only storage-index verification and compare the restored schema to the expected baseline.
- Record exact commands, tool versions, timestamps, target identity, results, discrepancies, and cleanup status. Do not include credentials or sensitive data in the report.
- Rehearse rollback/recovery steps and agree RPO/RTO before launch.
**Exit:** independently reviewable backup and successful isolated restore evidence exists. If not, stop here; do not apply migrations.

### Phase 2 — CI, dependencies, and code-quality gate
**Goal:** every proposed change gets a reproducible build and test result.

Tasks:
- Review/merge the CI bootstrap PR #82 only through normal checks/review; then prove a real successful workflow run.
- Confirm root lockfile and add/commit the API package lockfile if API dependencies are independently installed. Make CI use deterministic installs wherever package layout permits.
- Add type-check, lint, unit tests, migration static checks, launch-readiness validation, secret scanning, and dependency audit at the appropriate scopes.
- Ensure tests use fake/test identities only, no real candidate PII, and do not need production secrets.
- Make the launch gate fail with explicit blockers and never manufacture reports implying unrun tests passed.
**Exit:** clean reproducible install/build/test on CI and the required checks are configured on protected main.

### Phase 3 — Truth Vault schema and authorization reconciliation
**Goal:** settle the real database contract before applying the new domain migrations.

Tasks:
- Inspect current deployed schema/migration history and reconcile table/column/function names used by PRs #74 and #76–#80.
- Review all migration ordering, duplicate timestamps, dependency references, existing audit_log definition, `document_files` ownership columns, invoice states, helper signatures, grants, and trigger behavior.
- Review `kingsmen_security.current_authenticated_candidate_id()`, founder-role lookup/provisioning, and service-role-only RPC boundaries.
- Define candidate/founder/worker roles and a table-by-table read/write matrix; test denial as well as allowed access.
- Verify no candidate can self-assign founder privileges through Auth metadata or ordinary table writes.
- Execute SQL migration tests against a disposable restored copy first; do not apply to staging until phase 1 and review are complete.
**Exit:** signed-off migration graph, SQL tests pass on isolated restore, schema diffs understood, RLS and grants are least-privilege.

### Phase 4 — Backend runtime and core security boundary
**Goal:** make the API use durable Truth Vault persistence and enforce the same rules everywhere.

Tasks:
- Prove the current API endpoint list and connect real repository adapters; remove memory storage as any production/staging data path.
- Validate environment variables at startup and return masked readiness diagnostics.
- Standardize authentication, candidate ownership, founder guard, input validation, stable errors, request IDs/correlation IDs, structured redacted logging, and rate limits.
- Verify CORS is exact allowlist (not wildcard), and browser clients cannot use service-role credentials.
- Test health, commands, workflow result intake, candidate status, workbench, KYC start/submit, offers, invoices, compliance, performance, support, and founder finance/report routes.
- Test authorization against candidate A, candidate B, unauthenticated caller, non-founder, and authorized founder.
**Exit:** real staging API/database integration proof, no memory-only production behavior, route coverage, and negative authorization tests pass.

### Phase 5 — Candidate portal and onboarding end-to-end
**Goal:** candidate can safely register, onboard, manage profile, and see a reliable next action.

Tasks:
- Finish registration/login/session recovery and identity-to-candidate mapping.
- Complete responsive candidate dashboard and profile/onboarding forms; validate consent, contact preferences, data minimization, and field-level errors.
- Implement candidate-owned KYC start, private upload, draft/review/needs-correction/approved/rejected/expired states, and safe resubmission.
- Add document checklist, upload validation, private download access, version/hash metadata, and review audit.
- Implement candidate support ticket creation, status, messages, and attachments with ownership isolation.
- Verify all candidate-facing pages read from backend and never query privileged database APIs directly.
**Exit:** at least two isolated test candidates complete happy and failure journeys without cross-account access; Playwright E2E evidence recorded.

### Phase 6 — Compliance, eligibility, selection, and performance
**Goal:** founder review and candidate progress become explicit, auditable state machines.

Tasks:
- Complete compliance and medical eligibility schemas with minimal data collection, access boundaries, review/expiry rules, and audit.
- Build founder queues and decision screens with rationale, reviewer identity, timestamp, and idempotency key.
- Enforce valid state transitions and disallow conflicting/replayed decisions.
- Define performance metrics and their authoritative sources; distinguish measured data from manually entered observations.
- Expose only candidate-appropriate progress and decision notices.
**Exit:** SQL/API/UI integration tests cover all transitions, invalid transitions, replay, concurrency, and cross-candidate denial.

### Phase 7 — Offers, contracts, and legally meaningful acceptance
**Goal:** issue and accept versioned terms without overstating signature validity.

Tasks:
- Implement offer lifecycle: draft, issued, viewed, accepted, declined, expired, revoked, with server-side expiry and immutable versioned terms.
- Generate a canonical document and SHA-256 hash; retain exact document version shown to the candidate.
- Integrate a legally reviewed electronic signature provider if legally binding e-signature is required. Until then, label current behavior accurately as acceptance/signature metadata, not a legally validated e-signature.
- Ensure exact retries are idempotent and changed payloads conflict.
- Provide founder cancellation/reissue controls with audit trail.
**Exit:** full offer lifecycle E2E, immutable document evidence, replay tests, and legal review approval.

### Phase 8 — Billing, PayFast, ledger, refunds, and reconciliation
**Goal:** money state is server-verified, durable, and reconcilable.

Tasks:
- Finalize invoice/line-item schema, status transitions, ZAR integer cents, amount rules, and ownership policies.
- Keep invoice creation and payable amount under trusted server control.
- Verify PayFast checkout generation, signatures, fixed validation host, merchant identity, amount/currency, invoice/payment identity, expected status, and duplicate-parameter handling.
- Commit verified provider event, payment ledger, invoice state, and audit event atomically; support concurrency-safe idempotency.
- Implement explicit refund/reversal compensating entries, provider reconciliation, and exception review; never edit history to simulate a refund.
- Run real sandbox checkout/notify/ITN end-to-end using staging-only test data and capture redacted provider evidence.
**Exit:** real sandbox evidence, duplicate/concurrent callback tests, balanced ledger checks, failed/mismatched event tests, and refund/reversal tests all pass. No production payments before founder review.

### Phase 9 — Communications delivery
**Goal:** notification metadata turns into controlled, observable delivery.

Tasks:
- Implement provider adapter registry with explicit capability/status and sandbox proof.
- Complete email templates, versioning, sender verification, preference/consent/suppression, retries, delivery receipts, and bounce/complaint handling.
- Connect queue worker and authenticated provider callbacks; use idempotency, correlation, rate limits, bounded retries, and dead-letter queue.
- Add WhatsApp only for urgent-only communications; verify webhook authenticity, opt-in, template policy, and no bulk reminders.
- Keep SMS as backup-only and document trigger conditions.
**Exit:** staging provider proof, delivered/failed/retry/DLQ tests, consent enforcement, and policy-negative tests.

### Phase 10 — Search, reporting, exports, and document retention
**Goal:** finish metadata-only components into complete worker-backed functions.

Tasks:
- Implement candidate search API and indexing/refresh worker; enforce founder-only search and minimize indexed PII.
- Implement report request authorization, deterministic report generation, snapshots, download expiry, redaction, hashes, and audit.
- Add scheduled snapshots where required, with safe retry and reproducible output.
- Implement retention/deletion worker that reconciles database metadata with storage objects, respects legal holds, and records deletion results.
- Test stale index recovery, export authorization, expired links, deletion retries, and backup/restore implications.
**Exit:** actual generated reports and search results verified in staging; no metadata-only placeholder described as a completed feature.

### Phase 11 — Jarvis agents and controlled automation
**Goal:** make Jarvis a dependable private operator assistant, not an uncontrolled privileged actor.

Tasks:
- Test each named agent responsibility against allow, deny, approval-required, and missing-evidence scenarios.
- Connect tool registry entries only to real capabilities with accurate trust levels and provider state.
- Require command envelope, schema validation, policy decision, approval reference when needed, correlation ID, dry-run preview for risky changes, execution result, and evidence-ledger record.
- Add replay protection and permission scoping to workflow callbacks and external tools.
- Keep production deployment, payments/refunds, bulk communication, candidate-data sharing, official submissions, secret rotation, destructive DB actions, and paid infrastructure behind explicit approval and proof.
- Do not call an agent “live” until its full tool path and safety tests pass.
**Exit:** adversarial policy tests, blocked-action tests, audit completeness, and founder approval workflow pass.

### Phase 12 — Operations, hosting, security, and incident readiness
**Goal:** staging behaves like a controlled production environment and can be operated safely.

Tasks:
- Confirm the actual hosting target and cost/plan; do not provision paid resources without explicit approval.
- Deploy reproducibly with TLS, health checks, environment separation, bounded resource settings, rollback path, and no public workstation-shell dependencies.
- Add redacted structured logs, metrics, traces where available, queue lag, API/database error rates, payment mismatch alerts, storage failures, and backup/restore alerts.
- Write incident runbooks for data exposure, suspected credential compromise, payment mismatch, notification mis-send, queue backlog, and failed restore.
- Exercise alerting, dead-letter recovery, backup restore, rollback, secret rotation, and access revocation.
- Complete dependency/secret scans and security review.
**Exit:** staging monitoring and incident drill report exists; unresolved critical/high findings block launch.

### Phase 13 — Legal/privacy and product truthfulness
**Goal:** product behavior and published promises match operational capability and applicable requirements.

Tasks:
- Legal review of terms, privacy notice, consent, refund/cancellation policy, document retention, data-subject requests, provider sharing, and signature process.
- Publish versioned policy surfaces and record which version a candidate accepted and when.
- Verify the free Destiny Map does not collect unnecessary personal data.
- Clearly distinguish information/guidance from verified opportunities and official external submissions.
- Define data minimization and retention by category, especially identity, medical, payment, and contract data.
**Exit:** review/publishing evidence and consent/refund smoke tests are complete.

### Phase 14 — Final assembly, private beta, and public-launch decision
**Goal:** one reviewed evidence bundle proves the whole product works together.

Tasks:
- Run the launch-readiness validator and fix blockers rather than bypassing them.
- Execute the full staging runtime proof pack and final assembly collector; redact sensitive values and hash artifacts.
- Complete at least 10 end-to-end test-candidate journeys across registration, KYC, review/correction, selection, offer, payment sandbox, notification, support, and candidate isolation.
- Verify no unexpected writes, duplicate payments, unapproved communications, secret leakage, or cross-candidate access.
- Founder reviews the final evidence bundle and signs the launch decision.
- Start with private founder/operator beta; public launch requires all mandatory gates, rollback/recovery readiness, legal/privacy approval, and evidence-backed capacity/support plan.
**Exit:** all gates green with actual evidence; no “temporary” bypass; founder decision recorded.

## 7. Recommended PR and migration handling

1. Do not merge PRs simply because GitHub reports `mergeable=true`.
2. Establish and pass CI via PR #82 before relying on it for PR #80.
3. Review PR #74 schema/RLS safety findings against the real staging schema.
4. Build a single migration graph for PRs #76–#80 and any required PR #74 migrations. Resolve overlapping timestamps, existing objects, helper signatures, table ownership, and grants.
5. Keep each domain migration atomic and tested against an isolated restored database.
6. Merge one coherent, reviewed component at a time, run CI, and capture evidence before moving on.
7. Keep PR #73 open as historical coverage until replacement PRs are merged and source-guard verifies all expected coverage; then close only with a documented reason.
8. Do not apply migrations to staging until Phase 1 recovery evidence and Phase 3 schema review pass.
9. Apply reviewed migrations to staging only after explicit release-gate approval; capture before/after schema evidence and run isolation tests immediately.
10. No production deployment, public candidate traffic, or live payments until final assembly is reviewed.

## 8. Definition of done for every feature

A component is complete only when all applicable items are true:
- source exists on the intended branch and is reviewed;
- schema/API/UI/provider contracts agree;
- authentication and authorization have positive and negative tests;
- validation, errors, idempotency, retries, and concurrency are tested;
- migration has been tested against a disposable restored copy;
- unit and integration tests pass in a recorded CI run;
- E2E tests prove the user journey;
- logs and evidence are redacted and auditable;
- operational failure/recovery behavior is documented;
- UI labels and product promises match actual capability;
- launch-readiness manifest and build tracker are updated with evidence paths and date;
- no secrets or real candidate PII are included in repository artifacts.

## 9. Immediate next actions

Perform these in order, not in parallel with risky database work:
1. Complete the source-wide inventory and reconcile the build tracker.
2. Get PR #82 reviewed/merged under repository policy and capture a real green API CI run.
3. Create and verify the timestamped logical backup and isolated restore drill. This is a hard stop gate.
4. Review the actual staging schema and all migration diffs on the restored copy.
5. Resolve migration/function/table/RLS overlaps before any staging application.
6. Run API tests and migration tests; fix real failures rather than bypassing checks.
7. Implement and prove the first complete end-to-end vertical slice: candidate identity → onboarding/KYC → founder review → offer → sandbox invoice/payment → notification → audit.
8. Complete the remaining worker-backed modules (search, reports, retention, communications) one by one.
9. Complete Jarvis policy/agent adversarial tests and operations/legal gates.
10. Capture final staging proof pack, run the launch gate, and require founder review.

## 10. Current hard blockers (must remain visible)

- No verified logical backup + isolated restore evidence is established in this planning baseline.
- No database migration from PRs #74/#76–#80 has been applied to staging.
- The API README describes memory-only development storage until Truth Vault persistence is proven.
- PR #76–#80 and the CI bootstrap PR #82 are open/unmerged in the inspected state.
- No successful CI run is established here.
- No real PayFast sandbox checkout/ITN evidence is established here.
- Search, reports, notification delivery, WhatsApp delivery, and retention deletion are metadata/foundation-only until workers/providers are implemented and proven.
- Legal/privacy, secrets wiring, observability/incident, staging proof pack, and final assembly gates remain pending evidence in the launch manifest.

**No claim of launch readiness should be made until these blockers are closed with reproducible evidence.**
