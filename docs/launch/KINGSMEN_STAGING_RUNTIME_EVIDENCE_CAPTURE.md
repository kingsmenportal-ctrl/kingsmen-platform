# Kingsmen Staging Runtime Evidence Capture

Status: **foundation built, runtime execution pending**

Production ready: **false**

Public launch allowed: **false**

Validator token: Staging runtime evidence capture

This module adds the staging command that writes the 10 runtime evidence reports expected by the staging runtime proof pack and final assembly collector.

## Command

```powershell
.\scripts\staging\Invoke-KingsmenStagingRuntimeEvidencePack.ps1
```

Root npm wrapper:

```bash
pwsh -NoProfile -File scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1
```

## What the command writes

The runner writes these report paths:

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

## Safety rules

The reports must not print raw database URLs, provider credentials, candidate names, candidate contact details, document contents, card data, or provider passphrases.

Each report has:

```json
{
  "passed": false,
  "reviewed": false,
  "redacted": true,
  "rawSecretsPrinted": false,
  "rawCandidateDataPrinted": false,
  "providerCredentialsPrinted": false
}
```

A report may become `passed: true` only after the real staging check passes. The runner does not fake external provider proofs.

## Probe modes

Database probe:

```powershell
.\scripts\staging\Invoke-KingsmenStagingRuntimeEvidencePack.ps1 -RunDatabaseProbe
```

Web/API probe:

```powershell
.\scripts\staging\Invoke-KingsmenStagingRuntimeEvidencePack.ps1 -RunWebProbe
```

Both probes require environment variables configured outside Git.

## Review rule

`reviewed` defaults to false. Use `-MarkOperatorReviewed` only after the report has been checked by the operator/founder.

Final assembly still requires:

```bash
pwsh -NoProfile -File scripts/staging/Collect-KingsmenFinalAssemblyEvidence.ps1
```

and a founder review of `reports/final-assembly/final-assembly-evidence-bundle-latest.json`.
