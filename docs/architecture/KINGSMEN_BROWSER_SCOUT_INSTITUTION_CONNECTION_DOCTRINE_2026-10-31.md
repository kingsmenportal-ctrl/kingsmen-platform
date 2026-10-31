# Kingsmen Browser Scout and Institution Connection Doctrine
**Date:** 2026-10-31  
**Status:** Proposed architecture and operating contract; not evidence of implementation or launch approval  
**Parent release line:** National institution/source coverage PR #233, head `5132a1f98d55715669bb5244b147fa03c6885cb3`

## Purpose
Turn Playwright Browser Scout into the shared reliability, mapping, regression, and evidence engine for Kingsmen without changing the single-profile / single-workbench architecture or weakening release, consent, and human-approval gates.

## Non-negotiable boundaries
1. Default trust level is probe/read-only. Public pages may be inspected within lawful access and rate limits. Authenticated checks require an explicitly authorised account and approved scope.
2. Never solve or bypass CAPTCHA, OTP, MFA, payment confirmation, rate limits, access controls, or bot-protection challenges. Stop, record a redacted evidence event, and route to candidate-controlled guided completion or MAP.
3. No live institution submission, declaration, payment, or irreversible mutation from a probe job. Any future write-capable worker is a separately reviewed capability with candidate consent, scoped founder approval, an explicit policy-gate decision, idempotency, and a kill switch.
4. Never store passwords, bearer tokens, OTPs, session cookies, raw storage state, or unredacted sensitive form values in logs, screenshots, traces, artifacts, or the ordinary evidence ledger. Any specifically approved session broker must encrypt state, isolate it per candidate/institution, apply short TTLs, restrict access, and support verified deletion.
5. Source directories, HTML presence, API responses, and probe success do not establish programme availability, eligibility, provider partnership, deadline validity, submission, or outcome. Preserve source authority, observation time, expiry/freshness, review status, and evidence provenance.
6. Candidate-reported submission remains distinct from provider-confirmed submission/outcome. Human reviewers retain decisions; AI only recommends with cited evidence.
7. All real candidate data remains within the authorised Truth Vault boundary. Synthetic data is used for tests. No production candidate traffic before RC gates pass.

## Capability card contract
Each institution portal mapping proposal should be versioned and include:
- institution/provider identity and canonical source URLs;
- pathway and portal purpose (directory, programme discovery, application, status check, payment, or support);
- mapping version, author/proposer, reviewer, timestamps, evidence references, and confidence;
- page/step inventory with resilient role/label/text locators, field types, requiredness, constraints, document formats/size limits, and navigation edges;
- health state (unknown, healthy, degraded, changed, blocked-human-action, or broken) and the observed reason;
- source freshness, deadline provenance, and review/expiry date;
- CAPTCHA/OTP/MFA/payment/rate-limit/anti-bot indicators without attempting to defeat them;
- supported execution mode: probe-only, guided completion, MAP-first, or (only after a separate approved gate) candidate-controlled prefill hand-off;
- redaction policy, permitted probe frequency, rate budget, and next review date.

Proposals are immutable/versioned. A DOM change or selector failure creates a proposed diff and regression evidence; it must not silently promote a new mapping to candidate-facing use.

## Browser Scout job lifecycle
1. Resolve the approved target, purpose, account scope, frequency, and rate budget.
2. Create an isolated browser context per test identity/job; never share cookies or storage across candidates.
3. Navigate with bounded timeouts and explicit network/step limits; capture status, URL, accessibility snapshot, relevant console/network errors, and redacted screenshots.
4. Detect human gates and stop before solving or bypassing them.
5. Compare page structure and locator outcomes against the approved mapping version. A difference creates a review item, not an automatic live change.
6. Store a compact, redacted evidence record in the Truth Vault with job ID, mapping version, target, timestamps, result, and content hashes. Keep raw traces/screenshots in private, retention-bounded storage only where justified.
7. Update health and confidence only from defined evidence. Missing/stale evidence yields unknown or degraded, never implicitly healthy.
8. Emit a Jarvis/admin summary with failure category, recommended next action, and evidence links; alert thresholds must avoid repeated noisy notifications.

