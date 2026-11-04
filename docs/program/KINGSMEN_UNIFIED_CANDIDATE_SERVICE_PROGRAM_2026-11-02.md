
# Kingsmen Unified Candidate Service Programme
**Programme date:** 2 November 2026  
**Scope:** Entire Kingsmen product, business operations, backend, provider network and deployment  
**State at registration:** Planned / reconciliation in progress. This document does not claim implementation, staging proof or production deployment.

## 1. Mandate — the candidate does everything in Kingsmen

Kingsmen is to be the single place where a candidate discovers, selects, prepares, completes, submits through supported Kingsmen-managed routes, monitors, responds to requests, receives reminders and manages outcomes for opportunities across all six pathways.

The candidate must not be sent to provider/official websites to repeat forms or manage applications. Provider URLs, credentials, API details and portal instructions are internal routing information for Kingsmen operations, not the normal candidate journey.

Preserve the approved doctrine: one candidate account, one reusable profile, one master application/service-execution workspace, and provider/programme choices as child records. One conditional master form reuses verified profile information and asks only additional questions required by selected child choices. Each provider/programme child can have its own deadline, requirements, dispatch, acknowledgement, decision and outcome. CAO remains one Kingsmen parent application with ordered programme-choice children.

Provider execution must comply with law, provider terms and technical controls. Use an authorised API/integration or an explicitly consented Kingsmen-managed human process. Never bypass CAPTCHA, MFA, OTP or access controls, store provider passwords, or invent a submission, receipt or result. When no authorised execution route exists, expose a clear blocked/manual exception inside Kingsmen and do not claim that submission occurred. Do not silently redirect the candidate.

## 2. System-wide scope

This programme covers the public website, authenticated candidate portal, six pathways, application engine, opportunity catalogue, provider/institution registry, Supabase schema and security, API and workers, document vault, identity review, notifications, email, finance and PayFast, package entitlements, accommodation/CV services, Jarvis, Founder Control Plane, support/case handling, Notion governance, GitHub CI/reviews, Netlify deploys, observability, privacy, legal/provider permissions and business operations. It is not a website-only redesign.

## 3. Target product capabilities

### Candidate identity and profile
- One secure account and immutable Auth UUID-to-candidate identity link.
- One reusable profile with progressive capture, field provenance, consent, versioned corrections and save/resume.
- Autosave, explicit save state, resumable sessions and reliable reload/re-login persistence.
- Profile completeness and document readiness checks with understandable missing-field explanations.
- Secure account recovery, session handling and candidate-controlled privacy/communication preferences.

### Opportunity intelligence across six pathways
- Higher Education; TVET; SETA programmes and learnerships; Internships; Apprenticeships; Employment.
- Related funding, bursaries, accommodation and other support routes visible within the same Kingsmen experience.
- Search/filter by pathway, provider, programme, province, municipality, qualification, skill, eligibility, deadline, cost and support need.
- Every candidate-facing open opportunity must have source authority, retrieval time, current deadline/time zone, eligibility evidence and freshness status.
- Separate directory presence, legal/accreditation status, provider connection, programme availability, eligibility, partnership, application route, receipt and decision. A source URL or directory record is not proof of an open opportunity or connected submission.

### Unified application and one master form
- Candidate selects multiple opportunities/programmes across all six pathways within one Kingsmen workspace.
- A versioned conditional form reuses profile answers/documents and displays only the extra fields required by selected programmes.
- Programme/provider child records preserve each selected route's requirements, answers, documents, deadline, validation and execution state.
- Save/resume, draft persistence, review/confirm, duplicate prevention, eligibility checks, fee/deadline warnings and idempotent submission.
- Partial success is supported: one provider failure must not corrupt successful child submissions or the master workspace.
- Candidate can edit answers, replace documents, respond to corrections and withdraw/close a child route where provider rules permit.
- CAO is one parent application with ordered child programme choices; do not create multiple CAO parent applications.

