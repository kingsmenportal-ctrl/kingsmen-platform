param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$BackendBaseUrl = $env:KINGSMEN_BACKEND_BASE_URL,
  [switch]$RunDatabaseProbe,
  [switch]$RunWebProbe,
  [switch]$RunRlsProbe,
  [switch]$MarkOperatorReviewed,
  [switch]$PreserveExistingPassedReports
)

$ErrorActionPreference = "Stop"

function Import-LocalRuntimeEnv {
  $envPath = Join-Path $RepoRoot ".local/kingsmen.local-postgres.env"
  if (-not (Test-Path $envPath)) { return }
  foreach ($line in Get-Content -Path $envPath) {
    if ($line -match '^[A-Z0-9_]+=') {
      $parts = $line -split '=', 2
      $name = $parts[0]
      $value = $parts[1]
      if (-not [Environment]::GetEnvironmentVariable($name, 'Process')) {
        Set-Item -Path "Env:$name" -Value $value
      }
    }
  }
}

function Test-PlaceholderValue {
  param([string]$Value)
  if (-not $Value) { return $false }
  $trimmed = $Value.Trim()
  return (
    $trimmed -match '^<.*>$' -or
    $trimmed -match 'your .*connection string' -or
    $trimmed -match 'your .*url' -or
    $trimmed -match 'postgresql://REAL_' -or
    $trimmed -match 'REAL_USER' -or
    $trimmed -match 'REAL_PASSWORD' -or
    $trimmed -match 'REAL_HOST' -or
    $trimmed -match 'example' -or
    $trimmed -match 'placeholder'
  )
}

function New-Report {
  param(
    [string]$Module,
    [string]$Status,
    [bool]$Passed,
    [array]$Checks,
    [string]$NextAction
  )

  return [ordered]@{
    schema = "kingsmen.staging-runtime-evidence-report.v1"
    module = $Module
    status = $Status
    passed = $Passed
    reviewed = [bool]$MarkOperatorReviewed
    stagingReviewed = [bool]$MarkOperatorReviewed
    redacted = $true
    productionReady = $false
    publicLaunchAllowed = $false
    rawSecretsPrinted = $false
    rawCandidateDataPrinted = $false
    providerCredentialsPrinted = $false
    checks = $Checks
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    nextAction = $NextAction
  }
}

function Write-Report {
  param([string]$Path, [object]$Report)

  $fullPath = Join-Path $RepoRoot $Path
  if ($PreserveExistingPassedReports -and (Test-Path $fullPath)) {
    try {
      $existing = Get-Content -Raw -Path $fullPath | ConvertFrom-Json
      if ($existing.passed -eq $true) { return }
    } catch { }
  }

  $dir = Split-Path -Parent $fullPath
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $Report | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 -Path $fullPath
}

function Invoke-HealthProbe {
  param([string]$Url)
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
    return [ordered]@{ attempted = $true; passed = ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300); statusCode = $response.StatusCode; reason = "HTTP_$($response.StatusCode)" }
  } catch {
    return [ordered]@{ attempted = $true; passed = $false; statusCode = $null; reason = "HEALTH_PROBE_FAILED" }
  }
}

function Invoke-DockerPsqlText {
  param([string]$Sql)
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) { throw "DOCKER_NOT_AVAILABLE_FOR_DB_PROBE" }
  if (-not $env:KINGSMEN_POSTGRES_CONTAINER) { throw "KINGSMEN_POSTGRES_CONTAINER_NOT_CONFIGURED" }
  $dbUser = $(if ($env:KINGSMEN_POSTGRES_USER) { $env:KINGSMEN_POSTGRES_USER } else { "kingsmen" })
  $dbName = $(if ($env:KINGSMEN_POSTGRES_DATABASE) { $env:KINGSMEN_POSTGRES_DATABASE } else { "kingsmen_truth_vault" })
  $Sql | & $docker.Source exec -i $env:KINGSMEN_POSTGRES_CONTAINER psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -q -t -A
  if ($LASTEXITCODE -ne 0) { throw "DOCKER_PSQL_SQL_FAILED" }
}

