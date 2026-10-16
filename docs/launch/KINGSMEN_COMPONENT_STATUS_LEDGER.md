# Kingsmen Component Status Ledger

**Purpose:** Single working ledger for implementation progress. This is a source-level snapshot, not proof of runtime readiness. Update after each material change and attach evidence before advancing a status.

**Status vocabulary:** Not started · Implemented · Validated · Runtime verified · Accepted · Blocked

**Safety gates**
- **Database recovery:** **Blocked** — no verified timestamped logical backup + checksum + isolated restore + schema/data verification evidence is currently recorded here. Do not apply Supabase migrations or push schema changes until that evidence is reviewed.
- **Runtime / staging proof:** **Blocked / not established** unless a specific test run, environment, timestamp, and artifact are linked below.
- **Money:** integer cents only; live payments remain disabled pending explicit approval and sandbox evidence.
- **Data:** synthetic test accounts only.

## Current phase queue

| Order | Component / gate | Existing source / evidence to inspect | Related PRs | Status | Known gap / risk | Exact next action | Evidence required to close |
|---:|---|---|---|---|---|---|---|
| 0 | Source Guard / CI wiring | `package.json`; `scripts/validators/validate-api-truth-vault-persistence.mjs`; workflow run previously reported missing script `api:validate:truth-vault` | #82, #73 | Implemented (fix proposed on this branch; not yet CI-verified) | Script existed under `api:validate` but required Source Guard alias was absent. A source fix does not prove the workflow passes. | Run Source Guard and required API checks on the PR; fix genuine findings without weakening gates. | Green run URL + job logs for all required checks. |
| 0 | Component ledger / tracker reconciliation | PR #83 master plan; PR #84 logic/gap inventory; this ledger | #83, #84 | Implemented (initial snapshot) | Existing tracker CSV and all source/PR mappings still need direct row-by-row reconciliation. | Compare tracker rows with default-branch files and active PR diffs; amend this ledger with exact paths and conflicts. | Reviewed ledger commit and reconciled tracker reference. |
| 1 | Database recovery | Supabase staging project ref recorded in project notes: `euhubhhnumtibbyufghm` | #74, #76–#80 | Blocked | No verified logical backup, checksum, isolated restore, or restore verification is recorded. | Create backup; record timestamp, byte size, SHA-256; restore only to a confirmed isolated database; verify schema, key tables, relationships, RLS, functions, and synthetic sample data. | Backup manifest + restore log + verification report reviewed by founder. |
| 1 | Migration/schema reconciliation | `supabase/migrations/`; pending PR migration files | #74, #76–#80 | Blocked | Existing deployed schema/history has not been reconciled against all proposed migrations. | After recovery gate passes, compare migration history and definitions on the isolated restored copy; resolve duplicate/incompatible functions, triggers, grants, tables, and RLS. | Reproducible isolated migration test and schema diff; no staging push before gate. |
| 2 | Reproducible dependencies/build | Root `package.json`; root/API lockfiles; API workflow | #82, #73 | Blocked / not established | Clean deterministic install and lockfile completeness have not been proven by a clean CI run. | Audit tracked lockfiles and package scripts; run clean install, build, type checks and tests in CI. | Successful clean-environment run with exact commit SHA. |
| 3 | Truth Vault persistence | `apps/api/src/db/truth-vault-repository.ts`; `scripts/validators/validate-api-truth-vault-persistence.mjs`; API server/storage mode | #82, #80, #73 | Implemented foundation; runtime verification not established | Project notes identify `memory_development_only` as a launch blocker; validator success alone cannot prove deployed persistence. | Trace all API writes/reads through the repository abstraction; connect to PostgreSQL/Supabase safely after schema/recovery gates; test restart persistence and transaction/idempotency behaviour. | Synthetic writes survive restart; DB evidence and API test report. |
| 3 | Candidate identity, authorization, RLS | API auth helpers; `kingsmen_security.current_authenticated_candidate_id()`; RLS policies and founder guard | #76, #78, #80 | Implemented foundation; runtime verification not established | Candidate-to-auth identity linking and positive/negative role isolation must be proved against actual policies. | Run anonymous denial, Candidate A/B cross-access denial, founder positive and non-founder negative cases with synthetic accounts. | Test output and policy/schema evidence tied to environment and commit. |
| 4 | Candidate onboarding, KYC, compliance | `apps/api/src/components/candidate-router.ts`; proposed onboarding/KYC/compliance migrations | #76, #80 | Implemented foundation; runtime verification not established | Full registration-to-KYC workflow, review states, and document lifecycle are not proven end-to-end. | After Phases 1–3, run synthetic registration → onboarding → KYC → review/status → dashboard flow. | Playwright/API report and no manual DB surgery. |
| 4 | Documents and private storage | Document modules, storage policies and retention metadata | #76, #78, #73 | Partial / not runtime verified | Private upload/download, integrity, versioning, quarantine/scanning, correction flow and actual deletion worker require proof. | Audit existing storage code and policies; implement only missing lifecycle behaviour; test ownership and expired-object deletion. | Synthetic upload/access-denial/integrity/retention evidence. |
| 5 | Opportunities, eligibility, applications | API opportunity/application modules and relevant web routes | #73, #80 | Partial / not runtime verified | Verified source/freshness, eligibility rationale, and Prepared vs Submitted vs Official decision states need an end-to-end test. | Map existing state machine and source evidence; close gaps and test representative synthetic opportunity lifecycle. | State transition tests + source/verification timestamps + runtime journey. |
| 5 | Founder command centre / Jarvis | `packages/jarvis-core/src/`; `packages/contracts/src/jarvis/index.ts`; founder API modules | #73, #78, #82 | Implemented foundation; runtime verification not established | HUD/API integration, authority boundaries, approval workflow and evidence ledger must use real backend state. | Defer expansion; integrate after persistent backend and isolation gates; test allowed, approval-required, and prohibited commands. | Runtime command evidence plus unauthorized-action denials. |
| 6 | Offers, contracts, selection | API offer/signing routes; selection/offer/signature migrations | #76, #77, #80 | Partial / not runtime verified | Signature metadata is not by itself proof of legally valid electronic signing; expiry and replay cases need tests. | Validate complete decision → versioned offer → candidate acceptance/evidence lifecycle and legal requirements. | Synthetic lifecycle, replay/expiry tests, reviewed legal acceptance criteria. |
| 6 | Invoices, PayFast, refunds | `apps/api/src/components/payfast*.ts`; `supabase-payment-store.ts`; billing/payment migrations | #75, #79, #80 | Partial / not runtime verified | No full PayFast sandbox matrix evidenced; refund execution/reversal and ledger reconciliation remain open. | Keep live payments disabled; test success, cancel, failure, duplicate ITN, invalid signature, amount mismatch, atomic ledger, and refund paths in sandbox. | Provider sandbox records + internal ledger reconciliation report. |
| 7 | Communications and consent | Notification queue modules; email/WhatsApp/SMS integration points | #77, #79 | Partial / not runtime verified | Queue metadata is not delivery; provider evidence, bounce/retry, consent/opt-out and channel rules need proof. | Implement/test email delivery first; enforce urgent-only WhatsApp and backup-only SMS. | Safe-recipient provider event evidence and retry/opt-out tests. |
| 7 | Search, reports, support, workers | Reporting/search metadata and support modules | #73, #79 | Partial / not runtime verified | Index refresh/export metadata is not a working worker or secure report download. | Implement durable workers, permissioned search, real export/download expiry, retries, timeouts and dead-letter visibility. | Worker execution artifacts and permission/failure-recovery tests. |
| 8 | Observability, privacy/legal, final assembly | Launch gate validators, staging proof pack and launch docs | #73, #83, #84 | Blocked / not runtime verified | Full synthetic candidate + founder journeys, legal/data-subject process, monitoring, and all launch-gate evidence not established. | Assemble evidence only after core workflows pass; repeat recovery drill; present explicit go/no-go to founder. | All blueprint launch gates linked to real evidence and explicit founder acceptance. |

