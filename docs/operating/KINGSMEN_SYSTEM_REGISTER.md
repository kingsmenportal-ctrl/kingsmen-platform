# Kingsmen System Register — Baseline 2026-10-29

**Purpose:** One evidence-led register of what exists, what is deployed, what has actually been exercised, and what remains unproven. This is an operational baseline, not a claim of production readiness.

**Evidence rule:** A source file, migration, function marked ACTIVE, green unit test, or deployment record proves only that specific layer. It does not prove an end-to-end candidate journey. Unknown means unverified, not complete. This register must be updated against a commit and dated runtime evidence after each release batch.

## 1. Executive verdict

**Public launch: BLOCKED.** The platform has substantial source code, a populated Supabase schema/migration history, active Edge Functions, and automated validators. The available evidence does not establish a working, fully integrated candidate-facing product.

| Layer | Observed state on 2026-10-29 | What that does and does not prove |
|---|---|---|
| Source repository | GitHub repository `kingsmenportal-ctrl/kingsmen-platform`; default branch README and package manifests readable. Open PR #209 covers commercial/application-lifecycle consolidation. | Source exists. A PR is not merged/released unless GitHub says so. |
| Web application | `apps/web` is a Next.js package with build/start scripts. | Package exists; deployed candidate experience and authenticated full journey are not proven. |
| Backend API | `apps/api` has an HTTP server, command/workflow endpoints, policy handling, Jarvis adapter, and a Truth Vault repository adapter. Server code also contains in-memory Maps for command/read-model state. README explicitly labels the current API storage mode `memory_development_only`. | Do not treat API persistence as production-ready until actual runtime configuration and durable read/write/restart tests prove it. |
| Supabase staging | Project `kingsmen-portal-staging`, ref `euhubhhnumtibbyufghm`, status `ACTIVE_HEALTHY`, PostgreSQL 17.11. | Database endpoint is available; this alone does not prove application journeys. |
| Supabase migrations | Migration ledger has a long applied history from initial N03–N20 foundation through candidate auth/storage, RLS, application lifecycle, source ingestion, worker recovery, founder operations, PayFast, identity review and the 2026-10-29 commercial catalogue updates. | Ledger proves migrations recorded as applied, not every permission, runtime path, rollback or user journey. Migration ledger and repository migration files must continue to be reconciled. |
| Supabase Edge Functions | Live project lists candidate identity review request/decision/queue/evidence/follow-up/status, workspace readiness, profile review, application preparation, private documents, N15 ingestion/opportunities, N07 Airtable enqueue, N08 founder health, PayFast sandbox, application outcomes/review, among others. Listed functions show ACTIVE; most candidate/reviewer functions have JWT verification enabled. | ACTIVE and JWT configuration are deployment facts, not proof that each function succeeds under correct and incorrect identities. PayFast sandbox function is listed with JWT verification disabled; verify its signature/authentication boundary before exposing it. |
| Netlify | Two sites found: `kingsmen-portal-staging` and `kingsmen-packages`. Netlify metadata did not expose a useful published commit SHA in this audit. | Site objects and URLs exist; deployed commit alignment, successful build, actual page response, candidate portal route, API wiring and form persistence are unverified. Historical staging URL returned 404; retest the actual HTTPS URL before calling it live. |
| Jarvis | Repository includes typed contracts, policy gate, tool registry, evidence ledger, command runner, validators and a machine-readable live-core manifest; API has a Jarvis runtime adapter. Many Jarvis validators exist in package scripts. | This is a real software foundation, but no complete founder-operated control-plane journey or complete operational monitoring proof has been established by this snapshot. |
| Monitoring / operations | N08 founder health function exists; observability, incident, queue/DLQ, backup/restore and final evidence validators/proof scripts exist. | Scripts and health endpoint are not equivalent to verified alerts, provider probes, incident drills, durable worker recovery or restore drills. |
| Payments | PayFast sandbox Edge Function is active; finance migrations and sandbox proof/validator scripts exist. | No claim of end-to-end checkout, signed ITN, settlement, duplicate/replay handling, refund reconciliation and entitlement activation is made without runtime evidence. |
| Public launch | Launch readiness manifest says `blocked_until_required_gates_pass`. | Do not onboard public candidates or take real payments until gates and final founder review pass. |