## Execution routing
- **Probe-only:** public discovery, form/field mapping, health checks, mobile layout checks, and safe regression tests.
- **Candidate-guided completion:** provide a checklist and candidate-owned next steps when login, CAPTCHA, OTP, payment, declaration, or policy limits are reached.
- **MAP:** produce a candidate-specific, permission-checked packet and checklist when automation is unreliable or disallowed. Use private download links with expiry; do not email raw identity documents.
- **Candidate-controlled prefill hand-off:** future optional capability only after threat modelling and security review. Use an isolated short-lived browser session, explicit consent, a visible hand-off boundary, no hidden final submission, and safe cleanup. If the institution does not permit such automation, use guided/MAP instead.
- **Operator-assisted completion:** only with documented authorisation, least privilege, recorded purpose, and the candidate's consent. Final submit remains an explicit human action unless a separately approved institution-specific policy permits otherwise.

## Network inspection and session policy
Network interception may observe request metadata and public/authorised response schemas to diagnose page changes. Do not harvest undocumented private APIs, replay write requests, capture credentials or payment data, or use network evidence to circumvent a portal's controls. Keep allowlists, redact request/response bodies by default, and require review before any schema-derived mapping is promoted.

Persistent browser storage state is disabled by default. If later approved for a specific institution, require an explicit session owner, consent scope, encryption at rest, separate per-candidate keying, strict TTL, access audit, revocation, and tested deletion. Never treat storage state as a shared institution-wide credential.

## Evidence and status vocabulary
Use controlled statuses: `not_probed`, `healthy`, `degraded`, `mapping_changed`, `human_action_required`, `map_ready`, `broken`, `stale`, and `retired`. Each transition must record the actor/job, previous/new state, reason, timestamp, evidence references, and mapping version.

A probe can prove only what it actually observed at that time. It cannot prove that a candidate submitted an application or that a provider accepted it. Confirmation pages, reference numbers, receipts, and candidate reports must retain their evidence type and verification state.

## Candidate-facing integration
All six Kingsmen pathways use the same candidate identity, profile, Document Vault, and application workbench. Package benefits may change service intensity/usage only according to the approved commercial schedule; packages must not hide otherwise accessible opportunities. The workbench should show the institution, programme, last verified source observation, application state, evidence type, next action, and whether action is required from the candidate. Email remains the primary notification channel; WhatsApp/SMS are not part of the current delivery plan.

## Test and release gates
- Unit tests: status transitions, redaction, freshness/expiry, confidence rules, mapping versioning, rate budgets, and human-gate detection.
- Playwright contract tests: isolated contexts, no cross-candidate cookies, read-only network guard, bounded retries, screenshot/trace redaction, and stop-at-CAPTCHA/OTP/payment behaviour.
- Regression tests: desktop and South African mobile viewport sizes, offline/degraded network simulation, accessible locators, upload constraints, and MAP generation.
- Security tests: candidate A/B isolation, reviewer least privilege, private evidence access, signed-link expiry, secret scrubbing, and audit integrity.
- Operational tests: scheduler retries/backoff, duplicate job idempotency, dead-letter/recovery, stale mapping alerts, and kill-switch behaviour.
- Promotion gate: independent review, exact commit, passing required workflows, reviewed mapping diff, source evidence, staging proof, and explicit approval. A green browser probe is not a release approval.

## Integration order
1. Keep the ordered RC review and backup/change-control gate first.
2. Apply and verify 0097 only after independent review and approved backup.
3. Reconcile the already-live 0096 CAO bridge via the assertion-only migration; verify actual schema/catalog state and preserve provenance.
4. Review, apply, and test 0098 capacity enforcement separately.
5. Review source-import changes separately, then build the N15 adapter that reconciles reviewed source observations into the candidate-serving model. Directory rows alone must never create open opportunities or candidate matches.
6. Run authorised Candidate A/B and reviewer end-to-end tests, including document isolation, applications/CAO/tracker persistence, and cross-candidate denial.
7. Prove PayFast checkout, signed ITN, replay/duplicate handling, reconciliation, and entitlement in a separate gate.
8. Deploy only a reviewed immutable commit to Netlify; record deploy ID, commit SHA, URL, and authenticated route smoke evidence.
9. Reconcile the complete RC1 evidence register. No public release while any mandatory gate remains unproven.

## Initial institution rollout
Start with a small, human-reviewed first wave. Do not label a portal candidate-ready until the mapping has current evidence, an approved execution mode, a passing staging test, and a defined refresh schedule. Long-tail or heavily protected portals should default to guided/MAP rather than pursuing automation at any cost. Expand based on verified utility, not raw directory counts.

## Implementation status
This document is a proposed operating contract only. It does not claim that the scheduler, capability-card schema, self-healing queue, session broker, MAP renderer, Jarvis commands, candidate-facing health UI, or institution mappings are implemented or deployed. Those require code, tests, review, and runtime evidence in separate work items.