## Open PR map (initial; verify live state before relying on it)

| PR | Known scope from current project review | Working interpretation |
|---:|---|---|
| #84 | Complete Logic & Gap Inventory | Documentation source; freeze once ledger reconciliation is complete. |
| #83 | Master Completion Plan | Sequencing source; freeze once ledger reconciliation is complete. |
| #82 | API CI bootstrap / validation gates | Immediate engineering focus: prove Source Guard and API checks on real CI. |
| #80 | API component foundations + PayFast | Reconcile with existing source; do not infer operational PayFast from code alone. |
| #79 | Reporting/search/billing/WhatsApp metadata | Metadata foundation; workers/provider delivery remain proof requirements. |
| #78 | Founder RBAC/storage retention | Validate roles and actual object deletion; metadata alone is insufficient. |
| #77 | Contracts, notifications, audit log | Validate replay, expiry, delivery and append-only behaviour. |
| #76 | Onboarding, compliance, performance | Validate candidate lifecycle and policies against restored schema. |
| #75 | Finance baseline tests | Run tests and extend to provider callback/reversal cases. |
| #74 | Migration safety | Keep unapplied until recovery gate passes. |
| #73 | Real validation gates | Preserve strict gates; repair failures rather than bypassing them. |
| #70 | Existing portal prototype | Reconcile existing implementation with current default branch before duplicating work. |