## 2. Live staging data counts

Read-only SQL against the staging project on 2026-10-29 returned:

| Table | Rows | Interpretation |
|---|---:|---|
| `public.candidates` | 2 | Candidate rows exist; does not prove either can authenticate and complete the portal journey. |
| `public.applications` | 2 | Two legacy/core application rows exist; they are not proof of the new unified application flow. |
| `public.candidate_auth_identity_links` | 0 | No explicit candidate-to-auth identity mappings in this table. |
| `public.candidate_route_applications` | 0 | No route application records. |
| `public.candidate_application_tracker` | 0 | No tracker records. |
| `public.candidate_private_documents` | 0 | No private candidate document records. |
| `public.candidate_identity_review_requests` | 0 | No identity review requests. |
| `public.candidate_master_application_targets` | 0 | No unified master application targets. |
| `public.candidate_master_application_events` | 0 | No unified master application events. |
| `public.candidate_application_evidence` | 0 | No application evidence records. |

These counts are a point-in-time snapshot. They are not evidence that all other tables are empty. In particular, `applications.candidate_id` and Auth user IDs are different identity domains; never join them as if they were interchangeable. Establish and test explicit verified identity binding first.

## 3. Product scope that must remain canonical

- South Africa national scope; initial supported capacity target: **500 active candidates**.
- Six opportunity pathways: higher education, TVET, SETA programmes/learnerships, internships, apprenticeships, and employment.
- One unified candidate profile/application experience; all six pathways remain discoverable regardless of package. A package controls service/application entitlements, not which opportunities the candidate may see.
- CAO is one Kingsmen parent application with programme choices as child records (maximum six as currently specified in the PR #209 change); validate duplicates and bounds.
- A source directory or listing is not proof that an opportunity is open, eligible, within deadline, or successfully submitted. Preserve source authority, verification and expiry.
- Candidate-reported submission is distinct from provider-confirmed receipt/outcome. Provider outcomes require trusted evidence, reviewer identity and timestamp.
- AI provides decision support; it does not replace human decisions.
- POPIA/privacy, consent, data minimisation, retention, auditability, candidate A/B isolation and fail-closed behavior are mandatory.
- Current communication instruction from the founder: **no WhatsApp and no SMS for now**. Use email only when the email provider path is configured and verified; do not enable live notifications by assumption.
- Existing canonical package prices and names must be preserved from the commercial register; do not invent entitlement limits or silently change prices. Paid checkout stays disabled until PayFast sandbox/ITN evidence proves settlement.

## 4. Required end-to-end acceptance journeys

Each row is **NOT VERIFIED** until evidence is captured against the exact deployed commit and staging environment.

1. Candidate A and Candidate B register/sign in; sessions survive reload; each saves, reloads and updates only their own profile.
2. Explicit verified identity binding: request review, upload private evidence, candidate can retrieve only own files via temporary links, authorised reviewer can inspect, decision/follow-up persists, actor and timestamps are audited.
3. Document Vault: private bucket and file limits, MIME/content validation, checksum, signed URL expiry, unauthorized access denial, candidate isolation and application evidence linking.
4. Unified application: candidate creates one master application, chooses pathways/opportunities, CAO child choices validate, preparation persists, tracker/history reloads, and lifecycle transitions reject illegal or unsupported states.
5. Submission and outcome truth: candidate-reported submission remains distinct from provider acknowledgement and outcome; status cannot advance without appropriate verified evidence.
6. Opportunity engine: ingest only from authorised sources; preserve source URL, checked-at time, expiry, eligibility and confidence; expired/unverified listings do not leak into candidate-safe feeds.
7. Payments: sandbox checkout, success/cancel/failure, signature/merchant/amount/reference validation, duplicate and replay ITNs, retry after rejected settlement, refund/reconciliation, receipt/audit and entitlement only after verified settlement.
8. Communications: email-only staged delivery; consent, opt-out, retries, idempotency, bounce/failure and dead-letter/recovery behavior; no WhatsApp/SMS path enabled.
9. Jarvis founder control plane: authenticated founder-only brief/health/incident/report views; ordinary candidate and unauthenticated access denied; real persisted operational data, audit history, action approval and no secrets in outputs.
10. Integrations/workers: provider probes, idempotent webhooks, enqueue → lease → retry → dead-letter → recovery; clear `NOT_CONFIGURED` state when credentials/providers are absent.
11. Operations: redacted health and logs, alerts, incident severity drill, backup checksum and restore drill, source/deployment/DB migration reconciliation, and release evidence bundle.
12. Actual website: HTTPS URL returns expected page, real routes load, candidate forms call the backend, authenticated state persists, no dead links/placeholder-only submit paths, and published commit equals reviewed release commit.

## 5. Release gates and evidence discipline

P0 gates from the current launch readiness documents:

- Apply and independently verify GitHub `main` branch protection and required validators.
- Prove Truth Vault persistence and idempotency in staging.
- Prove RLS/role isolation for anonymous, candidate A, candidate B, reviewer, founder and service role.
- Prove deployed web-to-backend integration; no local shell or workstation dependency.
- Prove PayFast sandbox/ITN, invalid and replay cases before enabling payment.
- Prove backup/restore before production personal data.
- Verify runtime secrets are configured outside Git and never printed.
- Prove provider communications behavior; current product setting is email-only until changed by founder.
- Prove observability, incident handling, queue/DLQ recovery and redaction.
- Publish and review privacy, consent, terms and refund policy surfaces.
- Capture reviewed, redacted staging proof pack and final assembly evidence bundle; require founder review.

For every build batch, record four separate measures: **implemented**, **automated-tested**, **deployed**, and **end-to-end verified**. Attach exact commit SHA, environment, timestamp, test command/result, runtime evidence reference and unresolved blockers. Never convert a source validator pass into a runtime or deployment claim.

## 6. First execution order

1. Freeze and identify the one authoritative release candidate commit; inventory all open PRs, required checks, migration drift and deployment SHAs.
2. Confirm current website response and published Netlify commit. Fix deployment/build/routing before adding visual or product scope.
3. Complete backend durable persistence and prove staging read/write/restart/idempotency.
4. Prove candidate A/B authentication, identity mapping and RLS isolation.
5. Complete identity review and private document journey with a real reviewer identity.
6. Complete one unified application + tracker + verified evidence lifecycle.
7. Prove opportunity feed and source freshness; keep unverified listings out.
8. Complete founder/Jarvis health, audit, queue recovery and incident proof.
9. Complete PayFast sandbox/ITN proof, then communications (email only), legal/privacy and backup/restore gates.
10. Run the full authenticated end-to-end suite against the deployed commit, collect redacted evidence, review all gates, and only then consider launch.

## 7. Evidence sources used for this baseline

- Repository: `kingsmenportal-ctrl/kingsmen-platform`, default-branch `README.md`, `package.json`, `apps/api/src/server.ts`, `apps/web/package.json`, `manifests/launch/kingsmen-launch-readiness-v1.json`, `docs/launch/KINGSMEN_LAUNCH_READINESS.md`.
- GitHub: open PR #209, “refactor: consolidate commercial and application lifecycle runtime paths”; PR body reports Source Guard, Jarvis Live Runtime and repository tests passed on head `e45f79bc3a906221be757a780f52ba1f0fed083f`. This is PR-head evidence, not proof that the PR is merged or deployed.
- Supabase: project metadata, migration ledger, Edge Function inventory and read-only SQL table counts, timestamped 2026-10-29.
- Netlify: project metadata for `kingsmen-portal-staging` and `kingsmen-packages`; a usable published commit SHA and live route response were not established in this audit.

**Next update rule:** Do not replace this baseline with estimates. Update each claim only when newer source/runtime evidence is attached; preserve prior evidence and mark superseded snapshots.
