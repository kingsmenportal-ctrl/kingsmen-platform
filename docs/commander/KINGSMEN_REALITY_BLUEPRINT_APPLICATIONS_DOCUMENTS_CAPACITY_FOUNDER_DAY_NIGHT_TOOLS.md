# Kingsmen Reality Blueprint — End-to-End Operations, Capacity Phases, Applications, Documents, Founder Day and Tool Mesh

**Status:** Source-backed operating blueprint and implementation acceptance contract  
**Recorded:** 2026-10-17  
**Repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Authority rule:** Locked Commander doctrine and current repository evidence outrank assumptions. This file defines intended real-world behaviour; it does not declare a feature implemented merely because a manifest, panel, validator, or stub exists.

## 0. Why this blueprint exists

Kingsmen must be a real national South African route, application-support, funding, skills, employment, accommodation, document-evidence, communications, finance, and founder-command operation—not a CAO-only portal, static dashboard, collection of mock integrations, or fantasy automation story.

The code and the blueprint must agree. For every feature, the release record must state separately:
1. **Doctrine** — what the platform is required to do.
2. **Code** — exact implementation files and endpoints.
3. **Persistence** — tables/storage and migration actually applied.
4. **Provider** — connected adapter and credential boundary, if any.
5. **Runtime proof** — tests and staging evidence that demonstrate the real behaviour.
6. **Remaining gap** — what still prevents safe operation.

A file existing, a validator passing, a provider being named, or a UI card being rendered is not proof of an end-to-end capability.

## 1. Capacity phases: preserve the real targets and the gates

The repository has explicit capacity values in `scripts/validators/validate-oracle-bootstrap.mjs` and `scripts/oracle/Prepare-OracleVmBootstrapPlan.ps1`:

| Capacity stage | Repository value | Meaning | What it does **not** mean |
|---|---:|---|---|
| **Stage A — controlled launch** | **500 active candidates** | Initial live operational ceiling on Oracle Lite, low concurrency, one-founder/small-operator model. This is a hard active-workload ceiling, not a national-scope limit. | It does not mean only 500 people may ever discover Kingsmen or that national route categories should be hidden. It does not mean the cap may be exceeded when busy. |
| **Stage B — ready-cap target** | **1,000** | The code calls this `KINGSMEN_READY_CAP_TARGET`. It is a readiness target to prepare for a controlled increase after evidence review. | It is not automatic permission to raise the live cap to 1,000. |
| **Stage C — preparation target** | **5,000** | The code calls this `KINGSMEN_PREPARE_CAP_TARGET`. It is a preparation/planning target for architecture, data, queues, staffing, monitoring, and migration work. | It is not proof that the current Oracle Lite deployment can safely run 5,000 active candidates, nor permission to switch the cap without approval and capacity evidence. |

**Do not invent additional numeric cap stages.** The source-backed targets currently confirmed are 500 / 1,000-ready / 5,000-preparation. If older Commander-approved material defines additional sub-phases, recover and cite it before adding numbers.

### Required behaviour at each stage

**Stage A — 500 active**
- National route universe remains available: universities, private colleges, TVET, CAO/direct institution routes, NSFAS and other funding, bursaries, SETA, learnerships, internships, apprenticeships, employment, employers, accommodation, and transport.
- The cap applies to *active managed candidates/work*, not browsing, the existence of routes, or a candidate's dignity.
- Define “active” centrally in a tested server-side policy (e.g. admitted to managed service and not closed/archived/withdrawn); do not let the browser define it.
- Enforce cap transactionally in PostgreSQL, safely under concurrent sign-ups/activation requests. A UI warning or an in-memory count is insufficient.
- At capacity: preserve an intake/waitlist record where policy permits, explain the real status, prevent new managed activation, retain national preview access, and create an operator task. Never silently discard an applicant or imply service activation.
- Monitor active count, queue depth/age, DB pressure, CPU/memory/storage, failure rate, document review backlog, source freshness, payment reconciliation, candidate wait time, and founder workload.

**Stage B — readiness for 1,000**
- Prepare, do not automatically expand: collect a sustained period of clean runtime metrics; demonstrate database/RLS isolation; run queue and concurrency tests; prove backup and restore; demonstrate retry/dead-letter recovery; verify document storage capacity and access controls; test source refresh and notification throttles; record staffing and founder workload; assess candidate outcomes and unresolved incidents.
- Require a named human approval event, a capacity evidence bundle, and an audited cap change. The cap setting must be versioned and observable.
- If any critical indicator is red, remain at 500, reduce worker concurrency, drain queues, and remediate.

