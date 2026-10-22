# Kingsmen Launch Readiness

This document is the real finish-line map for launching Kingsmen. A module can be present in the repo and still be blocked from public launch until runtime evidence exists.

## Current verdict

**Public launch is blocked.**

The repo has source-level proof for backend API, PostgreSQL/Supabase Truth Vault persistence, safe web-to-backend boundary, PayFast sandbox boundary, RLS/security, backup/restore, branch protection, secrets wiring, communications, observability + incident handling, legal + privacy + consent + refund policy, the staging runtime proof pack, and final assembly evidence capture. The RLS/security source-level boundary is built, but staging role-isolation proof remains a separate required gate. It is still not safe to open to public candidates or take money because real staging evidence and final founder review are still pending.

## Verified staging evidence snapshot (2026-10-22)

- A live read-only catalog query inspected 225 public base tables: RLS is enabled on all 225 and disabled on none.
- Exactly three RLS-enabled backend-only review/audit tables have no client policies; live grant checks confirm `anon` and `authenticated` cannot SELECT them while `service_role` can. Do not add client policies just to silence the informational advisor notices.
- The identity helper is in the non-exposed `private` schema; the public-schema helper is absent. The identity-review submission Edge Function is ACTIVE v3 with JWT verification enabled.
- These checks do **not** prove policy correctness for all tables, authenticated candidate A/B isolation, private object isolation, reviewer decisions, or a published frontend commit. There are zero active platform reviewers, identity-review requests, verified identity links, and private documents in staging.
- Machine-readable evidence: `reports/security/rls-security-staging-snapshot-2026-10-22.json`. This is explicitly a partial catalog/privilege snapshot, not the full release proof.

## Cross-module staging evidence — 2026-10-22

The current machine-readable review is `reports/validation/cross-module-staging-audit-2026-10-22.json`. It is a partial staging audit, not a production approval.

- **N03 Truth Vault:** a staging-only PostgreSQL probe inserted an expiring idempotency row; a duplicate insert returned no row and did not overwrite the original response; an independent subsequent read confirmed the original record; a redacted `STAGING_PERSISTENCE_PROBE` audit event was persisted and re-read. This proves the database-level unique-key/read/write path only—not the application command path, process restart recovery, or backup/restore.
- **N04/N05:** identity review is ACTIVE v3 and private documents ACTIVE v7 with JWT verification. There are no verified identity links, active reviewers, review requests, or private documents, so authenticated candidate/reviewer and real binary storage journeys remain untested.
- **N06/N15:** 14 official South African source authority anchors were added to the idempotent seed and staging catalog. Staging now has 21 authorities, all requiring programme-level verification. There are still only 2 route-programme anchors and 0 eligible recent OPEN/FUTURE listings; the source anchors do not assert current programme availability.
- **Applications/outcomes:** staging has zero candidate application trackers, preparation items, submission jobs, or outcomes; provider acknowledgement and independently confirmed outcomes remain unproven.
- **N09/N14:** notification outbox, delivery attempts, consent records, integration outbox and dead-letter queues have zero rows. Real provider delivery, consent enforcement, retries and replay are not verified.
- **N12/N13/N16:** RLS is enabled on all 225 inspected public tables. Three intentionally backend-only tables have no client policies and no client SELECT grant. Health snapshots, service checks, incidents and worker heartbeats are currently zero; operational recovery has not been exercised.
- **N17/N18/N19 and release:** Netlify metadata still provides no current deploy ID or published commit. PR #134 remains open/draft. Public release stays blocked.

For the current code commit `2aab5ed76e31a57cf67db53592fbca67b44293ae`, Kingsmen One smoke tests, Source Guard and Release Evidence all passed (runs `39842755887`, `39842755908`, `39842755925`). Those checks are repository/build/health evidence, not authenticated user-flow evidence.

## Exact blockers

### P0 — Must be fixed before any public users

1. **Protect `main`.** Source guard and apply script exist, but GitHub protection must still be applied and verified.
2. **Prove Truth Vault persistence on staging.** A live staging run must prove command log, idempotency, workflow run, evidence ledger, audit, approval, heartbeat, and DLQ paths.
3. **Prove RLS/security in staging.** Apply the hardening migration to staging and test candidate, operator, founder, anonymous, and backend service isolation.
4. **Prove safe web-to-backend boundary in staging.** The deployed web app must prove `KINGSMEN_BACKEND_BASE_URL` calls API health and command intake without local shell, local file writes, or direct database access.
5. **Payment collection gate (PayFast deferred).** PayFast account setup is deferred and must not block building or testing unpaid candidate journeys. Until an account exists and sandbox success/cancel/return/failure/duplicate/invalid-signature/replay/amount-mismatch/refund-review evidence passes in staging, keep checkout/payment collection and payment-dependent entitlements disabled. Never simulate a successful payment or mark an order paid without a verified provider event.
6. **Prove backup and restore.** No production personal data until a real staging restore drill proves backup archive checksum, target/source separation, counts-only verification, RPO/RTO, and redaction.
7. **Wire secrets outside git.** Launch requires masked runtime health evidence proving required environment variables are configured outside Git without printing values.
8. **Prove communications provider boundary.** Candidate notifications require provider staging send/receive, bounce, opt-out, WhatsApp urgent-only, SMS fallback-only, and redacted evidence proof.
9. **Prove observability and incident handling.** Public users require staging health, logs, queue/DLQ, alerts, redaction, and SEV runbook evidence.
10. **Publish privacy, consent, terms, and refund policy.** Launch requires published/versioned surfaces, founder/legal review, consent capture proof, refund/payment display proof, and data-subject request proof.
11. **Capture the staging runtime proof pack.** Final assembly must not open until the staging runtime proof pack contains reviewed redacted runtime evidence for all P0 gates.
12. **Capture final assembly evidence bundle.** The final assembly collector must summarize every required staging report with SHA-256/status/review/redaction fields and founder review must remain required.

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
