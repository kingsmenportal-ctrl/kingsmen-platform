# Kingsmen Platform — Complete Logic, Feature, and Gap Inventory

**Status:** Detailed requirements and reconciliation supplement; not release approval  
**Repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Companion plan:** `docs/launch/KINGSMEN_MASTER_COMPLETION_PLAN.md` in PR #83  
**Primary rule:** No verified recovery path, no migrations.  
**Reality rule:** A documented requirement is not proof of implementation; a schema, mock, UI, or open PR is not proof of a working end-to-end feature.

## 1. Why this document exists

The master plan establishes architecture and phases. This supplement records the smaller operational rules that are commonly forgotten when a project is described only by its headline modules. It is a requirements inventory and gap checklist to reconcile against source code, migrations, the actual staging database, connected providers, browser UI, and runtime evidence.

Do not mark a row complete merely because a matching filename exists. Use four separate labels:

- **Source exists** — implementation is present in the inspected branch.
- **Integrated** — the UI, API, database, and any worker/provider call each other through the intended boundary.
- **Verified** — repeatable automated tests and/or staging evidence prove the behavior.
- **Operational** — monitoring, support, recovery, ownership, and runbooks exist.

The default branch, open pull requests, staging project, and local reports may differ. At the time of this inventory, substantial work is still in open PRs; the API documentation describes development-memory mode as a non-launch path; payment sandbox proof and backup/restore proof remain outstanding. Do not infer otherwise.

## 2. Product doctrine and business boundaries

Kingsmen is a South African candidate guidance, admissions/opportunities, application support, document/compliance, offers, finance, communications, reporting, and controlled-automation platform. It is not an institution, bursary funder, employer, regulator, payment processor, or guarantor of outcomes.

Permanent product rules:

1. **Guidance is not a guarantee.** Never promise admission, bursary funding, employment, visa approval, placement, or a deadline extension.
2. **Verified information must carry provenance.** Display source, last checked date, applicable intake/cycle, eligibility caveats, and a way to report stale or wrong information. Do not silently turn AI-generated text into a verified opportunity.
3. **Package intensity is not capability denial.** Any service/package tier may change human support, turnaround, or included work only according to explicit published terms. It must not secretly change factual guidance, safety, privacy, or access to a user's own records.
4. **Free Destiny Map entry remains useful.** Explain pathways and next steps before asking for unnecessary personal information. Do not force sensitive-document upload merely to browse general guidance.
5. **Candidate agency matters.** Explain why data is requested, what happens next, what remains incomplete, how to correct errors, and how to ask for human review.
6. **Human authority remains human.** High-impact eligibility, medical/compliance exceptions, selection, rejection, refunds, official submissions, and production-risk actions require the designated authorized person and an auditable reason.
7. **No fake integration.** Label mock, sandbox, disconnected, metadata-only, queued, and live states accurately.
8. **No hidden automation.** Tell users when an automated workflow is processing a request, what decisions it may make, and when human review is required.
9. **No duplicate work through retries.** Mutating actions must use stable idempotency keys and return the original result for an exact replay.
10. **Truth Vault wins.** The backend and PostgreSQL/Supabase state machine are authoritative; browser state, AI output, workflow messages, provider redirects, and local files are not the source of truth.

## 3. Roles, identity, and authority matrix

Implement and test each role server-side. A hidden button, URL secrecy, client-side role, email-domain check, or caller-supplied candidate ID is never authorization.

| Role | Intended scope | Explicit limits |
|---|---|---|
| Anonymous visitor | Public Destiny Map, public explanations, verified public opportunity listings | No private candidate data, internal reports, or sensitive eligibility inference |
| Candidate | Own profile, consent, applications, own documents, own KYC status, own offers/invoices/payments, own support and notifications | Cannot read or alter another candidate, approve own review, set paid status, change audit records, or assign self a role |
| Founder/authorized reviewer | Founder workbench, queues, review and selection decisions, offer issuance, exception review | Must be provisioned in trusted storage; sensitive actions need reason, evidence, and approval rules |
| Finance operator (if separately introduced) | Reconciliation and finance review limited to assigned permissions | Cannot alter candidate KYC/selection or grant founder privileges |
| Support operator (if separately introduced) | Support cases and minimum required profile context | No unrestricted medical, identity-document, finance, or audit access |
| Worker/service identity | Only the queue/table/function permissions needed for its job | No interactive login; no broad service-role use where a narrower capability is possible |
| Jarvis/AI agent | Read allowed evidence, propose action packets, call allowlisted tools within policy | Never self-grants authority or bypasses validators, founder approvals, RLS, rate limits, or launch gates |

**Required authorization tests:** unauthenticated request; candidate A reads candidate B; candidate submits candidate B's document/offer/KYC ID; candidate attempts founder endpoints; non-founder calls founder RPC; revoked founder; disabled account; expired session; wrong tenant/storage path; replayed approval; worker identity used as a browser identity.