**Stage C — preparation for 5,000**
- Produce a separate scale plan with tested queue concurrency, database query/index/connection budgets, object-storage costs and lifecycle, operator roles, support coverage, source monitoring volume, rate limits, disaster recovery, privacy/retention, and a rollout/rollback plan.
- Use load tests with synthetic data, not real candidate PII.
- A preparation target is not an active-candidate limit change. Require a further explicit Commander approval and deployment proof before any live cap increase.
- Preserve the same route capability and safety standards while changing throughput.

### Capacity pressure actions already reflected in code
`apps/api/src/observability/capacity-monitor.ts` defines LOW/MEDIUM/HIGH/CRITICAL pressure at 70%/85%/95%; at HIGH the recommendation is hold the cap and reduce workflow concurrency; at CRITICAL freeze growth, drain queues, and review incidents. Wire these signals to the live founder cockpit, alerting, and the admission gate; test the full path. Do not treat a computed snapshot as proof that the admission gate is enforced.

## 2. The real candidate journey — from public discovery to outcome

### Step 1 — public discovery and informed intake
1. Visitor lands on the public Kingsmen website and sees that Kingsmen is an independent support/routing service, not an official university, TVET, SETA, NSFAS, CAO, employer, bursary, accommodation, government, or payment-provider portal.
2. Visitor can inspect the Free Destiny Map preview and public service/pricing boundaries without entering the Founder Control Plane.
3. The preview is explicitly **0 managed applications**. It provides all-sector orientation, not hidden promises that exact targets, applications, portals, or submission work have already been completed.
4. Candidate chooses a service/package only after seeing scope, exclusions, truthful prices, refund/cancellation terms, consent and privacy notices. Do not invent prices or conceal entitlements.
5. Intake collects only necessary fields, purpose/consent, contact channel, and enough identity data to initiate the approved identity-review process.

### Step 2 — registration, authentication, and candidate identity
1. Register account; send email confirmation; establish a secure session only after provider-confirmed auth.
2. Map the authenticated Supabase user UUID to the correct existing candidate record through authorised review and a unique/controlled identity-linking process. **Email equality alone must not link a candidate.**
3. If identity is ambiguous, duplicated, or conflicts with an existing record, quarantine for human review; do not merge automatically.
4. Enforce server-side ownership on every candidate read/write and private document route. Client-supplied candidate IDs are not authority.
5. Persist audit events for link, review, correction, revoke, and sensitive access.

### Step 3 — profile and correction review
1. Build a structured profile: identity/contact, province/location, education history and results, qualifications, skills, interests, eligibility/constraints, funding needs, route preferences, transport/accommodation constraints, and consent choices as applicable.
2. Extracted CV/document values are suggestions, not trusted facts. Show source document/page/field when available and ask the candidate to confirm.
3. Candidate corrections create a review request with old value, proposed value, reason, evidence, actor, timestamps, status, and reviewer decision. Sensitive conflicts require operator review.
4. Keep an auditable change history; never silently overwrite verified identity/qualification facts.

### Step 4 — assess the complete route universe
For each candidate, build separate route records and eligibility assessments across all relevant families—not one generic “application”:
- Higher education: public universities, private higher-education institutions/colleges, direct institution portals, and CAO where applicable.
- TVET colleges and programme-specific admissions.
- NSFAS and other funding/support routes.
- Bursaries and scholarships.
- SETA programmes, learnerships, skills programmes, and training providers.
- Internships and graduate programmes.
- Apprenticeships and trades pathways.
- Employment/vacancies and employer-specific applications.
- Accommodation routes and applications.
- Transport support/routes where offered.
- Other verified opportunities in the national route registry.

Each route must have its own provider, programme/opportunity, source URL, source type, eligibility, location, opening/closing dates, fees, required documents, official submission channel, last-checked time, source confidence, freshness status, evidence reference, and next action. Accommodation and transport are connected service areas, not falsely represented as an education application.

### Step 5 — opportunity verification and matching
1. Ingest source records from approved sources; record when and by whom they were checked.
2. Verify current facts against official provider sources where possible. Label uncertain/secondary data provisional.
3. Match against candidate-confirmed profile facts and route eligibility. Explain why a route matches, why it may not, missing evidence, deadline/fee uncertainty, and candidate decision needed.
4. Candidate chooses or confirms routes; package weight may affect managed count, monitoring, priority, route intensity, document support and execution intensity, **not human dignity or whether the person deserves access to a sector**.
5. Do not invent a closing date, fee, qualification, vacancy, eligibility rule, application result, or acceptance.