function Invoke-DockerDatabaseProbe {
  try {
    Invoke-DockerPsqlText -Sql "select 1" | Out-Null
    return [ordered]@{ attempted = $true; passed = $true; reason = "DOCKER_POSTGRES_SELECT_1_OK" }
  } catch {
    return [ordered]@{ attempted = $true; passed = $false; reason = $_.Exception.Message }
  }
}

function Invoke-DatabaseProbe {
  if (-not $RunDatabaseProbe) { return [ordered]@{ attempted = $false; passed = $false; reason = "RUN_DATABASE_PROBE_NOT_SET" } }
  if (-not $env:KINGSMEN_DATABASE_URL) { return [ordered]@{ attempted = $true; passed = $false; reason = "KINGSMEN_DATABASE_URL_NOT_CONFIGURED" } }
  if (Test-PlaceholderValue -Value $env:KINGSMEN_DATABASE_URL) { return [ordered]@{ attempted = $true; passed = $false; reason = "PLACEHOLDER_DATABASE_URL_CONFIGURED" } }
  $psql = Get-Command psql -ErrorAction SilentlyContinue
  if (-not $psql) { return Invoke-DockerDatabaseProbe }

  $oldUrl = $env:DATABASE_URL
  try {
    $env:DATABASE_URL = $env:KINGSMEN_DATABASE_URL
    & $psql.Source $env:DATABASE_URL -v ON_ERROR_STOP=1 -q -t -c "select 1" | Out-Null
    if ($LASTEXITCODE -eq 0) { return [ordered]@{ attempted = $true; passed = $true; reason = "DATABASE_SELECT_1_OK" } }
    return [ordered]@{ attempted = $true; passed = $false; reason = "DATABASE_SELECT_1_FAILED" }
  } catch {
    return [ordered]@{ attempted = $true; passed = $false; reason = "DATABASE_PROBE_EXCEPTION" }
  } finally {
    $env:DATABASE_URL = $oldUrl
  }
}

function Convert-PsqlKeyValueLines {
  param([array]$Lines)
  $result = @{}
  foreach ($line in $Lines) {
    $text = ([string]$line).Trim()
    if (-not $text -or $text -notmatch '=') { continue }
    $parts = $text -split '=', 2
    $result[$parts[0]] = $parts[1]
  }
  return $result
}

function Test-PsqlBoolean {
  param([object]$Value)
  $text = ([string]$Value).Trim().ToLowerInvariant()
  return ($text -eq "t" -or $text -eq "true" -or $text -eq "1")
}

