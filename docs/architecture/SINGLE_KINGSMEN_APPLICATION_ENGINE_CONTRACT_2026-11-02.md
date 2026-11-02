# Single Kingsmen Application Engine — Contract and Implementation Plan

**Date:** 2 November 2026  
**Status:** Engineering contract / review draft. This document is not evidence of an implemented engine, an applied migration, or a deployment.

## 1. Product invariant

A candidate has one Kingsmen identity, one reusable profile, and one master application/service workspace. The candidate can select opportunities from all six pathways in one conditional application journey. Selected opportunities are child targets beneath that master workspace; they are not six separate candidate accounts or unrelated parent applications.

The six pathways are Higher Education, TVET, SETA programmes & learnerships, Internships, Apprenticeships, and Employment. CAO is represented as one Kingsmen parent with ordered programme-choice children. Existing legacy records must remain traceable; do not silently re-parent, delete, or fabricate historical applications.

The package determines priority volume, managed-route capacity and service level. It must not restrict catalogue visibility or remove pathways. Keep canonical plan prices/entitlements in the existing source of truth; do not duplicate or redefine them in the application engine.

## 2. Proposed logical model

Names below describe domain responsibilities, not approved physical table names. Reconcile the live schema and migration ledger before selecting final DDL.

- **Master application/workspace:** candidate owner, lifecycle state, schema/version, created/updated timestamps, profile snapshot/version reference, consent evidence reference, and optimistic concurrency version.
- **Application target (child):** one selected opportunity/programme/employer route; pathway; provider/institution and programme references; target-specific state; deadline snapshot; eligibility/readiness snapshot; priority/managed-route classification; idempotency key; and immutable provenance.
- **Target requirements:** versioned required fields, documents, declarations, and provider-specific answers. Reuse profile fields where consent and field semantics permit; never overwrite the reusable profile with application-only answers.
- **Answer set:** versioned, schema-validated application-specific answers per target or shared master-form section. The master form computes the union of requirements for selected targets, deduplicates semantically identical fields, and clearly labels target-specific requirements.
- **Provider route/attempt:** authorised route, route policy/version, operator or integration identity, attempt sequence, request/response evidence references, retry policy, and human approval record where required.
- **Provider acknowledgement / outcome:** separate immutable facts with source, evidence, observed time, verification state, and correction/supersession lineage. Candidate-reported activity is never equivalent to provider acknowledgement or a provider decision.
- **Application event ledger:** append-only domain events with actor, time, correlation ID, idempotency key, prior/new state, and evidence reference. Current status is a projection of valid events, not free-form untraceable text.
- **Work queue / outbox:** durable idempotent jobs for readiness checks, authorised submission, status polling or human follow-up, email and portal notifications. Retries must not create duplicate applications or duplicate external submissions.

Before physical schema changes, compare these responsibilities against `candidate_applications`, `candidate_master_application_targets`, `candidate_application_draft_answers`, `candidate_application_events`, CAO child tables, and all migrations 0096–0109. Prefer a minimal extension of existing canonical entities over a parallel competing schema.

## 3. Candidate journey

1. Sign in and resolve exactly one verified Auth UUID-to-candidate identity link; fail closed for zero or multiple links.
2. Load/save one reusable profile with explicit consent, provenance, completeness, and durable reload/re-login behavior.
3. Search the shared catalogue. Separate directory/source records from verified, currently open opportunities. Only show an opportunity as open when source authority, deadline, eligibility and freshness evidence pass the defined policy.
4. Select one or more targets across any of the six pathways in one workspace.
5. Calculate the conditional form from the union of target requirements and profile gaps. Do not ask twice for the same field; disclose target-specific questions and conflicts.
6. Save a resumable draft with optimistic concurrency, schema version, idempotency, and clear saved/error state.
7. Evaluate eligibility, deadline, profile/document readiness, consent, plan priority allowance, and route availability per target. Do not reject the entire master workspace merely because one child target is blocked.
8. Present a per-target review and explicit candidate authorization before any dispatch or human-assisted execution.
9. Execute only via an authorised provider API/integration or a consented Kingsmen-managed human process. If unavailable, create an honest in-Kingsmen exception/task. Never bypass CAPTCHA/MFA/OTP, provider controls or terms; never request or store provider passwords; never fake provider submission.
10. Track every target separately within the single workspace: draft, readiness, queued, awaiting human action, authorised, attempt recorded, dispatched, provider acknowledged, provider decision/outcome, blocked, withdrawn, or correction required. Use the existing canonical enum vocabulary after reconciliation rather than adding conflicting labels.
11. Show a unified timeline and inbox while retaining target-specific deadlines, requests, receipts and outcomes. Email and portal inbox are the enabled communication channels; WhatsApp/SMS remain disabled.
12. Support corrections, withdrawals, evidence review, dispute/supersession, and an auditable record of who changed what and why.

## 4. Transaction and integrity rules

- Creating a master workspace is idempotent for the authenticated candidate and chosen workflow key.
- Adding the same target twice resolves to the same child target or returns a clear conflict; it must not create duplicate parent applications.
- The parent/child ownership relation must be enforced in the database. Every candidate read/write verifies the caller's identity link and ownership; no client-supplied candidate ID is trusted.
- A multi-target save must report per-target validation outcomes. Use one transaction for related database writes; use durable outbox jobs for external work that cannot participate in a database transaction.
- Provider dispatch is at-least-once at the job layer but must be made effectively-once where the provider supports idempotency. Where it does not, retries require reconciliation and must not blindly resubmit.
- State transitions are validated server-side and append evidence/events. No candidate or AI agent can mark a provider receipt or decision as verified without supporting evidence and the authorised review process.
- Do not count candidate-reported submissions as provider-confirmed submissions.
- Entitlement checks use the canonical package catalog and payment settlement evidence. No access/entitlement from a checkout redirect or unverified PayFast ITN.
- Apply the 500-active-candidate release cap only through the already reviewed authoritative enforcement mechanism; do not create a bypass or apply unapproved migrations.

