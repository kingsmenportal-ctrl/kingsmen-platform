# Kingsmen System Register — Evidence Baseline
**Register ID:** KSR-BASELINE-2026-10-29  
**Captured:** 2026-10-29  
**Repository:** `kingsmenportal-ctrl/kingsmen-platform`, default branch `main`  
**Purpose:** The single working register for what Kingsmen contains, how each part is built and run, what has actually been proved, and exactly what remains. This is a baseline, not a claim of production readiness.

## 1. Rules for truthful status
Every capability must be tracked independently across these states:
1. **Specified** — requirements and acceptance scenarios are explicit.
2. **Implemented** — source/configuration exists on a named commit.
3. **Build-verified** — the exact commit builds successfully; record command and run.
4. **Unit/contract-tested** — named automated tests ran and passed.
5. **Integrated** — dependencies work together against the intended environment.
6. **Runtime-verified** — an actual request/action was executed and persisted/read back.
7. **Security-verified** — authorization, isolation, abuse and failure cases were tested.
8. **Deployed** — exact commit and target deployment are identified.
9. **End-to-end accepted** — complete user journey passed with evidence.
10. **Operationally monitored** — health, logs, alerts, incident response and recovery have been exercised.

Never promote a capability based on file presence, a migration being applied, a green unit test, a successful compile, a configured provider, or an attractive UI. Record each level separately. Use **PASS**, **FAIL**, **BLOCKED**, **NOT RUN**, or **UNKNOWN**; never substitute a percentage for missing evidence.

## 2. Live facts collected for this baseline

### GitHub source
- Repository exists and is accessible: `kingsmenportal-ctrl/kingsmen-platform`.
- Default branch: `main`; repository visibility: public.
- Repository root `README.md` describes a monorepo with a Jarvis core, deployable API package, launch gate, validators, and evidence manifests.
- Root `package.json` defines a large command catalogue, including `npm test`, Jarvis validators, `npm run api:build`, launch audit/gate, repository inventory, migration-integrity, staging E2E, PayFast, RLS, backup/restore, secrets, communications, observability, legal/privacy and final-assembly checks.
- These scripts are declared in source. This baseline has **not run them**, so their present pass/fail state is UNKNOWN until a named CI/local run is attached.
- The repository already has `docs/architecture/KINGSMEN_REPOSITORY_OPERATING_INVENTORY.md`, `apps/api/src/final-assembly/module-registry.ts`, `manifests/launch/kingsmen-launch-readiness-v1.json`, and a validator that can generate a repository-wide inventory. This register complements rather than replaces those artifacts.

### Supabase staging
A live Supabase project lookup returned:
- Project: `kingsmen-portal-staging`
- Project ref: `euhubhhnumtibbyufghm`
- Region: `eu-west-1`
- Status at lookup: `ACTIVE_HEALTHY`
- PostgreSQL major version: 17 (reported version `17.11.0.003`)

The live migration ledger returned versions through:
- `20261029143144 canonical_package_benefits_universal_accommodation_20261029`
- `20261029143414 seed_canonical_public_package_cards_20261029`

The ledger contains N03–N20 foundations, RLS and FK hardening, candidate identity/profile/application/document work, marketplace/source ingestion, durable worker recovery, founder access hardening, PayFast sandbox settlement, identity-review least privilege, master application lifecycle and package catalogue changes. The ledger proves recorded migration application, **not** semantic schema parity, correct data, working API calls, RLS isolation, rollback safety, or a successful candidate journey. There are two entries named `candidate_application_preparation_readiness_0078` with distinct timestamps; migration history/source reconciliation is required before any replay or cleanup. Do not blindly rerun migrations.

### API runtime
- `apps/api/package.json` declares a CommonJS TypeScript API package, Node >=20, TypeScript compiler and `pg` dependency.
- Root README lists API routes: `GET /health`, `GET /api/system/health`, `POST /api/commands`, `POST /api/workflow/result`, `POST /api/workflow-results`, `GET /api/candidates/:candidateId/status`, and `GET /api/applications/:applicationId/workbench`.
- README explicitly states current API storage mode is `memory_development_only` and the next launch build must replace it with PostgreSQL/Supabase Truth Vault persistence.
- Therefore durable API persistence is **not accepted as complete** based on the README; inspect current code and run persistence/restart tests before changing this status.

