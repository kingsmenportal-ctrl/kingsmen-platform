# Kingsmen One — Simplified Rebuild Program

**Version:** 1.0  
**Record date:** 20 November 2026  
**Canonical repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Working branch:** `rebuild/stage-0-audit-foundation`  
**Status:** Stage 0 audit in progress; this document is the governing implementation plan, not a claim that later stages are complete.

## Objective

Deliver one coherent Kingsmen platform that preserves valuable existing work while simplifying implementation, operations, security and release. Do not create a competing product, discard the canonical repository, or treat an AI-builder prototype as production infrastructure.

## Target architecture

- **One application:** the existing Next.js / React / TypeScript app in `apps/web`, with public, candidate and Founder Control Plane workspaces.
- **One authoritative database:** the existing Supabase/PostgreSQL project, if recovery and health checks validate it. Do not add Neon or another production database.
- **One candidate application engine:** shared profile, opportunity/application lifecycle, ordered CAO child choices, evidence and status history.
- **One privileged Founder Control Plane:** shared operational workspaces with server-side authorisation.
- **Jarvis:** a controlled assistant over real Kingsmen services; read-only by default and approval-gated for privileged operations.
- **One controlled frontend deployment path:** the existing Netlify project, after GitHub linkage and exact deploy SHA can be verified.
- **Governance:** GitHub source and reviews; Notion for decisions/evidence index; Canva for design/architecture references.
- **Communications:** email only until separately approved provider tests pass. WhatsApp/SMS are not enabled by this plan.
- **Automation:** durable database-backed jobs/outbox first. Playwright is QA/read-only scouting unless explicit provider authorisation, candidate consent and required Founder approval exist.

The separate `apps/api` service is not assumed to remain a separately deployed product. First inventory its useful business logic and persistence boundaries. Migrate that logic into Next.js server route handlers or narrowly scoped Supabase Edge Functions where appropriate. Retire the separate API deployment only after equivalent behaviour and tests exist; never copy its in-memory development store into production.

## Non-negotiable product rules

1. One authenticated candidate account and reusable profile.
2. All six core pathways are discoverable on every plan: Higher Education, TVET, SETA programmes and learnerships, Internships, Apprenticeships and Employment.
3. Plans affect priority volume, managed-service level and concurrent capacity, not general catalogue visibility.
4. Applications are completed and tracked within Kingsmen. External provider URLs can document an authorised route but are not a substitute for the Kingsmen application journey.
5. CAO is one Kingsmen parent application with ordered programme-choice child records.
6. Source discovery is not verification. Candidate-facing OPEN requires official source evidence, deadline/intake, eligibility, freshness and a recorded verification decision.
7. Candidate-reported submission, submission to Kingsmen, authorised provider transmission, provider receipt and provider decision are different events.
8. The browser cannot grant paid entitlements, claim provider receipt, approve identity, or make privileged operational decisions.
9. Jarvis cannot invent truth, bypass access controls, or autonomously approve identity, admission, funding, payment/refund or production release.
10. Do not apply new staging DDL/imports until migration provenance and approved backup/restore gates pass.

## Target business domains

Use existing canonical tables when fit; this is a logical model, not a requirement to create exactly 18 tables.

- **Identity:** profiles, roles/permissions, consent events.
- **Catalogue:** providers, opportunities, evidence and verification history.
- **Applications:** parent application, typed pathway data, CAO choices, append-only events.
- **Documents:** private document metadata, identity-review requests/evidence/decisions.
- **Finance:** plan catalogue, orders, payment events, usage ledger.
- **Operations:** jobs, email outbox, approvals, audit and incident records.

Do not create a duplicate table just to match the proposed model. Reconcile names, foreign keys, ownership, existing data and RLS before any schema change. Prices remain integer cents and plan rules come from the canonical finance catalogue; do not use legacy `entitlement_snapshot` as authority.

## Rebuild stages and exit conditions

### Stage 0 — Recover, inventory and preserve
- Inspect repository structure, current default branch/head, dependencies, UI routes, components, API, scripts, CI and deployment configuration.
- Inspect Supabase project status, PostgreSQL version, migration ledger, schema, functions, security advisors, candidate/profile/application/finance/catalogue/document counts and storage configuration where available.
- Map each migration-ledger entry to a source migration and commit. Investigate duplicate 0078/0093 names and all source/live divergence.
- Inventory backups and recovery options. Confirm an isolated restore and parity checks before any database-changing release work.
- Record reusable components/business rules, unresolved risks, environment/secrets references (names only, never values), and the branch/PR plan.
- Preserve the current `main` branch and all assets; do not perform broad deletion/archiving during the audit.
- **Exit:** evidence-backed inventory, recovery recommendation, component/rules reuse map, migration reconciliation register, and a safe work branch.

### Stage 1 — Stable foundation and identity
- Standardise the Next.js/React/TypeScript toolchain with exact framework versions and lockfile consistency.
- Reuse the existing design tokens and premium navy/gold design direction.
- Establish authenticated server-side Supabase access, profile/consent persistence and roles.
- Implement public, auth, candidate and founder shells using shared accessible components.
- Test two separately authorised candidates, profile save/reload/re-login, and reciprocal isolation.
- **Exit:** two test candidates can persist and recover their own data after re-login; neither can access the other's records; production build is reproducible.

### Stage 2 — Verified opportunity catalogue
- Build the shared provider/opportunity/evidence model and founder verification workflow on reconciled schema.
- Implement all six pathways, search, filters, eligibility, deadline/timezone and freshness behaviour.
- Start with a reviewed, manageable number of genuine opportunities; extend imports through repeatable ingestion.
- Never auto-reopen expired, lapsed, cancelled, stale or unverified records.
- **Exit:** candidates can search the six pathways and only properly verified current openings are advertised as OPEN.

