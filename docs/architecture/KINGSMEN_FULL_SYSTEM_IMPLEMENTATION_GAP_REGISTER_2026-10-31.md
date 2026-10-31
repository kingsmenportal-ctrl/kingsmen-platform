# Kingsmen Full-System Implementation Gap Register
**Created:** 2026-10-31  
**Status:** Execution baseline; release remains HOLD.  
**Purpose:** Turn the Kingsmen-wide operating doctrine into ordered implementation work with explicit evidence. This document is not proof that any capability is live.

## System boundary and single-source-of-truth rules
- GitHub: canonical code, migrations, PR review, CI, release artefacts and exact commit evidence.
- Supabase project `euhubhhnumtibbyufghm`: sole canonical runtime database, Auth, RLS, private Storage, Edge Functions and operational records.
- Netlify site `kingsmen-portal-staging`: deployed website. A release is valid only when deploy ID, URL and source SHA match the approved commit.
- Notion: doctrine, policy, operating procedures and decisions; it cannot override runtime evidence.
- Airtable: restricted operational mirror with stable source IDs, idempotent sync and reconciliation; never a second candidate/application/payment authority.
- Canva: approved/licensed design assets only.
- Lovable: optional UI accelerator; useful changes must return through reviewed GitHub changes.
- Replit: optional, not a dependency.
- Neon: intentionally not in architecture.
- PayFast: sandbox only until server-verified settlement and reconciliation tests pass.
- Email is the only active communications channel in current scope. WhatsApp and SMS remain disabled.

## Verified current gaps from the read-only 2026-10-31 audit
- Supabase reports ACTIVE_HEALTHY, PostgreSQL 17.11; migration ledger has 130 rows, latest `20261029193124`.
- The ledger contains duplicate-named candidate application preparation migration entries at versions `20261019112452` and `20261019112511`. Reconcile source provenance, dependency order and live effects; do not blindly replay.
- Queried counts: candidates 2; identity-review requests 0; identity-review evidence 0; source authorities 21; external source observations 0; opportunity providers 0; opportunity programmes 0; candidate opportunities 0.
- 17 RLS-enabled public tables have no policies: founder_reports, founder_report_sections, founder_command_catalog, founder_operator_profiles, founder_command_requests, founder_watchlist_items, founder_escalation_threads, founder_command_results, founder_daily_briefs, founder_decision_log, founder_mobile_cards, founder_ops_audit_events, founder_runtime_config, candidate_private_document_reviews, candidate_identity_review_requests, candidate_identity_review_evidence, candidate_identity_review_audit. Determine whether each is intentionally deny-all or missing policy; add only least-privilege policies backed by authenticated role tests.
- Review SECURITY DEFINER functions in context. CAO functions `list_candidate_cao_parents`, `get_candidate_cao_choices`, and `save_candidate_cao_choices` have authenticated execute grants and require ownership/authorization tests. Payment functions were found restricted to service_role/postgres in this audit; preserve that boundary.
- Leaked-password protection was reported disabled by the Supabase security advisor; enable after configuration/change review and verify.
- The active-candidate cap of 500 is not yet proven by boundary/concurrency evidence.
- Netlify site exists, but deploy metadata did not expose a verifiable deploy ID/source SHA. Netlify Forms were not enabled.
- Airtable contains multiple overlapping Kingsmen bases; map schemas, owners and source IDs before syncing or creating more bases.
- Lovable has a public temporary portal and separate unpublished Jarvis/command prototypes. They are not independent release authorities.
- No external legal registration, provider partnership, opportunity, payment settlement, backup restore, or full candidate journey should be marked complete without its own evidence.

## Implementation workstreams and acceptance gates

### W0 — Baseline and release convergence (BLOCKING)
- [ ] Inventory every open PR, base/head SHA, dependency, CI status, independent review and conflict.
- [ ] Reconcile institution/source/capability branches; merge only reviewed, non-conflicting work through existing protections.
- [ ] Reconcile migrations against source files and live ledger, including duplicate 0078 entries and 0096–0106 provenance/order.
- [ ] Produce an encrypted backup covering database and private Storage, restore into isolated staging, compare row/FK/object counts and access boundaries, record RPO/RTO and sign-off.
- **Accept:** signed dependency map; restore evidence; reviewed migration plan; no blind production/staging DDL.