### Jarvis
- Source paths named in README: `packages/contracts/src/jarvis/index.ts`, `packages/jarvis-core/src/jarvis-policy-gate.ts`, `packages/jarvis-core/src/jarvis-tool-registry.ts`, `packages/jarvis-core/src/jarvis-evidence-ledger.ts`, `packages/jarvis-core/src/jarvis-command-runner.ts`, `scripts/validators/validate-jarvis-core.mjs`, and `manifests/jarvis/live-jarvis-core.json`.
- Intended boundaries: policy gate, trusted tool capabilities, evidence ledger, command planning and approval/blocked paths.
- The repository describes a live Jarvis foundation, but this baseline has not independently run its validators, exercised every tool adapter, verified founder authentication/authorization, or proved deployed UI-to-API-to-database control flows. Jarvis production-operational status is **UNKNOWN / NOT ACCEPTED** until those proofs exist.
- Safety rules in the repository include no secrets in repository/chat/logs, no bypassing CAPTCHA/OTP/rate limits, and founder approval for production-risk actions.

### Web / website / founder control plane
- Repository inventory registers N17 as founder command operations, N18 as public website/front door, and N19 as candidate mobile/public portal. The launch manifest declares the public launch blocked until required gates pass.
- Source registration is not proof that the deployed website is reachable, that routes load, that the website points to the right API, or that the founder control plane can execute authorized operations.
- This baseline has **no independently captured current Netlify site/deploy ID, published URL, deployed commit SHA, HTTP smoke result, or authenticated browser evidence**. These fields must be collected from Netlify and a live browser/runtime probe before the website is called working.
- Never call a local demo, a static GitHub Pages page, or a build preview the production website without explicitly labelling its limitations.

### Launch manifest and governance
- `manifests/launch/kingsmen-launch-readiness-v1.json` declares `publicLaunchStatus: blocked_until_required_gates_pass` and a candidate cap of 500.
- It defines 13 named launch gates: repo protection, API runtime, Truth Vault persistence, tenant/RLS security, web/API boundary, payments, backup/restore, secrets wiring, communications, observability/incident response, legal/privacy, staging runtime proof pack, and final assembly evidence capture.
- Its gate statuses mostly say foundation built but live evidence pending. The manifest itself is a plan/source declaration, not a current run result.
- Communication doctrine in older source manifests says email primary, WhatsApp urgent-only and SMS backup-only. **Current founder instruction supersedes that for implementation: do not implement or send WhatsApp or SMS now.** Email may be considered primary only after the user authorizes a provider and staging proof. Keep disabled/unconfigured channels visibly NOT_CONFIGURED.

## 3. Product scope that must remain invariant
- South Africa national scope; initial public cap is 500 active candidates.
- One candidate identity/profile and one unified Kingsmen application experience, covering six pathways: higher education, TVET, SETA programmes/learnerships, internships, apprenticeships, and employment.
- Opportunity access is universal across packages. A package limits application/service entitlements, not which opportunities a candidate can discover. Preserve the canonical package names and amounts in the finance catalogue; never invent limits or benefits.
- CAO is one Kingsmen application/service-execution record with programme choices as children, not separate disconnected accounts/forms.
- A source directory is not proof that a programme is open, eligible, in deadline, submitted, accepted or funded. Track source authority, last checked time, expiry, eligibility and evidence.
- Candidate-reported submission must remain distinct from provider-confirmed submission/outcome. Never mark success without evidence.
- AI provides decision support; humans retain decisions where required.
- PostgreSQL/Supabase Truth Vault is the authoritative data store; Airtable is a mirror, and n8n is a thin worker/orchestration layer, not a competing source of truth.
- POPIA, consent, retention, correction, least privilege, tenant/candidate isolation, audit and fail-closed behavior are release requirements.

