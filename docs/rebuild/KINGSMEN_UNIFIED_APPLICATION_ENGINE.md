# Kingsmen Unified Application Engine — Implementation Contract

**Status:** implementation contract; not a claim of runtime completion  
**Scope:** first candidate-facing vertical slice in the existing Kingsmen platform  
**Canonical repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Non-goals:** new competing app, provider-site redirect directory, automatic provider submission, schema changes without migration reconciliation, payment activation, or production release.

## Product invariant

A candidate has one Kingsmen account and reusable profile. The candidate can discover all six core pathways regardless of plan and create/manage applications through Kingsmen. Plan entitlements may constrain priority volume, managed-service capacity, and concurrency; they must not hide pathways or opportunities. A CAO submission is one Kingsmen parent application with programme choices as child records.

Core pathways:
- `higher_education`
- `tvet`
- `seta_learnership`
- `internship`
- `apprenticeship`
- `employment`

## Candidate journey

1. Authenticate and resolve the immutable Supabase Auth UUID to exactly one candidate record. Never link accounts by matching email alone.
2. Load the candidate's reusable profile and consent state from the backend. Unsaved browser state must never be represented as persisted.
3. Browse verified opportunities. An official source anchor alone is insufficient: candidate-facing OPEN requires authoritative source evidence, a valid deadline, eligibility, and freshness.
4. Select an opportunity and create a Kingsmen application draft through an authenticated backend command. The server revalidates candidate ownership, opportunity status, eligibility requirements, duplicate/idempotency key, plan capacity, and required consent.
5. Collect pathway-specific answers in typed application data while retaining one common application envelope. Avoid separate disconnected application engines per pathway.
6. Save draft and resume after refresh/re-login. Every mutation returns the persisted record/version and an audit/correlation reference.
7. Submit to Kingsmen for review/managed processing. Record candidate intent separately from any external provider transmission.
8. Display only evidence-backed statuses. Distinguish `DRAFT`, `READY_FOR_REVIEW`, `SUBMITTED_TO_KINGSMEN`, `PROVIDER_TRANSMISSION_PENDING`, `PROVIDER_RECEIPT_CONFIRMED`, `DECISION_RECEIVED`, `WITHDRAWN`, and `CLOSED`. Provider receipt/decision statuses require provider-origin evidence; never infer them from a button click.
9. Send candidate notifications through the approved email outbox only after durable state change and consent/purpose checks.

## Minimal domain model

Reuse and reconcile the existing schema before adding tables. The logical model is:

- **candidate profile** — one row per verified Auth identity; reusable details, completion state, consent/version.
- **opportunity** — typed pathway, provider/source authority, eligibility, deadline/timezone, verification state, evidence references and freshness.
- **application** — candidate owner, idempotency key, pathway, lifecycle state, common answers, timestamps, version, audit/correlation identifiers.
- **application choice** — child rows for multi-choice routes such as CAO; ordered programme choices belong to one parent application.
- **application event** — append-only status/event history with actor, source, evidence reference and timestamp.
- **outbox message** — idempotent email intent tied to a durable domain event; provider configuration remains NOT_CONFIGURED until proven.

Do not create duplicate tables if an equivalent canonical table already exists. No staging DDL or data import is authorised by this contract.

## API boundary

The web client must call the authenticated backend; it must not access privileged database credentials or decide trusted state.

Minimum command/read contracts (names illustrative until reconciled with current API conventions):
- `GET /api/candidate/profile`
- `PUT /api/candidate/profile`
- `GET /api/opportunities?pathway=<pathway>`
- `POST /api/applications` — create idempotent draft
- `GET /api/applications` — current candidate's applications only
- `GET /api/applications/:id` — ownership-checked detail
- `PATCH /api/applications/:id` — allowed draft edits only, optimistic version check
- `POST /api/applications/:id/submit` — candidate submits to Kingsmen, not automatically to a provider
- `GET /api/applications/:id/events` — ownership-checked status history

Every endpoint must derive candidate identity from a verified server-side session/token, not a client-supplied candidate ID. Use deny-by-default authorization, request validation, bounded payloads, idempotency, redacted logs, and audit events. Provider transmission is a separate approved adapter with explicit candidate consent, provider authorization, and founder approval where required.

## Plan and entitlement rule

- The verified opportunity catalogue is common to all plans.
- A plan affects priority-application allowance and managed-route/concurrent capacity only.
- Do not use the legacy `entitlement_snapshot` as the authority.
- Use the canonical finance plan catalogue and server-side entitlement evaluation.
- Never grant paid entitlements from a browser return URL; require verified PayFast settlement/ITN evidence and idempotent reconciliation.
- Free/paid status must not bypass eligibility, source verification, candidate ownership, consent, or security rules.

## Security and privacy acceptance

- Candidate A cannot read, update, list, or infer Candidate B's profiles, applications, choices, documents, events, orders, or audit data.
- Anonymous and authenticated non-reviewers cannot execute reviewer decisions.
- Service-role credentials never reach browser bundles.
- Every write is authorized and audited; every status is tied to its source/evidence.
- Sensitive fields are minimized and protected under POPIA purpose limitation, retention, correction, access, and deletion workflows.
- Concurrent duplicate create/submit requests are safe and idempotent.
- CAO child choices cannot be read or changed across parent-application ownership boundaries.

## Required tests

1. Contract/validation tests for all six pathway types and invalid pathway rejection.
2. Create, edit, reload, re-login, and submit a draft; verify persisted data after reload.
3. Idempotent duplicate create and duplicate submit.
4. Candidate A/B isolation for list/detail/update/choices/events/documents.
5. Opportunity closed, expired, stale, unverified, or ineligible => application creation/submit denied or safely flagged according to reviewed policy.
6. CAO parent + ordered child choices; one parent consumes one application entitlement.
7. Plan volume/capacity checks are concurrency-safe and do not change catalogue visibility.
8. Provider receipt cannot be generated by candidate UI; only validated provider-origin evidence can transition that status.
9. Outbox retry, duplicate event, dead-letter and redaction checks.
10. Accessibility and mobile viewport checks for the candidate flow.

## Delivery sequence

1. Read-only schema/API reconciliation against current main and staging evidence.
2. Implement backend profile/application read and write commands using existing canonical tables.
3. Add unit/integration tests and RLS/authorization checks.
4. Build the candidate form and tracker against those APIs; no fake local-only success states.
5. Validate with two separately authorised staging candidates and approved test data.
6. Capture exact commit, CI, runtime and isolation evidence.
7. Independently review; merge through required branch protection.
8. Deploy only to the existing staging site, then verify deployed SHA and authenticated E2E.

## Exit criteria

This workstream is complete only when the candidate can create, save, resume, submit to Kingsmen, and track a persisted application across all six pathways, with CAO child choices, candidate isolation, evidence-backed statuses, and tests tied to an exact reviewed/deployed commit. A UI mock, passing source validator, or external provider URL is not completion.
