# Kingsmen Local Truth Vault PostgreSQL

This is a **local/staging-only** PostgreSQL starter for generating real Truth Vault evidence without using placeholder database URLs.

Production ready: **false**  
Public launch allowed: **false**  
Raw secrets in Git: **false**  
Database URL printed to logs: **false**

## What it does

The script creates or starts a Docker PostgreSQL container, writes a local env file, applies `db/migrations/*.sql`, and writes a redacted local readiness report.

```txt
scripts/staging/Start-KingsmenLocalTruthVault.ps1
.local/kingsmen.local-postgres.env
reports/staging/local-truth-vault-postgres-latest.json
```

The `.local` env file and `reports` output are local runtime artifacts and must not be committed.

## Start local Truth Vault

```powershell
cd C:\Kingsmen\kingsmen-platform

.\scripts\staging\Start-KingsmenLocalTruthVault.ps1
```

The script writes:

```txt
.local/kingsmen.local-postgres.env
```

## Load the local env into PowerShell

```powershell
Get-Content .local\kingsmen.local-postgres.env | ForEach-Object {
  if ($_ -match '^[A-Z0-9_]+=') {
    $name, $value = $_ -split '=', 2
    Set-Item -Path "Env:$name" -Value $value
  }
}
```

## Start API against local PostgreSQL

Use CMD for the API process:

```bat
cd C:\Kingsmen\kingsmen-platform
for /f "usebackq tokens=1,* delims==" %A in (`type .local\kingsmen.local-postgres.env`) do set %A=%B
npm run api:build
npm run api:start
```

## Capture DB and web proof

Use PowerShell while the API is running:

```powershell
cd C:\Kingsmen\kingsmen-platform

Get-Content .local\kingsmen.local-postgres.env | ForEach-Object {
  if ($_ -match '^[A-Z0-9_]+=') {
    $name, $value = $_ -split '=', 2
    Set-Item -Path "Env:$name" -Value $value
  }
}

.\scripts\staging\Invoke-KingsmenStagingRuntimeEvidencePack.ps1 -RunDatabaseProbe -RunWebProbe -MarkOperatorReviewed -PreserveExistingPassedReports
npm run final:collect:evidence
npm run kingsmen:launch:audit
```

Expected local proof movement:

```txt
truth-vault-persistence-staging-latest.json = passed true
web-backend-boundary-staging-latest.json = passed true
passedReports: 2
failedFileChecks: 0
launch gate: blocked
```

The launch gate remains blocked because PayFast, RLS isolation, backup/restore, secrets runtime, communications, observability, legal/privacy, branch protection, and founder review still require real evidence.