## 4. System map and acceptance ownership
The authoritative N00–N20 names and ownership are in `apps/api/src/final-assembly/module-registry.ts`. Do not create a competing module taxonomy. For every N-module, the register must link its actual source paths, API routes, DB tables/RPCs, migrations, UI routes, background workers, configuration/secrets, tests, monitoring, deployed artifact and live evidence.

| Area | Known source / evidence anchor | Minimum acceptance proof | Current accepted state |
|---|---|---|---|
| N00 doctrine / invariants | repository doctrine and manifests | validator rejects conflicting policy and records approved changes | NOT RUN |
| N01 monorepo/build | root `package.json`, package manifests, workflows | clean install, build and CI on exact SHA | NOT RUN in this baseline |
| N02 API/state machine | `apps/api` | build; auth; input validation; idempotency; durable state; health and restart test | NOT ACCEPTED; README says memory-only mode |
| N03 Truth Vault | Supabase migrations and DB repository | DB read/write, transaction, restart durability, backup/restore | migrations recorded; runtime proof pending |
| N04 candidate identity/profile | candidate auth/profile code and migrations | register/login/save/reload/update; duplicate/link/recovery/error cases | E2E NOT PROVEN |
| N05 private documents | private-document Edge Function and vault migrations | real upload, MIME/size validation, private storage, hash, authorized retrieval, expiry, deletion/retention and A/B isolation | function/config previously reported; full E2E NOT PROVEN |
| N06 applications/workbench | master application, tracker, preparation routes and migrations | create/update/reload, pathway/choice integrity, status history, evidence-driven status | E2E NOT PROVEN |
| N07 Airtable mirror | sync module and durable outbox migrations | DB event → retryable sync → idempotent mirror; reconcile drift; dead-letter/recovery | authenticated queue proof pending |
| N08 founder control plane | control-plane routes and founder access migrations | founder-only access, ordinary user denied, persisted command/result, audit, UI health drill | complete deployed journey NOT PROVEN |
| N09 communications | communications contracts/worker | channel disabled by default except explicitly authorized email; consent/opt-out, retry/bounce, no WhatsApp/SMS sends | provider staging NOT CONFIGURED/PROVEN |
| N10 finance/PayFast | finance manifest, migrations, payment proof scripts | sandbox checkout + signed ITN + amount/reference/merchant verification + replay/idempotency + failed settlement/recovery/refund audit | sandbox exists; end-to-end settlement NOT PROVEN |
| N11 AI decision support | matching/evidence/review guard code | source-grounded explanations, stale-source rejection, human decision boundary, bias/safety tests | NOT ACCEPTED |
| N12 governance/privacy | policy/legal manifests | consent, retention, correction, audit, published reviewed terms/privacy/refund surfaces | review/publication proof pending |
| N13 observability/incidents | ops proof manifest and report paths | live health, structured redacted logs, metrics, alert, incident drill, recovery evidence | runtime proof pending |
| N14 integrations/connectors | connector contracts/tests | provider probes; NOT_CONFIGURED states; timeout/retry/DLQ/recovery/idempotency | source tests declared; current execution UNKNOWN |
| N15 opportunities/source intelligence | source authority registry, ingestion/feed | verify provenance, timestamps, expiry/timezone, eligibility; candidate-safe feed excludes expired/unverified items | ingestion E2E NOT PROVEN |
| N16 orchestrator/worker | durable worker migrations and code | actual worker process/build, lease/retry/duplicate/failure recovery, deployed execution | database foundation recorded; worker runtime NOT PROVEN |
| N17 founder operations/Jarvis control plane | Jarvis core + founder routes/UI | authenticated founder command → policy → approval where required → tool execution → durable evidence → visible result; deny non-founder | code foundation present; deployed E2E NOT PROVEN |
| N18 public website | `apps/web`, Netlify config/deploy | deployed URL and SHA, route smoke, correct API origin, error/loading states, accessibility/mobile check | current deployment identity UNKNOWN |
| N19 candidate portal/mobile | candidate UI routes and API | complete authenticated journey across supported viewport/browser; A/B isolation | NOT PROVEN |
| N20 final assembly/release lock | launch manifest, evidence collectors, release validators | one immutable RC SHA; combined CI; reviewed staging pack; final evidence bundle; founder sign-off | BLOCKED by required gates |