### W1 — Security and access control (BLOCKING)
- [ ] Review the 17 RLS tables listed above; record intended reader/writer roles per table.
- [ ] Inspect function definitions and effective grants; remove public/authenticated execution only where least-privilege contract requires it; preserve service-role-only finance operations.
- [ ] Review storage policies, Auth identity linkage, secrets, default privileges, search_path hardening, rate limits, audit PII minimisation and webhook replay controls.
- [ ] Enable leaked-password protection and test signup/password flows.
- [ ] Implement and test server-side active-candidate cap at 499, 500, 501, reactivation and concurrent registration; reject the 501st active candidate atomically.
- **Accept:** independent review, positive/negative role tests, no cross-candidate access, cap boundary and concurrency test reports.

### W2 — Candidate identity, profile and Document Vault (BLOCKING)
- [ ] Auth UUID is the stable identity key; prohibit email-only identity linking.
- [ ] Candidate profile create/save/reload/update and consent history persist.
- [ ] Identity-review request, evidence, assignment, reviewer decision and audit persist.
- [ ] Private PDF/JPEG/PNG upload, 10 MiB limit, ownership, MIME/content validation, signed-link expiry, unauthorized denial and deletion/retention verified.
- [ ] Candidate A cannot read/change Candidate B profile, documents, applications, identity review or tracker.
- **Accept:** real authenticated two-candidate + least-privilege reviewer staging run with evidence IDs and exact environment.

### W3 — Shared service/application engine
- [ ] One application/service-execution parent model across higher education, TVET, SETA/learnership, apprenticeship, internship, employment, entrepreneurship, funding, creative/professional, accommodation, transport, health/care, legal and social/public services.
- [ ] Provider-specific form adapters do not create separate disconnected candidate accounts or trackers.
- [ ] CAO is one master application with ordered programme-choice child records.
- [ ] Persist preparation, consent, evidence, submission attempts, candidate-reported submission, provider-confirmed receipt and provider-confirmed outcome as distinct states.
- [ ] Never claim submission, receipt, admission, employment, grant or outcome without evidence.
- **Accept:** authenticated end-to-end candidate/reviewer workflow, reload persistence and isolation tests.

### W4 — National provider and opportunity network
- [ ] Finish DHET extraction against both complete official PDFs; validate identifiers, registration/legal status sections, duplicate identity, province/campus candidates, counts and provenance.
- [ ] Keep cancelled, lapsed, provisional and unresolved registrations distinct; unresolved records excluded from import.
- [ ] Canonicalise public/private HEIs, TVET, CET/community centres, private colleges, occupational providers, SETAs, employers, funders, enterprise-support organisations and other relevant service providers.
- [ ] Populate source observations and opportunity programmes from validated official sources, with retrieved-at timestamp, source evidence, eligibility, deadline/timezone, fees, required documents, official route, freshness and reviewer.
- [ ] A provider directory entry is not proof of a partnership; a source link is not proof an opportunity is open.
- **Accept:** import preview, idempotent import, count/provenance reconciliation, official-route probes and candidate-safe publication tests.

### W5 — Website and deployed product
- [ ] One responsive accessible app shell for public discovery, pathways, opportunity detail, account/profile, documents, applications/tracker, Jarvis, support, plans/checkout, reviewer and founder areas.
- [ ] Public pages distinguish verified/live, needs review, stale, planned and unavailable.
- [ ] Reconcile useful Lovable UI/code into the canonical GitHub repo; retire duplicate prototypes only after useful functions/assets are captured and reviewed.
- [ ] Verify auth redirects, deep links, error/empty/loading states, mobile layout, privacy and accessibility.
- [ ] Confirm Netlify production deploy ID, public URL, exact source SHA and rollback path.
- **Accept:** deployed commit matches reviewed SHA; smoke test on deployed routes; no false “live/connected” claims.

