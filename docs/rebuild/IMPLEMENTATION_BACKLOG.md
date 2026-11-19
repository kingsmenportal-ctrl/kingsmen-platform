# Kingsmen One — Implementation Backlog

**Branch:** `rebuild/kingsmen-one-phase0-2026-11-19`  
**Baseline:** `main` at `cb1b98243d46c9a790030af041f78113558e3f30`  
**Rule:** Each stream stays independently releasable, but its own security and runtime gates must pass before user exposure.

## Phase 0 — Recover, preserve, audit
- [x] Verify canonical repository and record the main baseline SHA.
- [x] Confirm current Supabase staging project state and read migration/schema metadata.
- [x] Record migration duplication, empty core catalogue tables and security-advisor findings.
- [x] Create an isolated rebuild branch.
- [x] Recover 63 timestamped applied-migration body snapshots and seven late numbered SQL sources from historical branch evidence; preserve unverified 0087 outside active migration directories.
- [ ] Complete the row-by-row map for all 130 ledger entries; resolve the 26 rows without a direct source filename match and independently compare both duplicate 0093 source bodies.
- [ ] Decide repository visibility before adding proprietary or sensitive implementation detail.
- [ ] Fix the branch-protection evidence secret: the live workflow returns 403 when reading main protection. Keep the evidence gate fail-closed; configure a fine-grained GitHub token with repository Administration: read for `KINGSMEN_BRANCH_PROTECTION_READ_TOKEN`.
- [ ] Capture a reviewed backup/restore path before any database mutation. No backup/restore drill has yet been performed.

## Stream 1 — Candidate foundation
- [ ] Pin/verify frontend dependency versions from a reproducible lockfile.
- [ ] Verify Supabase Auth configuration and explicit verified identity linkage.
- [x] Remove the duplicate profile Edge Function declaration, add source-level contract assertions, and deploy/read back the corrected function as active version 5 with `verify_jwt=true`.
- [ ] Review and test the proposed verified-identity helper replacement in a disposable database before preparing an active migration. The helper must resolve from `candidate_auth_identity_links` directly; do not depend on `candidate_accounts` (currently empty in staging).
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


## Implementation status — 2026-11-19

### Landed on the rebuild branch (source only; not deployed)
- [x] Record the Kingsmen One doctrine, Phase 0 read-only audit and staged implementation backlog.
- [x] Correct the public homepage taxonomy to show the six canonical pathways as distinct routes.
- [x] Add a canonical-pathway regression validator to `npm test`.
- [x] Implement `/candidate/profile` against the existing authenticated `candidate-master-profile` Supabase Edge Function.
- [x] Add project-scoped Supabase browser-session token access; do not scan for or use a token from another Supabase project.
- [x] Build profile load/save, reusable candidate details, six pathway preferences, explicit consent acceptance, consent withdrawal and server-returned completeness / identity / persistence indicators.
- [x] Add a candidate-profile contract validator to `npm test` and a dashboard link to the profile page.

### Still required before this slice can be treated as release-ready
- [ ] Observe the latest GitHub Actions test/build runs after all profile commits; earlier CI success applied to the earlier six-file PR head only.
- [ ] Fix any fresh CI failures and re-run.
- [ ] Run a real authenticated browser journey against the intended staging domain, including first profile bootstrap, save, reload, log out/re-login and a second candidate isolation test.
- [ ] Confirm the current Netlify domain is in the deployed Edge Function CORS allowlist before using the profile page in a live staging browser.
- [ ] Review consent wording and the applicable privacy/retention terms before a real candidate pilot.