### Step 6 — application workbench (one route, one traceable case)
Every managed route application is its own record with:
- candidate ID and owner scope;
- route/provider/programme/opportunity ID;
- source and deadline/fee evidence;
- eligibility assessment and missing items;
- required documents and exact versions;
- candidate consent/approval;
- assigned owner/operator and queue priority;
- application state, state-transition history, next action, due date and reminders;
- external portal/reference number only when genuinely received;
- evidence ledger and communication history;
- exception reason and manual fallback state.

Use the repository's governed state machine; every state change must be authorised, idempotent where applicable, and evidenced. Never infer provider acceptance from a Kingsmen checklist or package completion.

### Step 7 — safe execution and manual fallback
1. Playwright is a **scout/probe**: check page availability, inspect public instructions/forms, detect login/OTP/CAPTCHA, capture screenshots and source evidence, and prepare a Manual Application Package (MAP).
2. Never bypass CAPTCHA/OTP, impersonate the candidate, evade provider controls, or claim submission success without official evidence.
3. A candidate/operator completes sensitive portal interactions where required. Record exactly which steps were completed, by whom, when, and with what official confirmation.
4. On blocker/outage/selector drift, use explicit reason codes: `OTP_REQUIRED`, `CAPTCHA_BLOCKED`, `PORTAL_DOWN`, `MANUAL_ONLY`, `SOURCE_REVIEW_REQUIRED`, `OTHER`. Route to MAP/manual handling or Phoenix fallback; preserve progress and notify the right operator.
5. MAP lifecycle: `DRAFT → READY → DELIVERED → IN_PROGRESS → COMPLETED`, with `REJECTED`/`CANCELLED` exceptions. Completion requires evidence reference, verifier, and timestamp. “Package completed” is not “provider accepted.”

### Step 8 — candidate status, communications, and support
- Candidate sees clear status, missing items, next action, due date, owner/support path, and whether a status is Kingsmen-verified or provider-confirmed.
- Email is the primary channel. WhatsApp is urgent-only; SMS is backup-only. No bulk WhatsApp campaigns.
- Every outbound message must respect consent, purpose, quiet hours, delivery status, retry limits, suppression/opt-out, and audit.
- Support cases have a category, severity, owner, evidence, response due time, escalation path, resolution, and candidate-visible explanation.
- Avoid exposing internal fraud indicators or another candidate's information.

### Step 9 — outcome and closure
- Record outcome as provider-confirmed, candidate-reported, pending, unsuccessful, withdrawn, expired, or unknown with evidence provenance.
- Keep “submitted”, “received”, “under review”, “offer”, “accepted”, “registered”, “employed”, and “funding paid” distinct.
- Completion/closure must preserve the final state, evidence, communications, finance status, candidate feedback, and any follow-up tasks.
- Measure outcomes and service quality without promising admission, funding, employment, accommodation, or transport.

## 3. Document lifecycle — code must know when, why, how, and where

The N05 report lists types, policy, readiness, request engine, verification, fraud signals, extraction bridge, storage, repository, UI panel, and checklist. That is a document-vault foundation. The report does **not** by itself prove end-to-end uploads, private object storage, malware scanning, signed downloads, retention, or live RLS. The recent candidate-document work also had metadata/request view only; upload/download/private storage/signed URLs remained blocked. Treat those as blockers until real evidence says otherwise.

### When a document is created or requested
A document event must have a trigger and purpose:
- candidate uploads a new document;
- an application/route requires a document;
- profile onboarding needs evidence;
- an existing document is expired, unreadable, incomplete, or superseded;
- a reviewer requests clarification/replacement;
- a candidate asks for correction/deletion subject to retention law/policy;
- a verified outcome or funding process requires supporting evidence.

A request record must store candidate, document type, purpose/reason, linked application/route (if applicable), required/optional flag, priority, due date, requester, status, created/updated timestamps, and safe candidate-facing instructions. No unexplained “upload documents” prompt.

### Upload sequence (required real behaviour)
1. Candidate is authenticated and ownership is resolved server-side.
2. UI displays allowed types, size limit, purpose, linked route(s), privacy notice, and upload status before transfer.
3. Server authorises candidate and purpose; creates a short-lived upload intent tied to candidate, document type, and maximum size/MIME rules.
4. File is uploaded to a **private object-storage bucket** using a short-lived scoped signed URL or a server-mediated stream. It is not written to public web assets, a public bucket, Git, logs, or Airtable.
5. Server verifies actual file signature/type and size rather than trusting filename or browser MIME. Reject disallowed types; compute checksum; record storage object key (not a public URL).
6. Run malware/quarantine checks where a supported scanner exists. Until scan is complete, status is quarantined/pending scan and extraction/reuse is blocked.
7. Create/update document metadata and an immutable storage event: document ID, candidate ID, type, original name safely sanitised, MIME, size, checksum, object key, uploader, upload time, purpose, linked request/application IDs, scan state, review state, retention class, and audit correlation ID.
8. Return a receipt/status to the candidate. If transfer or metadata persistence fails, surface a recoverable error and reconcile orphaned objects; never display “uploaded” if storage and metadata disagree.