## 4. Full candidate journey and state logic

Every state transition needs an owner, preconditions, allowed next states, immutable history, user-visible explanation, idempotency behavior, notification rule, timeout/escalation, and tests.

### 4.1 Discovery and Destiny Map
- Browse pathways: university, college, TVET, SETA/learnership, bursary/funding, employment, and managed support packages where applicable.
- Capture only information necessary for the requested result; show privacy notice before collecting personal data.
- Clearly separate public general guidance from personalized guidance and verified listings.
- A recommendation should include its reasons, assumptions, missing information, source/date, next action, and caveat that final decisions belong to the institution/funder/employer.
- Provide a “not relevant / incorrect / outdated” feedback route.
- No login required for basic public exploration unless there is a defined and justified product reason.

### 4.2 Account creation and access
- Email-first account identity; secure password or supported passwordless/auth-provider flow; verified email before sensitive workflow steps.
- Safe password reset, session expiry/revocation, logout, account recovery, duplicate-account handling, and account disable/deletion request.
- Never reveal whether a private email address exists in a reset response.
- Rate-limit login, OTP, reset, registration, document upload, and public intake endpoints.
- Keep authentication-provider identity separate from candidate business profile identity; link them through trusted server-side records.
- Candidate IDs are generated/derived by the backend, not accepted as proof of identity from request bodies.

### 4.3 Candidate profile and onboarding
- Capture name and contact details only as needed; validate and normalize inputs while preserving legitimate local names and phone formats.
- Record contact preferences, communication consent, privacy-notice version, terms version, and timestamp/source of each consent.
- Make optional fields visibly optional. Explain why each mandatory field is needed and which workflow depends on it.
- Save/resume drafts; show completion status and missing items; prevent duplicate submissions.
- Provide a correction path for mistaken name, email, phone, education, or document metadata.
- Track onboarding version so changed requirements can be explained rather than silently resetting candidates.

### 4.4 KYC and document intake
- Each document has owner, category, version, upload time, content type, byte size, checksum, storage key, scan status, reviewer state, rejection reason, retention deadline, and audit events.
- Private objects only; short-lived signed download URLs; no public buckets or permanent public links for identity, medical, financial, or education records.
- Enforce allowed file types, size limits, malware scanning/quarantine, filename normalization, content sniffing, checksum verification, and upload rate limits.
- Never trust extension or browser MIME type alone. Reject executable/active content and archive bombs; process documents in an isolated worker.
- KYC states must be explicit, e.g. not_started, pending, submitted, needs_correction, needs_review, approved, rejected, expired, withdrawn. Use only the canonical state list chosen in the schema.
- A candidate may submit only their own eligible record. Review decisions must capture reviewer, timestamp, reason code, human-readable note, evidence reference, and any expiry.
- Re-upload creates a new version; it must not silently overwrite the evidence that supported a prior decision.
- Medical or special-category data receives stricter access and minimization; do not expose raw documents to AI or general support by default.
- Explain rejection/correction reasons without exposing internal fraud heuristics or another person's information.

### 4.5 Opportunity and application management
- Each opportunity/application should identify the candidate, pathway, institution/employer/funder, cycle/intake, source, source URL/reference, last verification date, closing date/time/time zone, eligibility conditions, required documents, fee status, and current state.
- Prevent expired or unverified listings from appearing as current verified opportunities; show stale status rather than silently hiding uncertainty.
- Store eligibility inputs and rule/version used at the time of assessment so a later rule change does not rewrite history.
- A match score is guidance, not an admission/funding decision. Explain factors and missing data; avoid unsupported claims or opaque exclusion.
- Track application lifecycle separately from candidate lifecycle: draft, ready, review-required, approved-for-submission, submitted, acknowledgement-received, institution-pending, additional-info-required, outcome-received, withdrawn, expired, failed/blocked. Canonical states must be defined before implementation.
- External submission requires human approval when required, candidate consent, final preview, correct recipient, duplicate-submission prevention, timestamp, and receipt/evidence. Until integrated and proven, show “prepared for submission” rather than “submitted.”
- Capture receipt/reference number, source acknowledgement, error details, retry safety, and escalation if a provider is unavailable.
- Appeals/corrections and withdrawal must be defined for eligible workflows.

### 4.6 Founder review, compliance, and selection
- Queue items need priority, age, SLA, assigned reviewer, lock/claim behavior, required evidence, and escalation.
- Reviewers must see only the minimum data needed for that decision.
- Require structured decision code plus reason and optional supporting evidence; reject empty/ambiguous rationale where policy requires it.
- Distinguish “eligible for consideration,” “selected by Kingsmen,” “submitted to partner,” and “accepted by institution/funder/employer.”
- No automatic medical decision or final institutional decision by AI.
- Prevent self-approval, unauthorized role changes, duplicate decisions, stale-review overwrite, and conflicting concurrent decisions.
- Provide decision correction/supersession as a new audited event, not silent edits.
- Candidate-facing status must explain next steps and whether further action is needed without disclosing confidential internal notes.

