# Kingsmen Launch Readiness

This document is the real finish-line map for launching Kingsmen. A module can be present in the repo and still be blocked from public launch until runtime evidence exists.

## Current verdict

**Public launch is blocked.**

The repo has source-level proof for backend API, PostgreSQL/Supabase Truth Vault persistence, safe web-to-backend boundary, PayFast sandbox boundary, RLS/security, backup/restore, branch protection, secrets wiring, communications, observability + incident handling, legal + privacy + consent + refund policy, the staging runtime proof pack, and final assembly evidence capture. It is still not safe to open to public candidates or take money because real staging evidence and final founder review are still pending.

## Exact blockers

### P0 — Must be fixed before any public users

1. **Protect `main`.** Source guard and apply script exist, but GitHub protection must still be applied and verified.
2. **Prove Truth Vault persistence on staging.** A live staging run must prove command log, idempotency, workflow run, evidence ledger, audit, approval, heartbeat, and DLQ paths.
3. **Prove RLS/security in staging.** Apply the hardening migration to staging and test candidate, operator, founder, anonymous, and backend service isolation.
4. **Prove safe web-to-backend boundary in staging.** The deployed web app must prove `KINGSMEN_BACKEND_BASE_URL` calls API health and command intake without local shell, local file writes, or direct database access.
5. **Prove PayFast sandbox + ITN against provider sandbox.** No real payments until sandbox success/cancel/return/failure/duplicate/invalid-signature/replay/amount-mismatch/refund-review evidence exists from staging.
6. **Prove backup and restore.** No production personal data until a real staging restore drill proves backup archive checksum, target/source separation, counts-only verification, RPO/RTO, and redaction.
7. **Wire secrets outside git.** Launch requires masked runtime health evidence proving required environment variables are configured outside Git without printing values.
8. **Prove communications provider boundary.** Candidate notifications require provider staging send/receive, bounce, opt-out, WhatsApp urgent-only, SMS fallback-only, and redacted evidence proof.
9. **Prove observability and incident handling.** Public users require staging health, logs, queue/DLQ, alerts, redaction, and SEV runbook evidence.
10. **Publish privacy, consent, terms, and refund policy.** Launch requires published/versioned surfaces, founder/legal review, consent capture proof, refund/payment display proof, and data-subject request proof.
11. **Capture the staging runtime proof pack.** Final assembly must not open until the staging runtime proof pack contains reviewed redacted runtime evidence for all P0 gates.
12. **Capture final assembly evidence bundle.** The final assembly collector must summarize every required staging report with SHA-256/status/review/redaction fields and founder review must remain required.

## RLS/security source-level boundary

`RLS/security source-level boundary` is static evidence only; it is not proof of live tenant isolation. `RLS_SECURITY_SCRIPT_MISSING` means the required source validator or proof script is absent, and `RLS_STAGING_PROOF_REQUIRED` remains a hard launch gate until separate candidate, staff/operator, founder and backend identities have been tested against staging.

## Source proof command stack

Run these commands for source-level proof only:

```bash
npm run api:validate:truth-vault
npm run web:validate:backend-boundary
npm run payments:prove:sandbox
npm run payments:validate:sandbox
npm run security:prove:rls
npm run security:validate:rls
npm run backup:prove:restore
npm run backup:validate:restore
npm run secrets:prove:wiring
npm run secrets:validate:wiring
npm run communications:prove
npm run communications:validate
npm run observability:prove
npm run observability:validate
npm run legal:prove
npm run legal:validate
npm run staging:prove:pack
npm run staging:validate:pack
npm run final:prove:evidence
npm run final:validate:evidence
npm run repo:prove:branch-protection
npm run repo:validate:branch-protection
npm run kingsmen:launch:audit
```

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

```bash
npm run payments:prove:sandbox
npm run payments:validate:sandbox
```

This does not authorize live payments. Run real PayFast sandbox checkout against a staging notify URL before paid pilot.

## RLS/security proof command

```bash
npm run security:prove:rls
npm run security:validate:rls
```