function Invoke-RlsProbe {
  if (-not $RunRlsProbe) { return [ordered]@{ attempted = $false; passed = $false; reason = "RUN_RLS_PROBE_NOT_SET"; checks = @(@{ name = "rls_probe"; passed = $false; detail = "RUN_RLS_PROBE_NOT_SET" }) } }
  if (-not $env:KINGSMEN_DATABASE_URL) { return [ordered]@{ attempted = $true; passed = $false; reason = "KINGSMEN_DATABASE_URL_NOT_CONFIGURED"; checks = @(@{ name = "rls_probe"; passed = $false; detail = "KINGSMEN_DATABASE_URL_NOT_CONFIGURED" }) } }
  if (Test-PlaceholderValue -Value $env:KINGSMEN_DATABASE_URL) { return [ordered]@{ attempted = $true; passed = $false; reason = "PLACEHOLDER_DATABASE_URL_CONFIGURED"; checks = @(@{ name = "rls_probe"; passed = $false; detail = "PLACEHOLDER_DATABASE_URL_CONFIGURED" }) } }

  $sql = @'
\set ON_ERROR_STOP on
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kingsmen_rls_runtime_probe') THEN
    CREATE ROLE kingsmen_rls_runtime_probe;
  END IF;
END $$;
GRANT USAGE ON SCHEMA public TO kingsmen_rls_runtime_probe;
GRANT USAGE ON SCHEMA kingsmen_security TO kingsmen_rls_runtime_probe;
GRANT SELECT ON TABLE candidates, candidate_profiles, applications, evidence_ledger, workflow_runs, route_sources TO kingsmen_rls_runtime_probe;
DELETE FROM evidence_ledger WHERE evidence_ref LIKE 'KINGS-RLS-PROBE-%';
DELETE FROM applications WHERE metadata->>'rlsProbe' = 'true';
DELETE FROM candidates WHERE public_ref IN ('KINGS-RLS-A', 'KINGS-RLS-B');
WITH a AS (
  INSERT INTO candidates(public_ref, email, display_name, current_state)
  VALUES ('KINGS-RLS-A', 'redacted-a@example.invalid', 'RLS Probe Candidate A', 'NEW')
  RETURNING id
), b AS (
  INSERT INTO candidates(public_ref, email, display_name, current_state)
  VALUES ('KINGS-RLS-B', 'redacted-b@example.invalid', 'RLS Probe Candidate B', 'NEW')
  RETURNING id
)
INSERT INTO applications(candidate_id, route_type, route_name, institution_or_provider, current_state, source_confidence_band, portal_health, metadata)
SELECT id, 'UNIVERSITY', 'RLS Probe Route A', 'RLS Probe Provider', 'NEW', 'A', 'OPEN', '{"rlsProbe":"true"}'::jsonb FROM a
UNION ALL
SELECT id, 'TVET', 'RLS Probe Route B', 'RLS Probe Provider', 'NEW', 'B', 'OPEN', '{"rlsProbe":"true"}'::jsonb FROM b;
INSERT INTO evidence_ledger(evidence_ref, evidence_type, candidate_id, source_name, source_confidence_band, summary, protected_data, payload)
SELECT 'KINGS-RLS-PROBE-A-SAFE', 'RLS_PROBE', id, 'RLS Probe', 'A', 'redacted safe proof row', false, '{}'::jsonb FROM candidates WHERE public_ref = 'KINGS-RLS-A';
SELECT 'rls_enabled_candidates=' || COALESCE((SELECT relrowsecurity::text FROM pg_class WHERE oid = 'public.candidates'::regclass), 'false');
SELECT 'rls_enabled_applications=' || COALESCE((SELECT relrowsecurity::text FROM pg_class WHERE oid = 'public.applications'::regclass), 'false');
SELECT 'policy_candidate_read_own_exists=' || EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidates' AND policyname = 'candidates_candidate_read_own');
SELECT 'policy_service_backend_exists=' || EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidates' AND policyname = 'candidates_service_role_backend_all');
BEGIN;
SET ROLE kingsmen_rls_runtime_probe;
SET LOCAL app.kingsmen_role = 'candidate';
SET LOCAL app.candidate_public_ref = 'KINGS-RLS-A';
SELECT 'candidate_a_visible_count=' || count(*) FROM candidates WHERE public_ref IN ('KINGS-RLS-A', 'KINGS-RLS-B');
SELECT 'candidate_b_visible_to_a_count=' || count(*) FROM candidates WHERE public_ref = 'KINGS-RLS-B';
SELECT 'applications_visible_to_a_count=' || count(*) FROM applications WHERE metadata->>'rlsProbe' = 'true';
COMMIT;
RESET ROLE;
BEGIN;
SET ROLE kingsmen_rls_runtime_probe;
SET LOCAL app.kingsmen_role = 'service_role';
SET LOCAL app.service_context = 'none';
SELECT 'service_without_backend_visible_count=' || count(*) FROM candidates WHERE public_ref IN ('KINGS-RLS-A', 'KINGS-RLS-B');
COMMIT;
RESET ROLE;
BEGIN;
SET ROLE kingsmen_rls_runtime_probe;
SET LOCAL app.kingsmen_role = 'service_role';
SET LOCAL app.service_context = 'backend_api';
SELECT 'service_with_backend_visible_count=' || count(*) FROM candidates WHERE public_ref IN ('KINGS-RLS-A', 'KINGS-RLS-B');
COMMIT;
RESET ROLE;
DELETE FROM evidence_ledger WHERE evidence_ref LIKE 'KINGS-RLS-PROBE-%';
DELETE FROM applications WHERE metadata->>'rlsProbe' = 'true';
DELETE FROM candidates WHERE public_ref IN ('KINGS-RLS-A', 'KINGS-RLS-B');
'@

  try {
    $lines = Invoke-DockerPsqlText -Sql $sql
    $values = Convert-PsqlKeyValueLines -Lines $lines
    $checks = @(
      @{ name = "candidates_rls_enabled"; passed = (Test-PsqlBoolean $values["rls_enabled_candidates"]); detail = "relrowsecurity_checked" },
      @{ name = "applications_rls_enabled"; passed = (Test-PsqlBoolean $values["rls_enabled_applications"]); detail = "relrowsecurity_checked" },
      @{ name = "candidate_read_own_policy_exists"; passed = (Test-PsqlBoolean $values["policy_candidate_read_own_exists"]); detail = "policy_catalog_checked" },
      @{ name = "service_backend_policy_exists"; passed = (Test-PsqlBoolean $values["policy_service_backend_exists"]); detail = "policy_catalog_checked" },
      @{ name = "candidate_a_reads_only_own_candidate"; passed = (([int]$values["candidate_a_visible_count"]) -eq 1); detail = "count_only" },
      @{ name = "candidate_a_cannot_read_candidate_b"; passed = (([int]$values["candidate_b_visible_to_a_count"]) -eq 0); detail = "count_only" },
      @{ name = "candidate_a_reads_only_own_application"; passed = (([int]$values["applications_visible_to_a_count"]) -eq 1); detail = "count_only" },
      @{ name = "service_role_without_backend_context_denied"; passed = (([int]$values["service_without_backend_visible_count"]) -eq 0); detail = "count_only" },
      @{ name = "service_role_with_backend_context_allowed"; passed = (([int]$values["service_with_backend_visible_count"]) -eq 2); detail = "count_only" }
    )
    $passed = $true
    foreach ($check in $checks) { if (-not $check.passed) { $passed = $false } }
    return [ordered]@{ attempted = $true; passed = $passed; reason = $(if ($passed) { "RLS_SQL_ISOLATION_PROBE_PASSED" } else { "RLS_SQL_ISOLATION_PROBE_FAILED" }); checks = $checks }
  } catch {
    return [ordered]@{ attempted = $true; passed = $false; reason = "RLS_SQL_PROBE_EXCEPTION"; checks = @(@{ name = "rls_sql_probe"; passed = $false; detail = "RLS_SQL_PROBE_EXCEPTION" }) }
  }
}

