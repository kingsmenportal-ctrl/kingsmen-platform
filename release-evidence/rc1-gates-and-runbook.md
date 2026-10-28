# RC1 Combined Gate and Staging Runbook

Status: prepared runbook, not proof of execution. Never paste credentials, JWTs, service-role keys, payment secrets or personal candidate data into logs or PR comments.

## Gate 0 — Recovery before mutation
- Identify the staging backup/PITR recovery point and retention.
- Record project ref, backup timestamp, restore target, operator and integrity checks.
- Perform a restore into an approved isolated target; validate schema/migration ledger and sampled row counts/checksums.
- Record successful restore evidence and cleanup.
- Do not create candidate identities, synthetic rows or apply schema changes before this gate passes.

## Gate 1 — Immutable RC1
- Resolve the dependency order: #204 → #205 → #190 → #202 → #192; review each diff against its intended base and check that the dependency is actually present in the resulting tree.
- Obtain independent approval for #206; a comment is not approval.
- Recover the exact migration artifacts corresponding to both 0078 ledger versions. The repository source file alone does not prove which body was executed.
- Review migration ordering and drift; no duplicate/ambiguous migration entries accepted without explanation.
- Select a single full 40-character RC1 SHA only after authorized integration. Record it here and in the evidence register.
- Run all required workflows on that exact SHA; reject stale or PR-head-only checks that do not match RC1.

## Gate 2 — Combined verification
Record command, exit code, timestamp and commit SHA for each:
- dependency installation from lockfile; lockfile consistency
- lint/type checks
- API build and web production build
- unit and integration tests
- migration ordering/drift/semantic parity
- RLS/policy/grant/trigger/function checks
- identity review authorization contract
- candidate profile and application persistence
- document upload, ownership, signed-link expiry and invalid MIME/size tests
- candidate A/B isolation for profile, identity, documents, applications, orders and entitlements
- reviewer queue, allowed decision transitions, audit record and ordinary-user denial
- PayFast sandbox checkout, ITN signature/merchant/amount/reference/status validation, duplicate ITN idempotency, invalid notification rejection, settlement retry and entitlement activation
- connector retry/dead-letter/recovery and founder health authorization
- secret scanning, dependency/security checks and POPIA consent/retention review

A green unit test is not a substitute for a runtime staging journey. Preserve sanitized request/response summaries and database evidence, not credentials or personal data.

## Gate 3 — Staging migration change
- Confirm backup/restore gate, independent review, exact RC1 SHA and required checks.
- Capture pre-migration output from `0078-semantic-parity-audit.sql` and `0097-privilege-audit.sql` where applicable.
- Verify migration file SHA and order against the reviewed PR.
- Apply only the reviewed migration via the approved Supabase migration process.
- Immediately repeat post-checks and compare all privilege/schema deltas against the expected change.
- Stop on any unexpected delta. No ad hoc manual edits to production/staging state.
- Rollback is not a blind reverse of ACL state; use an independently reviewed corrective migration based on the captured baseline.

## Gate 4 — Authenticated test identities
After recovery and operator approval:
- Inspect existing Auth users and classify candidates/reviewer by purpose; reuse only identities explicitly designated for testing.
- If missing, create two synthetic candidates through normal staging sign-up with controlled test inboxes, and create/assign reviewer via approved admin path with least privilege.
- Never link reviewer identity by email alone; enforce verified auth subject + role/assignment.
- Authenticate through the real application. Verify cross-candidate denials on server/API and database policies.
- Record identity aliases and immutable auth subject IDs only in a restricted test record; never publish passwords or tokens.
- Test cleanup/retention plan before creating records.

## Gate 5 — Netlify deployment proof
- Read site metadata to obtain the actual published deploy ID.
- Fetch that deploy and record state, branch, commit_ref, deploy URL and published time.
- Assert `commit_ref == RC1_SHA` before calling it the RC1 deployment.
- Smoke test `/`, `/login`, candidate entry route, application workspace route and reviewer entry route; verify status, redirects, and that unauthenticated users cannot see protected data.
- A site URL, branch URL, or state label without deploy ID and commit SHA is insufficient.

## Gate 6 — Go/no-go
GO only if: immutable RC1; required independent reviews; all combined CI passes exact SHA; backup/restore passes; migrations are reviewed and semantically reconciled; authenticated E2E passes; candidate isolation passes; document security passes; payment reconciliation passes; deployed commit matches RC1; operational and privacy gates pass.
Otherwise NO-GO. List exact failed gate, evidence, owner and next action. Do not dilute failures into a percentage.

## Evidence record template
| Gate | Status | Commit SHA | Environment | Run/artifact URL | Timestamp UTC | Result | Owner / next action |
|---|---|---|---|---|---|---|---|
| Recovery | NOT_STARTED | | | | | | |
| 0078 parity | IN_PROGRESS | | staging | | | Historical executed bodies missing | Recover deployment artifacts |
| PR #206 independent review | BLOCKED | `ea1a31e6c2fa4e68618785ad70581538a8f6e266` | GitHub | PR #206 | | Comment exists; approval not established | Independent reviewer |
| Immutable RC1 + combined CI | NOT_STARTED | | | | | | |
| Authenticated candidate/reviewer E2E | NOT_STARTED | | staging | | | No proof yet | After recovery gate |
| Document Vault E2E | NOT_STARTED | | staging | | | | |
| PayFast sandbox E2E | NOT_STARTED | | sandbox/staging | | | | |
| Netlify published commit | BLOCKED | | Netlify | | | Deploy ID/commit not established | Resolve published deploy metadata |
| Go/no-go | NOT_STARTED | | | | | | |