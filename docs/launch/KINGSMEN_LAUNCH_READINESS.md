# Kingsmen Launch Readiness

This document is the real finish-line map for launching Kingsmen. It is intentionally strict: a module can be architecturally present in the repo and still be blocked from public launch until its runtime evidence exists.

## Current verdict

**Public launch is blocked.**

The repo has strong doctrine, contracts, migrations, module manifests, validators, local proof surfaces, a deployable backend API runtime, PostgreSQL/Supabase Truth Vault persistence foundation, a source-level safe web-to-backend boundary, a PayFast sandbox proof boundary, an RLS/security source-level boundary, a backup/restore source-level boundary, a branch-protection source boundary, a secrets wiring source boundary, a communications proof source boundary, and an observability + incident proof source boundary. It is still not safe to open to public candidates or take money because real staging proof, real PayFast sandbox provider evidence, real backup/restore drill evidence, masked runtime secret health evidence, communications provider staging evidence, observability staging monitoring evidence, GitHub branch-protection application, legal/privacy, and staging runtime gates remain closed.

## How far from launch

| Launch stage | Status | Meaning |
|---|---|---|
| Architecture / doctrine | Mostly complete | N00-N20 concepts and rules are represented in repo files. |
| Database schema | RLS source boundary built | Truth Vault migration exists and RLS hardening migration exists. Staging SQL role-isolation proof is still required. |
| Backend API | Runtime + persistence foundation built | `apps/api` has a package, TypeScript build config, server entrypoint, health route, command intake, workflow-result intake, read-model routes, and optional PostgreSQL Truth Vault mode. Staging DB integration proof is still required. |
| Web / control plane | Boundary foundation built | Public Free Destiny Map and Jarvis API routes now use backend API command/health boundaries instead of local shell/JSONL writes. Staging web/API smoke proof is still required. |
| Payments | Source-level sandbox proof built, real provider proof pending | PayFast signature/ITN/cancel/return/duplicate/replay/amount/refund/redaction proof is represented in code and validators. Real PayFast sandbox checkout against staging notify URL is still required before taking money. |
| Backup / restore | Source-level boundary built, real staging drill pending | Backup and restore scripts, manifest, proof runner, validator, and archive gitignore rules exist. A real staging restore drill with RPO/RTO evidence is still required before production personal data. |
| Branch protection | Source boundary built, GitHub apply pending | Source guard workflow, protection manifest, apply script, proof runner, and validator exist. GitHub `main` protection must still be applied with admin permissions. |
| Secrets wiring | Source boundary built, runtime health pending | Credential registry, empty `.env.example`, masked health script, source proof, and validator exist. Real env vars must still be configured outside Git and checked with masked runtime reports. |
| Communications | Source boundary built, provider proof pending | Email-primary, WhatsApp-urgent-only, SMS-backup-only, consent, opt-out, bounce handling, and no-live-send proof exist. Provider staging send/receive proof is still required before candidate notifications. |
| Observability | Source boundary built, staging monitoring proof pending | Health checks, structured logs, correlation ID rules, DLQ review, alert categories, redaction, SEV runbook, and founder escalation proof exist. Live monitoring, alert, and incident drill proof is still required. |
| Workflow execution | Partial | Workflow codes and state machine exist; deployed n8n/worker callback proof is still required. |
| Production operations | Blocked | Branch protection, secrets runtime proof, backup/restore staging drill, communications provider proof, observability staging proof, and launch runbook are required. |

## Exact blockers

### P0 — Must be fixed before any public users

