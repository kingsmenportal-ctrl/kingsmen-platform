# Kingsmen N00–N20 Operating Architecture and System Inventory

**Status:** Architecture baseline / implementation inventory contract  
**Scope:** The complete Kingsmen operating system across doctrine, runtime, data, candidate journeys, finance, governance, integrations, operations, and release.  
**Evidence rule:** A module's definition is not proof that its implementation, provider connection, migration, test, or deployment is complete. Record each separately with repository evidence.

## What “all of Kingsmen” means

Kingsmen is the coordinated system represented by N00–N20, not one website or one AI agent. Each N-module owns a bounded responsibility and publishes explicit contracts to neighboring modules. PostgreSQL/Truth Vault and the backend state machine own authoritative application state; external systems are adapters or mirrors unless a documented contract says otherwise. UI surfaces display and request actions; they do not independently establish truth or authority.

The system inventory must distinguish:
1. **Architecture** — what a module is responsible for.
2. **Implementation** — code, schema, workflows, routes, and UI that exist in the repository.
3. **Provider state** — actual configured services, permissions, secrets, buckets, and environments.
4. **Verification evidence** — validators, builds, tests, provider-side checks, logs, and dated results.
5. **Release status** — explicitly blocked, in progress, validated, or approved for a defined environment.

A file existing is not equivalent to a workflow working. A passing source guard is not equivalent to a successful authenticated integration test. A draft PR is not merged code. A merged change is not proof of a deployed or production-ready system.

## N00–N20 module ownership

| Module | Operating responsibility | Primary boundary / invariant |
| --- | --- | --- |
| **N00 — Constitution & Doctrine** | Constitution, doctrine, laws, Commander decisions, authority, non-negotiable operating rules. | Policy and approval authority must be explicit; implementation cannot silently override doctrine. |
| **N01 — Foundation & Runtime** | Monorepo/runtime foundation, Oracle Lite deployment discipline, environments, configuration and runtime boundaries. | Environment separation; no secrets in source; deployments must be evidence-led and reversible. |
| **N02 — Backend API Kernel** | Backend API, command/state machine, transitions, idempotency, policy gates and command results. | Validate commands server-side; reject invalid transitions; retries must not duplicate effects. |
| **N03 — PostgreSQL Truth Vault** | Authoritative persistence, read models, evidence records and audit history. | Durable state and audit trail are authoritative; derived views and mirrors cannot silently replace truth. |
| **N04 — Candidate Core** | Authentication, exact identity linkage, candidate profile and correction/review requests. | Authenticate first; bind to an existing candidate through an authorised stable identifier, never an email-only guess. |
| **N05 — Private Document Vault** | Document requests, private storage, upload/read lifecycle, extraction, verification, retention and deletion. | Owner-scoped access, least privilege, content validation, quarantine/scanning gates, auditable lifecycle and orphan reconciliation. |
| **N06 — Route Universe & Application Workbench** | Education and opportunity pathways, route discovery, application preparation and candidate workbench. | Route and application state must be traceable to current source evidence and candidate-owned records. |
| **N07 — Airtable Sync / Mirror** | Synchronise operationally useful records to and from explicitly approved Airtable surfaces. | Airtable is a mirror/adapter, not the authoritative truth store; sync must be scoped, idempotent and reconciled. |
| **N08 — Control Plane** | Operator control plane, read models, command surfaces and bounded operational actions. | Show source freshness and action authority; display-only controls must not imply an action occurred. |
| **N09 — Notifications & Communications** | Notification delivery, templates, preferences, retries and delivery evidence. | Respect consent and channel policy; delivery attempts/results are auditable and retries are controlled. |
| **N10 — Finance & Payments** | Packages, orders, invoices, PayFast ITN, payments, refunds and ledger. | Provider callbacks are untrusted until verified; financial transitions are idempotent, reconciled and auditable. |
| **N11 — AI Decision Support** | Recommendations, explanations, ranking and decision support. | AI recommendations do not replace authorised human decisions or governance controls. |
| **N12 — Governance & Review** | Approvals, risk, compliance, tribunal/review boundaries and separation of duties. | High-impact decisions require the correct authority, reason, evidence and appeal/review path. |
| **N13 — Observability & Resilience** | Health, queues, reports, incidents, backups, capacity and recovery evidence. | Health claims must come from observable evidence; backup existence is not proof of restore readiness. |
| **N14 — Provider & Workflow Adapters** | External provider integrations and workflow adapters, contracts, credentials boundaries and failure mapping. | Provider-specific logic stays behind explicit adapters; timeout, retry, idempotency and degraded-mode behavior are defined. |
| **N15 — Opportunity Engine** | Opportunity-source intelligence, freshness, eligibility/matching and provenance. | No invented opportunities or stale deadline claims; source, timestamp, confidence and review state are visible. |
| **N16 — Orchestrator / Execution Runtime** | Worker execution, scheduling, action dispatch, retries, compensation and recovery. | Workers are bounded executors; privileged decisions remain in policy/state-machine gates. |
| **N17 — Founder Command Ops** | Mobile cockpit, briefs, watchlist, escalations, operational decisions and closeout. | Commander actions are attributable; risk-bearing actions require explicit approval and evidence. |
| **N18 — Public Website / Route House** | Public front door, discovery, trusted information and transition into candidate workflows. | Public content must not claim private state or imply eligibility/admission/payment without evidence. |
| **N19 — Candidate Mobile / PWA** | Candidate mobile experience and continuity between public discovery and authenticated portal journeys. | Preserve identity/session boundaries, accessible mobile flows and continuity without bypassing server authorization. |
| **N20 — Final Integration & Release** | Cross-module integration, system lock, release gates and production-readiness evidence. | Release is evidence-gated; unresolved critical blockers keep production readiness false. |

