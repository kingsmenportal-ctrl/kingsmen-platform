# P0 Build Verification and CI Gap Analysis — 2026-10-17

## Scope and evidence boundary

Repository inspected through the GitHub connector at branch `feat/phase-a1-public-destiny-auth-foundation`, commit `2e1d4a24d75ea93e82b1601c82624cae80cbab6f`. This is a source/workflow configuration review only. No repository runner was available in this session; no Node command, dependency installation, TypeScript build, unit test, browser test, or static validator was executed here. A workflow lookup for the inspected commit returned an empty list. Therefore every runtime/build/test result remains **NOT RUN / NOT VERIFIED**, not passed.

## P0 findings

### P0-1 — API dependencies are not locked reproducibly

- `apps/api/package.json` pins `pg@8.12.0`, `@types/node@24.0.0`, and `typescript@6.0.3`.
- `apps/api/package-lock.json` does not exist on the inspected branch (GitHub contents API returned 404).
- `.github/workflows/kingsmen-application-builds.yml` installs API dependencies with `npm install`, then runs `npm run validate`. That permits resolution to be generated during CI instead of checking a committed lockfile.
- Do not fabricate a lockfile or silently change a CI gate. Generate a lockfile with the declared npm version in a controlled repository runner, review the full diff and platform metadata, then switch API CI to `npm ci` in a separate reviewed change.

### P0-2 — CI coverage depends on PR target branch

- `kingsmen-application-builds.yml` runs on PRs targeting `main` or `fix/kingsmen-phase0-source-guard-ledger`, plus pushes to `main` and manual dispatch.
- `kingsmen-source-guard.yml` runs on PRs targeting `main`, pushes to `main`, and manual dispatch only. It does **not** automatically run for a PR targeting `fix/kingsmen-phase0-source-guard-ledger`.
- The current Phase A.1 draft PR #86 targets `fix/kingsmen-phase0-source-guard-ledger`. Consequently, the application-build workflow is the relevant automatic PR gate; the source-guard workflow is not automatically triggered by that target.
- Do not interpret a missing workflow run as a passing result. Confirm GitHub Actions permissions and trigger configuration, then require explicit run IDs and commit SHA in the verification evidence.

### P0-3 — Web dependency checks exist, but are not executed by this audit

- `apps/web/package.json` pins exact versions for Next.js, React, TypeScript, Playwright, Mammoth and PDF parsing.
- The workflow runs `scripts/validators/validate-web-dependency-lock.mjs`, `npm ci` in `apps/web`, auth helper type-checks and Node regression tests, Personal Jobs and candidate-document source guards, then `npm run build`.
- These are good defined gates, but their existence is not proof that they passed. Require the run's commit SHA, each job's conclusion, and logs/artifacts before closing the gate.

### P0-4 — API validation is build plus tests, not a complete runtime proof

- `apps/api/package.json` defines `validate` as build plus test; `test` itself invokes build before `node --test dist`, so the build is repeated.
- Static PayFast, finance RLS, API runtime and secret-boundary validators run before API validation in the workflow.
- Successful compilation/tests would still not prove staging Supabase RLS, authenticated candidate isolation, PayFast sandbox/ITN behavior, backup restore, or provider communication safety. Those need separately recorded synthetic staging evidence.

### P0-5 — Some validators/proof scripts write report files

- Inspected launch-readiness, Truth Vault and RLS validators import filesystem `mkdirSync` / `writeFileSync` and write latest-report JSON under `reports/`.
- RLS proof scripts also write proof JSON. They are not strictly read-only even if their checks are source-level.
- Run them only in a disposable/controlled checkout or explicitly capture and review generated report changes. Do not describe these as pure read-only checks, and do not run proof scripts against production credentials unless the script is reviewed and authorized.

### P0-6 — Launch gate must remain blocked until evidence exists

- The source validator can check source tokens and existing report metadata; it cannot by itself establish deployed policy, data isolation, or restore capability.
- Preserve the explicit public-launch blocker until each gate has current, reviewed, redacted evidence tied to the intended commit and staging environment. Do not convert source presence to runtime verification.

## Controlled verification order

1. Record repository, branch, exact commit SHA, Node/npm versions, workflow run ID, runner OS, and start time.
2. Validate the web manifest/lockfile contract, then install with `npm ci` inside `apps/web`.
3. Run the three auth helper TypeScript checks and Node regression suites from the workflow; run Personal Jobs and candidate document source guards.
4. Run the web production build; preserve full logs and its exit code.
5. Generate the API lockfile using the declared package manager in a disposable checkout, inspect the lockfile diff, and only then propose switching CI from `npm install` to `npm ci`.
6. Run API source guards, TypeScript build and Node tests; capture each exit code separately.
7. Run source proof/validator scripts in an isolated checkout and inspect the resulting report diffs. Treat those outputs as source-level evidence only.
8. After build/source gates pass, run synthetic staging E2E against the staging API/database with two synthetic candidate accounts and explicit cross-account denial assertions. Do not use real candidate PII.
9. Separately prove RLS isolation, PayFast sandbox/ITN behavior, backup/restore, secrets wiring, communications staging, observability and legal/consent gates.
10. Close each launch gate only with a reviewed artifact, exact commit/environment identifiers, and an accountable reviewer.

## Verification register

| Gate | Current status from this audit | Evidence required to close |
|---|---|---|
| Web lock contract + `npm ci` | Not run here | Workflow run ID, commit SHA, logs |
| Web auth helper type-check/tests | Not run here | Per-step successful conclusion and test counts |
| Web static source guards | Not run here | Validator output and report diff |
| Web production build | Not run here | Successful build log tied to commit |
| API dependency reproducibility | Blocked: lockfile absent | Reviewed generated `apps/api/package-lock.json`, then CI using `npm ci` |
| API source validators | Not run here | Per-validator output and exit codes |
| API TypeScript build + tests | Not run here | Test summary and successful run |
| Candidate two-account staging isolation | Not proven by source review | Synthetic E2E results showing own-account success and cross-account denial |
| Deployed Supabase RLS | Not proven by source review | Staging SQL/API tests and reviewed policy state |
| PayFast sandbox/ITN | Not proven by source review | Sandbox transaction and ITN evidence; no live charge |
| Backup/restore | Not proven by source review | Controlled restore drill and data-integrity check |
| Public launch | **BLOCKED** | All mandatory gates evidenced and reviewed |

## Workflow files reviewed

- `.github/workflows/kingsmen-application-builds.yml`
- `.github/workflows/kingsmen-source-guard.yml`
- `.github/workflows/jarvis-live-runtime.yml`
- `.github/workflows/batch21c-docker-runtime-proof.yml`

## Safety and change control

No workflow was dispatched, no branch protection changed, no migration was applied, no deployment was triggered, no live payment was initiated, no provider communication was sent, and no production data or configuration was modified. This document is a proposed verification plan and source/workflow finding register, not a claim that the checks have passed.