### Provider routing and execution
- Maintain a provider capability register: official source; authorised method; integration/API contract; named authority; granted scope; consent/terms; credentials storage; rate limits; sandbox/test route; expiry/revocation; evidence; support contact; retry/fallback.
- Use typed provider adapters for permitted search, programme details, form mapping, document transfer, submission, receipt, status polling/webhooks, follow-up and outcomes.
- Where APIs are unavailable, use MAP-first Kingsmen operator workflows and Phoenix fallback; candidate remains inside Kingsmen and receives all prompts/tasks there.
- Playwright remains probe/scout unless transactional automation is explicitly authorised by the provider. No control circumvention.
- No connector is labelled active/connected/submittable until a provider-specific runtime test and evidence bundle pass.

### Status, task management and communications
- Append-only application event ledger: status, source, actor, timestamp, reason, correlation/idempotency key and evidence.
- Candidate dashboard displays every selected route, current/last-verified status, pending action, deadline, interview/assessment, provider request, assigned owner and next step.
- Keep separate states for candidate intent, queued, dispatch attempted, Kingsmen submission evidence, provider acknowledgement, provider review, information request, interview/assessment, decision, candidate response and final closure.
- Status arrives from authorised provider APIs/webhooks, verified email sources or audited operator updates; every status retains provenance and freshness.
- Provide in-platform task/notification inbox and email reminders for confirmation, deadline, missing information, submission/receipt, interview/assessment, decision, follow-up and case updates.
- Durable outbox, consent/purpose checks, template versioning, idempotency, bounded retries, delivery evidence, dead-letter and controlled replay.
- Email is the enabled candidate communication channel. WhatsApp/SMS remain disabled. Every notification routes the candidate to the relevant Kingsmen screen, never an external application URL.

### Document Vault and identity review
- Private PDF/JPEG/PNG upload up to 10 MiB, MIME and file-signature validation, SHA-256, versioning, ownership checks and expiring signed links.
- Reusable document references with explicit purpose/consent and programme-specific checklists.
- Least-privilege reviewer queue, decision reasons, correction requests, re-upload, evidence and audit.
- Prove Candidate A/B isolation, reviewer authorization, link expiry and full audit history.

### Finance and fulfilment
- Preserve the canonical seven paid products, exact ZAR-cent prices, priority-application allowances, distinct concurrent managed-route/30-day capacity, accommodation rules and CV Revamp terms in the canonical pricing register.
- All packages can access all six pathways and the verified catalogue; package controls priority/service volume, not pathway visibility.
- Checkout creates order/invoice/payment intent; PayFast ITN must verify signature, merchant, amount/currency, reference and status. Duplicate events must be idempotent. Entitlement only activates after verified settlement.
- Candidate sees receipts, plan, remaining usage, accommodation services and application charges inside Kingsmen.
- Preserve immutable order-time pricing/entitlement snapshots. Reconcile finance_plan_catalog, service_packages, website cards and actual runtime before changes.

### Intelligence, Jarvis and Founder Control Plane
- Explainable eligibility/readiness, opportunity fit, document checks, deadline prioritisation, missing-requirement detection, alternatives and next-best-action.
- Smart autofill may use verified profile/document data but candidates confirm material extracted values; hard eligibility rules remain deterministic.
- AI is decision support only: no admissions, funding, employment, identity approval, payment/refund or production-release decisions.
- Jarvis is a first-class cross-platform operating intelligence layer, not a chat-only interface. It reads live evidence, detects stale/conflicting states, supports triage and drafts scoped actions.
- Read-only by default. Writes require typed proposals, risk/impact, before/after, evidence, idempotency, revalidation and policy-based human/Founder approval.
- Founder Control Plane provides aggregate queues, provider health, status exceptions, communication delivery, finance, capacity, incidents, audit and release evidence. Server-side role checks are mandatory.

## 4. Delivery workstreams