## Cross-module operating contracts

- **Authority:** N00 defines policy; N02 enforces command/state transitions; N03 persists authoritative state and evidence; N12 owns required governance/review controls; N20 evaluates release evidence.
- **Identity:** N04 resolves the authenticated person to the exact candidate record. Other modules consume that binding rather than re-identifying by email or client-supplied IDs.
- **Documents:** N05 owns document lifecycle and access controls. N06 consumes only appropriately verified document state; N13 observes failures; N12 governs human review; N20 requires lifecycle evidence.
- **Money and entitlements:** N10 is the source of verified financial events. Service activation must depend on server-verified, correctly matched financial state and the authorised N11 fulfilment contract—not merely on an order existing.
- **External systems:** N07 and N14 adapt/synchronise external systems. Provider-side success must be reconciled into authoritative state; a local success message alone is not proof.
- **AI and automation:** N11 recommends; N16 executes only authorised, policy-approved work through N02/N12 boundaries. Neither AI output nor worker completion may silently grant authority.
- **Operations and release:** N08/N17 expose operational state and decisions; N13 supplies health/incident evidence; N20 consumes verifiable evidence and blocks release on missing critical proof.
- **Public-to-private continuity:** N18 discovers; N19 and N04 establish authenticated candidate continuity; N06 carries the application journey forward under server-side authorization.

## Minimum inventory record for every module

Track these fields in the module register or linked evidence record:

- module ID and name;
- responsibility and explicit non-responsibilities;
- owning package/team and dependency modules;
- source paths, API routes, data tables/migrations and provider adapters;
- commands, events, state transitions and idempotency keys;
- policy gates, permissions, data classification and audit events;
- validators, unit/integration/e2e tests and latest dated results;
- provider/environment configuration status without exposing secret values;
- dashboards, reports, alerts, retry/dead-letter/reconciliation and recovery behavior;
- known blockers, evidence links, next safe action and release impact;
- lifecycle status and last verified timestamp.

Use controlled evidence statuses such as **defined**, **planned**, **implemented-unverified**, **validated**, **blocked**, and **production-approved**. A status must link to its supporting evidence and environment. Do not label a module “live” solely because its UI or source file exists.

## Current implementation/evidence note

This document records the supplied operating architecture; it does not assert that every N00–N20 module is complete. Existing N05 document-vault work remains subject to its open draft pull requests and previously recorded failed/unverified CI state. In particular, document signature checks are not malware scanning, and staging bucket configuration, authenticated integration tests, quarantine/scanning, retention/deletion, and reconciliation require their own evidence. Keep `productionReady=false` until the release gate has the required evidence.

## Release acceptance checklist

- [ ] Architecture and ownership boundaries recorded for N00–N20.
- [ ] Module inventory populated with source paths and explicit dependencies.
- [ ] Database migrations reviewed and applied only through the approved environment process.
- [ ] Authenticated tests prove identity isolation and server-side authorization.
- [ ] Idempotency, retries, compensation and reconciliation are tested for side-effecting flows.
- [ ] Provider integration evidence comes from actual provider responses/configuration, with secrets redacted.
- [ ] Security, privacy, retention, deletion and audit controls have negative-path tests.
- [ ] Observability, backup/restore, incident and capacity evidence is current.
- [ ] CI, production build, integration tests and deployment checks are green for the target commit/environment.
- [ ] Human approvals, release sign-off and rollback procedure are recorded.
- [ ] No unresolved critical/high-risk blocker is misrepresented as complete.
