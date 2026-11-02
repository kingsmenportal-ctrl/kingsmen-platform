# Playwright Stage 0 — repository and worker inventory

**Snapshot date:** 2 November 2026  
**Implementation PR:** [#303 — Kingsmen browser QA and read-only provider scout](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/303)  
**Scope:** Source inventory and architecture decision only. This document does not authorise a provider operation, apply a database migration, enable a production worker, or declare release readiness.

## 1. Repository findings

| Area | Existing source of truth | Stage 0 finding |
|---|---|---|
| Browser dependency | Root `package.json` and `package-lock.json` | Playwright is already installed as a root development dependency; do not add a second package manager or duplicate dependency tree. |
| Browser QA | `scripts/playwright/run-kingsmen-browser-qa.mjs` | An anonymous, read-only browser smoke runner already exists in PR #303. |
| QA workflow | `.github/workflows/kingsmen-playwright-qa.yml` | A dedicated CI workflow already exists. Both jobs are now pinned to `ubuntu-24.04` after the first run failed when `ubuntu-latest` resolved to unsupported Ubuntu 26.04 for Playwright 1.60.0. |
| Provider discovery | `apps/workers/src/provider-source-scout.mjs` and `apps/workers/Dockerfile.playwright-scout` | An isolated Chromium container inspects founder-approved public HTTPS sources using GET-only requests. It is not an authenticated operations worker and has no database credential. |
| Scout policy | `scripts/playwright/provider-scout-policy.mjs` | Requires exact host allowlists, official-source classification, founder approval evidence and an unexpired approval. It blocks login, sensitive URLs, CAPTCHA and unapproved redirects. |
| Durable queue | `public.orchestrator_dispatch_queue` and the N16 database RPCs | An established durable queue already supports atomic claims, leases, idempotent results, recovery and manual handoff. |
| Worker runtime | `apps/api/src/orchestrator/durable-worker-queue.ts`, `worker-runner.ts`, `worker-main.ts` | N16 already provides the PostgreSQL queue adapter, explicit worker registry, result recorder, recovery loop and graceful shutdown. |
| Execution policy | `manifests/n16/orchestrator-execution-runtime.json` | The current locked policy says Playwright is scout/probe only. CAPTCHA, OTP, portal-down and manual-only cases go to a human/MAP handoff. |

## 2. N16 queue contract — reuse it; do not create a competing queue

The existing N16 database layer owns dispatch and recovery through these operations:

- `n16_claim_dispatches` — atomically leases due or expired LOCKED work.
- `n16_mark_dispatch_sent` — checks lease ownership before the external-side-effect boundary.
- `n16_record_dispatch_result` — records the result, evidence, retry or manual-handoff decision.
- `n16_reconcile_expired_sent` — quarantines ambiguous post-SENT work for reconciliation rather than blindly replaying it.
- `n16_deadletter_exhausted_locked` — closes expired LOCKED work after its retry budget is exhausted.

The current worker runner has an explicit handler registry. Unknown worker codes are routed to manual handling; handlers are not dynamically imported from job payloads. Human approval evidence is checked before a side-effect handler can cross the SENT boundary.

**Architecture decision:** do not add a parallel `browser_jobs` table merely to support Playwright. That would create two dispatch authorities, two lease/retry models and two audit trails. Playwright work should be represented in the established N16 orchestration model, with a typed worker code, validated payload, idempotency key, evidence references and explicit policy decision.

**Important isolation issue:** the current N16 claim RPC claims from the shared dispatch queue without a worker-code allowlist parameter. A second process that calls this unfiltered claim operation could lease unrelated N16 work; an unregistered handler then creates a manual handoff. Therefore a dedicated Playwright operations process must not be started against the shared queue until N16 supports safe worker-code-scoped claims (or an equivalent server-controlled routing boundary) and that change has passed migration review and isolated-database tests.

## 3. Stage completion assessment

### Stage 0 — inventory
**Source inventory completed.** Existing QA, scout, queue, worker runtime and policy boundaries have been identified. The single-queue decision and the unfiltered-claim risk are recorded above.

### Stage 1 — browser QA harness
**Implemented in PR #303; CI correction committed.** The QA runner checks public routes and verifies that protected candidate/founder/admin routes do not become anonymously accessible. The workflow runs the repository regression suite, Playwright policy tests, web build, browser smoke test and scout-container build.

The first PR #303 Playwright workflow reached the Chromium installation step and failed because the GitHub-hosted runner resolved to Ubuntu 26.04, unsupported by Playwright 1.60.0. The workflow now pins both jobs to Ubuntu 24.04. The browser workflow must be rerun against the new commit before this stage is called green.

### Stage 2 — authenticated candidate journey and isolation
**Not proven by the anonymous QA runner.** It must be tested separately against an authorised staging deployment using dedicated Candidate A and Candidate B identities held in the approved secret store. Required evidence includes:

1. Candidate A saves a profile, signs out, signs back in and reloads the same persisted profile.
2. Candidate A cannot read or mutate Candidate B's profile, documents, applications or status endpoints; the API/RLS result must be an explicit denial.
3. The same isolation is checked for the candidate's related records, not just one route.
4. Test output is redacted; no candidate password, access token, ID number, document or browser storage state is committed or uploaded unredacted.

No authenticated result is claimed by this inventory or by the anonymous browser QA report.

### Stage 3 — read-only public discovery
**Scout implementation exists; durable discovery ingestion is not established by PR #303.** The scout produces a bounded JSON report in its mounted work directory. It does not insert draft opportunities into Supabase, schedule a 02:00 run, mark opportunities open, establish eligibility, or prove a provider integration. Any future ingestion must preserve source URL, official-source authority, retrieval time, content hash, freshness and human verification state.

### Stages 4–5 — provider operations
**Not enabled.** Provider login, form filling, document upload, application submission, status polling and payment actions remain outside the current Playwright permission. A future operations worker requires, at minimum:

- a worker-code-scoped N16 claim boundary and reviewed migration;
- a dedicated, versioned provider adapter and documented provider authorisation/terms;
- candidate-specific consent, target-specific approval and time-bounded execution authority;
- a separate browser context per job, no shared cookies or committed auth-state files;
- CAPTCHA/OTP/MFA stop-and-handoff behaviour;
- strict secret isolation and redacted evidence;
- idempotency plus timeout reconciliation before any submission retry;
- provider receipt evidence distinct from a click, candidate-reported submission, provider decision or outcome;
- independent security review and Founder approval before a production capability is enabled.

A Level 3 or Level 4 route remains human-assisted or official handoff. No provider is treated as authorised merely because its public website can be opened.

## 4. Security and release boundaries

- No Neon database is introduced. Supabase/PostgreSQL remains the source of truth.
- No Supabase migration is applied by this Playwright work.
- No production or provider credentials are embedded in source, image layers, browser state, reports or logs.
- The scout remains public-read-only and has no candidate session, database connection, upload capability or submission capability.
- The operations worker remains disabled until the queue-routing and authorisation gates above are satisfied.
- Passing source validators is not authenticated runtime proof. A passing CI run is not a staging deployment or production deployment.
- PR #303 remains a review draft until its exact-head CI, independent review and required repository checks pass.

## 5. Immediate next acceptance gates

1. Rerun PR #303 after the Ubuntu 24.04 correction; require the browser-qa and scout-container jobs to pass on the new head SHA.
2. Review the generated QA artifact and ensure it contains no credentials, personal data, screenshots or browser storage.
3. Run the authenticated save/reload and Candidate A/B isolation suite against staging with dedicated test identities.
4. Only then design the filtered N16 worker claim and Playwright queue adapter as a separately reviewed operations milestone.

**Stage 0 conclusion:** Kingsmen already has the correct queue foundation. The safe next design is to extend N16 with an explicitly scoped Playwright worker, not to introduce a second queue or let a new process consume the shared queue indiscriminately.
