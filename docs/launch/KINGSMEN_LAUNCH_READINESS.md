# Kingsmen Launch Readiness

This document is the real finish-line map for launching Kingsmen. It is intentionally strict: a module can be architecturally present in the repo and still be blocked from public launch until its runtime evidence exists.

## Current verdict

**Public launch is blocked.**

The repo has strong doctrine, contracts, migrations, module manifests, validators, local proof surfaces, a deployable backend API runtime, PostgreSQL/Supabase Truth Vault persistence foundation, a source-level safe web-to-backend boundary, a PayFast sandbox proof boundary, an RLS/security source-level boundary, and a backup/restore source-level boundary. It is still not safe to open to public candidates or take money because real staging proof, real PayFast sandbox provider evidence, real backup/restore drill evidence, branch-protection, legal/privacy, and staging runtime gates remain closed.

## How far from launch

| Launch stage | Status | Meaning |
|---|---|---|
| Architecture / doctrine | Mostly complete | N00-N20 concepts and rules are represented in repo files. |
| Database schema | RLS source boundary built | Truth Vault migration exists and RLS hardening migration exists. Staging SQL role-isolation proof is still required. |
| Backend API | Runtime + persistence foundation built | `apps/api` has a package, TypeScript build config, server entrypoint, health route, command intake, workflow-result intake, read-model routes, and optional PostgreSQL Truth Vault mode. Staging DB integration proof is still required. |
| Web / control plane | Boundary foundation built | Public Free Destiny Map and Jarvis API routes now use backend API command/health boundaries instead of local shell/JSONL writes. Staging web/API smoke proof is still required. |
| Payments | Source-level sandbox proof built, real provider proof pending | PayFast signature/ITN/cancel/return/duplicate/replay/amount/refund/redaction proof is represented in code and validators. Real PayFast sandbox checkout against staging notify URL is still required before taking money. |
| Backup / restore | Source-level boundary built, real staging drill pending | Backup and restore scripts, manifest, proof runner, validator, and archive gitignore rules exist. A real staging restore drill with RPO/RTO evidence is still required before production personal data. |
| Communications | Manual required | Email primary and WhatsApp urgent-only doctrine exists; provider proof is still needed. |
| Workflow execution | Partial | Workflow codes and state machine exist; deployed n8n/worker callback proof is still required. |
| Observability | Partial | Audit/evidence patterns exist; live monitoring, DLQ review, and incident SOP need proof. |
| Production operations | Blocked | Branch protection, secrets, backup/restore staging drill, and launch runbook are required. |

## Exact blockers

### P0 — Must be fixed before any public users

1. **Protect `main`.** The repository currently warns that the main branch is not protected. Public launch needs branch protection with required validators.
2. **Prove Truth Vault persistence on staging.** The repository stub has been replaced with PostgreSQL-mode writes, but a live staging run must still prove command log, idempotency, workflow run, evidence ledger, audit, approval, heartbeat, and DLQ paths.
3. **Prove RLS/security in staging.** RLS/security source-level boundary is built, but the hardening migration must be applied to staging and tested for candidate, operator, founder, anonymous, and backend service isolation.
4. **Prove safe web-to-backend boundary in staging.** Source-level hardening is built, but the deployed web app must prove `KINGSMEN_BACKEND_BASE_URL` calls API health and command intake without local shell, local file writes, or direct database access.
5. **Prove PayFast sandbox + ITN against provider sandbox.** Source-level proof exists, but no real payments until sandbox success/cancel/return/failure/duplicate/invalid-signature/replay/amount-mismatch/refund-review evidence exists from staging.
6. **Prove backup and restore.** Source-level scripts exist, but no production personal data until a real staging restore drill proves backup archive checksum, target/source separation, counts-only verification, RPO/RTO, and secret/raw-data redaction.
7. **Wire secrets outside git.** No live keys in repo, chat, logs, screenshots, reports, or package artifacts.
8. **Publish privacy, consent, terms, and refund policy.** This is required before collecting personal data and money.

### P1 — Must be fixed before paid pilot

1. Add real email provider send proof and bounce/failure handling.
2. Add founder/operator dashboard that reads from backend read models, not local shell commands.
3. Add DLQ review and incident workflow.
4. Add staging deploy proof for web + API + database.
5. Add tenant-scoped founder console views.

### P2 — Must be fixed before scaling

1. Publish internal packages only after strict `files` whitelists and package dry runs.
2. Add SDK package for web/control-plane/workers.
3. Add load tests under the 500 active-candidate cap.
4. Add automated regression tests for N00-N20 invariants.
5. Add N21-N23 Mirror/Adapt/Copy reality-intelligence modules after the immediate launch blockers.

## API runtime command

```bash
cd apps/api
npm install
npm run build
npm start
```

Root helpers:

```bash
npm run api:build
npm run api:start
npm run api:validate:truth-vault
```

PostgreSQL Truth Vault mode:

```bash
KINGSMEN_TRUTH_VAULT_MODE=postgres
KINGSMEN_DATABASE_URL=postgres://...
KINGSMEN_DATABASE_SSL=true
npm run api:start
```

## Web backend boundary command

Required web env:

```bash
KINGSMEN_BACKEND_BASE_URL=http://127.0.0.1:8080
KINGSMEN_BACKEND_TIMEOUT_MS=15000
```

Validation:

```bash
npm run web:validate:backend-boundary
```

## Payment proof command

Source-level proof:

```bash
npm run payments:prove:sandbox
```

Validator:

```bash
npm run payments:validate:sandbox
```

This still does not authorize live payments. It only proves the source-level boundary. Before paid pilot, run real PayFast sandbox checkout against a staging notify URL and keep the generated proof reports.

## RLS/security proof command

Source-level proof:

```bash
npm run security:prove:rls
```

Validator:

```bash
npm run security:validate:rls
```

This still does not authorize public candidate traffic. Before public users, apply the RLS hardening migration to staging and capture live SQL role-isolation proof.

## Backup/restore proof command

Source-level proof:

```bash
npm run backup:prove:restore
```

Validator:

```bash
npm run backup:validate:restore
```

Real staging drill:

```powershell
$env:KINGSMEN_DATABASE_URL = "postgres://...source..."
$env:KINGSMEN_BACKUP_ROOT = "D:\\KingsmenBackups"
.\scripts\backup\New-KingsmenTruthVaultBackup.ps1

$env:KINGSMEN_RESTORE_DRILL_DATABASE_URL = "postgres://...restore-drill..."
.\scripts\backup\Test-KingsmenTruthVaultRestore.ps1 -BackupFile "D:\\KingsmenBackups\\...\\kingsmen-truth-vault-....dump"
```

This still does not authorize production personal data. It only proves the backup/restore source boundary. Before production data, run a real staging restore drill and store counts-only evidence with RPO/RTO.

## Launch command

Run this for a report without failing the shell:

```bash
npm run kingsmen:launch:audit
```

Run this as a boot-blocker before release:

```bash
npm run kingsmen:launch:gate
```

The gate must remain blocked until the P0 launch blockers are fixed and evidenced.

## Launch phases

1. **Repo lock:** protect main, require validators, stop accidental package/release mistakes.
2. **Staging runtime:** run API + web + PostgreSQL/Supabase + internal command flow.
3. **Founder private beta:** process a small number of real test candidates manually with evidence.
4. **Paid pilot:** only after PayFast, refunds, support, backup/restore, and incident response pass.
5. **Public launch:** only after every required launch gate opens.
