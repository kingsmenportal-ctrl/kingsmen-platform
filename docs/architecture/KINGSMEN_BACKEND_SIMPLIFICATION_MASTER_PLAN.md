# Kingsmen Backend Simplification Master Plan
Date: 2026-10-29. Status: staged implementation plan; no destructive consolidation authorized.

## Canonical pricing and entitlements
Prices are ZAR integer cents: Foundational Accord 16999; Collegiate Ordinance 29999; Chancellor’s Writ 39999; Regency Mandate 46999; Artisan Charter 14999; Guildmasters Charter 19999; CV Revamp 4999.
Priority applications: 5, 10, 15, 15, 5, 8; CV Revamp is standalone and has no package application allowance.
30-day concurrent managed routes: 4, 8, 10, 12, 3, 5, 0 respectively. These are different measures and must never be conflated. Foundational includes eight accommodation routes at no extra charge; accommodation support remains available on every plan. CV Revamp delivers 15 personalised CV versions and 15 matching motivation letters, target 3 business days after complete intake. The +2 managed-route bonus applies only after eligible package ownership/upgrade is verified. Preserve historical order/payment snapshots.

All packages can discover all six pathways: Higher Education, TVET, SETA programmes/learnerships, Internships, Apprenticeships and Employment. One candidate account, reusable profile and core form. CAO is one Kingsmen parent application with programme choices as children. Candidate-reported submission differs from provider-confirmed receipt, decision and outcome. AI supports; humans/providers decide. Never promise outcomes or market an unverified opening. Email primary; WhatsApp/SMS disabled. MAP first, Phoenix fallback; Playwright probe/scout only. Initial cap 500 active candidates; scale gates 1k/5k/10k/25k.

## Evidence baseline inspected 2026-10-29
- Supabase staging project euhubhhnumtibbyufghm is ACTIVE_HEALTHY, PostgreSQL 17.11.
- 230 public tables were returned with RLS enabled; migration ledger contains 122 entries.
- Overlap families: route_* and opportunity_*; applications, candidate_applications, candidate_route_applications, candidate_application_tracker and candidate_master_application_*; service_packages, finance_plan_catalog and public_website_package_cards; orchestrator_*, workflow_*, integration_*, control_plane_* and founder_*.
- Sample live counts: candidates 2; applications 2; evidence ledger 4; audit events 3; source authorities 21; route categories 10; route providers 3; route programmes 8; finance_plan_catalog 8; public website package cards 7; service_packages 7. Most new operational tables are empty; this means missing proof, not healthy.
- Reconcile PRs #170/#171/#172/#173/#174/#176/#206/#207 and historical migration 0078/0097 evidence; open PRs are not release proof.
- Netlify staging exists but exact published SHA must be verified. Lovable project “Kingsmen Portal Temporary” latest inspected commit 03f02afb03365c3e92ab2b23b033344753a92d00 is NOT approved for release promotion. Replit “Kingsmen Gateway” is old and optional. Airtable billing base is a mirror, not system of record. A separate Airtable “Kingsman Nexus (MSB)” base contains overlapping student/profile/application, workflow/configuration, capability, document, WhatsApp/SMS and secret-reference structures; treat it as legacy operational evidence, not authority. No connected Neon projects were found. Canva search returned unrelated executive-command designs only.

## Target architecture
One operational database and one deployment by default; eight modular code domains:
1. Identity/profile/consent/provenance.
2. Verified opportunity catalogue (source/provider/programme/deadline/fee/eligibility/freshness).
3. Unified application engine (parent/child choices, state machine, evidence/events).
4. Private Document Vault and identity review.
5. Versioned plan catalogue, orders/invoices/payments/entitlements/usage ledger.
6. Durable orchestration (queue/outbox/inbox, idempotency, lease, retry, dead-letter/manual handoff).
7. Email communications and delivery evidence.
8. Founder operations (health, queue, incidents, capacity, finance, release evidence).
These are modules over Supabase, not separate microservices.

## Canonical write-model rule
Build a table-by-table authority/dependency matrix for every overlap. Map foreign keys, views, RPCs, triggers, RLS policies, storage policies, Edge Functions, API/web routes, worker references, jobs, Airtable syncs and actual row usage. Choose one canonical write model per domain. Other representations remain read adapters, immutable event history or explicitly deprecated only after all consumers/traffic are zero. Never drop/rename tables based on names alone.

## Safe migration method
1. Inventory schema objects, migration drift, grants/default ACLs, policies, indexes, auth/storage settings, functions and backup evidence.
2. Record for each table: authority, consumers, data provenance, retention, target, migration, validation and rollback.
3. Add typed contracts and compatibility adapters; route new writes through canonical domain APIs.
4. Expand/backfill/validate/contract in small batches with stable IDs and count/hash/FK/status parity. Avoid uncontrolled dual writes.
5. Move consumers one at a time and add contract tests; observe legacy access until zero.
6. Stop legacy writes only after zero consumers and an agreed observation window. Archive/deprecate only after backup/restore proof and review.
7. Never edit an applied migration body; use reviewed corrective migrations with preflight, postconditions and rollback/forward-fix.

