# KINGSMEN JARVIS BUILDER CORE
# Commander-only local builder runtime.
# Flow: typed command -> plan -> approved file write -> build/test -> proof report -> git commit.

$ErrorActionPreference = "Stop"

$Repo = "C:\Kingsmen\kingsmen-platform"
$PlanDir = Join-Path $Repo "reports\jarvis\builder\plans"
$ProofDir = Join-Path $Repo "reports\jarvis\builder\proofs"
$ModuleProofDir = Join-Path $Repo "reports\jarvis\builder\module-proofs"
$BackupDir = Join-Path $Repo "backups\jarvis-builder-core"
$Ledger = Join-Path $Repo "docs\jarvis\JARVIS_BUILD_STEP_LEDGER.md"

function EnsureDir([string]$Path) {
  if (!(Test-Path $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function WriteNoBom([string]$Path, [string]$Text) {
  EnsureDir (Split-Path -Parent $Path)
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Text, $utf8NoBom)
}

function ReadJson([string]$Path) {
  return (Get-Content $Path -Raw | ConvertFrom-Json)
}

function ToJson($Object) {
  return ($Object | ConvertTo-Json -Depth 50)
}

function NewPlanId {
  return "KJB-" + (Get-Date -Format "yyyyMMdd-HHmmss")
}

function CleanSlug([string]$Text) {
  $s = $Text.ToLowerInvariant()
  $s = $s -replace "[^a-z0-9]+", "-"
  $s = $s.Trim("-")
  if ([string]::IsNullOrWhiteSpace($s)) { $s = "module" }
  if ($s.Length -gt 48) { $s = $s.Substring(0,48).Trim("-") }
  return $s
}

function AssertSafeRelativePath([string]$Rel) {
  if ([string]::IsNullOrWhiteSpace($Rel)) { throw "Empty path blocked." }
  if ($Rel -match "^[A-Za-z]:") { throw "Absolute path blocked: $Rel" }
  if ($Rel.StartsWith("\") -or $Rel.StartsWith("/")) { throw "Root path blocked: $Rel" }
  if ($Rel -match "\.\.") { throw "Parent traversal blocked: $Rel" }

  $normalized = $Rel.Replace("/", "\")
  $allowed = @(
    "docs\kingsmen\modules\",
    "manifests\kingsmen\modules\",
    "reports\jarvis\builder\module-proofs\"
  )

  foreach ($prefix in $allowed) {
    if ($normalized.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }
  }

  throw "Path outside Builder Core allowed boundary blocked: $Rel"
}

function GetWebScripts {
  $pkg = Join-Path $Repo "apps\web\package.json"
  if (!(Test-Path $pkg)) { return @{} }
  $json = Get-Content $pkg -Raw | ConvertFrom-Json
  if (!$json.scripts) { return @{} }
  return $json.scripts
}

function RunCmd([string]$Command, [string]$WorkingDirectory) {
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "cmd.exe"
  $psi.Arguments = "/c " + $Command
  $psi.WorkingDirectory = $WorkingDirectory
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  [void]$p.Start()
  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()

  return [ordered]@{
    command = $Command
    cwd = $WorkingDirectory
    exit_code = $p.ExitCode
    stdout = $stdout
    stderr = $stderr
  }
}

function BuildModuleDoc([string]$ModuleId, [string]$Title, [string]$OriginalCommand) {
  $now = (Get-Date).ToUniversalTime().ToString("o")
  $lines = @(
    "# $ModuleId - $Title",
    "",
    "Status: BUILDER_DRAFT",
    "Created by: Kingsmen Jarvis Builder Core",
    "Created at: $now",
    "",
    "## Commander Command",
    "",
    $OriginalCommand,
    "",
    "## Purpose",
    "",
    "This module file is a controlled Builder Core output. It exists to prove that Jarvis can create a Kingsmen module through the approved build path without bypassing Commander authority.",
    "",
    "## Kingsmen Doctrine Boundaries",
    "",
    "- Commander-only build command.",
    "- No candidate-facing exposure.",
    "- Backend remains the authority for state.",
    "- PostgreSQL remains truth storage.",
    "- Airtable remains a mirror only.",
    "- n8n remains a thin worker only.",
    "- No silent automation.",
    "- No file write without explicit plan approval.",
    "",
    "## Implementation Notes",
    "",
    "- This file is safe documentation output.",
    "- Operational code must be added in later approved build steps.",
    "- Every later change must produce a proof report and pass validation before commit.",
    "",
    "## Next Gate",
    "",
    "The next build step must define exact files, exact purpose, validation, and rollback path before writing production logic.",
    ""
  )
  return ($lines -join "`r`n") + "`r`n"
}

function BuildModuleManifest([string]$ModuleId, [string]$Title, [string]$Slug, [string]$PlanId, [string]$OriginalCommand) {
  $obj = [ordered]@{
    module_id = $ModuleId
    title = $Title
    slug = $Slug
    status = "BUILDER_DRAFT"
    created_by = "Kingsmen Jarvis Builder Core"
    plan_id = $PlanId
    original_command = $OriginalCommand
    commander_only = $true
    safety = [ordered]@{
      requires_plan = $true
      requires_approval = $true
      requires_validation = $true
      requires_proof = $true
      git_commit_after_validation = $true
      public_candidate_access = "blocked"
    }
    doctrine = @(
      "Backend state authority",
      "PostgreSQL truth",
      "Airtable mirror only",
      "n8n thin worker only",
      "No silent file write",
      "Commander-only Jarvis"
    )
  }
  return ToJson $obj
}

function BuildModuleProofSeed([string]$ModuleId, [string]$Title, [string]$PlanId) {
  $obj = [ordered]@{
    module_id = $ModuleId
    title = $Title
    plan_id = $PlanId
    proof_status = "seed_created_before_validation"
    created_at = (Get-Date).ToUniversalTime().ToString("o")
  }
  return ToJson $obj
}

function NewBuilderPlan([string]$CommandText) {
  if ([string]::IsNullOrWhiteSpace($CommandText)) { throw "No command text supplied." }

  $m = [regex]::Match($CommandText, "(?i)\bN\d{2}[A-Z0-9\.\-]*\b")
  if (!$m.Success) {
    throw "Builder Core needs a module ID like N21, N04.8, or N20 before it writes anything."
  }

  $moduleId = $m.Value.ToUpperInvariant()
  $after = $CommandText.Substring($m.Index + $m.Length).Trim()
  $title = $after
  $title = $title -replace "^[\-\:\s]+", ""
  if ([string]::IsNullOrWhiteSpace($title)) { $title = "Kingsmen Module Draft" }
  if ($title.Length -gt 80) { $title = $title.Substring(0,80).Trim() }

  $slug = CleanSlug "$moduleId-$title"
  $planId = NewPlanId

  $files = @(
    [ordered]@{
      path = "docs\kingsmen\modules\$slug.md"
      action = "create_or_replace"
      purpose = "Human-readable Kingsmen module draft and doctrine gate."
      content = (BuildModuleDoc $moduleId $title $CommandText)
    },
    [ordered]@{
      path = "manifests\kingsmen\modules\$slug.json"
      action = "create_or_replace"
      purpose = "Machine-readable module manifest for future Jarvis/Control Plane indexing."
      content = (BuildModuleManifest $moduleId $title $slug $planId $CommandText)
    },
    [ordered]@{
      path = "reports\jarvis\builder\module-proofs\$slug-proof-seed.json"
      action = "create_or_replace"
      purpose = "Proof seed showing this module was generated through Builder Core approval."
      content = (BuildModuleProofSeed $moduleId $title $planId)
    }
  )

  foreach ($f in $files) { [void](AssertSafeRelativePath $f.path) }

  $plan = [ordered]@{
    plan_id = $planId
    created_at = (Get-Date).ToUniversalTime().ToString("o")
    status = "PLANNED_NOT_WRITTEN"
    command = $CommandText
    module_id = $moduleId
    title = $title
    slug = $slug
    write_boundary = @(
      "docs\kingsmen\modules\",
      "manifests\kingsmen\modules\",
      "reports\jarvis\builder\module-proofs\"
    )
    proposed_files = $files
    validation = [ordered]@{
      web_package = "apps\web"
      run_typecheck_if_available = $true
      run_lint_if_available = $true
      run_build_if_available = $true
    }
    git = [ordered]@{
      commit_after_validation = $true
      commit_message = "jarvis-builder: $moduleId $title"
      staged_paths_only = $true
    }
    approval_phrase = "APPROVE $planId"
  }

  EnsureDir $PlanDir
  $path = Join-Path $PlanDir ($planId + ".json")
  WriteNoBom $path (ToJson $plan)
  return $plan
}

function ShowPlan($Plan) {
  Write-Host ""
  Write-Host "BUILDER PLAN CREATED" -ForegroundColor Green
  Write-Host ("Plan ID: " + $Plan.plan_id) -ForegroundColor Cyan
  Write-Host ("Module:  " + $Plan.module_id) -ForegroundColor Cyan
  Write-Host ("Title:   " + $Plan.title) -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Files proposed, not yet written:" -ForegroundColor Yellow
  foreach ($f in $Plan.proposed_files) {
    Write-Host ("- " + $f.path + " [" + $f.action + "]") -ForegroundColor White
  }
  Write-Host ""
  Write-Host "Approval required:" -ForegroundColor Yellow
  Write-Host ("approve " + $Plan.plan_id) -ForegroundColor White
  Write-Host ""
}

function InvokeValidation {
  $results = New-Object System.Collections.Generic.List[object]
  $web = Join-Path $Repo "apps\web"
  if (!(Test-Path $web)) {
    $results.Add([ordered]@{ name = "web-app"; skipped = $true; reason = "apps\web missing" })
    return $results
  }

  $scripts = GetWebScripts
  $names = @()
  if ($scripts.PSObject.Properties.Name -contains "typecheck") { $names += "typecheck" }
  if ($scripts.PSObject.Properties.Name -contains "lint") { $names += "lint" }
  if ($scripts.PSObject.Properties.Name -contains "build") { $names += "build" }

  if ($names.Count -eq 0) {
    $results.Add([ordered]@{ name = "npm-scripts"; skipped = $true; reason = "no typecheck/lint/build script found" })
    return $results
  }

  foreach ($n in $names) {
    Write-Host ("VALIDATION: npm run " + $n) -ForegroundColor Cyan
    $r = RunCmd ("npm run " + $n) $web
    $results.Add($r)
    if ($r.exit_code -ne 0) {
      break
    }
  }

  return $results
}

function InvokeBuilderPlan([string]$PlanId) {
  $planPath = Join-Path $PlanDir ($PlanId + ".json")
  if (!(Test-Path $planPath)) { throw "Plan not found: $PlanId" }

  $plan = ReadJson $planPath
  if ($plan.status -ne "PLANNED_NOT_WRITTEN") {
    throw "Plan is not in PLANNED_NOT_WRITTEN state. Current state: $($plan.status)"
  }

  ShowPlan $plan
  Write-Host "Type exact approval phrase to write files:" -ForegroundColor Yellow
  Write-Host $plan.approval_phrase -ForegroundColor White
  $approval = Read-Host "Approval"

  if ($approval.Trim() -ne $plan.approval_phrase) {
    Write-Host "Approval phrase did not match. No files written." -ForegroundColor Red
    return
  }

  $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $backupThis = Join-Path $BackupDir ($PlanId + "-" + $stamp)
  EnsureDir $backupThis

  $changed = New-Object System.Collections.Generic.List[string]
  $backups = New-Object System.Collections.Generic.List[object]

  foreach ($f in $plan.proposed_files) {
    $rel = [string]$f.path
    [void](AssertSafeRelativePath $rel)
    $target = Join-Path $Repo $rel

    if (Test-Path $target) {
      $dest = Join-Path $backupThis $rel
      EnsureDir (Split-Path -Parent $dest)
      Copy-Item $target $dest -Force
      $backups.Add([ordered]@{ path = $rel; backup = $dest })
    }

    WriteNoBom $target ([string]$f.content)
    $changed.Add($rel)
    Write-Host ("WROTE: " + $rel) -ForegroundColor Green
  }

  $validation = InvokeValidation
  $validationPassed = $true
  foreach ($r in $validation) {
    if ($r.PSObject.Properties.Name -contains "exit_code") {
      if ($r.exit_code -ne 0) { $validationPassed = $false }
    }
  }

  $gitResults = New-Object System.Collections.Generic.List[object]
  $commitOk = $false
  if ($validationPassed) {
    Write-Host "VALIDATION PASSED. Preparing git commit for staged Builder Core paths only." -ForegroundColor Green

    foreach ($rel in $changed) {
      $gitResults.Add((RunCmd ('git add -- "' + $rel + '"') $Repo))
    }

    $commitMessage = [string]$plan.git.commit_message
    $gitResults.Add((RunCmd ('git commit -m "' + ($commitMessage.Replace('"','\"')) + '"') $Repo))

    $last = $gitResults[$gitResults.Count - 1]
    if ($last.exit_code -eq 0) { $commitOk = $true }
  } else {
    Write-Host "VALIDATION FAILED. Git commit blocked." -ForegroundColor Red
  }

  $proof = [ordered]@{
    proof_id = "PROOF-" + $PlanId
    plan_id = $PlanId
    completed_at = (Get-Date).ToUniversalTime().ToString("o")
    command = $plan.command
    module_id = $plan.module_id
    title = $plan.title
    changed_files = $changed
    backups = $backups
    validation_passed = $validationPassed
    validation_results = $validation
    git_commit_attempted = $validationPassed
    git_commit_ok = $commitOk
    git_results = $gitResults
    final_status = $(if ($validationPassed -and $commitOk) { "BUILT_VALIDATED_COMMITTED" } elseif ($validationPassed) { "BUILT_VALIDATED_COMMIT_FAILED" } else { "BUILT_VALIDATION_FAILED_NO_COMMIT" })
  }

  EnsureDir $ProofDir
  $proofPath = Join-Path $ProofDir ($PlanId + "-proof.json")
  WriteNoBom $proofPath (ToJson $proof)

  $plan.status = $proof.final_status
  $plan.proof_path = $proofPath
  WriteNoBom $planPath (ToJson $plan)

  Add-Content -Path $Ledger -Value @(
    "",
    "## Builder Core Execution - $PlanId",
    "",
    "Status: $($proof.final_status)",
    "Module: $($plan.module_id) - $($plan.title)",
    "Proof: $proofPath",
    ""
  ) -Encoding UTF8

  Write-Host ""
  Write-Host ("FINAL STATUS: " + $proof.final_status) -ForegroundColor Cyan
  Write-Host ("PROOF: " + $proofPath) -ForegroundColor Green
  Write-Host ""
}

function ShowStatus {
  EnsureDir $PlanDir
  $plans = Get-ChildItem $PlanDir -Filter "*.json" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 8
  if (!$plans) {
    Write-Host "No Builder Core plans yet." -ForegroundColor Yellow
    return
  }
  Write-Host "Recent Builder Core plans:" -ForegroundColor Cyan
  foreach ($p in $plans) {
    try {
      $j = ReadJson $p.FullName
      Write-Host ("- " + $j.plan_id + " | " + $j.status + " | " + $j.module_id + " | " + $j.title)
    } catch {
      Write-Host ("- " + $p.Name + " | unreadable")
    }
  }
}

function ShowHelp {
  Write-Host ""
  Write-Host "COMMANDS" -ForegroundColor Cyan
  Write-Host "plan Jarvis, create Kingsmen module N21 Founder Command Digest"
  Write-Host "approve KJB-yyyyMMdd-HHmmss"
  Write-Host "status"
  Write-Host "help"
  Write-Host "exit"
  Write-Host ""
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS BUILDER CORE" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "Typed command -> plan -> approval -> file write -> build/test -> proof -> git commit" -ForegroundColor Yellow
Write-Host "Commander-only. No silent writes. No public/candidate access." -ForegroundColor Yellow
Write-Host ""

if (!(Test-Path $Repo)) { throw "Repo not found: $Repo" }
EnsureDir $PlanDir
EnsureDir $ProofDir
EnsureDir $ModuleProofDir
EnsureDir $BackupDir

ShowHelp

while ($true) {
  $cmd = Read-Host "Jarvis Builder"
  if ([string]::IsNullOrWhiteSpace($cmd)) { continue }

  $trim = $cmd.Trim()
  if ($trim -match "^(exit|quit)$") { break }
  if ($trim -match "^help$") { ShowHelp; continue }
  if ($trim -match "^status$") { ShowStatus; continue }

  if ($trim -match "^(?i)plan\s+(.+)$") {
    try {
      $plan = NewBuilderPlan $Matches[1]
      ShowPlan $plan
    } catch {
      Write-Host ("PLAN FAILED: " + $_.Exception.Message) -ForegroundColor Red
    }
    continue
  }

  if ($trim -match "^(?i)approve\s+(KJB-[0-9]{8}-[0-9]{6})$") {
    try {
      InvokeBuilderPlan $Matches[1]
    } catch {
      Write-Host ("APPROVAL EXECUTION FAILED: " + $_.Exception.Message) -ForegroundColor Red
    }
    continue
  }

  Write-Host "Unknown Builder command. Type help." -ForegroundColor Yellow
}