Import-LocalRuntimeEnv
if (-not $BackendBaseUrl -and $env:KINGSMEN_BACKEND_BASE_URL) { $BackendBaseUrl = $env:KINGSMEN_BACKEND_BASE_URL }

$databaseProbe = Invoke-DatabaseProbe
Write-Report -Path "reports/staging/truth-vault-persistence-staging-latest.json" -Report (New-Report -Module "Truth Vault Persistence Staging Evidence" -Status ($(if ($databaseProbe.passed) { "TRUTH_VAULT_STAGING_PROBE_PASSED" } else { "PENDING_STAGING_CAPTURE" })) -Passed ([bool]$databaseProbe.passed) -Checks @(@{ name = "database_probe"; passed = [bool]$databaseProbe.passed; detail = $databaseProbe.reason }) -NextAction "Run with -RunDatabaseProbe after KINGSMEN_DATABASE_URL is configured outside Git with a real staging PostgreSQL connection string.")

$webChecks = @()
$webPassed = $false
if ($RunWebProbe -and $BackendBaseUrl -and -not (Test-PlaceholderValue -Value $BackendBaseUrl)) {
  $health = Invoke-HealthProbe -Url (($BackendBaseUrl.TrimEnd('/')) + "/health")
  $system = Invoke-HealthProbe -Url (($BackendBaseUrl.TrimEnd('/')) + "/api/system/health")
  $webChecks = @(
    @{ name = "backend_health"; passed = [bool]$health.passed; detail = $health.reason },
    @{ name = "backend_system_health"; passed = [bool]$system.passed; detail = $system.reason }
  )
  $webPassed = [bool]$health.passed -and [bool]$system.passed
} else {
  $webChecks = @(@{ name = "web_probe"; passed = $false; detail = "RUN_WEB_PROBE_OR_BACKEND_BASE_URL_NOT_SET_OR_PLACEHOLDER" })
}
Write-Report -Path "reports/staging/web-backend-boundary-staging-latest.json" -Report (New-Report -Module "Web Backend Boundary Staging Evidence" -Status ($(if ($webPassed) { "WEB_BACKEND_STAGING_PROBE_PASSED" } else { "PENDING_STAGING_CAPTURE" })) -Passed $webPassed -Checks $webChecks -NextAction "Run with -RunWebProbe and KINGSMEN_BACKEND_BASE_URL pointing to a running staging backend API.")