### Review, extraction, and reuse
1. Document progresses through explicit states such as `UPLOAD_INTENT`, `UPLOADED_QUARANTINED`, `SCAN_PENDING`, `AVAILABLE_FOR_REVIEW`, `EXTRACTION_PENDING`, `EXTRACTED_UNCONFIRMED`, `CANDIDATE_CONFIRMED`, `VERIFIED`, `REJECTED`, `EXPIRED`, `SUPERSEDED`, `DELETION_PENDING`, `DELETED`. Align names to actual schema before coding; do not create two competing state machines.
2. Extraction creates field-level candidates with document/version/source location, confidence, and extraction run ID. Never silently trust extracted fields.
3. Candidate confirms ordinary profile fields; sensitive identity/qualification conflicts go to authorised operator review.
4. A reviewer records decision, reason, evidence, reviewer identity and timestamp. Fraud signals trigger review only; they are not final fraud decisions.
5. Reuse a document across applications only when its type, validity, candidate consent, route requirements and version are suitable. Link the same controlled document record to multiple application requirements instead of uncontrolled duplicate uploads.
6. If rejected, tell the candidate the precise fix (e.g. unreadable page, expired evidence, wrong type) without exposing internal detection logic.

### Where documents and records live
- **Bytes:** private object storage (Supabase Storage or another explicitly configured private provider); bucket/object access must be private and audited.
- **Metadata and state:** PostgreSQL Truth Vault (document registry, requests, analysis/extraction, verification, fraud-signal, storage events, readiness snapshots, application links).
- **Authorization:** server-side candidate ownership, RLS/least privilege, operator scopes, signed URL expiry, and no client-supplied candidate ID trust.
- **Evidence:** append-only event/audit/evidence ledger references with checksum and timestamps.
- **Airtable:** redacted operational mirror only, never private document bytes or the authoritative truth.
- **Logs/reports:** identifiers and redacted statuses only; never file contents, access tokens, signed URLs, identity numbers, or credentials.
- **Backups:** encrypted and access-controlled; restore drills must prove both metadata and object bytes remain linked.

### Download, retention, and deletion
- Download only after server-side owner/operator authorisation; mint short-lived signed URL after every access check; record access event.
- No permanent public URL; no signed URL stored in analytics, logs, messages, or long-lived rows.
- Define retention by document purpose/legal basis and application lifecycle. A deletion request must check legal/operational holds, remove or cryptographically expire bytes and derivatives, update metadata, and preserve only legally required audit proof.
- On replacement, mark prior version superseded and retain only according to the retention policy.
- Test cross-candidate reads, guessed object keys, expired signed links, unauthorized operator access, oversized/malicious files, MIME spoofing, duplicate retries, partial upload failure, and backup restore.

### Required proof for N05 to be called operational
A browser E2E test must log in as candidate A, upload a real test file, see its receipt, verify private object storage and DB metadata, confirm request/application linkage, complete scan/review flow, and download via an authorised short-lived link; candidate B must fail to access every route/object. Evidence must be redacted. If storage provider, scanner, or live credentials are not configured, show `blocked/proof-needed`, not “complete”.

## 4. Founder morning command routine — first wake, then operate

The repository defines MORNING, MIDDAY, EVENING, INCIDENT, WEEKLY and MONTHLY briefs. Do not invent clock times: run relative to the configured Founder timezone and schedule, and label a brief late/missing if not delivered. The morning routine is a real queue of checks, not a static greeting.