This table is an acceptance register. It intentionally does not claim that all rows have the same implementation percentage. Per-module percentages must be calculated from named requirements and tests, not estimated from source volume.

## 5. Required end-to-end scenario catalogue
Every scenario below needs a stable scenario ID, test data identity, environment, exact commit, command/runner, result, timestamp, evidence URI and failure/cleanup record.

### Candidate identity and profile
- CAND-01 register with valid data and consent; reject malformed data.
- CAND-02 login/logout/session expiry/password reset and recovery.
- CAND-03 save → reload in a new session → update → reload; verify DB persistence.
- CAND-04 duplicate registration and identity-link conflict; fail closed.
- CAND-05 candidate A cannot read/write candidate B profile, applications or documents.
- CAND-06 reviewer role can see only assigned/authorized review material; candidate cannot self-approve.

### Identity review and documents
- DOC-01 upload permitted PDF/JPEG/PNG below 10 MiB; verify private object and persisted metadata/hash.
- DOC-02 reject oversized, unsupported MIME, malformed and unauthorized uploads.
- DOC-03 signed retrieval succeeds only for owner/authorized reviewer and expires as configured.
- DOC-04 revoke/expire/delete/retention path; verify no public bucket/object exposure.
- DOC-05 reviewer decision records actor, role, timestamp, reason, evidence and audit; identity link occurs only after authorized decision.
- DOC-06 concurrent submissions/retries do not duplicate or corrupt review state.

### Unified application and opportunities
- APP-01 one candidate profile powers all six pathways.
- APP-02 one master application with child programme choices; add/edit/remove choices with pathway consistency.
- APP-03 save/reload/update across sessions; verify tracker, tasks, deadline and history persistence.
- APP-04 unverified/expired source never appears as a verified/open opportunity.
- APP-05 source ingestion failure, stale data, timezone boundary and provider correction are handled safely.
- APP-06 application submission status remains candidate-reported until provider evidence confirms it; outcome requires provider/authorized evidence.

### Founder, Jarvis and workers
- OPS-01 unauthenticated and ordinary-candidate access denied to founder routes.
- OPS-02 founder command validates authority, tool capability, policy, risk and approval requirement.
- OPS-03 blocked/approval-required/dry-run/allowed command paths produce accurate evidence.
- OPS-04 worker crash, timeout, duplicate event, lease expiry, retry exhaustion and recovery are demonstrated.
- OPS-05 audit trail correlates command, actor, job, provider request and result; secrets/PII are redacted.
- OPS-06 actual deployed founder UI command round-trip works against staging data.

### Payments, communication and operations
- PAY-01 candidate-authorized PayFast sandbox checkout creates intent/order/invoice.
- PAY-02 valid ITN checks signature, merchant, amount, reference, status and environment before settlement.
- PAY-03 invalid signature, wrong amount/reference, duplicate/replay, out-of-order, failure and retry tests.
- PAY-04 entitlement only activates after verified settlement; refund/reversal/reconciliation leaves audit evidence.
- COM-01 no WhatsApp/SMS configuration, queue dispatch or send occurs under current instruction.
- COM-02 any future email channel requires explicit provider setup, consent/opt-out, bounce/retry and staging test before activation.
- OPS-07 backup restore to an isolated target and measure recovery point/time; do not overwrite staging blindly.
- OPS-08 alert and incident drill including redaction, dead-letter queue and recovery.
- WEB-01 live public URL resolves and reports exact deployed commit; website reaches the intended API.
- REL-01 all required CI on one immutable candidate RC SHA; migrations match source schema; complete E2E pack; reviewer/founder sign-off.

