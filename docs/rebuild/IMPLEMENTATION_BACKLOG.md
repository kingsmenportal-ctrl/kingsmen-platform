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
- [x] Add a review-only official-opportunity research manifest from current Department of Employment and Labour pages and explicit closed-cycle records; do not seed or publish the records automatically.
- [x] Prepare six official Department of Employment and Labour adverts in a structured review-only pack, keeping walk-in and online deadlines separate; add a regression validator that prevents premature publication.
- [x] Correct the N15 source-ingestion operator's project-session handling, fix the internship matcher, configure origin-specific CORS and add a source-ingestion contract validator.
- [x] Deploy N15 source ingestion as active staging version 4 with JWT verification enabled and verify deployed source equality against the reviewed branch.
- [x] Deploy N15 candidate-opportunity feed as active staging version 4, with JWT verification enabled, a valid verified-link actor/timestamp gate, and explicit configured CORS origins; read back the deployed source.
- [x] Deploy candidate-master-profile version 6 with JWT verification enabled and read back the exact branch source.
- [x] Deploy candidate-master-applications version 3 with JWT verification enabled and read back the exact branch source. It lists own targets/events and idempotently records `TARGETS_PLANNED`; provider submission is not implemented. Authenticated runtime/E2E remains unverified.
- [x] Deploy N15 source review queue version 1 as a read-only reviewer-gated endpoint, with JWT verification enabled; read back the exact branch source.
- [ ] Confirm the actual portal origin via KINGSMEN_PORTAL_ORIGINS and register an authorized N15 source reviewer. Live source-review allowlist roles are PLATFORM_ADMIN, PROVIDER_OPERATOR, APPLICATION_REVIEWER and EVIDENCE_VERIFIER; current reviewer table has one IDENTITY_REVIEWER but zero reviewers with an allowed N15 source role. Preserve findings as NEEDS_REVIEW until human verification. The review queue must remain forbidden to non-reviewers.
- [ ] Decide repository visibility before adding proprietary or sensitive implementation detail.
- [ ] Fix the branch-protection evidence secret: the live workflow returns 403 when reading main protection. Keep the evidence gate fail-closed; configure a fine-grained GitHub token with repository Administration: read for `KINGSMEN_BRANCH_PROTECTION_READ_TOKEN`.
- [ ] Identify and configure the canonical Netlify Portal site in the connected Netlify account before publishing the candidate UI. The visible projects are the old Jarvis site and an empty unrelated site; do not use either as the Kingsmen Portal deployment target.
- [ ] Capture a reviewed backup/restore path before any database mutation. No backup/restore drill has yet been performed.

## Stream 1 — Candidate foundation
- [x] Pin frontend direct dependencies and regenerate the tracked npm lockfile; CI verifies exact top-level package-lock matches and runs `npm ci` for the web app.
- [ ] Verify Supabase Auth configuration and explicit verified identity linkage.
- [x] Remove the duplicate profile Edge Function declaration, add source-level contract assertions, and verify the active version 6 function exactly matches the branch source with `verify_jwt=true`.
- [ ] Review and test the proposed verified-identity helper replacement in a disposable database before preparing an active migration. The helper must resolve from `candidate_auth_identity_links` directly; do not depend on `candidate_accounts` (currently empty in staging).
- [x] Add a seven-case pgTAP regression test specification for pending/revoked/future/mismatched/missing/verified links; the static source validator is wired into `npm test`.
- [ ] Execute the pgTAP test only on a disposable database after the proposed helper is applied there. It has not been run against staging.
- [x] Build the candidate profile UI, registration/login/password-recovery screens, project-scoped session and refresh helper; source checks and production web build pass. Authenticated runtime proof remains outstanding.
- [ ] Complete first-time profile bootstrap, save/reload/re-login and consent withdrawal through an authenticated staging session. No authorised candidate session has been provided or exercised.
- [x] Implement the registration/login/password-recovery/profile source flow against Supabase Auth and backend profile persistence.
- [ ] Complete the authenticated first-profile bootstrap, save/reload/re-login and Candidate A/B isolation proof; there are currently no authorized candidate sessions or verified identity-link rows.
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
- [x] Add and deploy the first unified planning slice: verified-match-to-internal-target workflow across six pathways, list saved targets, active-consent and verified-identity gates. Live canonical catalogue tables remain empty, so this is not yet an end-to-end application lifecycle.
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
- [x] Observe full Kingsmen CI and Jarvis runtime checks on commit `7c5cc419e856e051f535c1d3b0a5f8bfa360175f`; focused repository tests, Deno Edge Function type-checking, API build, and web production build passed.
- [x] Fix the stale session-key validator assumption and re-run CI successfully. Main-branch-protection evidence still fails with HTTP 403 and is not bypassed.
- [ ] Run a real authenticated browser journey against the intended staging domain, including first profile bootstrap, save, reload, log out/re-login and a second candidate isolation test.
- [ ] Confirm the current Netlify domain is in the deployed Edge Function CORS allowlist before using the profile page in a live staging browser.
- [ ] Review consent wording and the applicable privacy/retention terms before a real candidate pilot.