### Morning sequence
1. **Wake greeting and command identity:** “Welcome to Kingsmen Command, Commander.” Show local date/time only when verified, last truth sync, current deployment/environment, and whether the status data is fresh.
2. **Truth sync and system pulse:** query API, PostgreSQL Truth Vault, worker heartbeats, queue depth/age, dead letters, latest backups, storage health, provider health and last successful checks. Distinguish unavailable from healthy.
3. **Overnight change digest:** show deployments/commits, migrations, configuration changes, provider status changes, source changes, failed jobs, retry attempts, and unresolved alerts since last closeout.
4. **Candidate urgency lane:** list only authorised, minimum-necessary candidate references needing action today: deadlines, blocked applications, missing documents, identity-review conflicts, consent issues, payment disputes, vulnerable/urgent support flags, and stale communication. Do not leak sensitive details in push/summary previews.
5. **Application and route board:** due today/soon, source freshness, unverified fees/deadlines, portal outages, OTP/CAPTCHA/manual packages, MAP handoffs, Phoenix fallbacks, and provider acknowledgements awaiting evidence.
6. **Document desk:** uploads awaiting scan/review, requests due, failed uploads/orphan reconciliation, unreadable/expired files, extraction awaiting candidate confirmation, sensitive conflicts awaiting authorised review, and storage capacity.
7. **Finance desk:** PayFast ITN reconciliation, unmatched/duplicate/replayed events, pending orders, refunds awaiting human review, charge/amount mismatches, failed receipts, package activation mismatches. Browser return/cancel URLs never prove payment.
8. **Communications desk:** failed/queued email, urgent-only WhatsApp escalation, SMS backup events, consent/quiet-hour suppression, retries/dead letters, and candidates with no successful delivery.
9. **Capacity and staffing:** active count against 500, pressure bands, queue concurrency, operator backlog, unresolved incidents, and whether a proposed growth gate is evidence-ready. Never automatically raise cap.
10. **Commander decision docket:** each item has severity, cause, evidence, impact, recommended action, required approval, owner, rollback/fallback, and deadline. Read-only items do not require approval; sensitive state changes do.
11. **Approve or defer:** Commander can inspect, prioritize, pause, resume, approve, reject, escalate, request MAP/Phoenix fallback, and request document/source/finance/comms review. State-moving commands go through governance and orchestrator, never directly from a UI panel.
12. **Morning plan:** top three to five critical outcomes, work queued to approved workers, explicit manual tasks, expected checkpoints, and next brief time. Do not claim completion until result evidence arrives.

### Midday / evening / incident briefs
- **Midday:** progress against morning decisions, queue aging, missed deadlines, candidate communication failures, document and payment exceptions, capacity drift.
- **Evening closeout:** completed vs incomplete work, evidence refs, open risks, overnight-safe tasks, tasks explicitly paused, and morning watchlist.
- **Incident:** trigger immediately for auth/RLS leak, private-document exposure, payment integrity failure, cap breach, data loss, repeated provider failures, or dangerous workflow behaviour. Contain, preserve evidence, notify authorised people, define owner and fix path; do not hide the incident in the next digest.
- **Weekly/monthly:** outcomes and quality, route/source coverage, refunds/finance reconciliation, capacity trends, incidents, support workload, provider spend/cost controls, growth readiness, and policy changes.

## 5. Day and night operations — human boundaries remain real

### Daytime (candidate and operator hours)
- onboarding, identity resolution, profile corrections, candidate consent, route matching and eligibility review;
- source verification, application planning, document upload/review, application workbench, MAP/manual submissions;
- candidate communications and support, employer/provider follow-ups where authorised;
- payment/order support, refund review, finance reconciliation;
- partner/provider coordination, privacy/compliance review, incident handling;
- Founder decisions, capacity monitoring, quality sampling, evidence capture.

### Night / after-hours (approved unattended work only)
- scheduled refresh of approved public source pages and opportunity metadata, with provenance and change diff;
- queue reconciliation, idempotent retries, dead-letter classification, stale-lock cleanup, worker heartbeat checks;
- matching suggestions and candidate-specific reminders only where consent, quiet-hour and purpose rules allow;
- PayFast ITN reconciliation and duplicate/replay detection (never AI refund decisions);
- backup verification, health checks, storage reconciliation, cost/capacity checks and incident alerts;
- prepare next morning's brief and ranked command docket.

**Must remain human/approval-bound:** identity merge, sensitive profile correction, fraud/privacy decision, refund approval, official application submission, external message campaign, consent override, retention/deletion exception, cap increase, production deploy, or any irreversible state change. Exact quiet hours and schedule come from approved config; no fabricated clock schedule. Email is primary, WhatsApp urgent-only, SMS backup-only.

## 6. Kingsmen system/tool inventory — what “all of Kingsmen” means

### N00–N20 operating architecture
- **N00:** constitution, doctrine, laws, Commander decisions.
- **N01:** monorepo/runtime foundation, Oracle Lite deployment discipline and environment.
- **N02:** backend API kernel, command/state machine, idempotency, policy gates.
- **N03:** PostgreSQL Truth Vault, persistence, read models, evidence and audit.
- **N04:** candidate core, authentication, identity linkage, profile and correction review.
- **N05:** private Document Vault, requests, storage, extraction, verification and retention.
- **N06:** Route Universe and Application Workbench.
- **N07:** Airtable sync/mirror only.
- **N08:** Control Plane and read models/command surfaces.
- **N09:** notifications/communications.
- **N10:** packages, orders, invoices, PayFast ITN, payments, refunds and ledger.
- **N11:** AI decision support; recommendations do not replace authorised human decisions.
- **N12:** governance, approval, risk, compliance and tribunal/review boundaries.
- **N13:** observability, health, queues, reports, incidents, backup/capacity evidence.
- **N14:** provider and workflow integration adapters.
- **N15:** opportunity engine, source intelligence, freshness and matching.
- **N16:** orchestrator/execution runtime; worker actions and recovery.
- **N17:** Founder Command Ops, mobile cockpit, briefs, watchlist, escalations and decisions.
- **N18:** public website / Route House front door.
- **N19:** candidate mobile/PWA and public-to-portal continuity.
- **N20:** final integration, system lock, production readiness and release evidence.

