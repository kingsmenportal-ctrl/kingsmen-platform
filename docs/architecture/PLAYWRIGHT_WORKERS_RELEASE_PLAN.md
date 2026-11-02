# Kingsmen Playwright Workers — Controlled Release Plan

Date: 2026-11-02. Status: implementation branch, not a deployment claim.

## Scope
1. Playwright testing worker for website/staging navigation, forms, responsive layout, accessibility smoke checks, authentication boundaries, and regression.
2. Separate controlled browser worker for approved browser tasks, reusing N16 durable PostgreSQL queue/recovery, strict task schemas, bounded execution, restricted credentials, structured redacted logs, and human approval for consequential actions.
3. Integrate through the existing Supabase/PostgreSQL source of truth and approved N16 job/result/audit contracts. Do not add Neon or a second queue.
4. Add provider adapters one at a time only after evidence of authorization, official route, terms, credentials, candidate consent, permitted data handling, failure/recovery policy, and provider receipt semantics.

## Existing foundation
- Root package includes Playwright as a development dependency.
- N16 has a durable PostgreSQL queue adapter, explicit handler registry, lease recovery, graceful shutdown, and approval/evidence checks.
- An authenticated staging E2E HTTP runner exists, but it is not equivalent to a real browser test.
- None of these source facts proves CI success, a running worker, or a deployed commit.

## Testing worker
- Pull requests run deterministic contract checks.
- Actual staging checks run only by explicit workflow dispatch against an HTTPS allowlisted origin.
- Cover desktop/mobile viewport, route availability, page title, basic navigation, form controls/labels, and anonymous protected-route boundaries.
- Never submit live applications, payments, documents, emails, or provider forms in smoke tests.
- Authenticated coverage requires explicitly provisioned test sessions and Candidate A/B/reviewer isolation assertions.
- Reports must not contain tokens, cookies, response bodies, query strings, or personal data.

## Controlled automation worker
- Run as a separately supervised long-lived Node process/container, not a short-lived Netlify function.
- Reuse N16 durable queue/result/recovery; do not create a competing queue.
- Only explicitly registered worker codes execute. Unknown codes become manual handoffs.
- Strict task schema, origin/path allowlist, total deadline, navigation/action timeouts, bounded concurrency and retries.
- Initial capability is read-only scout/test. No CAPTCHA/MFA bypass, anti-bot evasion, or undocumented access.
- Runtime secrets only; never put credentials in task payloads, logs, screenshots, artifacts, or Git.
- Submission, upload, messaging, payment, accepting terms, or provider-account mutation remains blocked unless a provider-specific adapter carries verifiable human-approval evidence.
- A timeout after a consequential action is ambiguous: quarantine and reconcile manually; never blind replay.

## Provider onboarding gate
Record official destination/source timestamp, authorization and terms, integration mode, candidate consent, permitted fields/documents, credential owner/secret reference, test account/sandbox, safe failure policy, duplicate/idempotency policy, provider acknowledgement/receipt evidence, and distinct candidate-reported submission/provider receipt/provider decision states. Otherwise use official URL plus human-assisted handoff.

## Release sequence
1. Complete existing N16 merge dependencies, CI, independent review, and effective branch protection.
2. Pass deterministic Playwright contract tests.
3. Run read-only staging smoke checks on the exact approved deployed origin and attach redacted reports.
4. Add a registered read-only browser handler over N16 and prove unknown-task blocking, approval enforcement, timeout/retry, process-kill recovery, and audit evidence.
5. Build/deploy to a supported long-running container host; pin exact source commit and image digest. Do not claim a persistent Playwright browser is suitable for Netlify Functions.
6. Verify health, queue claim/result, graceful shutdown, recovery, secret isolation, exact commit, and runtime evidence.
7. Add provider adapters individually after authorization and provider-specific tests.
8. Founder approval is required before enabling write-capable adapters.

## Hard blockers
- Re-read current CI and merge state at release time.
- Branch protection and independent review must be effective, not merely documented.
- Authenticated Candidate A/B and reviewer sessions/isolation proof must exist.
- Backup/restore and migration change control must pass before staging schema changes.
- Deployment is not verified until exact commit/image digest and live health/queue evidence are captured.
- A public portal URL alone does not authorize automation.

## Status vocabulary
Track `implemented`, `contract-tested`, `CI-passed`, `deployed`, `runtime-verified`, and `provider-authorized` separately. Never collapse these into a single “live” status.