### 4.7 Offers, agreements, and signatures
- Offer must reference candidate, offer version, package/terms version, expiry, price/currency if applicable, and stable idempotency key.
- Render the exact immutable offer/document that the candidate is accepting; store its SHA-256 hash.
- Record signer identity, explicit intent, method, timestamp, IP/device metadata only when justified, and document hash. Protect metadata as personal data.
- A database row recording signature metadata is not by itself proof that an e-signature complies with applicable law. Determine the required signature method and evidence with legal review.
- Replays of the same signing request return the same result; altered terms/hash under the same key must conflict.
- Expired, withdrawn, superseded, already accepted, or revoked offers cannot be signed.
- Provide downloadable copy and clear support path.

### 4.8 Invoices, payments, refunds, and ledger
- All money values are integer minor units (cents); currency is explicit and validated. Do not use floating point for settlement math.
- Invoice line totals must reconcile to invoice total; negative/zero amounts are allowed only where explicit business rules permit them.
- Define invoice states and allowed transitions; issue dates, due dates, void reasons, tax treatment, credit notes, and receipts must be explicit.
- Provider checkout/return/cancel pages are navigation, not payment proof.
- Verify PayFast ITN signature and configured provider source, merchant/environment, exact amount and currency, payment status, invoice/order association, and idempotency/replay state. Never trust caller-supplied “paid”.
- Persist raw provider evidence only with controlled access, redaction, and retention; preserve normalized verification outcome and correlation IDs.
- Use atomic transactions for payment ledger entries and invoice/order/package activation. Repeated ITNs must not duplicate payments, ledger entries, notifications, or activations.
- Separate pending, verified, failed, reversed, refunded, chargeback/disputed states; define reconciliation of delayed/out-of-order events.
- Refund requests require reason, amount, linked original payment, duplicate detection, reviewer/approval, provider outcome, ledger reversal, and candidate communication. AI cannot approve refunds.
- Daily/periodic reconciliation compares provider records with Kingsmen ledger and reports unmatched, duplicate, late, and amount-mismatched records.
- Sandbox proof is required before any live payment; live credentials and secrets must never enter Git, logs, screenshots, or evidence artifacts.

### 4.9 Notifications and communications
- Email is primary; WhatsApp is urgent-only; SMS is backup-only, according to project doctrine.
- Each template has purpose, channel, language, approved content/version, sender identity, consent/legal basis, and classification.
- Use transactional outbox/queue, stable idempotency keys, delivery attempts, provider message IDs, timestamps, error categories, retry/backoff, dead-letter handling, and manual replay controls.
- Avoid sending duplicates when a worker retries or when a state change is replayed.
- Respect unsubscribe and channel preference for non-essential messages; transactional/legal messages must follow the approved lawful basis and policy.
- Do not put identity numbers, medical details, passwords, OTPs, payment secrets, or full documents in message bodies.
- WhatsApp must not become a bulk-reminder channel. Do not claim a message was delivered merely because it was queued.
- Provide candidate-visible notification history where appropriate and founder operational queue metrics.
- Email/WhatsApp integrations remain unproven until provider credentials, delivery webhooks, opt-out handling, retries, and staging evidence are verified.

### 4.10 Support, complaints, corrections, and appeals
- Support case includes owner, category, severity, status, assignee, timestamps, linked candidate, allowed attachments, SLA, and audit trail.
- Candidate can see only their own case and permitted replies/attachments.
- Define escalation for account takeover, data leak, wrong payment, missed deadline, document loss, harassment, and disputed decision.
- Sensitive internal notes must be separate from candidate-visible conversation.
- Record complaints and corrections; avoid requiring candidates to re-send documents that are already safely stored unless necessary.
- Provide a privacy/data-rights contact and a process for access, correction, objection, deletion/retention exceptions, and complaint handling.

### 4.11 Progress and performance
- Progress is derived from authoritative events, not a manually editable “success score.”
- Show completed steps, blocked steps, waiting party, next action, last update, and expected/unknown wait times.
- Separate activity metrics from outcomes; do not claim employment/admission success without evidence.
- Any score or ranking must be explainable, tested for bias, versioned, and reviewable by a human.
- Candidates need correction/appeal route for inaccurate derived data.

## 5. Founder command centre: required operational details

The founder workspace should include the following coherent surfaces, not merely isolated endpoints:

1. **Overview:** candidate funnel, queue ageing, SLA breaches, integration health, failed jobs, finance reconciliation, security alerts, and release gate status.
2. **Candidate search:** authorized filters, pagination, minimal result fields, audit logging for sensitive lookups, rate limits, and no unrestricted export by default.
3. **Review queues:** KYC, document corrections, compliance/medical, application readiness, selection, support, refunds, and exception cases.
4. **Candidate timeline:** immutable chronological events with source, actor, timestamp, correlation ID, and redacted details.
5. **Application workbench:** eligibility assumptions, source freshness, required evidence, review decisions, submission status, receipts, and next action.
6. **Offer desk:** draft/preview/issue/expire/revoke/version/accept, idempotency, document hash, and legal-status warning where signature is only metadata.
7. **Finance desk:** invoices, line items, payment events, ledger, provider reconciliation, refunds, disputes, credits, and exception approvals.
8. **Communications desk:** templates, consent/preferences, queue state, provider delivery evidence, retry/dead-letter, and campaign approvals.
9. **Reports and exports:** request, authorization, purpose, filters, data minimization, snapshot time, expiry, download audit, redaction, and deletion after retention period.
10. **Support desk:** cases, SLA, internal/private notes, escalation, and candidate-visible replies.
11. **Provider registry:** provider, environment, owner, required configuration presence (never secret value), health, sandbox evidence, webhook status, limits, and kill switch.
12. **Jarvis command panel:** evidence-backed status, planned action, required approvals, dry-run preview, validator result, execution receipt, rollback/recovery path, and audit event.
13. **Access administration:** role provisioning/removal, MFA policy, session revocation, privileged-action review, and audit of access changes.
14. **Incident/release panel:** open incidents, current deployment, migration version, backup proof, recovery runbook, feature flags, and launch gate.

All privileged screens must enforce permissions in the backend. Search/export/download are themselves sensitive actions and need logging, not only writes.

## 6. Jarvis, agents, workflows, and tool execution

Jarvis is a controlled command and evidence layer, not the database, business state machine, or unrestricted autonomous operator.

### 6.1 Required command lifecycle
1. Receive command and authenticate actor.
2. Normalize command type and validate payload against a versioned schema.
3. Assign command ID, idempotency key, correlation/trace ID, and timestamp.
4. Classify risk, data sensitivity, environment, required authority, and allowed tools.
5. Evaluate mode/channel/tool/authority policy.
6. Return blocked, dry-run, approval-required, or allowed plan explicitly.
7. For allowed execution, call a narrowly scoped tool/worker; never pass arbitrary shell commands or untrusted instructions directly.
8. Validate tool output and compare expected postconditions.
9. Persist command, policy decision, approval, tool receipt, result, and evidence.
10. Verify outcome independently; report partial failure truthfully.
11. Require explicit founder approval before production-risk actions and re-check approval at execution time.
12. Provide idempotent retry, timeout/cancel behavior, and compensating/rollback instructions.

### 6.2 Agent boundaries
- Founder Command Agent: status, evidence, action packets, approved allowlisted actions.
- Doctrine Guardian: checks doctrine and forbidden patterns.
- Provider Gate Agent: classifies disconnected/mock/sandbox-proven/controlled-live/blocked states.
- Proof Honesty Agent: rejects readiness claims without linked evidence.
- Oracle Lite Agent: cost-aware checks and action proposals only; no paid-resource creation or deployment without approval.
- Candidate Safety Agent: factuality, privacy, consent, non-guarantee language, stale-source detection.
- Finance Guard Agent: payment evidence, ledger consistency, refund approvals.
- Communications Guard Agent: channel policy, consent, rate limits, duplicate prevention.
- Additional agents must be registered, versioned, assigned least-privilege tools, and tested against prompt injection and privilege escalation before being enabled.

### 6.3 Workflow/worker rules
- n8n or another workflow engine is a worker/orchestrator, not the source of truth.
- Every job has schema version, job ID, correlation ID, idempotency key, attempts, deadline, lease/claim state, result, and error classification.
- Validate inbound webhook signatures or shared-secret/HMAC according to provider capability; use replay windows where appropriate.
- Workers must tolerate duplicate delivery, delayed events, partial outages, and poison messages.
- Use bounded retries with exponential backoff and jitter; send exhausted jobs to a dead-letter queue and alert an operator.
- Worker result intake must authenticate the worker, validate the state transition, and reject results that do not match current workflow/version.
- Never allow an arbitrary worker result to directly mark an application submitted, invoice paid, KYC approved, or production deployed without independent evidence.

## 7. Data model and persistence inventory

The following entities or equivalent normalized records must exist in the canonical model. Names may differ, but semantics must be preserved and mapped.

### Identity and consent
- auth identity mapping; candidate profile; candidate status; contact preferences; consent records; privacy notice/terms versions; role assignments; reviewer identity; session/access events.
- Consent is purpose- and channel-specific, versioned, timestamped, and revocable where applicable.

### Opportunity and application
- opportunity/source/provider; source verification history; institution/employer/funder; intake/cycle; eligibility rules/version; candidate eligibility assessment; application; required checklist; application event history; external submission attempt; receipt/acknowledgement; decision/outcome; correction/appeal.