### Agents, robots, tools, apps, providers
The locked Jarvis product spec records an inventory baseline of **254 agents, 52 robots, 983 tools and 90 apps**. Treat these as repository inventory counts at the time of that spec, not as live-connected counts. Every inventory entry must show purpose, owning module, allowed actions, risk/trust level, adapter, credential boundary, last runtime proof, current state, and fallback.

The locked provider list includes GitHub, Netlify, Google Drive, Gmail, Google Calendar, Airtable, Neon, Supabase, Canva, PayFast, OpenAI, AI Wisebase, B12, Norton, Replit, Catalyst, Lovable, Namecheap, Softonic, Vivin, Voice Generator, OpenClaw, Playwright, and Oracle Lite. Additional tools include PostgreSQL/Truth Vault, approved web/live research, OpenClaw command gateway, Playwright Scout, n8n/worker adapters, PowerShell Creator, and the provider connectors declared in repo manifests.

The current repo provider matrix labels many as `FOUND_NEEDS_RUNTIME_PROOF` and others as `REFERENCED_ONLY`. Do not claim connected/live merely because the name, key reference, UI tile, or manifest exists. Provider state vocabulary should distinguish not found, referenced only, adapter found/needs proof, runtime verified, blocked/missing credentials, disabled.

### Locked control rules
- PostgreSQL is the internal Truth Vault; Airtable is a mirror.
- n8n is a thin worker: it reports results to the backend and does not own core state.
- OpenClaw is a governed command gateway, not final truth and not an unbounded shell.
- Playwright is scout/probe only; no CAPTCHA/OTP bypass or fake submission.
- Email primary; WhatsApp urgent-only; SMS backup-only.
- Founder Control Plane is not a second backend; reads use N08 models, reports N13, risky state changes N12, execution N16.
- No silent override, no command without trace/evidence, no false production/payment/submission claims.
- Jarvis is Commander-only, not a public candidate chatbot.
- No useless architecture layers: new components must map to a module, state ownership, proof, and removal/rollback path.

## 7. Pricing and package integrity — no fabricated catalogue

Repository-visible examples (not the complete Commander-approved price list):
- `FREE_DESTINY_MAP`: R0 preview, 0 managed applications; all-sector preview, detailed target intelligence stays sealed until an appropriate package is activated.
- `CV_REVAMP`: R49.99; 15 truthful personalised CV versions and 15 matching motivation letters. Never invent experience, qualifications, references, certificates or skills.
- `ACCOMMODATION_SUPPORT`: R179.00; standalone support for 8 accommodation applications/routes; code also states paid packages include up to 8 ACC-01 accommodation routes.

These entries are not proof of the full catalogue or the user's complete pricing. Before publishing or charging, reconcile historical Commander-approved catalogue and every code/data surface: pricing codex, API package catalog, public website cards, database seed and runtime catalog, checkout/order snapshot, package entitlements, usage counters, refunds/cancellations, and finance reporting. For every package record: canonical key/name, amount/currency, tax treatment if applicable, entitlement quantities, included/excluded work, application/route limits, monitoring/priority, validity/expiry, activation conditions, refund/cancellation policy, version, approval source, effective date, and test coverage. On conflict, stop paid checkout and flag reconciliation; do not guess a price or silently use the nearest value.

## 8. Realistic implementation plan and proof gates

### P0 — truth audit and repository reconciliation
- Inventory all routes/pages, API endpoints, migrations, seeds, runtime configs, package catalogs, provider adapters, worker workflows, and reports.
- Mark each capability doctrine-only / UI-only / API-only / persistence-present-but-unapplied / provider-referenced / runtime-proven / blocked.
- Recover all approved pricing, cap-phase decisions, day/night schedule/quiet hours, document requirements, route rules, and Commander corrections from repository history, issues, PRs, and approved records.
- Link each requirement to source file and tests. Do not fill unknown values with guesses.