### Stage 3 — Unified application engine
- Reuse the authenticated profile and verified catalogue.
- Build one adaptive application flow, durable draft/resume/update, document references, submission to Kingsmen, event history, truthful candidate tracker and founder application queue.
- Implement CAO as one parent with ordered child programme choices.
- Enforce idempotency, optimistic versioning, server-side eligibility and plan-capacity checks.
- Keep candidate submission distinct from provider transmission/receipt/decision.
- **Exit:** an authenticated candidate completes an application inside Kingsmen, authorised Founder Operations processes it, and the candidate sees persisted truthful status after re-login.

### Stage 4 — Founder operations and secure documents
- Consolidate twelve capabilities into shared workspaces: Command Center; Candidate Operations; Application Operations; Catalogue Operations; Document Operations; Finance Operations; Governance and Recovery; Jarvis.
- Implement Document Vault uploads (PDF/JPEG/PNG, server-enforced 10 MiB limit, SHA-256, private paths, authorised short-lived signed links).
- Separate ordinary application files and sensitive identity evidence with explicit policies.
- Implement reviewer decisions, evidence links, requests for information, assignment, audit and controlled MAP/Phoenix manual paths.
- **Exit:** a case moves from candidate upload through authorised human review to a recorded candidate-facing update; cross-candidate and unauthorised reviewer tests pass.

### Stage 5 — Finance and communications
- Use the canonical plan catalogue and integer-cent prices.
- Implement order/payment/usage ledger, server-side PayFast sandbox checkout and ITN verification (signature, merchant, amount, currency, reference, status, replay/idempotency).
- Entitlements only follow verified persisted settlement.
- Implement email outbox, templates, consent/purpose checks, retries, dead-letter/replay and delivery history. Provider remains NOT_CONFIGURED until authorised credentials and sender verification are evidenced.
- **Exit:** sandbox settlement creates the correct entitlement once; invalid/replayed/mismatched callbacks are rejected; email delivery/retry evidence is traceable.

### Stage 6 — Durable operations, controlled automation and Jarvis
- Implement durable jobs, bounded retry/backoff, dead-letter queues, controlled replay and operational health.
- Connect Jarvis to authenticated deterministic commands and live evidence.
- Separate proposal/preview from execution; record actor, approver, policy decision, sanitised input/output, correlation ID and outcome.
- Keep browser automation read-only unless provider authorisation, candidate consent and required Founder approval are all evidenced.
- **Exit:** normal workflows remain usable without AI; Jarvis respects execution-time permissions, idempotency and approval gates.

### Stage 7 — Release and limited pilot
- Required CI: formatting/lint, TypeScript, unit/business rules, DB/RLS integration, security checks, production build and Playwright candidate/founder journeys.
- Verify backup restoration, storage/object parity, RPO/RTO, secrets wiring, alerts/redaction and payment/email boundaries.
- Deploy to the existing staging site through one controlled path and record deploy ID, URL, commit SHA, build log and timestamp.
- Run authenticated end-to-end tests against that exact deployed commit.
- **Exit:** no unresolved critical security/data-integrity defects; independent review and Founder pilot approval are recorded. Production/payments require separate approval.

## Security and privacy baseline

- Never expose Supabase service-role/secret keys, PayFast credentials, or provider credentials in browser bundles, repository files, screenshots or logs.
- Resolve candidate identity from verified server-side auth; do not link accounts by email matching alone.
- RLS and server-side authorisation are implemented together. Use least privilege; never add broad policies to silence advisors.
- Review every exposed SECURITY DEFINER function's owner checks, `search_path`, effective grants and caller identity; move private helpers out of exposed schemas where appropriate.
- Keep reviewer and Founder operations backend-authorised; UI visibility is not authorisation.
- Implement privacy notice, consent versions, purpose limitation, access/correction/deletion/retention and incident workflows with appropriate South African legal/privacy review before real-candidate launch.
- Do not put document bytes or signed URLs in public records or telemetry.
- No migration execution, production deployment, payment activation, privileged access provisioning, repository visibility changes or destructive action merely because this plan exists.

## Plans to preserve

| Plan | Price | Priority applications | Concurrent capacity |
|---|---:|---:|---:|
| Foundational Accord | R169.99 | 5 | 4 |
| Collegiate Ordinance | R299.99 | 10 | 8 |
| Chancellor's Writ | R399.99 | 15 | 10 |
| Regency Mandate | R469.99 | 15 | 12 |
| Artisan Charter | R149.99 | 5 | 3 |
| Guildmasters Charter | R199.99 | 8 | 5 |
| Free Destiny Map | R0.00 | Free tier | No paid entitlement |

Foundational Accord retains eight accommodation routes. CV Revamp remains a standalone R49.99 service with 15 CV versions and 15 motivation letters (target three business days). Its conditional extra two-route benefit applies only after the existing required ownership verification and upgrade. These policies must be reconciled with the live finance catalogue before use; they are not permission to seed or change production prices.

## Founder/operator decisions required later

- Approve cloud billing/project recovery actions if the provider presents a charge or irreversible change.
- Decide repository visibility after reviewing GitHub plan/branch-protection implications; do not change it silently.
- Approve candidate consent, privacy, legal, terms, refund and service wording before launch.
- Provide provider authorisation and candidate consent for external submission routes.
- Configure PayFast sandbox and transactional email through secure account settings, never in chat.
- Approve privileged roles and Founder/Jarvis action boundaries.
- Approve limited pilot, production payment activation and public launch separately.

## Progress reporting standard

Each milestone report must distinguish **implemented**, **automated tests passed**, **runtime verified**, **deployed**, and **business outcome verified**. State exact commit and evidence. A project URL, source-level validator, workflow start, documentation change or green CI alone is not production completion.