This does not authorize public candidate traffic. Apply the RLS hardening migration to staging and capture live SQL role-isolation proof.

## Backup/restore proof command

```bash
npm run backup:prove:restore
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

## Branch protection command

```bash
npm run repo:prove:branch-protection
npm run repo:validate:branch-protection
```

Apply GitHub branch protection with admin permissions:

```powershell
.\scripts\github\Set-KingsmenMainBranchProtection.ps1
```

## Secrets wiring proof command

```bash
npm run secrets:prove:wiring
npm run secrets:validate:wiring
```

Masked runtime health check:

```powershell
.\scripts\security\Test-KingsmenSecretWiring.ps1
```

Reports may show only configured/not-configured/masked status and must never print values, URLs, token prefixes, private keys, service-role keys, or provider secrets.

## Communications proof command

```bash
npm run communications:prove
npm run communications:validate
```

Provider staging proof still required: email send/receive, bounce handling, opt-out path, WhatsApp urgent-only approval evidence, SMS fallback-only evidence, and redacted evidence report.

## observability + incident proof command

```bash
npm run observability:prove
npm run observability:validate
npm run observability:staging
```

Staging observability proof still required: API health proof, database health proof, queue/DLQ proof, structured log sample with correlationId, alert proof, SEV1/SEV2/SEV3 incident drill, founder escalation, and no PII or secrets in logs proof.

## legal + privacy + consent + refund proof command

```bash
npm run legal:prove
npm run legal:validate
```

Publication and review proof still required: published Terms of Service, Privacy Notice, Consent Notice, Refund and Payment Policy, Data Subject Request Path, founder/legal review record with policy versions, consent capture smoke proof, refund/payment display proof, and no personal data collection before privacy notice proof.

## Staging runtime proof pack command

```bash
npm run staging:prove:pack
npm run staging:validate:pack
```

See `docs/launch/KINGSMEN_STAGING_RUNTIME_PROOF_PACK.md`.

The staging runtime proof pack requires these redacted runtime reports:

```txt
reports/staging/truth-vault-persistence-staging-latest.json
reports/staging/web-backend-boundary-staging-latest.json
reports/staging/rls-sql-isolation-staging-latest.json
reports/staging/payfast-provider-sandbox-staging-latest.json
reports/staging/backup-restore-drill-staging-latest.json
reports/security/secrets-wiring-runtime-health-latest.json
reports/staging/communications-provider-staging-latest.json
reports/staging/observability-incident-staging-latest.json
reports/staging/legal-privacy-publication-staging-latest.json
reports/repo/main-branch-protection-apply-latest.json
```

The staging pack is source-built, but runtime evidence remains pending until those files exist and are reviewed.

## Final assembly evidence capture command

```bash
npm run final:prove:evidence
npm run final:validate:evidence
```

Collector for Windows/Oracle staging:

```powershell
.\scripts\staging\Collect-KingsmenFinalAssemblyEvidence.ps1
```

Strict collector that exits non-zero if any required staging report is missing, failed, unreviewed, or unredacted:

```powershell
.\scripts\staging\Collect-KingsmenFinalAssemblyEvidence.ps1 -RequireAll
```

See `docs/launch/KINGSMEN_FINAL_ASSEMBLY_EVIDENCE_CAPTURE.md`.

The output is:

```txt
reports/final-assembly/final-assembly-evidence-bundle-latest.json
```

The bundle must contain only report paths, status flags, review flags, redaction flags, timestamps, counts, and SHA-256 hashes. It must not copy raw staging report bodies.

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
2. **Staging runtime:** run API + web + PostgreSQL/Supabase + internal command flow + staging runtime proof pack.
3. **Final assembly:** collect final assembly evidence bundle, founder-review every report, and keep public launch blocked until all P0 evidence passes.
4. **Founder private beta:** process a small number of real test candidates manually with evidence.
5. **Paid pilot:** only after PayFast, refunds, support, backup/restore, communications proof, legal/privacy proof, incident response, observability proof, staging pack, and final assembly evidence bundle pass.
6. **Public launch:** only after every required launch gate opens.
