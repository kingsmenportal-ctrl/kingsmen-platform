# Kingsmen Portal — Canonical Visual Design & Interaction Register

**Status:** Proposed canonical design contract  
**Registered:** 2026-10-27  
**Applies to:** Public portal, candidate portal, staff operations, founder governance, Jarvis surfaces, payment and document workflows  
**Authority:** Product requirements and verified runtime evidence outrank prototype copy or mock data.

This register captures the visual and interaction requirements from the supplied Kingsmen prototype descriptions. It is a design contract, not evidence that every described capability has shipped. A prototype screenshot, example number, badge, or illustrative record must never be presented as live system data.

## 1. Brand and responsive design

- Primary surfaces: deep navy `#0B1A2A` to `#0B2550`.
- Accent: warm gold `#C9A227` to `#D4AF37`, used for primary calls to action, focus/active states and priority emphasis.
- Supporting semantic colours: green for verified/success, amber for pending/warning, red for rejected/error. Never rely on colour alone; pair it with a label and icon/text.
- Identity: shield/crest and the “Kingsmen Portal” wordmark. Use the approved asset where available; do not invent a supposedly official logo asset.
- Typography: clean, high-legibility sans-serif; strong heading hierarchy; readable line lengths and accessible contrast.
- Candidate experience: mobile-first, keyboard and screen-reader accessible, resilient on low bandwidth. Staff/founder surfaces may use denser desktop layouts but must remain responsive.
- Interaction: visible focus states, meaningful disabled states, loading and empty states, recoverable errors, confirmation for consequential actions, and clear success/failure feedback.
- Navigation should be consistent within each authenticated role. Candidate navigation should expose My Applications, Find Opportunities, My Documents, Help & Support and My Next Steps where appropriate.
- Use reduced-motion preferences and avoid animation as the only signal of state.

## 2. Evidence and truthfulness contract

1. PostgreSQL/Supabase is the authoritative transactional record. UI state, screenshots, Airtable mirrors, AI output and prototype content are not truth sources.
2. A directory entry is not proof that an opportunity is open, its deadline current, a candidate eligible, or an outcome confirmed. Show source, last-checked time, verification status and expiry where available.
3. A candidate saying “submitted” is distinct from a provider-confirmed submission. An application outcome requires authorized, attributable evidence.
4. Do not display example names, amounts, counts, timestamps, match scores, SLA percentages, uptime, backups or payment confirmations as live metrics. Clearly label seeded/demo data or suppress it.
5. Never display “Verified”, “Payment confirmed”, “Sent”, “Approved”, “Backed up” or “Restored” until the corresponding backend evidence exists.
6. Missing configuration, unavailable integrations and stale source data must produce honest warnings or a fail-closed state, not a simulated success.

## 3. Candidate surfaces

### 3.1 Free Destiny Map — mobile entry flow

- Branded navy header, gold wordmark, back control and candidate profile entry point.
- Heading: “Free Destiny Map”; explain it is a free, three-step pathway discovery assessment.
- Three-step progress indicator; current step must be text-labelled as well as visually highlighted.
- Primary gold “Start now” action and secondary “Learn how it works” action.
- Explain expected outputs: strengths overview, possible roles/pathways and actionable next steps.
- Capture only necessary candidate inputs: interests, skills/strengths, goals and relevant constraints. Make save state explicit.
- AI-generated recommendations must be labelled as suggestions, with explanations and uncertainty; no invented predictive guarantees.
- Candidate progress must persist to the authenticated candidate's own record before the UI claims it has been saved. If persistence is unavailable, clearly label the draft as local/session-only.
- Maintain consistent candidate navigation through all steps. Support low-data rendering and accessible controls.

### 3.2 Candidate profile and application preparation

- Clear stepper for personal information, document verification, assessment/preparation and final review.
- Provide save, reload and update flows with visible persistence confirmation.
- Show field validation beside the relevant field; do not silently discard user input.
- A CAO submission is one parent Kingsmen application; programme choices are child choices under that parent, not separate application-count units.
- Show service entitlements and application-count usage from authoritative order/entitlement records, not hard-coded package labels.
- A final submit action must disclose whether it prepares a manual application package, queues an authorized integration, or actually receives provider confirmation. Do not conflate these states.

### 3.3 Document Upload & Verification — private Document Vault