### Documents and compliance
- document metadata/version; private object key; checksum; scan/quarantine status; document category; access/download event; KYC case/state; review decision; compliance/medical case with restricted access; retention schedule and deletion/hold record.

### Offers and contracts
- offer; offer version/terms snapshot; expiry/revocation; signature evidence; document hash; acceptance event; terms/legal review version.

### Finance
- package/plan catalog and version; order; invoice and line items; payment intent; provider ITN receipt and verification result; payment; ledger entry; refund request/approval/provider outcome; credit/reversal/dispute; reconciliation run and exception.

### Communications and support
- notification outbox; approved template/version; provider message ID; delivery attempt/status; consent/preferences; support case; message/reply; internal note; escalation and SLA event.

### Audit, workflow, and reporting
- append-only audit event; actor/authority; before/after reference or safe diff; reason; correlation ID; source; timestamp; workflow job/attempt/result; report/export request; immutable snapshot metadata; export expiry/download event; retention/deletion job; incident and release evidence.

### Data rules
- UUIDs or stable opaque IDs; explicit foreign keys; constraints for state and money; UTC timestamps with displayed timezone; normalized phone/email; no unnecessary copies of sensitive data.
- Define uniqueness/idempotency scope, soft-delete versus hard-delete semantics, retention legal holds, cascade behavior, and anonymization rules.
- Avoid storing the same truth independently in browser storage, workflow engine, and database.
- Migrations must be additive/compatible where possible, reviewed for lock time, backfill, rollback/forward-fix, grants, RLS, indexes, triggers, and actual existing objects.

## 8. API and integration contract checklist

Every endpoint should specify method/path, actor, request schema, response schema, state transitions, idempotency, rate limit, permission, data classification, error codes, audit events, and tests.

Minimum API families:
- health/readiness/version and dependency health;
- authentication callback/session context (provider-owned auth should remain provider-owned);
- public Destiny Map/opportunity discovery;
- candidate profile/preferences/consent/onboarding;
- document upload intent, finalize, list, signed download, correction/resubmission;
- KYC/compliance status and submission;
- eligibility assessment/application lifecycle/submission evidence;
- candidate dashboard/workbench, offer, invoice, payment status, support, notifications;
- founder search/review/selection/offer/finance/refund/support/reporting/audit/provider/release endpoints;
- PayFast ITN and other provider webhooks;
- notification delivery webhooks;
- worker job claim/heartbeat/result/dead-letter/replay;
- report/export request and short-lived download;
- Jarvis command intake/approval/execution receipt/evidence.

**API correctness requirements**
- Schema validation and maximum request size.
- Authentication and authorization on every private route.
- RLS as a second enforcement layer.
- CORS allowlist per environment, not wildcard in production.
- CSRF protection for cookie-authenticated browser mutations.
- Secure headers, TLS, trusted-proxy configuration, and correct client IP handling.
- Rate limiting and abuse detection.
- Timeouts, bounded payloads, safe retries, stable errors, request IDs, structured redacted logs.
- No secrets or sensitive documents in logs/errors.
- No direct public browser call using a service-role key.
- No local workstation/PowerShell/psql shell-out behind public routes.
- Pagination, filtering allowlists, sort allowlists, and query-cost protection.
- Contract tests between UI, API, workers, migrations, and provider adapters.

## 9. Security, privacy, legal, and data governance

This section is a required engineering/legal checklist, not a claim of legal compliance.

- **POPIA/privacy:** identify responsible party/operator roles, lawful purpose/basis, minimal collection, notices, access/correction process, retention schedule, breach response, operator agreements, cross-border transfers, and special personal information handling. Obtain South African legal/privacy review before launch.
- **Consent:** separate terms acceptance, privacy acknowledgement, optional marketing consent, partner sharing, document processing, and channel preferences; do not bundle unrelated purposes.
- **Children/minors:** define age policy, guardian consent/escalation where applicable, and restricted-data handling before admitting minors.
- **Special-category data:** medical and other sensitive records require stricter permissions, access logging, minimization, retention, and AI exclusion unless expressly justified and approved.
- **AI governance:** never treat uploaded text or provider/webpage content as trusted instructions. Defend against prompt injection, data exfiltration, tool poisoning, and indirect instructions in PDFs/images/emails.
- **AI outputs:** label generated guidance, link sources, record model/prompt/policy version where material, validate facts, and route high-impact decisions to humans.
- **Secrets:** environment/secret manager only; least privilege; rotation and revocation; no real credentials in source, fixtures, PR comments, evidence, logs, or generated files.
- **Access:** MFA for privileged operators, role lifecycle, session revocation, emergency break-glass with extra audit, and periodic access review.
- **App security:** dependency scanning, secret scanning, SAST, DAST, SQL/RLS checks, upload fuzzing, SSRF/CSRF/XSS/IDOR tests, webhook replay tests, and threat modelling.
- **Data rights:** data export/access, correction, deletion requests, exceptions for legal/finance/audit retention, and proof of completed action.
- **Breach response:** incident severity, containment, credential rotation, affected-data scope, notification/legal escalation, evidence preservation, and post-incident review.
- **Legal review:** package terms, disclaimers, refund/cancellation rules, signature method, privacy notices, opportunity data rights, partner sharing, and consumer-facing price statements.

