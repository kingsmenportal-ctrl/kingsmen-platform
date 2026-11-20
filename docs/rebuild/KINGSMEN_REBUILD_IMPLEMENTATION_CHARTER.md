# Kingsmen Rebuild — Implementation Charter

**Status:** Active planning and implementation branch  
**Created:** 2026-11-20  
**Working branch:** `kingsmen-rebuild-2026-11-20`  
**Source of truth:** canonical GitHub repository; existing live Supabase project remains authoritative until an approved migration plan says otherwise.

## Mission

Deliver a simpler Kingsmen platform without discarding working business logic, security controls, designs, migration history or operational evidence. The first product outcome is a complete candidate-to-founder-to-candidate application journey. Jarvis and advanced automation are built on top of that working, permissioned foundation.

## Non-negotiable operating rules

1. Do not modify `main` directly during rebuild work.
2. Do not delete existing branches or implementation.
3. Do not create a second production backend or database by default.
4. Do not run destructive SQL, restore a project, create a billable Supabase branch, or change production data without explicit approval.
5. Keep credentials and candidate data out of GitHub, chat, logs and test fixtures.
6. No launch claim without deployed-runtime evidence.
7. Do not mark an opportunity verified without source evidence and a recorded verification decision.
8. Distinguish submitted to Kingsmen, prepared for provider, provider submission and provider receipt.
9. Grant entitlements only from verified, idempotent server-side payment events.
10. Jarvis must respect backend permissions, policy gates, approvals and audit/evidence recording.
11. Retain manual operations and recovery paths; automation is not the only route to completing a case.
12. Use test accounts and synthetic personal data in automated tests.

## Product acceptance target

A test candidate can register, verify/sign in, maintain a persistent profile, discover a verified opportunity, draft and submit an application to Kingsmen, and later see its truthful state after re-login. An authorised founder/operator can inspect and process the case, record an action with an audit trail, and request additional information. Candidate A cannot read or alter Candidate B's records or documents.

External provider submission is a separate action and is not implied by submission to Kingsmen.

## Delivery stages

### Stage 0 — Inspect and preserve
- Inventory source files, branches, migration history, contracts, pages, components, tests and launch evidence.
- Reconcile live Supabase migration ledger with checked-in migration files, read-only.
- Verify repository visibility/licensing and identify reusable implementation.
- Deliver an audit report and old-to-target mapping.

**Exit:** safe baseline, known gaps, no discarded data/code.

### Stage 1 — One stable application foundation
- Review and pin compatible framework/runtime dependencies in a separate change.
- Establish clear feature modules and shared design tokens/components.
- Confirm auth and server-side permission patterns.
- Establish a reproducible local build and minimum CI suite.

**Exit:** reproducible build and secure authenticated session.

### Stage 2 — Candidate identity and profile
- Registration, sign-in/out, verification and recovery.
- Persistent profile and consent history.
- RLS and server-side authorization tests.

**Exit:** two synthetic candidates persist their own profiles and cannot access each other.

### Stage 3 — Verified opportunity catalogue
- Shared provider/opportunity/source-evidence model.
- Six pathway views: Higher Education, TVET, SETA/Learnerships, Internships, Apprenticeships and Employment.
- Search, filters, deadlines, eligibility, verification and freshness checks.

**Exit:** candidates can discover real, evidence-backed opportunities; unverified listings are not represented as verified/open.

### Stage 4 — Unified application engine
- Reusable profile-backed form, opportunity-specific questions, drafts, document references, submission and event history.
- Founder application queue and candidate status timeline.
- CAO parent application with ordered programme choices.
- Separate internal processing and external provider receipt evidence.

**Exit:** complete authenticated end-to-end candidate/founder journey persists through re-login.

### Stage 5 — Operations and documents
- Private document storage, access controls, signed-link expiry and review workflow.
- Founder queues, assignments, approval gates, audit and manual fallback.
- MAP/Phoenix recovery operations.

**Exit:** case can be managed from candidate upload to founder review and candidate update with evidence.

### Stage 6 — Finance and communications
- Canonical plan catalogue, orders, payment events, entitlement and usage ledger.
- PayFast sandbox signature/merchant/amount/currency verification and idempotency.
- Email outbox, retries, delivery evidence and consent checks.

**Exit:** sandbox payment grants entitlement exactly once; communications are traceable.

### Stage 7 — Controlled automation and Jarvis
- Durable job processing, retries, dead-letter recovery and health.
- Jarvis read-only inspection first, then approval-bound actions.
- No permission bypass or unauthorized external submissions.

**Exit:** real operations can be inspected/assisted with recorded policy and execution outcomes.

### Stage 8 — Runtime evidence and controlled pilot
- Unit/integration/RLS/E2E tests, restore drill, secrets wiring and deployment evidence.
- Resolve every P0 blocker in `docs/launch/KINGSMEN_LAUNCH_READINESS.md`.
- Limited founder-approved pilot only after review.

**Exit:** actual deployed journeys pass; critical security/data integrity defects are resolved; evidence is reviewed.

## Initial technical posture

- Frontend: existing Next.js/React/TypeScript application.
- Data/auth/files: existing Supabase/PostgreSQL/Auth/Storage, subject to audit.
- Hosting: existing Netlify connection; no deployment change until project and deploy mapping are verified.
- Source and CI: GitHub with isolated branches and reviewable commits.
- Tests: focused unit/business tests, database/RLS integration tests and Playwright E2E.
- AI: optional and non-critical; core workflows must work without an LLM.

## Release evidence minimum

Each milestone must record:
- commit SHA and changed paths
- automated test command and result
- database migration status, if applicable
- runtime/browser result, or explicitly state not yet verified
- security and data-integrity implications
- outstanding blockers and founder decisions needed

## Founder decisions required only when relevant

- Repository privacy/licensing before adding proprietary implementation if the repository is public.
- Approval before recovery/restoration, billable resources, destructive database operations or production data changes.
- Final privacy/consent/legal wording and retention policy before real candidates.
- Provider permissions and candidate consent before any external submission.
- PayFast sandbox credentials via secure platform configuration, never chat.
- Separate approval for production payments, pilot and public launch.