- Show a clear upload zone with file picker and camera capture where the device/browser supports it; never make camera access mandatory.
- Canonical accepted file types: PDF, JPEG and PNG; maximum size 10 MiB per file unless a reviewed backend policy changes it. Client-side checks improve usability but server-side validation is authoritative.
- Display each document's original filename, type, size, upload time, server-computed SHA-256 when available, and explicit review state.
- Status vocabulary: Uploaded / Pending review / Needs information / Verified / Rejected. Use “Verified” only after an authorized reviewer or verified provider source records that decision.
- A rejection must show a safe, actionable reason and a replace/re-upload path without deleting the audit history.
- Private files must never be exposed through public buckets or permanent public URLs. Download links are short-lived and issued only after server-side ownership/role checks.
- The candidate may see only their own documents. Reviewers may access only evidence they are authorized to review. Candidate A/B isolation is a release gate.
- Do not claim encryption, registry verification, progress percentages or an estimated completion time unless the deployed service actually provides them.
- Assessment and final-review actions remain blocked while required documents are not in the required verified state.

### 3.4 Low-data / offline mode

- Visible data-saver state and a concise explanation of what is disabled.
- Local draft storage may be described as local-only until successfully synchronized. Distinguish “Saved on this device”, “Sync pending” and “Synced”.
- Retry synchronization safely and idempotently; do not overwrite newer server changes without conflict handling.
- Avoid hard-coded data-usage figures or guarantees of compatibility with specific browsers/networks unless measured and tested.
- Do not store sensitive documents or tokens in insecure local storage merely to support offline mode.

### 3.5 Candidate Jarvis

- Candidate-focused assistant surface with pathway context and clear distinction between sourced facts and AI-generated suggestions.
- Jarvis may explain steps, summarize a candidate's own information and suggest alternatives. It must not claim to have reviewed records it cannot access.
- Show a visible disclaimer: AI suggestions are assistance, not the source of truth; human review is required before consequential submission or decisions.
- Any write is a proposal requiring the policy-appropriate human approval. Record actor, proposal, decision, execution result and correlation ID.
- Undo/reversal may be advertised only for actions whose backend implementation actually supports it and whose retention window is explicit.
- No autonomous identity approval, admissions decision, payment/refund decision, outcome assertion, security-policy change or privilege escalation.

### 3.6 Pricing, orders and PayFast

- Render prices from the canonical package catalogue; do not create separate hard-coded price lists in the UI and backend.
- Canonical formal service tiers (ZAR):
  - Foundational Accord — R169.99
  - Collegiate Ordinance — R299.99
  - Chancellor’s Writ — R399.99
  - Regency Mandate — R469.99
  - Artisan Charter — R149.99
  - Guildmaster’s Charter — R199.99
  - CV Revamp — R49.99
- A separate commercial SKU list has also appeared in prototype copy (University Applications R199; TVET R179; Learnership Finder R249; Bursary Applications R299; Career Launch R399; Accommodation & Campus Support R349; All-In-One Destiny R599). These are **not interchangeable** with the formal tier prices. Do not publish or sell these as canonical until the owner approves a mapping and backend catalogue, entitlement rules and checkout agree.
- Free Destiny Map is R0. Package quantities and benefits must be read from the approved entitlement matrix; avoid duplicate/conflicting claims.
- Before checkout, show package, price, included quantity/benefits, VAT treatment and order reference. Server-side catalogue values determine the charge.
- A return URL alone is not payment proof. Activation requires verified PayFast ITN: signature, merchant, amount, reference, status and idempotency checks, followed by persisted settlement evidence.
- Confirmation screen may show “Payment confirmed” only after the authoritative settlement record is committed. Receipt and invoice must derive from that record. Duplicate ITNs must not duplicate entitlements.
- No payment-card details or secrets in client logs, audit payloads or screenshots.

## 4. Staff operational workspace

- Role-gated workspace with navigation for dashboard, queue, document review, action log, reports, settings and support.
- Queue rows must come from real authorized work items. Counts, SLA timers and “approved today” metrics must be computed from persisted events and show their time window.
- Provide clear priority, state, age/SLA, owner and next action. Empty and error states must be useful and truthful.
- Approve/reject actions require the correct permission, a confirmation where consequential, server-side validation and an append-only audit event. Keyboard shortcuts must not bypass confirmation or authorization.
- “Undo” appears only when a specific operation has a supported compensating action; it must not rewrite the audit history.
- Bulk actions need a preview, an explicit count and safe handling of partial failures.

### 4.1 Human document review with Jarvis assistance

- Display the evidence and its provenance beside any AI summary or risk signal.
- Keep an always-visible statement: “AI assistance only — never auto-approves.”
- Show suggested reply/analysis separately from the authoritative decision controls.
- A staff action may submit a recommendation for approval; only an authorized reviewer may make the decision.
- Risk scores are advisory, explainable where possible, and never the sole basis for adverse treatment.