## 6. Build, compile, test, deploy and monitor record format
For every batch, append a record with:
- batch ID and objective;
- branch, PR, exact base/head/merge SHA;
- files changed and requirement IDs addressed;
- exact install/build/test commands, environment, run IDs, exit codes and passed/failed/skipped counts;
- migration versions applied and schema-parity result;
- deployed provider/site/function IDs and deployed commit;
- sanitized HTTP/browser/API/DB evidence;
- security negative tests and candidate A/B isolation result;
- monitoring/alert/recovery result;
- requirement-by-requirement state transitions;
- blockers, plain-English cause, exact owner/action needed, workaround/parallel work;
- rollback plan and evidence cleanup;
- remaining work recalculated from open acceptance scenarios.

A build report is not a deployment report. A deployment report is not an E2E report. A successful test is only valid for the SHA and environment that actually ran it.

## 7. Initial known gaps to close first, in dependency order
1. Establish one immutable baseline SHA and run the repository inventory/launch audit against it. Record all open PRs/branches/issues from the live GitHub census; do not assume stale reports describe current state.
2. Run clean dependency install, root test suite, API build, web production build, all validators, and combined CI. Capture actual outputs and resolve any compile/test errors.
3. Inspect API storage selection and prove whether any production-capable path still uses memory-only state. Replace the path with Truth Vault persistence and add transaction/restart tests before retiring the old path.
4. Reconcile duplicate 0078 migration history and source/schema parity. Compare schema, functions, policies, indexes, constraints and grants; no blind replay.
5. Verify backup/restore before more risky staging mutations.
6. Run authenticated candidate A/B and reviewer identity-review journeys, then document upload/retrieval/expiry and unified application persistence.
7. Run opportunity source/feed negative cases and actual worker process retry/recovery.
8. Run founder/Jarvis authorization and persisted command/result round-trip.
9. Run PayFast sandbox checkout and ITN reconciliation; keep live money flows disabled.
10. Establish Netlify site/deploy identity, deployed SHA and live URL; run website-to-API smoke and authenticated browser journeys.
11. Finish secrets, communications (with WhatsApp/SMS disabled), observability/incident, legal/privacy and final assembly evidence.
12. Only then determine release readiness; do not open public launch while any mandatory gate remains unresolved.

## 8. Initial quantified state — what can and cannot be claimed
- **21/21 N00–N20 module slots:** declared in existing repository inventory; this is registration coverage, not functional completion.
- **13 launch gates:** declared by the launch manifest; their current runtime pass count has not been freshly established by this baseline.
- **Supabase staging:** live project lookup reports ACTIVE_HEALTHY; this is provider/database availability, not app-level correctness.
- **Migrations:** ledger read succeeded through two 2026-10-29 package migrations; schema parity and user journeys are not thereby verified.
- **API build/tests, web build/tests, Jarvis tests, deployment, authenticated E2E, security matrix, backup/restore, PayFast ITN, monitoring/incident drill:** NOT RUN or NOT PROVEN by this baseline capture.
- **Public launch:** BLOCKED in the source manifest; keep it blocked until evidence says otherwise.
- **Completion percentages:** intentionally NOT CLAIMED until each acceptance scenario is counted and its evidence state is current.

## 9. Source anchors
- `README.md` — declared runtime paths and memory-only API warning.
- `package.json` — actual script catalogue.
- `apps/api/package.json` — API build/runtime declaration.
- `docs/architecture/KINGSMEN_REPOSITORY_OPERATING_INVENTORY.md` — N00–N20 map and census semantics.
- `apps/api/src/final-assembly/module-registry.ts` — module names/owners/validators/reports.
- `manifests/launch/kingsmen-launch-readiness-v1.json` — 13 launch gates and release rules.
- Live Supabase migration ledger for project `euhubhhnumtibbyufghm` — applied-version evidence, with limitations noted above.

**Change control:** update this register only with evidence-bearing changes. Preserve previous values and explain why a status changed. No module is “complete” until its specified acceptance scenarios pass at the required environment and its evidence points to the exact deployed commit.