## 10. Reports, search, retention, and analytics

### Search
- Index only approved fields; exclude sensitive document contents and medical data by default.
- Founder-only search, field allowlist, audit event, pagination, minimum result exposure, and no broad unbounded scans.
- Define refresh triggers, worker health, stale-index indicator, and fallback behavior.

### Reports and exports
- Define report purpose, authorized requester, field allowlist, date range, snapshot time, timezone, version, row count, checksum, expiry, and download audit.
- Large exports run asynchronously. Validate filters and escape spreadsheet formula-leading cells to prevent CSV injection.
- Private export storage, short-lived signed URL, no permanent public links, expiry and deletion worker.
- A report request or snapshot metadata row alone is not a generated report; prove worker execution and downloadable output.

### Retention and deletion
- Per-category schedule for identity docs, medical data, support attachments, communications, audit, finance records, logs, exports, and backups.
- Legal hold and active-dispute exceptions; approved deletion request; idempotent worker; deletion verification; immutable evidence that avoids retaining deleted content itself.
- Object storage lifecycle must delete the object, not merely update database metadata. Reconcile orphaned objects and orphaned metadata.
- Define backups' retention and expiry; deletion requests must explain backup propagation limits.

### Analytics
- Define operational KPIs and calculation versions: intake conversion, onboarding completion, review age, submission success, provider failures, payment reconciliation, support SLA, notification delivery, and verified outcomes.
- Avoid misleading success metrics, double counting, or outcome attribution unsupported by evidence.
- Restrict row-level analytics and exports; aggregate where possible.

## 11. Reliability, observability, recovery, and operations

- Separate liveness from readiness. Liveness says process runs; readiness checks required dependencies/configuration without leaking secrets.
- Correlation IDs across web request, API, DB transaction, queue job, provider callback, notification, and audit event.
- Structured logs with redaction; metrics and alerts for error rate, latency, queue age, retries, dead letters, DB saturation, webhook failures, payment mismatch, storage/scanning failures, and auth abuse.
- Define SLOs/SLAs and incident severity only after realistic service capacity is known.
- Document deploy, rollback/forward-fix, migration, provider outage, key rotation, backup restore, and incident runbooks.
- Establish backup schedule, retention, encryption, checksum, restore cadence, RPO/RTO targets, isolated restore tests, schema/data verification, and signed-off evidence.
- Recovery gate: timestamped logical backup; byte size; SHA-256; restore into isolated database; schema and key row/count/constraint verification; migration history comparison; application smoke tests; evidence location; reviewer sign-off. **Until all are complete, no migration.**
- Staging must use synthetic test data and isolated credentials. Never seed production candidate PII into test fixtures.
- Deployment must be reproducible from lockfiles, pinned runtime/build versions, validated environment variables, least-privilege deploy identity, health checks, and post-deploy smoke tests.
- Feature flags/kill switches for payments, outbound communications, external submissions, exports, and agent execution.
- Define support ownership, on-call/incident contact, business-hours coverage, escalation paths, and maintenance notices.

## 12. Frontend experience and accessibility

- Public, candidate, founder, and command surfaces have clear separation; responsive layouts and consistent status vocabulary.
- Every form has labels, inline validation, keyboard operation, accessible error announcement, focus management, and clear success/failure state.
- Meet WCAG 2.2 AA as a target; test keyboard-only, screen reader, zoom/reflow, contrast, reduced motion, and mobile touch targets.
- Support low bandwidth, resumable upload where justified, graceful retries, and no loss of draft data.
- Localize dates/time zones, ZAR formatting, phone formats, and language content; do not imply a translation has been legally reviewed when it has not.
- Never put sensitive data in query strings, browser analytics, client error trackers, or local storage without a reviewed reason.
- Show loading, empty, stale, offline, partial-failure, queued, pending-review, denied, expired, and retry states.
- Provide accessible confirmation before irreversible actions and display reference IDs after submissions/payments/support requests.

## 13. Testing and evidence matrix

Each critical flow requires unit, integration, RLS/security, end-to-end, negative, retry/idempotency, and staging evidence as applicable.