1. **Product contract and service design:** candidate/operator/reviewer/provider/founder journeys; common navigation, terminology and task model; mobile-first, low-data, accessible and resumable design.
2. **Identity/profile/consent:** authentication, immutable linking, profile CRUD, consent, recovery, field provenance, A/B isolation and reviewer RBAC.
3. **Catalogue and opportunity intelligence:** canonical provider/programme records, six-pathway taxonomy, official source ingestion, freshness, deadlines, fees, eligibility and candidate-safe search.
4. **Application engine:** parent/child model, single conditional form, multi-select, CAO choices, save/resume, validation, evidence, idempotency, retries and partial failure.
5. **Provider execution network:** authorization and capability inventory, adapter contract, one provider pilot, test route, actual submission and provider receipt proof, MAP/Phoenix human operations.
6. **Status and communications:** event timeline, dashboard/task inbox, provider status updates, email notification service, delivery evidence, reminder scheduling and candidate responses.
7. **Document and identity operations:** private upload/vault, review queue, corrections, signed-link expiry, audit and fraud/security controls.
8. **Commercial fulfilment:** canonical package parity, PayFast sandbox checkout/ITN, invoice/receipt, entitlements, usage, CV Revamp and accommodation.
9. **Intelligence and founder operations:** rules/AI assistance, Jarvis governance, command approvals, control-plane queues, incident and provider operations.
10. **Platform reliability/security:** POPIA, RLS/effective grants, secure secrets, migration provenance, protected backup/isolated restore, 500 active-candidate enforcement, observability, retries, DR, accessibility and performance.
11. **Release and deployment:** one authoritative release candidate, dependency-ordered PR stack, CI, independent review, staging E2E, exact-SHA deploy evidence, rollback, Founder approval and production handover.

## 5. Fast and efficient execution model

Deliver short end-to-end vertical slices; do not build disconnected modules or duplicate existing code.

- **Slice A — candidate foundation:** authenticated sign-in, reusable profile, consent, autosave/reload/re-login, private document flow and mobile shell.
- **Slice B — verified discovery:** searchable six-pathway catalogue, eligibility/deadline details and saved-opportunity basket with honest empty states.
- **Slice C — unified application:** one master workspace/form, conditional programme sections, child route records, CAO choices, validation, save/resume and candidate confirmation.
- **Slice D — provider pilot:** select a provider with documented authorization; test form mapping, file transfer, dispatch, receipt, retry, manual fallback and operator audit.
- **Slice E — status loop:** provider update ingestion, candidate timeline, task inbox, email reminders, corrections and candidate response.
- **Slice F — scale provider coverage:** add providers using the proven adapter and acceptance contract; feature-flag unproven routes.
- **Slice G — commercial and support:** sandbox settlement, plan capacity, fulfilment, accommodation, CV services and case escalation.
- **Slice H — Jarvis and control plane:** evidence-grounded intelligence, human approvals, queue/incident operations and founder reports.
- **Slice I — hardening and release:** security/load/accessibility testing, backup/restore, canary, exact-deploy proof and handover.

Parallel work only where modules/interfaces do not conflict. Database/domain changes are serialized through migration review. Stack PRs only with explicit base/head dependencies. Reconcile duplicates before new implementation. Use feature flags and rollback-safe changes to reduce release risk.

## 6. Existing Kingsmen execution anchors — reuse rather than duplicate

- GitHub #280 — master integration/release convergence.
- #258 — whole-Kingsmen gap and acceptance register.
- #212 — candidate experience vertical slice.
- #274 — shared application/CAO lifecycle.
- #275 — Document Vault and identity review.
- #266 and #249 — opportunity ingestion/freshness.
- #260 and #241 — provider/institution coverage and integration release gates.
- #269 — PayFast sandbox and verified entitlement.
- #270 — email outbox/retry/delivery.
- #264 and #283 — protected backup/restore and migration provenance.
- #265 — RLS, privileged functions and 500-candidate cap.
- #267 — exact Netlify deployment SHA and authenticated routes.
- #272 — Jarvis/Founder authorization and audit.
- Existing related PRs include #216, #282, #284, #285, #287, #288, #290 and #292. All were found open/unmerged in the current lookup; recheck live status, reviews and CI before relying on them.

## 7. Mandatory acceptance tests