1. **Protect `main`.** Source guard and apply script exist, but GitHub protection must still be applied and verified.
2. **Prove Truth Vault persistence on staging.** The repository stub has been replaced with PostgreSQL-mode writes, but a live staging run must still prove command log, idempotency, workflow run, evidence ledger, audit, approval, heartbeat, and DLQ paths.
3. **Prove RLS/security in staging.** RLS/security source-level boundary is built, but the hardening migration must be applied to staging and tested for candidate, operator, founder, anonymous, and backend service isolation.
4. **Prove safe web-to-backend boundary in staging.** Source-level hardening is built, but the deployed web app must prove `KINGSMEN_BACKEND_BASE_URL` calls API health and command intake without local shell, local file writes, or direct database access.
5. **Prove PayFast sandbox + ITN against provider sandbox.** Source-level proof exists, but no real payments until sandbox success/cancel/return/failure/duplicate/invalid-signature/replay/amount-mismatch/refund-review evidence exists from staging.
6. **Prove backup and restore.** Source-level scripts exist, but no production personal data until a real staging restore drill proves backup archive checksum, target/source separation, counts-only verification, RPO/RTO, and secret/raw-data redaction.
7. **Wire secrets outside git.** Source-level secrets wiring proof exists, but launch still requires masked runtime health evidence proving required environment variables are configured outside Git without printing values.
8. **Prove communications provider boundary.** Source-level communications proof exists, but candidate notifications require provider staging send/receive, bounce, opt-out, WhatsApp urgent-only, SMS fallback-only, and redacted-evidence proof.
9. **Prove observability and incident handling.** Source-level observability + incident proof exists, but public users require staging health, logs, queue/DLQ, alert, redaction, and SEV runbook evidence.
10. **Publish privacy, consent, terms, and refund policy.** This is required before collecting personal data and money.

### P1 — Must be fixed before paid pilot

1. Add real email provider send proof and bounce/failure handling.
2. Add founder/operator dashboard that reads from backend read models, not local shell commands.
3. Add live DLQ review and incident workflow drill.
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
KINGSMEN_DATABASE_URL=[set-outside-git]
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
$env:KINGSMEN_DATABASE_URL = "[source-database-url-set-outside-git]"
$env:KINGSMEN_BACKUP_ROOT = "D:\KingsmenBackups"
.\scripts\backup\New-KingsmenTruthVaultBackup.ps1

$env:KINGSMEN_RESTORE_DRILL_DATABASE_URL = "[restore-drill-database-url-set-outside-git]"
.\scripts\backup\Test-KingsmenTruthVaultRestore.ps1 -BackupFile "D:\KingsmenBackups\...\kingsmen-truth-vault-....dump"
```

This still does not authorize production personal data. It only proves the backup/restore source boundary. Before production data, run a real staging restore drill and store counts-only evidence with RPO/RTO.

## Branch protection command

Source-level proof:

```bash
npm run repo:prove:branch-protection
```

Validator:

```bash
npm run repo:validate:branch-protection
```

Apply GitHub branch protection with admin permissions:

```powershell
.\scripts\github\Set-KingsmenMainBranchProtection.ps1
```

Dry run:

```powershell
.\scripts\github\Set-KingsmenMainBranchProtection.ps1 -DryRun
```

This still does not prove GitHub settings are active until the apply script passes and GitHub confirms `main` requires `source-guard`, blocks force push/deletion, and requires pull-request review.

## Secrets wiring proof command

Source-level proof:

```bash
npm run secrets:prove:wiring
```

Validator:

```bash
npm run secrets:validate:wiring
```

Masked runtime health check:

```powershell
.\scripts\security\Test-KingsmenSecretWiring.ps1
```

This still does not authorize public launch. Real secrets must live only in local `.env`, GitHub Secrets, Oracle environment variables, or future vault/KMS. Reports may show only configured/not-configured/masked status and must never print values, URLs, token prefixes, private keys, service-role keys, or provider secrets.

## Communications proof command

Source-level proof:

```bash
npm run communications:prove
```

Validator:

```bash
npm run communications:validate
```

Provider staging proof still required:

```txt
SMTP or email-provider sandbox send/receive
bounce handling
unsubscribe/opt-out path
WhatsApp urgent-only approval evidence
SMS fallback-only evidence
redacted evidence report with no recipient address or raw message body
```

This still does not authorize real candidate notifications. It only proves the source-level communications boundary.

## Observability + incident proof command

Source-level proof:

```bash
npm run observability:prove
```

Validator:

```bash
npm run observability:validate
```

Staging observability proof still required:

```txt
API health proof
database health proof
queue and DLQ proof
structured log sample with correlationId
payment failure alert proof
RLS/security alert proof
backup/restore alert proof
communications failure alert proof
SEV1/SEV2/SEV3 incident drill
founder escalation path
no PII or secrets in logs proof
```

This still does not authorize public users. It only proves the source-level observability and incident boundary.

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
4. **Paid pilot:** only after PayFast, refunds, support, backup/restore, communications proof, incident response, and observability proof pass.
5. **Public launch:** only after every required launch gate opens.