### 4.2 Support, workflow failures and communications

- Distinguish support tickets from internal workflow incidents and from message delivery failures.
- Retry controls must use idempotent server-side operations and expose retry state/error without leaking credentials or private content.
- Email is the current primary communication channel. **WhatsApp and SMS are deferred for now**; their prototype tabs/templates are design references only and must not imply a live integration.
- No fake sent/delivered counts. Show queued, sent, delivered, bounced/failed only when provider delivery evidence supports the state.
- Respect candidate consent, opt-out, POPIA minimization and retention. Use plain South African English.

## 5. Founder control plane and governance

- Dark navy command-centre visual language with evidence-backed KPIs, operational health, incidents, approval queue and audit drill-down.
- Metrics must be sourced from persisted operational/financial records and carry a time window; suppress placeholder figures.
- Restricted actions show a prominent “Founder approval required” gate. UI lockouts are not sufficient; backend authorization is mandatory.
- Jarvis is read-only by default. Writes follow proposal → validation/policy checks → human approval → execution → audit/result. Any failed validation or missing approver must fail closed.
- Sensitive actions (refunds, security policy, access changes, production-risk operations) require explicit, authenticated approval. Step-up authentication is required where policy mandates it.
- Audit events must be append-only at the application permission level, attributable, timestamped, correlated and tamper-evident. Do not claim cryptographic hash chaining, immutable storage, signed events or compliance certifications until implemented and independently verified.
- Health and backup panels must use real probes and backup/restore evidence. A “restore passed” badge requires a recorded restore drill and checksum/consistency verification.
- Founder access does not remove the requirement for least privilege, review evidence and safe change controls.

## 6. Jarvis architecture contract

1. Portal UI/API authenticates the actor and establishes role and tenant/candidate context.
2. Request router classifies the request and permitted tool scope.
3. Policy and validation layer checks authorization, input, state transition and risk.
4. Read-only tools may execute automatically when policy allows.
5. Write operations create a proposal and await the designated human approval.
6. The execution service re-validates approval, authorization, idempotency and preconditions.
7. Result, evidence and audit event are persisted; UI reflects only committed state.
8. Errors, stale approval, conflicting state or missing configuration fail closed.

Invariant labels: **Read-only by default; writes require approval; never the source of truth; never bypass RLS or validation; all consequential actions logged; reversibility only when implemented; fail closed on error.**

## 7. Accessibility, security and release acceptance

- All controls are keyboard-operable with visible focus; status is not colour-only; headings/labels are semantic; mobile layouts avoid horizontal overflow.
- Server validates all inputs and authorization independently of the UI. RLS and storage policies are tested with at least two candidate identities and the reviewer role.
- No service-role keys or provider secrets in browser bundles, logs or repository files.
- Verify candidate A cannot read/update candidate B's profile, applications, orders, entitlements or documents; verify ordinary candidates cannot invoke reviewer/founder decisions.
- Automated tests cover validation, errors, empty states, duplicate requests, expired sessions/links, permission denials and partial failures.
- Release evidence records the exact commit, CI result, migration state, deployed URL/commit, runtime tests and remaining exceptions.
- “Implemented”, “tested”, “deployed” and “end-to-end verified” are separate statuses. Never mark a capability complete based only on a mockup, unit test, database function deployment or successful build.

## 8. Prototype inventory / screen map

The recovered descriptions cover these major prototype families:
1. PayFast payment confirmation
2. Free Destiny Map mobile flow
3. Candidate document upload and verification
4. Low-data/offline application progress
5. Candidate Jarvis
6. Package selection/pricing
7. Staff operational dashboard
8. Support tickets and workflow failures
9. Communications center
10. Staff document review with Jarvis
11. Founder dashboard
12. Founder Jarvis with hard blocks
13. Governance and audit
14. System health and backup/restore
15. Controlled Jarvis architecture diagram
16–20. Remaining prototype variants/screens described by the supplied prototype set must be attached to this register when the original files are available; this document does not claim to contain their unprovided screenshots.

## 9. Change control

- This register governs visual and interaction consistency, not backend truth or permission grants.
- Any exception requires an explicit product decision and a linked issue/PR.
- When prototype copy conflicts with current operational policy, the current policy wins. Specifically, communications integrations for SMS/WhatsApp are deferred; package catalogue conflicts require resolution before checkout; illustrative metrics and statuses must not be presented as live.
- Original prototype images should be stored under `docs/design/prototypes/` when accessible, with descriptive filenames and provenance. Their absence must be disclosed rather than filled with generated lookalikes presented as originals.