- A candidate registers once; profile and consent persist after save, reload, sign-out and re-login.
- Candidate selects opportunities from all six pathways in one Kingsmen workspace and completes one conditional Kingsmen form without being sent to provider URLs.
- Each provider/programme child runs independently; errors, retries and partial successes preserve parent and sibling data.
- CAO is one parent with ordered programme choices.
- Candidate A cannot read/change Candidate B profile, documents, applications, messages, payments or status.
- Reviewer access is server-authorized and audited.
- Stale, expired, unverified or ineligible opportunities cannot be presented as verified/open.
- Submitted, provider-acknowledged, under-review, decision and outcome states require their respective evidence.
- Provider requests, candidate responses, reminders, correction uploads and decisions appear inside Kingsmen.
- Email sends are consent/purpose checked, idempotent and delivery-evidenced; WhatsApp/SMS stay off.
- Paid entitlements activate only after verified settlement; orders, invoices, receipts and usage agree.
- Jarvis cannot self-approve privileged writes or invent provider/finance/identity outcomes.
- CI, security, backup/restore, staging runtime, authenticated E2E, provider, payment and notification proof are tied to the exact candidate SHA.

## 8. Release gates and truthful state reporting

Track implementation, testing, security, deployment, end-to-end verification and evidence quality separately. A green CI check proves only that check. A merged PR is not proof of a working candidate journey. A deployed URL is not proof of commit parity or workflow correctness. No completion percentage without a defined denominator and verifiable evidence.

**Do not mutate staging** until migration ledger/live schema provenance is reconciled, a protected encrypted database plus private-Storage backup is produced, an isolated restore and parity check pass, and formal change control/independent review are recorded.

Production requires: one reviewed release SHA; required CI and branch protections; security/privacy gates; candidate A/B + reviewer runtime proof; verified provider route; PayFast sandbox settlement/ITN proof; email delivery proof; backup/restore and rollback proof; Netlify deploy ID + exact SHA + HTTPS route verification; redacted evidence; independent review; and explicit Founder release approval.

## 9. Observed baseline — 2 November 2026

- Supabase project euhubhhnumtibbyufghm (kingsmen-portal-staging) is listed ACTIVE_HEALTHY. This does not prove the candidate workflows are live.
- Read-only inventory shows foundations across candidate, application, document, source/provider, notifications, finance, orchestration and Founder domains. Several candidate/profile/document/new-opportunity/notification tables appeared empty in the snapshot; empty is not proof of working functionality.
- The snapshot included 2 candidates, 2 application rows, 21 opportunity source authorities, 3 legacy route providers and 8 legacy route programmes.
- PR #292 (draft persistence), #288 (eligibility/deadlines/receipts), #290 (provider connection lifecycle), #287 (plan capacity), #216 (candidate experience) and other dependent work remain open/unmerged in the current lookup.
- GitHub issue #280 and #258 are the master execution anchors; do not create a parallel master backlog.
- Migration provenance and backup/restore remain blockers to staging changes. PayFast is sandbox-only. Branch protection and exact Netlify deploy SHA require fresh proof.
- Candidate email is primary; WhatsApp/SMS remain disabled. MAP is primary managed fallback; Phoenix is fallback; Playwright remains probe/scout.

## 10. Immediate order of execution

1. Register this programme in the engineering command hierarchy and reference it from the approved unified-candidate decision and GitHub #280.
2. Reconcile all open PR bases/heads, dependency order, CI, reviews and the canonical release branch.
3. Resolve migration provenance, protected backup/isolated restore, RLS/privileged grants and database-enforced 500-candidate cap.
4. Prove candidate identity/profile/documents plus verified six-pathway discovery.
5. Prove one master form, child programme execution, CAO choices, status history and email reminders.
6. Prove one fully authorised provider route end-to-end before scaling the connector network.
7. Complete remaining provider coverage, payments/entitlements, Jarvis, Founder Control Plane, performance and operational readiness.
8. Deploy staging then production only after the exact-SHA release gates and Founder approval.

**Registration status:** programme specification recorded in the repository on a review branch. This is planning/governance registration only; it does not claim that the above implementations or deployments are complete.
