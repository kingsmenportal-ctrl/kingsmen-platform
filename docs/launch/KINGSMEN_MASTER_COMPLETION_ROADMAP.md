# Kingsmen Platform — Master Completion Roadmap

**Purpose:** turn the existing Kingsmen repository into a safe, useful, verifiably working service for real South African candidates. This plan is the execution index; it does not claim that any unproven integration or launch gate has passed.

## Product scope

Kingsmen is a candidate-facing gateway for South African education and opportunity pathways: university and college admissions, TVET, learnerships, bursaries, employment opportunities, managed pathways, documents, applications, communications, and payments. The public Free Destiny Map should provide useful guidance without collecting personal data. Jarvis is private founder command intelligence, not a public candidate chatbot.

## Source-of-truth rules

1. The backend and PostgreSQL/Supabase Truth Vault own authoritative business state.
2. GitHub owns source code, change history, review, and machine-readable proof artifacts.
3. Validators and runtime evidence—not documentation or UI labels—determine whether a capability is ready.
4. Lovable may accelerate interface work, but generated UI must use the supported backend boundary and must not bypass server authorization.
5. Airtable may coordinate internal operations; it must not become the authoritative store for candidate identity, permissions, payment state, or application state.
6. AI may recommend and draft. Server-side policy, explicit authorization, validation, and founder approval govern consequential actions.
7. No secrets in source, logs, prompts, or reports. Never print credentials or real candidate personal data in test evidence.

## Release phases and exit criteria

### Phase 0 — Establish a trustworthy baseline (P0)
- [ ] Inspect the actual repository, open PRs/issues, build scripts, migrations, and CI outcomes before changing production behavior.
- [ ] Run the documented core tests and launch audit in a clean environment; record command, commit SHA, exit status, and redacted output.
- [ ] Reconcile documentation with actual package scripts and executable paths; fix commands that refer to missing scripts.
- [ ] Repair failing required CI checks and make the default validation path deterministic.
- [ ] Apply and verify protection for main; require reviewed changes and passing checks where supported.
- **Exit:** repeatable CI passes from a clean checkout, branch protection is evidenced, and the launch audit identifies only explicit remaining blockers.

### Phase 1 — Secure backend and persistent state (P0)
- [ ] Build the API and test health, command intake, workflow-result intake, candidate status, and application workbench.
- [ ] Provision a non-production Supabase/PostgreSQL project; apply migrations in order and document rollback/restore procedures.
- [ ] Replace memory_development_only for staging with tested PostgreSQL persistence; verify restart persistence and idempotency.
- [ ] Test authorization and RLS for anonymous, candidate A, candidate B, operator, founder, and backend service contexts.
- [ ] Verify server-side input validation, candidate ownership, audit events, rate limits, safe errors, and request correlation.
- **Exit:** staging proves durable persistence and cross-user isolation; no candidate can read or mutate another candidate's records.

### Phase 2 — Candidate product and service workflow (P0/P1)
- [ ] Audit the web app against the actual product scope; separate shipped, partial, mock, and missing functionality.
- [ ] Deliver a mobile-first public information experience and Free Destiny Map with no personal-data collection on the public path.
- [ ] Implement consent-aware candidate onboarding, profile, document checklist, opportunity discovery, saved opportunities, application tracking, and status explanations.
- [ ] Make every deadline, eligibility rule, fee, and opportunity source traceable and show freshness/verification status.
- [ ] Test accessible forms, empty/loading/error states, responsive layouts, and end-to-end critical journeys.
- **Exit:** a test candidate can complete the supported journey from discovery through a tracked application without false guarantees or data leakage.

### Phase 3 — Documents, communications, payments (P0 before taking money)
- [ ] Secure document upload/storage, file-type/size checks, access controls, retention rules, and deletion/data-subject request paths.
- [ ] Prove email send/receive, bounce and opt-out handling; keep WhatsApp urgent-only and SMS fallback-only.
- [ ] Test PayFast sandbox success, cancel, failure, duplicate notifications, invalid signatures, replay, amount mismatch, and refund review.
- [ ] Reconcile order/payment state only from verified server/provider events; never trust a browser return page as proof of payment.
- [ ] Publish founder/legal-reviewed terms, privacy notice, consent notice, payment/refund policy, and support/data-request route.
- **Exit:** all provider tests have redacted staging evidence; production payments and candidate notifications remain disabled until approval.

### Phase 4 — Jarvis and controlled automation (P1)
- [ ] Keep Jarvis private to the founder and enforce tool allowlists, least privilege, risk tiers, approval gates, and evidence logging server-side.
- [ ] Distinguish provider states: configured, reachable, sandbox-proven, staging-proven, production-approved, blocked.
- [ ] Use dry-run by default for write actions; require explicit approval for deployment, bulk communications, refunds, payment activation, official submissions, destructive actions, and secret changes.
- [ ] Validate every generated action packet and preserve command, policy decision, tool plan, result, and approval evidence.
- **Exit:** tests demonstrate that unauthorized or high-risk commands are blocked even if the UI or model asks for them.

### Phase 5 — Operations, reliability, and launch (P0)
- [ ] Prove backup/restore with checksums, source/target separation, redacted counts, and measured RPO/RTO.
- [ ] Prove health checks, structured redacted logs, alerts, queue/dead-letter handling, incident runbooks, and escalation.
- [ ] Configure secrets outside Git; prove only masked configured/not-configured status.
- [ ] Deploy a staging build and capture the complete runtime proof pack and final assembly evidence bundle.
- [ ] Run accessibility, security, privacy, performance, recovery, and end-to-end acceptance checks.
- [ ] Obtain explicit founder sign-off for each production-risk gate.
- **Exit:** every P0 launch gate has reviewed staging evidence, the release gate passes, rollback is tested, and public launch is explicitly approved.

## Integration boundaries

| System | Intended responsibility | Must not become |
|---|---|---|
| GitHub | Code, reviews, CI, issue tracking, proof artifacts | Proof of production readiness by itself |
| Supabase/PostgreSQL | Auth integration where appropriate, durable relational data, RLS, migrations | A database accessed directly from an untrusted browser with elevated credentials |
| Lovable | UI prototyping and product implementation acceleration | An authorization layer or a substitute for backend validation |
| Airtable | Internal operations, partner/opportunity curation, human review queues, launch tracker | The source of truth for identity, permissions, payments, or candidate application state |
| Jarvis/AI | Research, recommendations, drafts, safe orchestration | Unsupervised production authority |

## Working rules for every change

- Work on a branch and open a pull request; do not bypass repository protection.
- Make small changes with a stated acceptance test and rollback note.
- Never mark a task complete because a file exists; require its validator or runtime proof.
- Use synthetic fixtures for test candidates and redact all logs/reports.
- Record blockers with an owner, dependency, evidence required, and next executable action.
- Do not enable public candidate intake, live payments, official submissions, or bulk outreach while any required P0 gate is blocked.

## First execution sequence

1. Audit the default branch and repair the highest-impact failing CI checks.
2. Run the core validator and launch-readiness audit; turn their exact findings into scoped issues.
3. Reconcile migration order and Supabase staging configuration; prove durable storage and RLS.
4. Validate the candidate-facing critical path end to end.
5. Complete provider sandbox tests, operational proofs, and final founder launch review.

**Status rule:** this roadmap is a plan, not evidence that the listed work has been completed. Update checkboxes only after the corresponding evidence is reviewed.