## 5. Security, privacy and operational boundaries

- POPIA purpose limitation, minimisation, consent, retention, correction, export/deletion policy and audit.
- Private document storage, short-lived access URLs, allowed MIME/type and size checks, content hash, malware scanning/review status where available, and no public buckets.
- Candidate A/B isolation tests for profile, master workspace, child targets, answers, documents, events, receipts and notifications.
- RLS and server-side authorization must agree; SECURITY DEFINER functions use hardened search paths, least privilege and explicit grants/revokes.
- No provider credentials in candidate-visible payloads, logs, source control, analytics or Jarvis context.
- Jarvis is read-only by default. Writes, dispatches, identity decisions, payment changes, migration application, and release actions require the documented human/Founder approval gate.
- MAP is the primary managed route; Phoenix is fallback; Playwright is probe/scout only unless the provider has explicitly authorised automated execution.

## 6. Implementation slices and exit criteria

### Slice A — contract and schema reconciliation
- Produce a table/constraint/RPC map for the current live schema and migration ledger, including migrations 0096–0109 and the legacy `applications` linkage.
- Decide canonical master parent, child-target identity and CAO compatibility without creating a competing application system.
- Record migration ordering, rollback/forward-recovery plan, and data-preservation checks.
- Exit: reviewed design, no unresolved duplicate-parent semantics, migration provenance approved; no staging writes yet.

### Slice B — persistence and authorization
- Add only the minimal schema changes and SECURITY DEFINER RPCs needed for master workspace + child targets + versioned answers/events.
- Test save/reload/re-login, optimistic concurrency, idempotency, candidate ownership, duplicate targets, partial target validation and legacy compatibility.
- Exit: automated DB tests and candidate A/B negative tests pass against an isolated disposable database; least-privilege grants reviewed.

### Slice C — conditional form and workbench
- Build one form for selected targets with shared profile fields, target-specific requirements, clear readiness errors, autosave, resume and one unified timeline.
- Exit: all six pathways can coexist under one workspace in integration tests; CAO still creates one parent with ordered choice children.

### Slice D — route orchestration
- Introduce per-target queue state, approval, dispatch attempts, provider acknowledgement and human exception workflow.
- Start with test doubles and authorized/manual routes. Provider-specific live execution is enabled only after written/technical authorization and route-specific proof.
- Exit: retry/idempotency tests, evidence provenance, failure recovery, no fake receipts, no external redirect presented as completion.

### Slice E — communications and operational controls
- Email + Kingsmen inbox; reminder scheduling; delivery-attempt ledger; dead-letter/retry handling; candidate and Founder visibility.
- Exit: provider-delivery evidence exists for staging; WhatsApp/SMS are denied server-side.

### Slice F — release and rollout
- CI, independent review, security scan, branch protection evidence, protected backup, isolated restore, migration-ledger/schema reconciliation, staging deploy, authenticated runtime verification, redacted evidence and Founder sign-off.
- Canary with internal/test accounts first. Enforce the 500 active-candidate cap; define monitoring, support runbook, rollback and incident response before public release.
- Exit: all release gates evidenced against the exact deployed SHA. No claim of production readiness from source checks alone.

## 7. Required automated tests

1. One candidate selects one target in each of six pathways and receives one master workspace with six child targets.
2. Multiple CAO choices remain ordered child records beneath one Kingsmen parent.
3. Repeated create/save requests with the same idempotency key do not duplicate parents, targets, events or dispatches.
4. Two candidates cannot read or mutate one another's profile, answers, targets, documents, events, receipts or notifications.
5. Zero/multiple/unverified identity links fail closed.
6. One blocked target does not silently erase or block valid sibling targets; outcomes are explicit per target.
7. Deadline expiry, stale source, missing eligibility evidence and missing consent block dispatch with actionable explanations.
8. A candidate-reported submission does not create a provider acknowledgement or outcome.
9. Retry after timeout cannot blindly duplicate a provider submission; unknown result goes to reconciliation.
10. Payment return URL without verified settlement grants no entitlement.
11. Form schema/profile version changes preserve answer provenance and require revalidation rather than silently rewriting a submitted snapshot.
12. Candidate save persists after refresh and re-login; concurrency conflict is visible and recoverable.
13. Event ledger cannot be rewritten by candidate-facing roles; corrections append superseding events.
14. Email/portal notifications are idempotent; WhatsApp/SMS cannot be queued.
15. Legacy rows and existing CAO flows remain readable and are not silently migrated or deleted.

## 8. Release blockers that remain explicit

This contract does not close or waive: backup/restore proof, migration provenance/change control, candidate A/B authenticated isolation proof, branch-protection evidence, required CI and independent review, PayFast ITN settlement/idempotency proof, email delivery proof, provider-specific authorisation/receipt proof, exact Netlify deployed-SHA proof, POPIA/security review, or Founder release approval.

## 9. Definition of done

The milestone is done only when one candidate can select opportunities across all six pathways, complete one conditional form, save/reload/re-login, see each child target's independent readiness and lifecycle inside one Kingsmen workspace, and receive truthful evidence-backed status updates—while isolation, idempotency, consent, entitlement and release gates pass against the exact deployed build. A document, passing lint/source checks, mock provider, or draft PR alone does not meet this definition.
