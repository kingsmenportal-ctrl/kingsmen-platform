# Kingsmen One — implementation backlog

This is the single ordered delivery map for the simplified rebuild. Reuse existing issues and code wherever possible; do not duplicate workstreams just to create a new tracking system.

## Stage 0 — Audit and preservation
- [x] Create a dedicated safe branch for the rebuild.
- [x] Record the simplified rebuild doctrine and phased exit criteria.
- [x] Capture a current read-only Supabase baseline.
- [ ] Inventory current repository routes, components, scripts and workflows.
- [ ] Build a file-by-file reuse/retire/archive map.
- [ ] Map live migration versions to source files and commits; explain duplicate 0078/0093.
- [ ] Inspect `candidate_auth_identity_links` provenance and dependencies.
- [ ] Confirm backup retention/plan, private Storage backup coverage and isolated restore capability.
- [ ] Verify repository visibility and branch protection options; present cost/governance implications before any change.
- [ ] Verify the existing Netlify site is linked to the canonical repo and capture real deploy metadata.

## Stage 1 — Foundation and identity
- [ ] Pin exact Next.js/React versions and reconcile lockfile metadata.
- [ ] Stabilise local/CI install and production build.
- [ ] Add/verify server-only Supabase client and session handling; prohibit service secrets in client code.
- [ ] Reconcile profile and consent contracts against live schema before creating anything.
- [ ] Test candidate profile save/reload/re-login for two separate identities.
- [ ] Verify all reciprocal cross-candidate reads/writes are denied.
- [ ] Define Founder role provisioning and server-side route guards.

## Stage 2 — Opportunity catalogue
- [ ] Reconcile canonical provider/opportunity tables and source-authority model.
- [ ] Ensure six pathways share one typed model and all plans see the same verified catalogue.
- [ ] Implement current-source/deadline/eligibility/freshness publication rules.
- [ ] Review source import and provider verification queues.
- [ ] Seed only reviewed, authoritative, current opportunities; do not fabricate OPEN records.

## Stage 3 — Unified applications
- [ ] Reconcile `applications`, `candidate_applications`, master application targets, tracker and CAO choice records.
- [ ] Define one canonical application lifecycle and append-only status events.
- [ ] Implement authenticated draft create/update/reload and idempotency.
- [ ] Implement CAO parent + ordered child choices with candidate ownership guards.
- [ ] Implement submission to Kingsmen separately from any provider transmission.
- [ ] Implement Founder application processing and candidate-facing timeline.
- [ ] Run Candidate A/B, duplicate request, status guard and re-login integration tests.

## Stage 4 — Documents and operations
- [ ] Map current document metadata tables and private buckets; confirm backup/restore.
- [ ] Enforce PDF/JPEG/PNG and 10 MiB server-side, SHA-256 and private object paths.
- [ ] Verify signed-link expiry/ownership/denial and sensitive identity evidence separation.
- [ ] Audit all 17 RLS-enabled/no-policy tables and define deliberate backend-only access.
- [ ] Review six authenticated SECURITY DEFINER functions and apply fixes through reviewed migrations only.
- [ ] Enable leaked-password protection.
- [ ] Implement Founder queues/actions, audit and manual MAP/Phoenix paths.

## Stage 5 — Finance and email
- [ ] Validate the eight-row canonical plan catalogue and pricing values.
- [ ] Prove PayFast sandbox checkout/ITN signature/merchant/amount/currency/reference/idempotency.
- [ ] Keep payment confirmation and entitlement granting server-side.
- [ ] Configure approved email provider and verified sender domain.
- [ ] Test outbox retry, duplicate event, bounce/opt-out, dead-letter and controlled replay.

## Stage 6 — Jarvis and durable work
- [ ] Reuse existing Jarvis typed contracts/policy gate/evidence ledger after audit.
- [ ] Bind only live authenticated read models and explicitly allowed commands.
- [ ] Enforce actor/scope/risk tier/idempotency and Founder approval for privileged work.
- [ ] Implement durable jobs, retry/backoff, dead-letter, recovery and queue health.
- [ ] Retain Playwright as QA/read-only scout until authorised external routes are approved.

## Stage 7 — Release and pilot
- [ ] Required CI passes on the exact reviewed commit.
- [ ] Migration/source/live parity reconciled and approved.
- [ ] Encrypted backup plus isolated restore and RPO/RTO evidence accepted.
- [ ] Security/accessibility/responsive/browser test suite passes.
- [ ] Netlify deploy ID and SHA match the reviewed release candidate.
- [ ] Authenticated Candidate A/B/Founder journey passes against that deployed SHA.
- [ ] Privacy/terms/support and incident processes reviewed.
- [ ] Founder explicitly approves pilot, then separately approves production/payments.

## Current tracked workstreams to reconcile, not duplicate

- PR #321 — unified application engine implementation contract.
- Issue #280 — P0 release integration and authenticated E2E proof.
- Issue #264 — migration reconciliation and backup/restore.
- Issue #265 — RLS, SECURITY DEFINER grants, leaked-password protection and candidate cap.
- Issue #274 — shared candidate application engine and CAO.
- Issue #249 — opportunity freshness and candidate-safe feed.
- Issue #267 — Netlify deployed SHA and authenticated routes.
- Issue #269 — PayFast sandbox/ITN.
- Issue #270 — durable email/outbox.
- Issue #272 — Jarvis/Founder action authorisation.
- Issue #283 — identity-link migration provenance.

## Status semantics

A checkbox is checked only when the action has been performed and evidence exists. Code written, a PR opened, or a command started is not the same as tests passed, runtime proven, deployed, or a business outcome achieved.
