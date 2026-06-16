# Kingsmen Final Assembly Evidence Capture Proof

Status: `foundation_built_pending_final_evidence_capture_review`

Production ready: **false**  
Public launch allowed: **false**  
Final assembly can open: **false**

This module is the bridge between source-level launch proof and real staging evidence. It does not run PayFast, PostgreSQL, email, WhatsApp, branch protection, or staging monitoring by itself. It collects already-created redacted staging reports into one final assembly evidence bundle.

## Why this exists

The launch gate now has many source-level proof modules. Those prove the codebase has the right boundaries, but they do not prove the deployed staging system worked. Final assembly needs one reviewed bundle that summarizes every staging report without leaking sensitive data.

## Required input reports

The collector expects these files:

- `reports/staging/truth-vault-persistence-staging-latest.json`
- `reports/staging/web-backend-boundary-staging-latest.json`
- `reports/staging/rls-sql-isolation-staging-latest.json`
- `reports/staging/payfast-provider-sandbox-staging-latest.json`
- `reports/staging/backup-restore-drill-staging-latest.json`
- `reports/security/secrets-wiring-runtime-health-latest.json`
- `reports/staging/communications-provider-staging-latest.json`
- `reports/staging/observability-incident-staging-latest.json`
- `reports/staging/legal-privacy-publication-staging-latest.json`
- `reports/repo/main-branch-protection-apply-latest.json`

## Bundle output

The collector writes:

```txt
reports/final-assembly/final-assembly-evidence-bundle-latest.json
```

The bundle may contain:

- report path
- exists flag
- passed flag
- reviewed flag
- redaction flag
- source report status
- report SHA-256 hash
- timestamp
- counts

The bundle must not contain:

- raw staging report bodies
- database URLs
- provider credentials
- provider passphrases
- raw candidate names
- raw candidate contact details
- document contents
- payment card data
- private keys

## Commands

Source proof:

```bash
npm run final:prove:evidence
```

Source validator:

```bash
npm run final:validate:evidence
```

Local/Oracle staging collection:

```powershell
.\scripts\staging\Collect-KingsmenFinalAssemblyEvidence.ps1
```

Strict collection that exits non-zero when any report is missing/failed/unreviewed/unredacted:

```powershell
.\scripts\staging\Collect-KingsmenFinalAssemblyEvidence.ps1 -RequireAll
```

## Final assembly rule

Final assembly remains closed until every required runtime report exists, passes, is redacted, and is reviewed. Founder review is still required even when the bundle is complete.