## State machines
Opportunity: discovered → source checked → verification pending → verified open → stale/closed/withdrawn. Only verified-open is marketed as open.
Application: draft → ready/preparation → candidate approval → queued → submission attempt → candidate-reported submitted OR provider-confirmed received → provider decision/outcome. Failure routes to recoverable/manual handoff with evidence.
Identity: request → private evidence → reviewer pending → needs information/rejected/approved. Approval requires accepted evidence, exact candidate-reference match, authorized reviewer, conflict checks, verified link and audit.
Payment: pending → ITN received/unverified → verified settlement → entitlement activated. Validate signature, merchant, amount/currency, reference, status and replay. Atomically reconcile intent/order/invoice/payment/evidence; no entitlement before verified settlement.

## Security and frontend
RLS bound to verified immutable Auth UUID; prove Candidate A cannot read/write Candidate B. No authorization from user-editable metadata or email-only identity linking. No service-role key in browser. Private Document Vault accepts PDF/JPEG/PNG up to 10 MiB with MIME/signature and ownership checks plus short-lived signed URLs. Least-privilege IDENTITY_REVIEWER and FOUNDER grants; POPIA consent/minimisation/retention/audit; inspect effective ACL/default grants and function execute privileges. Secrets remain in runtime secret store. No bypass of branch protection, SSO, reviews, CI or founder approval.
Keep the premium accessible responsive Kingsmen frontend: one shell, reusable form, six pathways, clear status/progress, package/capacity wording, accommodation support, opportunity freshness and graceful manual fallback. Add accessibility, keyboard, mobile and screenshot regression checks. Do not deploy/promote the rejected temporary generic website.

## Payment and orchestration
PayFast sandbox only until real checkout and ITN proof. Test invalid signature/merchant/amount/reference/status, incomplete payload, duplicate ITN, transient settlement failure/retry and recovery. Keep ITN receipt and settlement evidence distinct. Settlement RPC service-role-only.
One durable job abstraction with allowlisted handlers, idempotency, lease expiry, bounded retry/backoff, dead-letter and manual handoff. Unknown actions fail closed. Human approval and evidence precede irreversible provider action. MAP is primary assisted/manual portal path, Phoenix fallback. Unconfigured providers report NOT_CONFIGURED, never green by inference.

## Work batches and gates
0. Full repo/schema/functions/policies/storage/PR/deploy inventory; recover migration 0078 and review 0097/#206; backup/restore; dependency matrix.
1. Canonical typed contracts and catalog parity validator; reconcile live prices/limits before writes.
2. Auth/profile save-reload-update, private upload/signed URL expiry, identity review/evidence/decision/link/audit, candidate A/B isolation.
3. Canonical verified opportunity read API; source/deadline/eligibility; six pathways and accommodation.
4. Unified application engine, CAO child choices, preparation, duplicate prevention, evidence-backed states, MAP/Phoenix fallback and tracker persistence.
5. PayFast sandbox, ITN, atomic settlement, invoice/receipt/evidence, entitlement activation and replay/recovery tests.
6. Real worker process-kill/restart around claim/send boundary, retry/dead-letter recovery, webhook idempotency, email-only.
7. Founder live brief with persisted evidence, freshness budgets, incident/queue/finance/health, audited grants and PII-safe output.
8. Premium frontend integration, accessibility, responsive and visual regression.
9. RC1: immutable reviewed SHA, locked install, API/web builds, combined suite, schema/security/backup evidence, reviewed staging migrations, Netlify deployed SHA match, real authenticated candidate/reviewer journey, candidate isolation, PayFast sandbox proof and founder approval.
10. Scale tests at 500 then 1k/5k/10k/25k with queue/load/cost/backup/SLO evidence.

## Acceptance and evidence
Unit tests: integer-cent pricing/entitlements, state machines, freshness, idempotency/retry. Integration: DB transactions, parent/child integrity, payment settlement, queue leases, audit/outbox. Security: RLS A/B, reviewer/founder roles, revoked grants, storage ownership/signed URL expiry, secret exposure, payment spoof/replay, ACL/function privileges. Data: migration drift, 0078 semantic parity, row/hash/FK parity and catalogue reconciliation. E2E: real mailbox OTP, profile save/reload/update, identity evidence/reviewer decision/link/audit, application choices/docs/tracker, verified opportunity, PayFast sandbox ITN, founder brief and Netlify route/SHA match. Failure: provider timeout, MAP→Phoenix, retry exhaustion, worker kill before/after SENT, duplicate webhook/ITN, stale listing, missing secret and restore.
Implemented/tested/deployed/E2E are separate metrics. Pin exact SHA, CI run, migration ledger, environment, timestamp, deployment ID and redacted output. A plan, merge, build, applied migration or empty table is not production readiness.