| Area | Minimum proof scenarios |
|---|---|
| Build/reproducibility | clean install from committed lockfiles; lint/typecheck/build; supported runtime version |
| Authentication | login/reset/expiry/revoke; rate limits; no account enumeration |
| Authorization/RLS | candidate A/B isolation; anonymous denied; founder-only RPC; storage object isolation |
| Candidate lifecycle | draft/resume; missing fields; duplicate request; state transition guard; correction path |
| Documents | wrong type/oversize/malware; private signed URL expiry; checksum; reupload version; unauthorized download |
| Opportunity truth | stale/expired listing; source citation/date; unsupported claims; eligibility versioning |
| Selection | null/invalid decision; unauthorized reviewer; concurrent conflicting decision; idempotent replay |
| Offers/signature | expired offer; changed terms/hash; wrong candidate; duplicate signature; audit event; legal evidence review |
| Finance | cents rounding; amount/currency mismatch; failed/cancelled/return; valid/invalid ITN; duplicate/replay; reversal/refund; atomic ledger |
| Notifications | consent/opt-out; retry duplicates; provider outage; dead letter; delivery webhook validation; redaction |
| Support/reporting | candidate case isolation; export permissions; CSV injection; signed URL expiry; retention deletion |
| Jarvis | blocked action; dry run; approval expiry; prompt injection; tool output validation; no secrets in evidence |
| Workers | duplicate/delayed job; poison message; lease expiry; stale workflow result; bounded retries |
| Operations | backup restore; migration rehearsal; rollback/forward-fix; alert test; provider kill switch |
| Accessibility | keyboard, screen reader, contrast, mobile/reflow, error/focus states |

Playwright must use synthetic accounts and synthetic documents only. A browser probe is not a substitute for database-level RLS checks, and a mocked provider is not real provider proof.

## 14. Provider and component status language

Every external capability must be one of:
- **Not configured**
- **Mock/local only**
- **Configured, not verified**
- **Sandbox tested**
- **Staging proven**
- **Controlled live**
- **Disabled/blocked**

Apply this to Supabase persistence, PayFast, email, WhatsApp, SMS, object storage, malware scanning, n8n/workers, report export, search indexing, external opportunity sources, external submissions, Oracle deployment, monitoring, and Jarvis tools. Each status requires an evidence link and last-verified timestamp.

Never say “connected” means “working”; “queued” means “sent”; “submitted” means “acknowledged”; “payment return” means “paid”; “schema exists” means “migration applied”; or “PR mergeable” means “tested.”

## 15. Missing/commonly forgotten build items to reconcile explicitly

These are mandatory checklist items until source and evidence prove otherwise:

1. Canonical state-machine registry and allowed transition tables for every workflow.
2. Single authoritative glossary for candidate/application/opportunity/order/invoice/payment/offer/selection/KYC statuses.
3. Data dictionary with field sensitivity, owner, retention, and source of truth.
4. Consent and privacy-notice versioning and proof of consent.
5. Candidate account recovery, session revocation, duplicate account handling, and account disable/deletion.
6. Document scanning/quarantine, private object lifecycle, signed URL expiry, checksum, and orphan reconciliation.
7. Opportunity provenance/freshness, cycle/intake, timezone/deadline, eligibility rule version, and stale-source handling.
8. External submission receipts and safe retry semantics; explicit “prepared” vs “submitted” state.
9. Human correction/appeal path for KYC, eligibility, selection, and derived data.
10. Reviewer assignment/locking, SLA, aging, escalation, and conflict handling.
11. Legally reviewed terms and e-signature evidence requirements.
12. Invoice lifecycle, tax/credit note rules, reconciliation, chargebacks/disputes, and refund approval.
13. Notification outbox, delivery webhooks, unsubscribe/preferences, dead letters, and duplicate prevention.
14. Worker authentication, job leases, schema version, retry budget, dead-letter/replay UI.
15. Search/report/export workers that produce actual results rather than metadata alone.
16. Retention/deletion worker that deletes storage objects and verifies outcome, not just metadata.
17. Founder role provisioning/revocation, MFA, access review, break-glass, and privileged action re-authentication.
18. Candidate-visible event timeline and accurate “who is waiting on whom” progress.
19. Support cases, complaints, data correction, privacy requests, and escalation playbooks.
20. Accessibility, low-bandwidth resilience, mobile/browser compatibility, and localization.
21. Observability, alerts, SLOs, incident runbooks, deployment rollback/forward-fix, and kill switches.
22. Dependency/security scanning, threat model, upload abuse tests, webhook replay tests, CSV injection tests, and prompt-injection tests.
23. Backup retention/restore cadence, RPO/RTO, isolated recovery drill, and signed-off evidence.
24. Staging synthetic-data policy, secret rotation, environment validation, and reproducible lockfiles.
25. Evidence registry linking each release claim to commit, test run, staging run, reviewer, timestamp, and artifact checksum.
26. Release checklist and go/no-go approval that cannot be overridden by AI or a single green unit-test job.
27. Operational ownership: who handles support, payments, provider outages, privacy incidents, and failed jobs.
28. Business continuity for provider outage, deadline-sensitive applications, payment callback delay, and document-storage outage.
29. Clear billing/package disclosure, cancellation/refund policy, support limits, and candidate-facing price/version record.
30. Data migration compatibility checks for every pre-existing table, trigger, function, index, grant, RLS policy, and storage bucket before a migration runs.

