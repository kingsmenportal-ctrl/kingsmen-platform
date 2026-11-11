# Kingsmen Portal — Canonical Visual & Interaction Design Register

**Registered:** 2026-10-27  
**Status:** Canonical design contract; implementation and production status must be verified independently.  
**Detailed governance copy:** [Notion visual & interaction register](https://app.notion.com/p/4064b23b887481dd925fd1922443f894?pvs=204)

This document supplements—not replaces—the existing Kingsmen source, migrations, module register and release gates. Preserve working code and routes. Audit existing implementations before redesign.

## Authority hierarchy
- Runtime truth: Supabase/PostgreSQL and authenticated APIs.
- Code and checks: reviewed source, PRs and CI in `kingsmenportal-ctrl/kingsmen-platform`.
- Deployment truth: actual hosting deploy and exact published commit.
- Governance/evidence index: Notion.
- Airtable is a mirror, not a second source of truth.
- Founder/human approval is authoritative for restricted decisions.
- A design spec or mockup is not proof that a feature is implemented.

## Visual system
- Navy: `#0B1A2A`–`#0B2550`.
- Gold: `#C9A227`–`#D4AF37`.
- Royal blue for desktop candidate navigation and primary workflow controls where appropriate.
- Green = verified/success; amber = pending/warning; red = rejected/error; grey = not started/disabled.
- Shield/crest and “Kingsmen Portal” wordmark; professional, accessible typography and South African English.
- Candidate experience mobile-first; staff/founder screens information-dense and clear on desktop.
- Shared responsive shell, visible keyboard focus, good contrast, reduced motion, clear loading/empty/error states.
- No generic SaaS template, oversized empty hero, disconnected microsites, or plain chat box as a replacement for the Jarvis command centre.
- Dashed hotspot labels in design references are annotations only and must not appear in the product.

## Candidate UI
### Free Destiny Map
Mobile navy header, back/profile controls, title/subtitle, 3-step progress dots, warm white compass card, gold START NOW CTA, secondary Learn how it works, benefits checklist and persistent bottom nav: My applications, Find opportunities, My documents, Help & support, My next steps. Implement real navigation, input validation, preserved answers across back/forward, honest empty/error/loading states and useful results. Do not claim psychometric validity or guaranteed outcomes.

### Document Upload & Verification
Four stages: Personal Information → Document Verification → Assessment → Final Review. Drag/drop and file picker; camera capture only when supported. Suggested types: government ID, Matric certificate, proof of residence, CV/resume. Show real file metadata and lifecycle state; compute SHA-256 only when actually calculated; show progress only during a real upload; display accurate rejection reason, retry/replace, and verification timestamp only after an authorized verification event. Summary is derived from persisted records. Continue disabled until required checks pass. No fake identities, files, hashes, timestamps, registry calls or pre-verified documents.

### Low-data / offline
Data-saver mode, reduced imagery, low-bandwidth layout, resumable transfers where supported, honest offline/sync states and conflict handling. Sensitive documents/secrets must never be stored in localStorage. Claims about offline saving, auto-sync, Opera Mini/3G support and data consumption require real device tests.

### Candidate Jarvis
Read-only by default; contextual assistance, alternatives and action history. No invented match scores or claims of reading unavailable data. Every write is a proposal with impact/risk preview and appropriate human approval. Log all actions. Promise reversal only when a tested compensation path exists. Persistent disclaimer: “Jarvis is not a source of truth. Suggestions are AI-generated for assistance only. Human review required before final submission.”

### Pricing / PayFast
Canonical formal tiers:
- Foundational Accord — R169.99: 5 priority applications + 8 accommodation routes.
- Collegiate Ordinance — R299.99: 10 priority applications.
- Chancellor’s Writ — R399.99: 15 priority applications.
- Regency Mandate — R469.99: 15 applications with maximum override priority.
- Artisan Charter — R149.99: 5 priority applications.
- Guildmasters Charter — R199.99: 8 priority applications.
- CV Revamp — R49.99 as a separate service.

Historical proposed SKUs (University, TVET, Learnership, Bursary, Career Launch, Accommodation, All-in-One) must be reconciled with canonical price, VAT and entitlement data before checkout. Payment success is shown only from verified server-side evidence: canonical order/amount, applicable VAT, gateway reference, signature/merchant/amount/currency/status checks, ITN result, receipt and entitlement state. Never hardcode sample orders/cards/references or claim ITN verified. Prove idempotency, reconciliation and failure recovery. Sandbox is not production settlement proof.

### Applications and opportunities
Six pathways: higher education, TVET, SETA programmes/learnerships, internships, apprenticeships, employment. Funding is cross-cutting: NSFAS, bursaries, scholarships, institutional/employer funding and stipends. CAO is one parent Kingsmen application/service record; programme choices are children and do not inflate application count. A source directory does not prove an opportunity is open, deadline current, eligibility met, submission made or outcome confirmed. Show provenance, verification and freshness; distinguish candidate-reported from provider-confirmed submission/outcome. MAP and Phoenix are fallback paths; Playwright is probe/scout only and cannot bypass CAPTCHA/OTP or fabricate submissions.

## Staff and communications
- Operational dashboard: live sourced KPIs, queue filters, priorities, status/SLA timers, document review, action log. A/R/U shortcuts must respect focus, confirmation and authorization.
- Support tickets and workflow failures: real status, safe retry, idempotency, dead-letter/recovery visibility and audit.
- Jarvis-assisted document review: explainable sourced flags and drafted replies only; visible “AI ASSISTANCE ACTIVE — NEVER AUTO-APPROVES”. No AI-only approve/reject or official admissions/payment/refund/fraud decisions.
- Email is primary. **SMS and WhatsApp are deferred** and must not be activated or advertised until explicitly re-authorized, despite historical prototype tabs.
- Delivery metrics reflect real provider events; email actions require authorization, consent/recipient checks, preview and audit.

## Founder control plane
- Dark navy/gold command centre with live, timestamped KPIs, approval queue, audit, incidents/health and Jarvis suggestions. No sample revenue/users/churn/uptime.
- Restricted actions display “Founder Approval Gate — REQUIRED”. Jarvis cannot approve refunds, change security policy, elevate privileges or release production. Require authorized founder, scoped confirmation and step-up auth where configured. Audit blocked attempts and decisions. Fail closed.
- Audit records actor/action/target, redacted before-after, correlation ID, timestamp, result and evidence. Never log secrets or identity documents. Claim hash-chain/immutability/signing/SOC 2 only if implemented and independently evidenced.
- Health/backup/restore data must come from real probes and jobs with measurement windows. Backup success is not restore-test success.

## Jarvis architecture
Authenticated request → typed plan → policy/validation (actor, scope, consent, RLS, invariants, risk) → scoped read tools or write proposal → authorized human approval queue (founder for sensitive classes) → executor revalidates and executes idempotently → audit evidence and truthful result. Stale state, ambiguity, policy failure or missing audit/approval dependencies fail closed. Reversal requires a tested compensating action.

## Product invariants
- South African national scope; initial active-candidate target 500, then 1,000 / 5,000 / 10,000 / 25,000.
- POPIA, consent, retention, least privilege, candidate A/B isolation and private document access.
- Existing source/migrations/modules must be preserved and reconciled.
- No unverified opportunity, deadline, eligibility, submission, outcome, payment or verification claims.
- SMS/WhatsApp out of current scope; email primary.
- Production readiness requires exact deployed commit, required CI, reviewed/applied migrations, authenticated candidate/reviewer E2E, candidate isolation, private upload/read/expiry, PayFast checkout/ITN/reconciliation/entitlements, security gates, incident/restore evidence and explicit founder approval.

## Acceptance checklist
- [ ] Audit existing routes/components before redesign; preserve working work.
- [ ] Shared brand tokens, responsive candidate shell, persistent mobile nav and staff/founder shell.
- [ ] All primary actions work; loading/error/empty/disabled states and accessibility tested.
- [ ] Destiny Map validates and preserves answers.
- [ ] Vault enforces private authorization, hash, MIME/size, signed-link expiry, audit and candidate isolation.
- [ ] Candidate-owned application state persists across reload.
- [ ] Catalogue/VAT/entitlements reconcile server-side.
- [ ] PayFast signature/merchant/amount/reference/status, ITN idempotency, recovery and no premature activation tested.
- [ ] Reviewer roles are least-privilege; decisions audited.
- [ ] Jarvis write proposal/approval/fail-closed behavior tested.
- [ ] Offline claims tested; no sensitive localStorage.
- [ ] Founder metrics are real and timestamped.
- [ ] Automated/security/accessibility/responsive tests pass; deployed route and exact commit verified.
- [ ] Implementation, test, deployment and E2E completion reported separately.

## Existing work / caution
Repository: `kingsmenportal-ctrl/kingsmen-platform`; Supabase staging project `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`); Netlify site `kingsmen-portal-staging`. Existing areas include auth foundation, Truth Vault/RLS, identity review, application preparation, private Document Vault, reviewer decisions, candidate status/follow-up, founder operations and integrated release CI. Previously recorded PRs #173/#174/#176/#194 were open/unmerged; refresh live state before changes. PR #197 last recorded head was `b764b65853f652a696bdb90da818fd71fb0c6737`; review/CI status must be checked before migration use. Keep branch protection and PR review.

Lovable project `3638e675-a728-49e0-84d2-b456a8572a54` is a temporary visual surface and was not connected to existing Supabase staging. Do not treat it as the production app or create a competing backend.

The 20-screen register describes intended design/behaviour; prototype sample names, IDs, prices, timestamps, hashes, metrics, badges and incident data are illustrative unless sourced. Change to pricing, entitlements, communication channels, approval authority, evidence policy or data architecture requires explicit recorded decision.