## Evidence recording format

For every status above **Implemented**, record:
- commit SHA and PR URL;
- command/workflow name and result URL;
- environment and timestamp;
- synthetic scenario(s), including negative tests;
- evidence artifact/report path;
- unresolved failures or limits.

**Do not promote a component to Runtime verified or Accepted from source inspection, a mocked provider, a metadata row, or a validator that only checks file contents.**

## Latest verification snapshot — 2026-10-16

### GitHub CI evidence

- Source Guard run: [run 38924426301](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/38924426301) — **SUCCESS** on commit `5a81113e00d56550130e602ad4946ed2ae286a4e`. All 29 workflow steps completed successfully, including Truth Vault source validator, web/backend boundary, PayFast source proof + validator, RLS source proof + validator, backup/restore source proof + validator, secrets, communications, observability, legal/privacy, staging proof pack, staging evidence capture, final assembly, branch-protection source proof + validator, and launch audit.
- Jarvis Live Runtime run: [run 38924426331](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/38924426331) — **SUCCESS**; Jarvis core, runtime controller, and live batch validators passed.
- These are **source/CI validation results**, not proof that live staging recovery, RLS role isolation, real PayFast provider checkout, provider delivery, or production branch protection have been completed.
- The Source Guard workflow command wiring was repaired in `package.json` using existing proof/validator scripts. A stale RLS validator assertion was corrected to check the current launch-gate diagnostic, the launch-readiness manifest now explicitly states the PayFast evidence requirement, and the staging evidence/final evidence collector commands are now declared.

### Supabase read-only inspection

Project: `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`), region `eu-west-1`, status reported `ACTIVE_HEALTHY`, PostgreSQL 17.11.

Read-only SQL/API inspection at 2026-10-16 15:25 UTC reported:
- 188 public base tables;
- 214 public RLS policies;
- 10 application functions across `public` and `kingsmen_security`;
- 30 applied migrations, through `20261015153651 / n30_revoke_unneeded_candidate_mutations_0030`;
- Supabase security advisor returned no security lints;
- performance advisor reported 162 unused-index findings (informational; not a reason to remove indexes without workload analysis).

This is a metadata/schema inspection only. It is **not a backup** and does not prove recoverability or candidate isolation.

### Build tracker reconciliation — initial measurement

Default-branch `Kingsmen_Build_Tracker.csv` was read at blob SHA `51e3f84153d76e2d47a709351b807168f86a2225`. It contains 188 task rows across phases 0–14. Status values at that snapshot: 185 `Not_Started`, 3 `Built`. This does not by itself prove the rows are accurate against current source or runtime evidence; row-by-row path and evidence reconciliation remains open. Keep the CSV as the existing task-level tracker and this ledger as the major-component/gate view until the two are reconciled.

## Current exit-gate decision

- **Phase 0 CI wiring:** Source Guard and Jarvis Live Runtime checks are now green on the branch. The ledger and tracker exist, but detailed tracker row reconciliation and verified GitHub branch-protection settings remain open; do not claim the entire repository lock gate is closed yet.
- **Phase 1 database recovery:** **BLOCKED.** No timestamped logical dump, size, SHA-256, isolated restore log, or schema/data verification report has been produced. No migration was applied and no database write was performed during this inspection.
- **Migration rule remains active:** no Supabase migrations, schema pushes, or branch merges until a genuine backup is restored and verified in an isolated target.