$rlsProbe = Invoke-RlsProbe
Write-Report -Path "reports/staging/rls-sql-isolation-staging-latest.json" -Report (New-Report -Module "RLS SQL Isolation Staging Evidence" -Status ($(if ($rlsProbe.passed) { "RLS_SQL_ISOLATION_STAGING_PROBE_PASSED" } else { "PENDING_STAGING_CAPTURE" })) -Passed ([bool]$rlsProbe.passed) -Checks $rlsProbe.checks -NextAction "Run with -RunRlsProbe after the PostgreSQL Truth Vault is migrated and available.")

$pendingReports = @(
  @{ path = "reports/staging/payfast-provider-sandbox-staging-latest.json"; module = "PayFast Provider Sandbox Staging Evidence"; action = "Run real PayFast sandbox checkout/ITN proof against staging notify URL." },
  @{ path = "reports/staging/backup-restore-drill-staging-latest.json"; module = "Backup Restore Drill Staging Evidence"; action = "Run backup and restore drill scripts against staging and restore-drill databases." },
  @{ path = "reports/security/secrets-wiring-runtime-health-latest.json"; module = "Secrets Runtime Health Staging Evidence"; action = "Run Test-KingsmenSecretWiring.ps1 in staging after configuring secrets outside Git." },
  @{ path = "reports/staging/communications-provider-staging-latest.json"; module = "Communications Provider Staging Evidence"; action = "Run provider send/receive, bounce, opt-out, urgent WhatsApp, and SMS fallback proof." },
  @{ path = "reports/staging/observability-incident-staging-latest.json"; module = "Observability Incident Staging Evidence"; action = "Run staging health, alert, DLQ, redaction, and incident drill proof." },
  @{ path = "reports/staging/legal-privacy-publication-staging-latest.json"; module = "Legal Privacy Publication Staging Evidence"; action = "Publish and review policy surfaces, then capture consent/refund/data-subject request proof." },
  @{ path = "reports/repo/main-branch-protection-apply-latest.json"; module = "Main Branch Protection Apply Evidence"; action = "Apply GitHub branch protection and capture the redacted apply report." }
)

foreach ($item in $pendingReports) {
  Write-Report -Path $item.path -Report (New-Report -Module $item.module -Status "PENDING_STAGING_CAPTURE" -Passed $false -Checks @(@{ name = "runtime_evidence_required"; passed = $false; detail = $item.action }) -NextAction $item.action)
}

$summary = [ordered]@{
  schema = "kingsmen.staging-runtime-evidence-capture-summary.v1"
  module = "Staging Runtime Evidence Capture Runner"
  status = "STAGING_RUNTIME_EVIDENCE_CAPTURE_RECORDED"
  passed = $false
  productionReady = $false
  publicLaunchAllowed = $false
  rawSecretsPrinted = $false
  rawCandidateDataPrinted = $false
  providerCredentialsPrinted = $false
  generatedReports = 10
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = "Complete each pending staging report, then run final:collect:evidence."
}

Write-Output ($summary | ConvertTo-Json -Depth 12)