### Latest scoped progress — 2026-11-19

- [x] Supabase staging `candidate-master-profile` version 6 is active with JWT verification and matches its branch source exactly.
- [x] Supabase staging `candidate-master-applications` version 2 is active with JWT verification and matches its branch source exactly.
- [x] The first unified application-planning UI/function is present on PR #320; it supports all six pathways, lists candidate-scoped activity events, and only creates internal `PLANNING` targets from verified, current source evidence with a confirmed future deadline.
- [x] Exact frontend dependency pins and lockfile are checked in; Next.js is pinned to 15.5.29; the full CI run passed.
- [x] Add six current official employment adverts to a review-only pack and wire a validator into `npm test`; no records were published or seeded.
- [ ] Populate the canonical opportunity schema through the gated evidence/reviewer workflow. Counts at review time: 0 candidate opportunity matches, 0 opportunity programmes, 0 providers, 0 source observations, 0 confirmed deadlines and 0 plan targets.
- [ ] Obtain authorized test-candidate sessions and activate an authorized platform reviewer; no verified candidate identity links or active reviewer accounts are present.
- [ ] Confirm `KINGSMEN_PORTAL_ORIGINS` contains the actual portal staging origin before browser E2E; no Netlify portal deployment is claimed by this update.
- [ ] Resolve the 403 in main-branch-protection evidence with a read-only fine-grained GitHub token, and complete migration-source reconciliation plus backup/restore review before any database migration.


### Official opportunity source pack — 2026-11-19

- [x] Add structured review-only records for Employment Service Practitioner, Admin Clerk Legal Services X4, Records Administrator X9, Claims Processors X8, Claims Credit Officer X5, and Client Service Officer: Paymaster.
- [x] Preserve current advert references and locations, advertised eligibility, source URLs, and separate walk-in (16:00) and online (23:59) closing times for 27 November 2026 in Africa/Johannesburg.
- [x] Add `validate-kingsmen-official-research-pack.mjs` to `npm test`; it rejects candidate-facing publication defaults and direct database import.
- [ ] Obtain a source-reviewer role already allowed by N15, then refetch each exact official page through the deployed ingestion path and have an authorized reviewer approve any opening claim.
- [ ] No live opportunity, provider, deadline or match rows were created from this pack.


### Verified-identity gate test preparation — 2026-11-19

- [x] Added `supabase/tests/20261119_verified_candidate_identity_gate.test.sql`: seven rollback-scoped tests for the helper replacement proposal.
- [x] Added `validate-kingsmen-verified-identity-gate-proposal.mjs` to root `npm test` to check canonical-link resolution, verified status/freshness and rollback-only test guardrails.
- [ ] The SQL test has not been run; no local PostgreSQL tooling or disposable Supabase branch was available in the current environment. Do not run it against live staging.
- [ ] Before a live migration, recover the remaining source files, capture/test a restorable backup, and run the pgTAP test plus Candidate A/B RLS tests in a disposable database.