## 16. Definition of done for a component

A component is complete only when all applicable items below are true:

- Requirements and states documented; acceptance criteria agreed.
- UI uses the intended API; API uses authoritative persistence/provider adapter.
- Auth, authorization, RLS, and storage permissions tested positively and negatively.
- Inputs validated, errors stable and redacted, rate limits applied.
- Idempotency, concurrency, timeout, retry, and partial failure handled.
- Audit trail and correlation IDs recorded.
- Accessibility and user-visible states implemented.
- Unit/integration/E2E/security tests pass in a recorded run.
- Staging test proves the actual integration, not only a mock.
- Monitoring, runbook, owner, retention, and rollback/recovery defined.
- Feature flag/kill switch exists for high-risk functionality.
- Evidence linked from the completion tracker and release gate.

## 17. Order of completion and stop conditions

1. **Inventory and truth baseline:** reconcile main, every open PR, all migrations, manifest, tracker, UI routes, workflows, and staging schema. Identify duplicate/overlapping objects and conflicting status definitions.
2. **CI and reproducible build:** committed lockfiles, clean install, lint/typecheck/build, validators, unit tests, PR checks that actually run on the target branch.
3. **Recovery proof:** create and checksum logical backup, restore to isolated DB, verify schema/data, record sign-off. No migration before this step.
4. **Migration rehearsal:** apply all proposed migrations only to the isolated restored copy; inspect existing object conflicts, RLS, grants, functions, triggers, indexes, locking, idempotency, and rollback/forward-fix.
5. **Truth Vault:** implement and prove real persistent API mode, trusted identity mapping, canonical state machines, RLS, audit, storage.
6. **One end-to-end candidate slice:** public entry → candidate account → onboarding → private document/KYC → founder review → selection → offer → invoice → sandbox payment ITN → ledger → notification → candidate progress/support.
7. **Complete adjacent modules:** opportunities/submission receipts, reports/search workers, retention deletion, notification provider delivery, support, and performance views.
8. **Jarvis and agents:** adversarial tests, tool allowlists, approvals, evidence receipts, no prompt-injection privilege escalation.
9. **Operational readiness:** backups/restore drill, monitoring/alerts, incident runbooks, access review, privacy/legal review, deployment/rollback, feature flags.
10. **Release gate:** all mandatory checks green with staging evidence; founder reviews evidence pack and explicitly approves a bounded pilot. Public launch is a separate decision.

Stop conditions: unknown existing schema; unverified restore; conflicting migration ownership; failing RLS; missing trusted auth context; duplicate side effects; payment mismatch; secrets in evidence; no rollback/recovery plan; missing legal/privacy decision; provider claimed live without proof. Do not bypass a failing gate to make the dashboard green.

## 18. Current facts versus open questions

Known from repository documentation and prior PR inventory:
- Jarvis core contracts/policy/tool registry/evidence ledger/command runner and validators exist on main.
- Backend API shell exists; persistence mode and route behavior must be verified against current code/config.
- The deployable API documentation has historically shown wildcard CORS defaults and memory mode; these are not acceptable as production defaults without environment-specific correction and tests.
- Candidate KYC/compliance/selection, offers/notifications/audit, founder RBAC/retention, reporting/search/billing, and PayFast work is distributed across open PRs and has not been proven as a single applied staging system.
- A PayFast sandbox proof specification exists; that is not a real sandbox transaction.
- The backup/restore gate remains a hard blocker until evidence is supplied and reviewed.

Open questions to resolve from source and the founder's product/legal decisions:
- Exact package names, price/version, service boundaries, cancellation/refund terms, and support SLAs.
- Canonical candidate and application states and the exact six gates referenced in product doctrine.
- Exact institutions, opportunity sources, provider contracts, data refresh policy, and source licensing.
- Whether candidates include minors and the corresponding consent flow.
- Which external submissions may be automated and which always require human confirmation.
- Exact legal signature method and required proof.
- Data retention periods, lawful bases, cross-border providers, and incident notification process.
- Production hosting target, supported regions, backup RPO/RTO, availability goals, and operational owners.
- Exact launch cohort, pilot limits, founder acceptance criteria, and kill-switch authority.

These are not details to guess. Record decisions, owner, date, rationale, and version in the repository before implementing dependent behavior.

## 19. Evidence registry template

For every requirement, record:
- Requirement ID and component
- Status (not started / source exists / integrated / verified / operational / blocked)
- Source paths and commit SHA
- PR/issue
- Test command and exact run URL/result
- Staging environment and timestamp
- Synthetic test fixture identifier (no candidate PII)
- Evidence artifact path, checksum, and reviewer
- Known limitations, rollback plan, next owner/action

**Release decision:** No public launch, live payment, production migration, or broad candidate onboarding until all applicable safety, recovery, privacy/legal, security, integration, and operational gates are evidenced and approved.
