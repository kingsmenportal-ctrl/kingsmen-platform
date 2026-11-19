# Kingsmen One — Implementation Backlog

**Branch:** `rebuild/kingsmen-one-phase0-2026-11-19`  
**Baseline:** `main` at `cb1b98243d46c9a790030af041f78113558e3f30`  
**Rule:** Each stream stays independently releasable, but its own security and runtime gates must pass before user exposure.

## Phase 0 — Recover, preserve, audit
- [x] Verify canonical repository and record the main baseline SHA.
- [x] Confirm current Supabase staging project state and read migration/schema metadata.
- [x] Record migration duplication, empty core catalogue tables and security-advisor findings.
- [x] Create an isolated rebuild branch.
- [ ] Reconcile all migration files under source control with the live 130-entry ledger.
- [ ] Decide repository visibility before adding proprietary or sensitive implementation detail.
- [ ] Capture a reviewed backup/restore path before any database mutation.

## Stream 1 — Candidate foundation
- [ ] Pin/verify frontend dependency versions from a reproducible lockfile.
- [ ] Verify Supabase Auth configuration and explicit verified identity linkage.
- [ ] Build or consolidate the candidate registration/login/profile journey against real Supabase persistence.
- [ ] Record consent version/text and ensure revocation prevents prohibited processing.
- [ ] Prove save/reload/re-login persistence.
- [ ] Prove Candidate A cannot read or modify Candidate B's profile, applications or documents.
- **Exit:** two isolated test candidates complete the same journey across independent sessions; database and browser evidence is redacted and reproducible.

## Stream 2 — Verified opportunity catalogue
- [ ] Review the existing provider/opportunity schema before introducing more tables.
- [ ] Establish official source authorities, evidence references, verification reviewer and freshness rules.
- [ ] Ingest a small, manually reviewable sample across all six canonical pathways.
- [ ] Require official source, eligibility, deadline/intake as applicable, current evidence and recorded verification for an “open” label.
- **Exit:** candidates can search the verified sample; stale/unverified/unresolved records are not shown as open recommendations.

## Stream 3 — Unified application engine
- [ ] Use one candidate application lifecycle across all six pathways.
- [ ] Save drafts and capture submission/event history durably.
- [ ] Connect reusable candidate profile and private documents.
- [ ] Represent CAO as one parent with ordered child choices.
- [ ] Keep Kingsmen submission, provider preparation, provider receipt and provider decision distinct.
- [ ] Build candidate timeline and founder application workbench.
- **Exit:** one authenticated candidate completes a Kingsmen application, an operator processes it, and the candidate sees the persisted truthful status after re-login.

## Stream 4 — Founder operations and documents
- [ ] Consolidate queues into candidate, application/route, catalogue, document/review, finance/capacity and governance/recovery workspaces.
- [ ] Keep privileged operations behind server-side role checks, policy gates and audit events.
- [ ] Validate private PDF/JPEG/PNG uploads up to 10 MiB, compute SHA-256, use private storage and expiring links.
- [ ] Separate sensitive identity evidence; preserve reviewer decisions and reasons.
- **Exit:** a full document-review case can be run without cross-candidate access or unaudited privileged writes.

## Stream 5 — Finance and communications
- [ ] Preserve canonical ZAR-cent plan catalogue and existing commercial rules.
- [ ] Verify PayFast sandbox ITNs server-side (signature, merchant, amount, currency and idempotency).
- [ ] Make payment events replay-safe and grant entitlements only from verified server-side events.
- [ ] Use durable email outbox, retries and delivery evidence; email is primary.
- **Exit:** sandbox settlement grants the correct entitlement exactly once; notification attempts and outcomes are traceable.

## Stream 6 — Controlled automation and Jarvis
- [ ] Durable job/outbox processing with retry, backoff and dead-letter recovery.
- [ ] Read-only operations/research and QA first.
- [ ] Founder-approved action registry, evidence and action history.
- [ ] Keep MAP/Phoenix manual fallback; no unauthorized external submission.
- **Exit:** Jarvis operates only through authenticated, allowlisted commands and cannot bypass founder gates.

## Release evidence — required for every stream
- [ ] Source commit SHA and review state.
- [ ] Automated unit/business/security tests.
- [ ] Live authenticated browser journey on the target environment.
- [ ] Relevant database/RLS/storage/payment evidence.
- [ ] Deployment ID and deployed SHA only when independently verified.
- [ ] No unresolved critical security or data-integrity defect in the released scope.

## Guardrails
No force-merges, fabricated approvals, production claims from CI alone, public candidate launch before the scoped release gates pass, or destructive schema/source changes before backup and review.