### P1 — secure candidate journey
- prove auth/email confirmation, identity link/review, profile correction workflow, consent, candidate-scoped read/write and RLS;
- run browser E2E for register → confirm → sign in → candidate profile → route discovery → save route → application record → document request → status page;
- test cross-candidate isolation and ambiguous identity.

### P2 — private document bytes, not just metadata
- configure private storage and server upload intent; wire size/MIME/signature checks, scan/quarantine, metadata, application links, extraction confirmation, review, signed download, retention and audit;
- apply migrations to staging, test backup/restore and unauthorized access; keep UI honest when storage is not configured.

### P3 — route and application reality
- seed verified source registry and route catalogue; implement source freshness, eligibility evidence, deadlines/fees, application state machine, MAP, blockers, official-reference evidence and manual fallback;
- test each of the six main pathway families and connected funding/accommodation/transport services separately.

### P4 — packages and finance
- reconcile complete package catalogue and checkout entitlements; sandbox-test PayFast success/cancel/return/failure, ITN signature/amount/source/idempotency/replay, activation, refund review and finance ledger;
- no live charging before provider evidence and founder approval.

### P5 — day/night workers and Founder cockpit
- wire schedules from approved config, worker heartbeats, retry/dead-letter handling, source refresh, notification consent/quiet hours, backup and reconciliation tasks;
- generate and deliver real morning/midday/evening/incident/weekly/monthly briefs from live read models, not static seeded cards;
- prove every card drills to source record/evidence and every command uses N12/N16 boundaries.

### P6 — cap enforcement and growth gate
- enforce 500 transactionally in DB and API; test concurrent activation at 499/500/501 and idempotent retries;
- surface 1,000-ready and 5,000-preparation targets as readiness stages, never automatic cap changes;
- build evidence-gated Commander approval and rollback.

### P7 — provider/tool mesh and release proof
- inventory all agents/robots/tools/apps and verify each adapter separately;
- repair CI/lockfile and apply migrations on staging; prove web/API/DB/RLS/provider boundaries, backup restore, incident response, cost controls, accessibility/mobile flows, and end-to-end candidate tasks;
- only then proceed to private beta, paid pilot, and public launch in order. Control Plane/Jarvis must reflect real state and must not conceal upstream blockers.

## 9. Release acceptance checklist

A feature is “operational” only when all applicable checks are true:
- [ ] candidate can use it in the actual browser UI;
- [ ] API authorises the actor and validates inputs;
- [ ] PostgreSQL is the authoritative persisted state;
- [ ] private object bytes are stored in the configured private provider when applicable;
- [ ] RLS/owner scoping and operator permissions are tested;
- [ ] audit/evidence events are persisted;
- [ ] retries/idempotency/failure states are tested;
- [ ] notification/consent/quiet-hour behaviour is proven where applicable;
- [ ] live provider sandbox/runtime proof exists where applicable;
- [ ] staging browser E2E and migration evidence are attached;
- [ ] Founder cockpit shows actual status and drill-down evidence;
- [ ] missing proof is labelled blocked/proof-needed, not green;
- [ ] no false claim of official submission, acceptance, payment, or production readiness.

## 10. Source anchors already located in the repository

- `docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md` — phases 0–16; document, route, finance, founder and launch plan.
- `docs/jarvis/JARVIS_LOCKED_PRODUCT_SPEC.md` — visual lock, agent/robot/tool/app inventory baseline, provider list and proof-state rules.
- `docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md` — command classification, Personal Desk, Live Intelligence, OpenClaw, Playwright Scout, backend authority.
- `docs/jarvis/perfect-rebuild/NUMBER_07_JARVIS_MUST_KNOW_KINGSMEN_INTERNAL_KNOWLEDGE_AND_DOCTRINE.md` — national route scope and locked doctrine.
- `reports/n05/N05_DOCUMENT_VAULT_REPORT.md` — N05 files and current document-vault foundation.
- `reports/n17/N17_FOUNDER_COMMAND_OPS_RUNTIME_REPORT.md` and `db/migrations/0015_n17_founder_command_ops.sql` — Founder briefs, mobile cockpit, decisions and escalation tables.
- `apps/api/src/observability/capacity-monitor.ts` — pressure thresholds and cap snapshot.
- `scripts/validators/validate-oracle-bootstrap.mjs` and `scripts/oracle/Prepare-OracleVmBootstrapPlan.ps1` — 500 active / 1,000 ready / 5,000 preparation settings, low concurrency and worker defaults.
- `docs/api/KINGSMEN_TRUTH_VAULT_PERSISTENCE.md` — API persistence modes and remaining staging/RLS/payment/backup blockers.
- `docs/finance/KINGSMEN_PAYMENT_PROOF.md` — PayFast ITN evidence and sandbox requirements.
- `db/seeds/n18_public_website_seed.sql`, `apps/web/src/public-site/PricingBoundaryPanel.tsx`, `apps/api/src/public-website/package-boundaries.ts` — public product/pricing boundaries to reconcile.
- `reports/jarvis/JARVIS_PROVIDER_CONNECTION_MATRIX_LATEST.md` — provider states are repo evidence, not proof of live connection.

