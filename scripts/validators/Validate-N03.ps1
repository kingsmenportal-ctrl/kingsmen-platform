$ErrorActionPreference = "Stop"

$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

$RequiredFiles = @(
  "manifests\n03\postgres-truth-vault.json",
  "db\migrations\0001_n03_truth_vault.sql",
  "db\seeds\n03_source_authorities_seed.sql",
  "apps\api\src\db\truth-vault-schema.ts",
  "apps\api\src\db\database-url.ts",
  "apps\api\src\db\truth-vault-repository.ts",
  "apps\api\src\evidence\evidence-ledger.ts",
  "apps\api\src\idempotency\idempotency.ts",
  "apps\api\src\heartbeat\worker-heartbeat.ts",
  "apps\api\src\index.ts",
  "scripts\db\Run-N03Migration.ps1",
  "reports\n03\N03_POSTGRES_TRUTH_VAULT_REPORT.md"
)

$RequiredSqlMarkers = @(
  "CREATE EXTENSION IF NOT EXISTS pgcrypto",
  "CREATE TABLE IF NOT EXISTS candidates",
  "CREATE TABLE IF NOT EXISTS candidate_profiles",
  "CREATE TABLE IF NOT EXISTS applications",
  "CREATE TABLE IF NOT EXISTS idempotency_keys",
  "CREATE TABLE IF NOT EXISTS command_log",
  "CREATE TABLE IF NOT EXISTS workflow_runs",
  "CREATE TABLE IF NOT EXISTS evidence_ledger",
  "CREATE TABLE IF NOT EXISTS audit_events",
  "CREATE TABLE IF NOT EXISTS source_authorities",
  "CREATE TABLE IF NOT EXISTS route_sources",
  "CREATE TABLE IF NOT EXISTS worker_heartbeats",
  "CREATE TABLE IF NOT EXISTS dead_letter_queue",
  "CREATE TABLE IF NOT EXISTS approval_requests",
  "ENABLE ROW LEVEL SECURITY"
)

$Failures = @()

foreach ($File in $RequiredFiles) {
  $Full = Join-Path $Base $File
  if (!(Test-Path $Full)) {
    $Failures += "Missing file: $File"
  }
}

try {
  Get-Content "$Base\manifests\n03\postgres-truth-vault.json" -Raw | ConvertFrom-Json | Out-Null
}
catch {
  $Failures += "Invalid JSON: manifests\n03\postgres-truth-vault.json"
}

$Sql = ""
if (Test-Path "$Base\db\migrations\0001_n03_truth_vault.sql") {
  $Sql = Get-Content "$Base\db\migrations\0001_n03_truth_vault.sql" -Raw
}

foreach ($Marker in $RequiredSqlMarkers) {
  if ($Sql -notmatch [regex]::Escape($Marker)) {
    $Failures += "Migration missing SQL marker: $Marker"
  }
}

$SchemaTs = ""
if (Test-Path "$Base\apps\api\src\db\truth-vault-schema.ts") {
  $SchemaTs = Get-Content "$Base\apps\api\src\db\truth-vault-schema.ts" -Raw
}

foreach ($Table in @(
  "candidates",
  "candidate_profiles",
  "applications",
  "command_log",
  "idempotency_keys",
  "workflow_runs",
  "evidence_ledger",
  "audit_events",
  "source_authorities",
  "route_sources",
  "worker_heartbeats",
  "dead_letter_queue",
  "approval_requests",
  "system_runtime_config"
)) {
  if ($SchemaTs -notmatch $Table) {
    $Failures += "Truth schema missing table marker: $Table"
  }
}

$IndexTs = Get-Content "$Base\apps\api\src\index.ts" -Raw
foreach ($ExportMarker in @(
  "./db/truth-vault-schema",
  "./db/database-url",
  "./db/truth-vault-repository",
  "./evidence/evidence-ledger",
  "./idempotency/idempotency",
  "./heartbeat/worker-heartbeat"
)) {
  if ($IndexTs -notmatch [regex]::Escape($ExportMarker)) {
    $Failures += "API index missing export: $ExportMarker"
  }
}

$Result = [ordered]@{
  module = "N03"
  name = "PostgreSQL Truth Vault"
  checked_at = (Get-Date).ToString("s")
  status = $(if ($Failures.Count -eq 0) { "PASS" } else { "FAIL" })
  failures = $Failures
  required_files = $RequiredFiles
}

New-Item -ItemType Directory -Force -Path "$Base\reports\n03" | Out-Null
$Result | ConvertTo-Json -Depth 10 | Set-Content "$Base\reports\n03\N03_VALIDATION_RESULT.json" -Encoding UTF8

if ($Failures.Count -gt 0) {
  Write-Host "N03 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) {
    Write-Host "- $Failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "N03 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n03\N03_VALIDATION_RESULT.json" -ForegroundColor Green