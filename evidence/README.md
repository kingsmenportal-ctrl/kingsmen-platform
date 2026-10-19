# Kingsmen Portal — Release Evidence Index

**Repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Working branch:** `fix/kingsmen-ci-real-validation-gates`  
**Purpose:** Track actual release evidence without confusing source-level checks, test fixtures, or planned work with verified staging results.

> **Current rule:** This index is a checklist, not proof that a rehearsal or staging test has passed. Do not mark a gate passed until its dated, redacted evidence exists and has been reviewed. Do not apply migrations 0031–0035 until backup/restore readiness and the exact migration SQL have been reviewed.

## Release gate status

| Gate | Status | Required evidence |
|---|---|---|
| Finance baseline | PENDING | Dated log from the repository's real finance tests; test paths and package scripts confirmed first |
| Staging backup | PENDING | Dashboard backup/PITR screenshot with timestamp; no secrets or candidate data |
| Restore rehearsal | PENDING | Restore into a separate test project, timestamped restore record, schema/policy comparison, and reviewed differences |
| Migration review 0031–0035 | PENDING | Exact SQL files reviewed for ordering, idempotency, grants, RLS, ownership, and rollback/recovery plan |
| Staging migrations | NOT RUN / VERIFY FIRST | Supabase migration history and catalog evidence from the intended staging project only |
| Candidate isolation | PENDING | Authenticated test using two dedicated staging test accounts; evidence must show candidate B cannot read or mutate candidate A's records |
| Document lifecycle | PENDING | Upload, registration, retrieval, linking, retirement, and failed-deletion behavior tested against the actual application |
| Founder review | PENDING | Anonymous denied, candidate denied, authorized founder succeeds; persisted decision and audit trail verified |
| Runtime evidence pack | PENDING | Dated Playwright report and screenshots/traces with secrets and personal data removed |
| Finance / PayFast | PENDING | Finance tests pass; sandbox callback evidence is separate from source checks; live processing remains disabled |
| Runtime secrets health | PENDING | Presence/health check only; never record secret values |
| Source Guard launch gate | BLOCKED UNTIL EVIDENCE | Run the existing gate after required evidence is collected; do not weaken or bypass it |

## Evidence directory layout

Create dated directories only when collecting real evidence:

- `evidence/finance-baseline/` — test command, exit code, timestamp, and sanitized log.
- `evidence/backup-restore/` — backup and restore timestamps, restore project reference, verification output, and review notes.
- `evidence/staging-YYYY-MM-DD/` — runtime test report and redacted screenshots/traces.
- `evidence/release-review/` — final gate output and reviewer decision.

Do not commit SQL dumps, credentials, access tokens, unredacted screenshots, real candidate PII, or production data. A database dump may contain sensitive data even when filenames appear harmless; keep it in approved secure storage and commit only a sanitized record of its existence, size, and checksum if policy allows.

## Safe execution sequence

1. Inspect the current branch, migration files, migration history, and the launch-readiness validator.
2. Run the finance baseline using test files and commands that actually exist in this repository. Record failures; do not invent test names or claim coverage based on a script's expected output.
3. In the Supabase dashboard, verify/create a backup or verify PITR and record the exact timestamp. Take a secondary dump only through an approved, authenticated environment.
4. Restore into a separate disposable project using a documented supported restore method. A SQL dump is not proof of a successful restore; confirm restore completion before comparing schema, policies, bucket visibility, and counts.
5. Review migrations 0031–0035 before applying them. Confirm the actual migration files exist, are in sequence, and have reviewed authorization/grant/RLS behavior. Do not paste unreviewed SQL into a live staging project.
6. Apply migrations to staging only after backup and restore rehearsal pass. Verify the migration history and expected catalog objects with read-only queries.
7. Run Playwright with dedicated staging test identities and the correct staging URL. Ensure the tests exercise real UI/API/storage flows rather than relying on undocumented globals or fabricated storage paths.
8. Review the report, save sanitized evidence, and rerun Source Guard. A passing source validator alone does not prove runtime readiness.
9. Split PR #73 only after the actual repository diff and dependency boundaries have been inspected. Create branches from the verified current base; avoid broad path globs that may pull unrelated files into a PR.
10. Close PR #73 only after the replacement PRs exist, their contents and dependencies are correct, and the project owner has verified the intended disposition. Never state that PRs were merged, tests passed, migrations applied, or gates passed unless GitHub/Supabase evidence confirms it.

## Evidence record template

For each run, include:

- **Gate:**
- **Environment/project reference:** (reference only; no credentials)
- **Commit SHA:**
- **Started / completed (UTC):**
- **Command or dashboard procedure:**
- **Result / exit code:**
- **Evidence file(s):**
- **Redaction review:** pass/fail
- **Reviewer / notes:**

## Important implementation notes

- Use the actual repository package layout. The root `npm test` script is not automatically a finance-ledger test suite.
- Treat a configured mock or sandbox interface as a mock/sandbox; do not label it a live integration.
- Keep live payments disabled until the separate sandbox evidence, authorization, and release approvals are complete.
- Do not make evidence generation scripts write a “PASSED” result before a human has entered and verified the real observations.
- Do not use a single SQL row-count diff as the sole restore check; identity, schema, policies, storage configuration, constraints, and application behavior also need review.
