# Kingsmen Candidate Website — Journey, Runtime and Operations Register
**Register ID:** KCR-WEB-CANDIDATE-2026-10-29  
**Status:** Evidence-led operating specification; not a claim that the live candidate website currently works.  
**Owner:** Kingsmen product/release owner  
**Repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Related register:** `docs/architecture/KINGSMEN_SYSTEM_REGISTER.md` (same draft PR #210)

## 0. Why this register exists
This is the durable record of the intended candidate experience, its technical route, daily operating model, test scenarios, and current evidence. Future work must update this record and the existing implementation rather than create a second website, duplicate forms, competing application state machines, or a fresh prototype.

**Non-negotiable reuse rule:** Before creating a route, table, migration, Edge Function, API endpoint, UI component, workflow, or package feature, search the repository, migration ledger, Supabase functions, open PRs, and this register. Reuse the canonical implementation where it exists. If a replacement is needed, prove parity and migrate consumers before retiring the old path. Do not duplicate a user journey just because its existing route is difficult to finish.

## 1. Current reality — what evidence says on 2026-10-29
### 1.1 Evidence that exists
- The repository is `kingsmenportal-ctrl/kingsmen-platform`.
- The canonical release module registry declares N18 Public Website / Route House Front Door and N19 Candidate Mobile / Public-to-Portal Experience. Its `validated` label is a registry value, not proof of a deployed journey; the repository-wide inventory explicitly warns runtime proof is separate.
- The launch manifest says `publicLaunchStatus: blocked_until_required_gates_pass` and sets a 500-candidate cap.
- The root README lists the API runtime and explicitly warns that its current storage mode is `memory_development_only`; it says the next launch build must replace this with PostgreSQL/Supabase Truth Vault persistence. Until current code and deployment prove otherwise, do not treat the listed API routes as durable production endpoints.
- PR #190 reports historical CI passes on head `b86f82ccc4fc14772d1e74b36f6920a1136460a6` for the reproducible web build, candidate identity-review UI contract, reviewer authorization contract, follow-up/status contract and release-evidence workflow. These are historical source/CI evidence, not current live website or authenticated browser proof.
- PR #190 describes candidate email OTP sign-in and identity-review submission, a reviewer queue, private evidence upload/read/decision, candidate-owned status/follow-up, and validators. It explicitly says browser E2E, a deployed URL tied to the RC SHA, real authenticated submission, reviewer decision, private upload, candidate A/B isolation, deployed function reconciliation and release approval remain required.
- PR #203 describes an existing authenticated N15 opportunity-matches page with keyword search, six-pathway filtering, deadline sorting, source freshness/evidence display and a Document Vault link. It does not prove a live feed; the same day's PR #209 notes a read-only staging query found zero rows in `candidate_auth_identity_links`, `candidate_opportunity_matches`, `external_source_observations`, `opportunity_programmes`, and `opportunity_deadlines`. Therefore no personalized verified opportunity inventory was available in that snapshot. Do not seed fake opportunities to make the page look populated.
- PR #176 describes a candidate-owned identity-review status page and follow-up workflow; it reports cleanup-only staging tests and zero residual identity-review request/evidence/audit/link fixtures after cleanup. This is not proof that a real candidate has completed the journey.
- Earlier website evidence records the Netlify URL `https://kingsmen-portal-staging.netlify.app/` returning 404/unverified and a Lovable preview disconnected from Supabase. The founder rejected the early-access/waitlist/Lovable concept. Do not revive or deploy that rejected site as the Kingsmen product.
- No current Netlify site ID/deploy ID/deployed commit, current successful live-page HTTP check, or full authenticated browser trace has been established in this register. Thus **the candidate website is not currently certified as working end to end**.

### 1.2 Evidence state summary
| Evidence item | State | Meaning |
|---|---|---|
| Repository and module registry | OBSERVED | Source tree and N18/N19 declarations exist. |
| Launch gate | OBSERVED: BLOCKED | Public launch must remain closed. |
| Historical web build/contract CI in PR #190 | REPORTED PASS at named SHA | Valid only for those workflow runs and that SHA. |
| Candidate OTP delivery to a real mailbox | NOT PROVEN | Must test with an authorized staging identity. |
| Real candidate sign-in + request submission | NOT PROVEN | No fabricated candidate activity. |
| Private document upload/retrieval/expiry in browser | NOT PROVEN end to end | Function/configuration evidence alone is insufficient. |
| Reviewer decision + audit + identity link | Partial database/contract evidence; full journey NOT PROVEN | Must execute authenticated candidate and reviewer paths. |
| Candidate A/B isolation over HTTP | NOT PROVEN end to end | Required negative test. |
| Verified opportunity feed | NOT AVAILABLE in cited staging snapshot | Source/opportunity/link tables were empty in the reported read-only query. |
| Unified master application save/reload | Implementation/CI reported in RC work; deployed authenticated E2E NOT PROVEN | Must prove persistence against the intended deployed stack. |
| Current Netlify deployed SHA and live route | UNKNOWN | Must capture from provider and independently smoke-test. |
| Daily monitoring and incident drill | NOT PROVEN | Requires actual alerts/logs/recovery evidence. |

## 2. Product contract — the experience we are building once
The public website explains Kingsmen and helps a candidate start. The authenticated candidate portal performs actual work. They may be two surfaces of the same product, but not separate products with duplicate profiles, forms, or application records.

### Canonical scope
- South African national opportunity platform.
- Six pathways: higher education; TVET; SETA programmes and learnerships; internships; apprenticeships; employment.
- One account, one reusable candidate profile, one unified Kingsmen master-application experience, and child choices/targets for individual providers/programmes.
- CAO is represented as a Kingsmen application/service-execution record with programme choices as children. Do not make a second CAO-only candidate account/form.
- Every candidate can discover all six pathways irrespective of package. A package governs confirmed application/service entitlements, not access to the opportunity catalogue. Use the canonical package catalogue and confirmed entitlements; do not invent limits.
- Free Destiny Map/profile-readiness view should explain missing information and next actions without pretending a provider has accepted an application.
- Document Vault is private. Candidate evidence, identity review, application attachments and reviewer access are purpose-bound and audited.
- Source directory entry does not mean an opportunity is currently open or that eligibility, deadline, submission, admission, employment, funding or outcome has been confirmed.
- Candidate-reported action and provider-confirmed outcome are distinct states. Never fabricate success.
- AI can explain, organize and recommend; it does not silently make reserved human decisions.
- Founder/staff tools are separate authenticated roles, not hidden candidate routes.
- POPIA, explicit consent, least privilege, retention/deletion, correction, audit, fail-closed access, and candidate A/B isolation apply throughout.
- Current communications scope: **no WhatsApp and no SMS**. Do not create sends/queues for them. Email may only be activated when authorized, configured and tested with consent, opt-out and failure handling.

## 3. Candidate journey — exact step-by-step operating model
The route names below are logical journey stages. Where a path is explicitly mentioned in a PR, it is named as a known route; other UI route paths must be confirmed from the current web source before being represented as live URLs. Do not assume a guessed URL is deployed.

### Stage 0 — Public entry and truthful product explanation
**Candidate action:** Open the official Kingsmen website on mobile or desktop.
**Website must:** Explain the six pathways, national scope, what Kingsmen does/does not promise, how verification works, privacy/consent, package/entitlement logic, fees and refund rules where applicable, and how to start.
**Runtime:** Browser → deployed web build/CDN → public route. Public content must not require candidate secrets. Any API-backed data is fetched from the configured environment, not hardcoded.
**Success evidence:** Exact public URL, provider site/deploy ID, deployed commit SHA, HTTP status, route screenshot/browser trace, mobile viewport result, console/network error report, API origin and health result.
**Failure paths:** 404, stale deployment, wrong environment, API unreachable, slow/low-data network, invalid links, unavailable service. Show an understandable error and retry path; never silently claim submission or eligibility.
**Current state:** Live deploy identity and current live route are UNKNOWN; old Netlify staging URL was previously reported 404/unverified. Do not use the rejected waitlist/Lovable page.

### Stage 1 — Start account and consent
**Candidate action:** Select sign-in/register and supply a valid identity/contact method; review consent and privacy notices.
**Expected system:** Supabase Auth (or the explicitly approved auth authority) issues/validates the session. The web client does not invent its own user identity. Consent version, timestamp and purpose are recorded as appropriate.
**Success evidence:** Real staging mailbox OTP received and consumed; session established; auth UID captured only in restricted evidence; consent record persisted and read back; logout/session expiry behaves correctly.
**Negative scenarios:** malformed address; wrong/expired/reused OTP; resend abuse/rate limit; duplicate account; interrupted network; consent declined; logout; expired session; account recovery; unauthorized deep link; no email provider configured.
**Safe outcome:** If auth/OTP is not configured, show a truthful unavailable state. Do not simulate login or create an unauthenticated candidate record.
**Current state:** Real mailbox OTP and deployed-browser auth are NOT PROVEN.

### Stage 2 — Resolve Auth identity to the candidate record
**Candidate action:** Continue to candidate portal after authentication.
**Expected system:** Server resolves the signed-in Supabase Auth UID to exactly one authorized candidate record through an approved identity-link process. Email matching alone must never silently merge identities.
**Success evidence:** Auth UID → candidate ID mapping is authorized, persisted, unique, audited and read back. Conflicting links fail closed.
**Negative scenarios:** no link; multiple candidate records; conflicting account; candidate attempts another candidate ID; expired session; reviewer not authorized; race/concurrent link requests.
**Safe outcome:** Request authorized identity review or show a clear pending state. Never attach a new account to another person's record based only on matching email/name.
**Current state:** PR #209 reports zero `candidate_auth_identity_links` rows in a read-only staging snapshot. A real candidate mapping must be established and proved; do not invent a link.

### Stage 3 — Candidate profile and Destiny Map
**Candidate action:** Complete/edit personal details, education, qualifications, experience, location/preferences, interests, support needs where necessary, and profile/document readiness.
**Expected system:** One reusable profile powers all six pathways. The UI marks required, optional, missing, unverified and expired fields accurately. Save operation uses authenticated server-side ownership checks and the Truth Vault as authority.
**Success evidence:** Create/save → reload in a fresh session → update → reload again; DB row/version/audit match; validation errors preserve valid entries; candidate A cannot read or update candidate B.
**Negative scenarios:** partial form; invalid date/phone; unsupported values; duplicate submit; lost connection during save; stale concurrent edit; session expiry; unauthorized candidate ID; data correction request; account deletion/retention request.
**Safe outcome:** Clearly distinguish unsaved, saved, pending verification and verified data. No green check without a recorded verification event.
**Current state:** Full live browser save/reload/update journey NOT PROVEN.

### Stage 4 — Browse opportunities across six pathways
**Candidate action:** Open opportunity discovery, search by keyword/provider/location/sector, filter by pathway and sort by deadline/relevance.
**Expected system:** Authenticated N15 feed returns only authorized candidate-safe opportunities. Each result carries provider/source, evidence reference, last-checked time, deadline/time zone, published eligibility where available, freshness and status.
**Success evidence:** A record is traceable to a real source observation; freshness logic and filter/sort results pass browser and API tests; unverified/expired/missing-source items are excluded; empty-feed state is honest.
**Negative scenarios:** no data; stale or future timestamps; missing source evidence; closed/expired opportunity; uncertain eligibility; timezone boundary; source outage; duplicated provider record; malformed URL; malicious content; a source changes after a candidate views it.
**Safe outcome:** Say no verified matches are currently available and explain when data was last checked. Never create synthetic rows to make the interface look complete.
**Current state:** PR #203 reports the UI/search/filter foundation. PR #209 reports zero opportunity/source/link rows in a staging snapshot; a live populated verified feed is NOT proven.

### Stage 5 — Select targets and build one master application
**Candidate action:** Save target institutions, programmes, employers, or opportunities; for CAO, choose programme options under one Kingsmen application/service-execution record.
**Expected system:** A single master application parent holds candidate-level preparation/status. Child targets/choices link to it and record pathway, provider, source evidence, deadlines, fees, requirements and service execution. No duplicate profile or disconnected per-pathway form.
**Success evidence:** Create parent; add/edit/remove child choices; reload; repeat submit idempotently; verify relational constraints, ownership, history and API readback. Candidate sees which choices are incomplete and why.
**Negative scenarios:** duplicate target; invalid pathway/provider relationship; target closes; deadline passes; entitlement insufficient; concurrent edits; partial save; duplicate request; candidate B ID injection; choice deletion after a service has started.
**Safe outcome:** Explain whether a target is saved, eligible based on published rules, ready for review, or blocked. A recommendation is not an application submission.
**Current state:** RC work reports master-application implementation/build evidence, but the deployed authenticated save/reload/child-choice journey is NOT PROVEN.

### Stage 6 — Check package and service entitlement
**Candidate action:** Review available packages and choose a service if needed.
**Expected system:** Opportunity discovery remains universal. Backend calculates entitlements from the canonical package catalogue and verified payment/order state. Price, benefits, application/service limits and renewal/refund rules come from the approved source of truth, not UI constants.
**Success evidence:** Displayed package matches backend catalogue; unauthorized requests cannot exceed entitlement; payment failure does not activate benefits; successful verified sandbox settlement activates exactly the intended entitlement; audit is retained.
**Negative scenarios:** no package selected; stale price; changed price during checkout; duplicate checkout; unpaid/pending/failed/reversed payment; amount mismatch; refund; replayed ITN; candidate modifies client price/entitlement.
**Safe outcome:** Never grant entitlement based only on a return URL or client-side success flag.
**Current state:** PayFast sandbox account exists, but full checkout/ITN/reconciliation and entitlement E2E remain NOT PROVEN.

### Stage 7 — Document Vault
**Candidate action:** Upload requested identity, qualification, CV, motivation-letter or application evidence; inspect document status.
**Expected system:** Browser uploads only through the authorized private-document flow. Enforce private storage, accepted PDF/JPEG/PNG types and 10 MiB maximum where this remains the approved contract; validate on the server, not only in the browser. Store metadata/hash, owner, purpose, review status, timestamps and audit. Signed links are short-lived and authorized.
**Success evidence:** Real upload returns a persisted record; private object is confirmed; authorized owner can retrieve; unauthorized candidate/reviewer cannot; signed link expires; document metadata and audit persist; deletion/retention rules are verified.
**Negative scenarios:** too large; unsupported/mismatched MIME; malformed file; interrupted upload; duplicate/replay; expired session; other candidate's document ID; leaked/public object URL; expired signed link; reviewer not assigned; deletion/retention expiry.
**Safe outcome:** Show upload pending/failed/rejected/accepted separately. A file upload does not mean the document is verified.
**Current state:** PR #190 documents function/UI foundations and some database security tests. Complete live authenticated upload → private retrieval → expiry → A/B isolation browser evidence is NOT PROVEN.

### Stage 8 — Identity review and follow-up
**Candidate action:** Submit identity-review request and evidence, monitor status, answer a request for more information, and resubmit evidence.
**Expected system:** Server validates ownership; request/evidence/audit are persisted. Reviewer access uses the least-privilege identity-review role and assignment rules. Decision requires an authorized reviewer, allowed transition, reason/evidence and audit. Identity linking occurs only after the authorized decision and conflict check.
**Success evidence:** Candidate request appears in reviewer queue; reviewer sees only authorized material; approve/reject/needs-information actions persist; candidate sees status/follow-up after reload; audit identifies actor, time and decision; identity link created only on valid approval.
**Negative scenarios:** candidate self-approval; ordinary user calls reviewer endpoint; reviewer accesses unrelated case; evidence missing; stale decision; conflicting existing identity; duplicate decision; concurrent reviewer; follow-up on closed case; forged candidate ID.
**Safe outcome:** Pending, needs-information, approved or rejected states reflect database evidence. Never infer approval from uploaded evidence or UI navigation.
**Current state:** PRs #176/#190 report implementation and selected cleanup-only SQL/contract CI evidence. A real candidate/reviewer browser journey remains NOT PROVEN.

### Stage 9 — Application preparation and provider execution
**Candidate action:** Complete checklist, verify target requirements, review fees/deadlines, request an authorized application service, approve any required disclosures, and track execution.
**Expected system:** The backend checks identity, profile, documents, source freshness, consent and entitlements before creating an execution record. Each provider action is idempotent and has a correlation ID. CAPTCHA/OTP/rate-limit controls are not bypassed. Manual steps are surfaced to the candidate.
**Success evidence:** Preparation task and application execution are persisted; evidence, responsible actor, provider, timestamp and outcome are linked; retries do not duplicate applications or charges.
**Negative scenarios:** stale source; missing document; expired deadline; provider portal down; provider blocks automation; consent withdrawn; insufficient entitlement; duplicate execution; uncertain submission result.
**Safe outcome:** Status can be “preparation required”, “ready for review”, “candidate-reported submitted”, “provider receipt confirmed”, “provider decision received”, “failed/needs action” only when the corresponding evidence supports it.
**Current state:** Full live provider execution is NOT PROVEN. Playwright/browser scout is diagnostic only; do not treat a probe as submission.

### Stage 10 — Tracking and status history
**Candidate action:** Reopen dashboard and inspect profile readiness, targets, tasks, deadlines, document states, payment/entitlement and applications.
**Expected system:** A server-derived read model presents the latest durable state with timestamps and next actions. It does not show success merely because a button was clicked.
**Success evidence:** State persists across logout/login, device and server restart; status history and evidence agree; each item opens the correct authorized detail.
**Negative scenarios:** stale cache; out-of-order events; provider delay; duplicate webhook; conflicting state; unavailable DB; expired opportunity; user attempts another candidate's application ID.
**Safe outcome:** Show last-updated time and pending verification where applicable. Fail closed for sensitive data if the authority is unavailable.
**Current state:** Full authenticated dashboard/tracker persistence is NOT PROVEN.

### Stage 11 — Candidate support, correction, privacy and exit
**Candidate action:** Ask for help, correct personal data, change consent, request account/data handling, log out.
**Expected system:** Support does not expose another candidate's record; privacy requests enter an auditable workflow; retention rules govern deletion/anonymization and legal holds; logout invalidates local access.
**Success evidence:** Authenticated ownership checks, request acknowledgement, audit, response SLA/owner and completion evidence. No secrets or unnecessary personal data in telemetry.
**Negative scenarios:** account takeover request; unauthorized export; request to erase data under legal hold; session still usable after logout; sensitive data in URLs/logs.
**Current state:** Complete live candidate privacy/support operational path NOT PROVEN.

## 4. What happens behind every screen
The intended trust chain is:

1. **Browser UI** renders the route and performs client-side usability validation. Client checks are not security boundaries.
2. **Auth session** identifies the caller. The server validates the session/token.
3. **API/Edge Function** validates schema, authorization, ownership, role, consent, state transition, rate limits and idempotency/correlation IDs.
4. **PostgreSQL/Supabase Truth Vault** is the source of truth for candidate, profile, application, evidence, entitlement, status and audit records. No separate browser/local-memory state may become authoritative.
5. **Private object storage** holds private documents; database metadata links object to owner/purpose/review status.
6. **Transactional event/outbox/worker** handles retries and external integration without losing the original transaction or duplicating effects.
7. **External provider** may return no response, delayed response, rejection or confirmed receipt. Each is represented separately.
8. **Read model/UI** fetches persisted state and displays the real status and next action.
9. **Observability** correlates request, actor, route, job, provider and result using IDs while redacting secrets and unnecessary personal data.
10. **Release controls** prove the same commit was built, tested, deployed and exercised. No route is declared live because it exists in source.

Where actual source files differ from this intended flow, update the register with the discovered implementation and an explicit gap; do not document intention as current behavior.

## 5. Daily operating model
### Every day before candidate traffic
- Check current deploy status, deployed SHA, web availability, API health, database health and active Edge Function versions.
- Check failed login/OTP rates, authentication provider delivery, API 4xx/5xx and latency, DB connection/error rates, worker queue age, retry counts, dead-letter counts, storage upload failures, provider failures, stale opportunity-source counts and payment reconciliation drift.
- Check backup freshness and alert delivery; backup is only useful after a restore has been tested.
- Review security events, RLS/authorization errors, unexpected role changes and secret-scan alerts.
- Check that disabled WhatsApp/SMS channels have no active send configuration or dispatch.
- Check opportunity freshness, expired records, source ingestion lag, deadline/time-zone anomalies and empty-feed state.
- Check payment intents/orders against verified PayFast ITNs and settlement/entitlement records. Never manually grant entitlements solely to clear a dashboard.
- Review unresolved candidate support/identity-review queues with least privilege and SLA ownership.
- Record incidents, deploys, migrations, operator actions and decisions in the audit/evidence system.

### During the day
- Every request/job receives a correlation ID; state-changing requests use an idempotency key.
- Retry transient external failures with bounded backoff; after exhaustion place work in a visible dead-letter state and alert an owner.
- Do not silently discard work, retry irreversible provider submissions without checking prior outcome, or duplicate payments.
- If the Truth Vault is unavailable, disable sensitive state changes and clearly indicate service interruption; do not fall back to an untracked in-memory production state.
- If opportunity-source checks fail, suppress stale/unverified items or clearly mark them unavailable; never present old data as current.
- If payment status is uncertain, leave entitlement pending until verified reconciliation.
- If a document scan/validation/retrieval fails, keep it unverified and private.
- If a deploy causes elevated errors, stop promotion, use the reviewed rollback procedure, verify data/migration compatibility and record the incident.

### End of day
- Reconcile pending/failed jobs, dead-letter items, identity-review backlog, candidate-submission events, PayFast ITNs, orders, entitlements and provider outcomes.
- Review stale source records and approaching deadlines.
- Verify no cross-candidate access events or unexpected privilege changes.
- Confirm backups and alert pipeline, review deployment/test evidence, and record unresolved risks with owner and next action.
- Do not close a task just because its UI is present; close it only when its acceptance evidence passes.

## 6. Monitoring and alert specification
Every signal must have an owner, threshold, runbook, notification target, retention period and a tested alert. Thresholds should be set from measured staging baselines and explicit service objectives, not guessed as production truth.

| Signal | Minimum alert condition to configure/test | First response |
|---|---|---|
| Website availability | Repeated route/HTTP failures or deploy health-check failure | Confirm deploy/SHA, inspect build and routing, rollback if required. |
| API health | Health endpoint fails, elevated 5xx or latency above agreed SLO | Check deploy, dependency health and redacted logs; fail closed for writes if Truth Vault unavailable. |
| Auth/OTP | Provider outage, unusual failure/resend rate, OTP not delivered | Check provider status/config and abuse controls; never bypass OTP. |
| Database | Connection exhaustion, migration drift, failed transactions, unexpected RLS errors | Stop risky mutations, inspect pool/locks/policies, preserve evidence. |
| Candidate isolation | Any unauthorized cross-candidate read/write succeeds | Critical incident: disable affected path, preserve audit, investigate, retest before restore. |
| Document Vault | Upload/retrieval errors, public-object exposure, invalid signed-link behavior | Restrict access immediately; inspect storage policy and function auth; test expiry. |
| Opportunity source | Ingestion lag, stale/expired record leakage, feed suddenly empty | Mark data unavailable/stale, inspect source jobs and timestamps; do not fabricate records. |
| Workers | Oldest job age, repeated retries, dead-letter growth, duplicate side effects | Inspect idempotency/correlation IDs, retry safely, recover DLQ with audited action. |
| PayFast | ITN signature/amount mismatch, duplicate/replay, order-settlement mismatch | Do not grant entitlement; quarantine event and reconcile against verified provider data. |
| Communications | Any WhatsApp/SMS dispatch attempt; email bounce/opt-out/provider errors if email enabled | WhatsApp/SMS: block and investigate. Email: honor opt-out and retry policy. |
| Security | unexpected role/grant change, secrets detected, unusual auth denial/success patterns | Revoke/rotate through approved process, preserve redacted evidence, assess impact. |
| Backup/restore | backup overdue/failed or restore drill fails | Block launch/data-risk increase until backup and recovery are restored and verified. |
| Release | deployed SHA differs from approved RC; required workflow failed or missing | Stop promotion; identify exact SHA and rerun required checks without bypass. |

Monitoring must not log passwords, OTPs, access tokens, service-role keys, payment secrets, full document URLs, or unnecessary candidate PII.

## 7. Complete acceptance scenario register
Use these stable IDs forever; extend with new IDs instead of replacing or duplicating an existing test.

| ID | Scenario | Required proof | Initial status |
|---|---|---|---|
| WEB-001 | Public homepage and key routes load | deployed URL, deploy ID/SHA, HTTP/browser trace | UNKNOWN |
| WEB-002 | Website points to intended staging API | network trace, API origin, health response | NOT PROVEN |
| WEB-003 | Mobile, desktop, low-bandwidth and accessible navigation | browser/device matrix, no critical console errors | NOT RUN |
| AUTH-001 | Real email OTP sign-in, expiry, resend and logout | redacted browser trace + auth result | NOT PROVEN |
| AUTH-002 | Consent captured with version/time and decline honored | DB readback + negative test | NOT PROVEN |
| ID-001 | Auth user resolves to one candidate record | persisted unique mapping + audit | NOT PROVEN |
| ID-002 | Conflicting identity link fails closed | HTTP/DB assertion; existing link unchanged | partial cleanup-only evidence; E2E pending |
| PROF-001 | Profile save/reload/update in fresh session | API/DB readback after new session | NOT PROVEN |
| PROF-002 | Candidate A cannot read/update candidate B | two real identities, HTTP negative tests | NOT PROVEN |
| OPP-001 | Six-pathway discovery/search/filter/sort | browser/API assertions against evidence-backed records | UI foundation reported; live data not proven |
| OPP-002 | Expired/unverified/missing-source item excluded | negative source freshness tests | source-contract tests reported; deployed feed pending |
| APP-001 | One master application and child choices persist | create/edit/reload/idempotency/DB constraints | implementation/CI reported; deployed E2E pending |
| APP-002 | Candidate-reported submission differs from provider confirmation | state-transition and evidence tests | NOT PROVEN end to end |
| DOC-001 | Private permitted file upload and metadata persistence | actual object + metadata/hash readback | NOT PROVEN end to end |
| DOC-002 | MIME/size/owner checks and signed URL expiry | rejected cases + unauthorized HTTP access | NOT PROVEN end to end |
| REV-001 | Candidate submits review and reviewer sees assigned request | two authenticated roles and browser trace | NOT PROVEN |
| REV-002 | Reviewer decision/follow-up/audit/link | persisted state transition and audit readback | partial SQL/contract evidence; E2E pending |
| PAY-001 | Sandbox checkout + valid ITN reconciliation | provider sandbox evidence + DB order/payment/entitlement | NOT PROVEN |
| PAY-002 | Invalid signature/amount/ref/replay/failure does not grant entitlement | negative settlement tests | NOT PROVEN |
| OPS-001 | Actual worker retries, DLQ and recovers | runtime logs/DB state with correlation IDs | NOT PROVEN |
| OPS-002 | Backup restore drill | isolated restore, checksums, recovery measurements | NOT PROVEN |
| OPS-003 | Alerts and incident recovery drill | fired alert, response timeline, recovery evidence | NOT PROVEN |
| PRIV-001 | Correction/retention/export/deletion request flow | authorized request, audit, retention outcome | NOT PROVEN |
| REL-001 | deployed web SHA matches reviewed RC and complete gate pack | provider deploy + CI + E2E evidence on same SHA | BLOCKED |

## 8. Canonical architecture and ownership boundaries
- **N18:** public website/front door. Owns public explanatory pages, entry/navigation, responsive shell, and links into the authenticated portal.
- **N19:** candidate public-to-portal experience. Owns candidate journey presentation and interaction, not independent truth or duplicate business rules.
- **N04:** candidate identity/profile/portal state and candidate ownership boundary.
- **N05:** private Document Vault and document authorization.
- **N06:** unified master application/workbench and child target/choice tracking.
- **N10:** payment/order/entitlement authority; PayFast settlement is evidence-driven.
- **N12:** consent, privacy, governance and retention.
- **N13:** metrics, health, incident and evidence reporting.
- **N14/N16:** connectors, durable worker/orchestration, retry, idempotency and recovery.
- **N15:** source-backed opportunity intelligence and freshness gates.
- **N17:** founder/Jarvis operations; never grant founder authority to a candidate route.
- **N20:** release evidence, final assembly and public-launch lock.

Truth authority: PostgreSQL/Supabase Truth Vault. Airtable is a downstream mirror, not the source of truth. Workers orchestrate durable work but do not invent authoritative business state.

## 9. Evidence collection and change-control workflow
For every implementation batch:
1. Record current branch, exact base SHA, PR ancestry and open competing work.
2. Search existing source/routes/schema/functions/validators and this scenario catalogue.
3. Name the existing canonical path being reused. If adding a new path, explain why the existing path cannot be extended.
4. Link each changed file to one or more stable requirement/scenario IDs.
5. Run clean install/build/test/validators on the exact commit; record run URLs and pass/fail/skip counts.
6. Run integration tests against isolated staging fixtures. Use real authorized test identities; never fabricate real user activity. Clean fixtures and prove cleanup.
7. Run positive and negative authorization tests with candidate A, candidate B, reviewer, founder, anonymous and service roles as appropriate.
8. For staging browser tests, capture sanitized request/response and DB readback, exact environment, timestamp, deployed SHA, route and evidence reference.
9. Record deploy provider/site/deploy ID, published URL, deployed SHA, build result and post-deploy smoke.
10. Update scenario status without deleting historical evidence; distinguish source/CI proof from database, browser, deployment and operational proof.
11. Do not retire old consumers or migrations until new path passes parity, isolation, idempotency, rollback and consumer-zero checks.
12. Keep public launch blocked while any mandatory gate remains unresolved.

## 10. Immediate execution queue — do not start a second website
1. **WEB-001:** identify current Netlify site/deploy and current published SHA from provider; check the URL from an independent HTTP/browser probe. Record the actual result, including 404 if present.
2. **WEB-002:** trace web configuration to the correct Supabase project and API/Edge Function endpoints; confirm no local/memory-only API is presented as production.
3. **AUTH-001 / ID-001:** use an authorized real staging mailbox/test identity to complete OTP and candidate identity resolution.
4. **PROF-001 / PROF-002:** save/reload/update a candidate profile with two distinct candidate identities and verify isolation.
5. **REV-001 / REV-002 / DOC-001 / DOC-002:** complete the real candidate-to-reviewer flow including private upload and candidate follow-up.
6. **APP-001 / APP-002:** complete master application and child target save/reload, status evidence and idempotency.
7. **OPP-001 / OPP-002:** source and verify legitimate staging opportunities; if source data is not ready, prove the safe empty state instead.
8. **OPS-001–003 / PAY-001–002:** execute worker recovery, PayFast sandbox reconciliation, backup restore and incident/alert drills.
9. **REL-001:** combine evidence against one immutable RC SHA, verify the actual deployed commit, then request normal review. Do not bypass branch protection.

## 11. Definition of done for the candidate website
The candidate website is “working” only when a real staging candidate can: open the correct deployed site; sign in; resolve to the correct candidate identity; save/reload/update profile; view honest six-pathway discovery; save a master application and child choices; upload and retrieve authorized private documents; submit and track identity review; see reviewer follow-up/decision; track application status supported by evidence; see payment/entitlement only after verified sandbox settlement; and remain isolated from candidate B. The same release must have role-negative tests, privacy/audit evidence, monitoring/incident/restore proof, a published URL tied to the exact SHA, and reviewed release gates.

**Current conclusion:** this is the canonical candidate journey and acceptance register. It prevents duplicate rebuilds, but it does not itself make the website live. Live runtime evidence must now be collected against the existing implementation, one scenario at a time, in the dependency order above.


## 12. Live Netlify provider inspection — 2026-10-29
A live read-only query of the connected Netlify account returned:
- Site name: `kingsmen-portal-staging`
- Site ID: `fb27d0db-b116-4890-8f7f-14e654c27dbc`
- Netlify project dashboard: `https://app.netlify.com/projects/kingsmen-portal-staging`
- Primary URL returned by the provider: `http://kingsmen-portal-staging.netlify.app`
- Branch URL returned at inspection: `http://6ae36f87f18d7b3668bcf238--kingsmen-portal-staging.netlify.app`
- Provider reports the site is claimed, has no password or team-SSO gate, and Netlify Forms are not enabled.
- The provider's project response did not expose a populated current deploy ID or commit SHA (`currentDeploy` was empty). This is insufficient to identify which code is live.
- A 24-hour Netlify observability query for this site returned an empty status-code count list, an empty request-log list, and an empty edge-request series. This does **not** prove the site had zero requests or was down; it means this query supplied no usable request evidence. Do not invent traffic counts.
- Independent browser/web fetch in this session could not fetch the site URL (tool returned a disabled fetch error), so no HTTP status or page content was verified by that method.

**Interpretation:** the Netlify site object exists, but the currently published code/commit and candidate-facing content remain UNKNOWN. WEB-001 stays UNKNOWN/NOT PROVEN. Next action: inspect the site's actual deploy/build record through Netlify, identify deploy ID + commit + published URL, then run a real HTTP/browser smoke test and compare its route/build contents with the intended repository SHA. Do not call the site working based only on the site object.



## 13. Direct source inspection — current default branch (`main`)
Read-only source inspection was performed after registering the journey. These are code facts on the repository's default branch, not assumptions about the Netlify deployment:

### Candidate opportunity matches — present, but backend data/runtime still required
File: `apps/web/src/app/candidate/opportunity-matches/page.tsx`
- The page has six pathway labels, a button to load verified matches, an explicit sign-in/configuration error, identity-review-required handling, empty-feed state, source-check/deadline display and a link to the candidate dashboard.
- It reads a Supabase access token from browser localStorage under the project-specific auth-token key and calls `/functions/v1/n15-candidate-opportunities` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- It currently provides pathway filtering in the visible implementation. Search/sort behavior is claimed in PR #203, but the exact default-branch file read did not show keyword search or deadline sorting. Reconcile this difference before assuming the PR's full behavior is on `main`.
- Source file exists; no browser runtime test or live feed was executed in this audit.

### Document Vault page — currently informational shell on `main`
File: `apps/web/src/app/candidate/documents/page.tsx`
- The inspected file renders a heading and explanatory cards for private storage, OCR/review and evidence.
- It does not implement a visible file picker, upload flow, document list, status refresh or download interaction in that file. Do not tell candidates that they can actually upload/retrieve documents through this page until the functional flow is connected and tested.

### Document upload URL endpoint — explicit non-production stub on `main`
File: `apps/web/src/app/api/candidate/documents/upload-url/route.ts`
- The route parses JSON and checks for a few required fields.
- It does not visibly validate a caller's authenticated session, ownership, MIME allowlist, size ceiling or reviewer role.
- It returns `productionReady: false` and `signedUploadUrl: "SIGNER_RUNTIME_REQUIRED"`, despite `ok: true`.
- This is a route shell, not a real signed-upload implementation. Treat this as a **security/release blocker**: never use it to upload real candidate documents; do not expose it as a working production endpoint. The implementation must fail closed until it verifies identity/ownership and creates a real short-lived signed upload through the trusted server-side storage authority. The service-role key must never reach the browser.

### Expected candidate login and master-application API route absent from default branch
The source validator `scripts/validators/validate-candidate-journey-security-boundary.mjs` explicitly reads:
- `apps/web/src/app/candidate/login/page.tsx`
- `apps/web/src/app/api/candidate/master-application/route.ts`
- `apps/web/src/app/api/candidate/documents/upload-url/route.ts`
- `apps/web/src/app/api/candidate/documents/finalize/route.ts`

In the default-branch read on 2026-10-29, `candidate/login/page.tsx`, `api/candidate/master-application/route.ts`, and `api/candidate/documents/finalize/route.ts` returned GitHub 404/NOT_FOUND. They may exist on an unmerged feature/release branch, but they are **not present at those paths on the inspected default branch**. This must be reconciled against the actual release candidate and deployment before merging or duplicating anything. Do not re-create them blindly; inspect their existing PR/branch ancestry first.

### Source and feed backend
File: `docs/n15/N15_LIVE_INGESTION_AND_CANDIDATE_FEED.md`
- Documents the deployed staging function contract: ingestion is restricted to registered HTTPS authority URLs and trusted roles; discoveries are `NEEDS_REVIEW`; ingestion does not declare programmes open or publish candidate opportunities automatically; the candidate feed requires an authorized candidate identity link and approved current evidence.
- The same doc says a deployed function does not prove ingestion has run; an authenticated run record is required.
- PR #209's read-only staging snapshot found zero candidate identity links and zero candidate opportunity/source rows. Therefore the safe candidate experience in that observed state is identity review required or no verified matches—not a fabricated opportunity list.

### Build configuration
File: `apps/web/package.json`
- Declares Next.js build/start scripts and the Netlify Next.js plugin dependency. This does not prove the currently published Netlify deploy uses this package, this branch, or a current successful build.

**Priority consequence:** first reconcile the candidate login/master-application/document flow across `main`, the RC branch, and Netlify's deployed SHA. The upload-url stub and absent default-branch routes must be treated as real findings. Finish the canonical existing flow before starting a replacement UI or a second API path.