### W6 — Payments and commercial operations
- [ ] Preserve canonical catalogue prices and historic order snapshots; define plan benefits, entitlements, expiry, cancellation, refund and terms.
- [ ] PayFast sandbox checkout and server-side ITN signature/merchant/amount/currency/reference/status validation.
- [ ] Test duplicate/replayed ITN, invalid signature, wrong amount, wrong reference, incomplete payment, failure/recovery and atomic idempotent settlement.
- [ ] Generate payment/order/invoice/receipt/settlement/audit records and grant entitlements only after verified settlement.
- [ ] Finance reconciliation, refund review, support escalation and unit economics.
- **Accept:** end-to-end sandbox evidence; no entitlement from unverified or client-reported payment success.

### W7 — Email, integrations and durable workers
- [ ] Email provider config, sender/domain verification when available, consent-aware outbox, retries, bounce/suppression and delivery state.
- [ ] Durable worker process/build with allowlisted handlers, lease/claim, idempotency, bounded retries, dead-letter, recovery and audit.
- [ ] Airtable sync is minimal, stable-ID-based, idempotent, monitored and reconciled; no secrets or unnecessary candidate PII.
- [ ] External provider connections stay NOT_CONFIGURED until authorised credentials, contract and probes exist.
- **Accept:** failure → retry → dead-letter → recovery evidence; duplicate delivery and webhook idempotency tests.

### W8 — Jarvis and founder control plane
- [ ] Jarvis connects to real governed data and approved tool contracts, not hard-coded demo statuses.
- [ ] Separate candidate Jarvis, reviewer assistance, opportunity/source intelligence, workflow orchestration, safety/compliance and founder operations.
- [ ] Every action is scoped and audited; external submissions require candidate confirmation; payment/refund/deploy/privileged changes require explicit approval.
- [ ] Founder control plane reports timestamped source-backed service health, queues, incidents, capacity, provider freshness, finance, email, backup and release SHA.
- [ ] Missing/stale evidence cannot report GREEN; failures have owner, retry, escalation and recovery paths.
- **Accept:** authorised founder runtime drill, denied ordinary-user/unauthenticated tests, durable audit/history and evidence-backed incident simulation.

### W9 — Business/legal readiness
- [ ] Confirm legal entity/CIPC/tax/VAT/beneficial-ownership and other registrations from actual official documents where applicable; do not fabricate identifiers or status.
- [ ] POPIA data map, lawful basis, notices, consent, retention, subject requests, operator/processor agreements, subprocessor register and breach response.
- [ ] IP/brand/domain ownership, renewals, licence records and trademark assessment.
- [ ] Provider agreements and partnership claims verified separately.
- [ ] Support SLAs, incident/change management, continuity and accountable owners.
- **Accept:** documents/decisions recorded with responsible owner and review date.

### W10 — Launch and operational proof
- [ ] Full tests on exact release candidate; all independent reviews and required CI checks pass.
- [ ] Approved migration execution and post-migration effective privilege checks.
- [ ] Candidate A/B/reviewer journey, private vault, master application/CAO, tracker, email, payment sandbox (where enabled), founder operations and deployed Netlify routes proven.
- [ ] Rollback, backup restore, incident response and support readiness verified.
- **Accept:** signed release decision tied to exact commit and deployed SHA. Until then, release status is HOLD.

## Required status vocabulary
Use one status per item: `NOT_REGISTERED`, `DISCOVERED`, `CONFIGURED`, `IMPLEMENTED`, `TESTED`, `DEPLOYED`, `E2E_VERIFIED`, `BLOCKED`, or `NOT_IN_ARCHITECTURE`. Store owner, canonical source, dependency, evidence URL/ref, exact SHA/environment, last-checked timestamp, next review, risk, blocker, rollback and approver.

## Execution rule
Work in dependency order. Do not apply migrations before review and restore approval; do not broaden RLS or grant privileges without role-specific tests; do not import unvalidated provider data; do not turn optional tools into required dependencies; do not publish unverified opportunities; do not claim completion based on code, a project listing, a passing unit test, or a UI prototype alone. Report implementation, tests, deployment and authenticated end-to-end proof separately.