## 11. Final operating law

Build for the real day: a real person registers, confirms identity, gives consent, uploads a private document for a named reason, sees it stored and reviewed, selects a specific route, tracks a specific application, receives accurate communication, and sees an evidenced outcome. At the same time, the Founder wakes to a truthful operational brief, handles the highest-risk decisions, and can see what the workers did overnight.

If the code cannot identify **who did what, when, why, against which candidate/route/document, where the bytes/state live, what evidence proves it, what failed, and who must act next**, the workflow is not finished.


## 12. Additional source recovery — pricing, application constraints, and Founder clock

A second pass through `config/environment/.env.template` found additional package values and operating constraints that were missing from the first summary. These are **repository-recorded configuration values**, not yet independently reconciled against every Commander-approved pricing record, production catalogue, checkout and finance path. Preserve them for reconciliation; do not silently publish/charge from the environment template alone.

| Environment key | Recorded value |
|---|---:|
| `KINGSMEN_FOUNDATIONAL_ACCORD_PRICE` | R169.99 |
| `KINGSMEN_COLLEGIATE_ORDINANCE_PRICE` | R299.99 |
| `KINGSMEN_CHANCELLORS_WRIT_PRICE` | R399.99 |
| `KINGSMEN_REGENCY_MANDATE_PRICE` | R469.99 |
| `KINGSMEN_ARTISAN_CHARTER_PRICE` | R149.99 |
| `KINGSMEN_GUILDMASTERS_CHARTER_PRICE` | R199.99 |
| `KINGSMEN_CV_REVAMP_PRICE` | R49.99 |
| `KINGSMEN_CV_REVAMP_UPGRADE_EXTRA_ROUTES` | 2 |
| `KINGSMEN_NSFA_FEE_TASKS_ALLOWED` | false |
| `KINGSMEN_CAO_PARENT_APPLICATION_MODEL` | true |
| `KINGSMEN_FAST_SUBMISSION_TARGET_MINUTES` | 60 |

The template also records:
- `KINGSMEN_TIMEZONE=Africa/Johannesburg`
- `FOUNDER_MORNING_DIGEST_HOUR=08`
- `FOUNDER_END_OF_DAY_CHECK_HOUR=18`
- `FOUNDER_ACTION_PACKETS_ENABLED=true`
- `FOUNDER_URGENT_ALERTS_ENABLED=true`
- `FOUNDER_STOP_SELLING_ALERTS_ENABLED=true`
- `KINGSMEN_STOP_SELLING_AT_CAP=true`
- `KINGSMEN_WORKER_CONCURRENCY=2`
- `KINGSMEN_PLAYWRIGHT_MAX_CONCURRENCY=1`
- `SUPABASE_STORAGE_BUCKET=kingsmen-documents`
- `SUPABASE_SIGNED_UPLOAD_TTL_SECONDS=900`
- `SUPABASE_RLS_REQUIRED=true`
- `SIGNED_UPLOADS_REQUIRED=true`
- `SERVICE_ROLE_BROWSER_EXPOSURE_ALLOWED=false`

Operational interpretation:
1. The configured morning digest target is 08:00 Africa/Johannesburg and the end-of-day check target is 18:00 Africa/Johannesburg. The scheduler must honour the configured timezone, detect late/missed runs, and record actual start/delivery timestamps; these settings do not prove the scheduler is deployed or delivering.
2. The 60-minute fast-submission value is a target, not a guarantee. Use it only for eligible work after source, documents, consent and provider availability are ready; never bypass OTP/CAPTCHA or official review to meet it.
3. NSFAS fee tasks are explicitly disabled in the template; never represent Kingsmen as paying official NSFAS fees or enable fee-related actions without a Commander-approved policy change.
4. The CAO parent-application model is a declared configuration constraint and must be reflected in candidate intake, consent/guardian requirements where applicable, application records and tests.
5. The Supabase bucket and signed-upload TTL are declared configuration, not proof that storage exists or is secure. The actual upload endpoint must enforce candidate ownership, private bucket policy, short-lived scoped upload, metadata persistence, MIME/signature and size checks, audit and application linkage.
6. Reconcile these keys with the package codex, public copy, database seeds/catalogues, checkout snapshots, entitlements and finance ledger before paid launch. Conflicts must block checkout rather than trigger an inferred price.
