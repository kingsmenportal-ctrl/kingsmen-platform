#requires -Version 5.1
<#
CREATOR.5 - install-git-hooks.ps1
Installs local Git hooks for Kingsmen proof discipline.

Usage:
  powershell -ExecutionPolicy Bypass -File .\scripts\install-git-hooks.ps1

Creates:
  .git/hooks/pre-commit
  .git/hooks/commit-msg

The hooks are local developer safety nets. They do not replace validators.
#>

[CmdletBinding()]
param(
    [switch] $Force
)

$ErrorActionPreference = 'Stop'

function Write-KmLine {
    param(
        [string] $Text,
        [string] $Color = 'Gray'
    )
    Write-Host $Text -ForegroundColor $Color
}

function Get-KmRepoRoot {
    $fromScript = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    if (Test-Path (Join-Path $fromScript '.git')) {
        return $fromScript
    }

    $fromCurrent = (Get-Location).Path
    if (Test-Path (Join-Path $fromCurrent '.git')) {
        return $fromCurrent
    }

    throw 'Not inside a Git repository. Run from kingsmen-platform.'
}

$RepoRoot = Get-KmRepoRoot
Set-Location $RepoRoot

$HookDir = Join-Path $RepoRoot '.git/hooks'
$PreCommitPath = Join-Path $HookDir 'pre-commit'
$CommitMsgPath = Join-Path $HookDir 'commit-msg'
$ReportDir = Join-Path $RepoRoot 'reports/creator'
$ReportPath = Join-Path $ReportDir 'git-hooks-install-report.json'

New-Item -ItemType Directory -Force -Path $HookDir | Out-Null
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

if ((Test-Path $PreCommitPath) -and (-not $Force)) {
    throw 'pre-commit hook already exists. Re-run with -Force to overwrite.'
}

if ((Test-Path $CommitMsgPath) -and (-not $Force)) {
    throw 'commit-msg hook already exists. Re-run with -Force to overwrite.'
}

$PreCommitContent = @'
#!/bin/sh
# Kingsmen local pre-commit hook.
# Blocks obvious proof-discipline violations before commit.

set -eu

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM || true)
if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

FAILED=0
REPORT_DIR="reports/creator"
REPORT_FILE="$REPORT_DIR/git-hooks-last-precommit-report.json"
mkdir -p "$REPORT_DIR"
TMP_REPORT="$REPORT_FILE.tmp"

printf '{\n  "hook": "pre-commit",\n  "productionReady": false,\n  "failed": [\n' > "$TMP_REPORT"
FIRST=1

add_failure() {
  FILE_PATH="$1"
  CODE="$2"
  DETAIL="$3"
  if [ "$FIRST" -eq 0 ]; then
    printf ',\n' >> "$TMP_REPORT"
  fi
  FIRST=0
  printf '    {"file":"%s","code":"%s","detail":"%s"}' "$FILE_PATH" "$CODE" "$DETAIL" >> "$TMP_REPORT"
}

scan_file() {
  FILE_PATH="$1"

  case "$FILE_PATH" in
    *.png|*.jpg|*.jpeg|*.gif|*.webp|*.pdf|*.zip|*.ico|*.lock)
      return 0
      ;;
  esac

  CONTENT=$(git show ":$FILE_PATH" 2>/dev/null || true)

  echo "$CONTENT" | grep -Eiq 'productionReady[[:space:]]*[:=][[:space:]]*true|"productionReady"[[:space:]]*:[[:space:]]*true|production_ready[[:space:]]*[:=][[:space:]]*true' && {
    add_failure "$FILE_PATH" "PRODUCTION_READY_TRUE_BLOCKED" "productionReady true is forbidden until production proof gates pass"
    FAILED=1
  }

  echo "$CONTENT" | grep -Eiq '(service[_-]?role|smtp[[:space:]_-]*pass|whatsapp[[:space:]_-]*token|payment[[:space:]_-]*secret|airtable[[:space:]_-]*token|database_url)[[:space:]]*[:=][[:space:]]*["'"''][^"'"'']+' && {
    add_failure "$FILE_PATH" "SECRET_ASSIGNMENT_BLOCKED" "possible hardcoded credential assignment found"
    FAILED=1
  }

  echo "$CONTENT" | grep -Eiq '(candidate_documents/|raw_evidence/|\.env$|\.env\.|private_key|BEGIN RSA PRIVATE KEY|BEGIN OPENSSH PRIVATE KEY)' && {
    add_failure "$FILE_PATH" "SENSITIVE_ARTIFACT_BLOCKED" "possible sensitive artifact or key material found"
    FAILED=1
  }
}

for FILE_PATH in $STAGED_FILES; do
  scan_file "$FILE_PATH"
done

printf '\n  ],\n  "passed": ' >> "$TMP_REPORT"
if [ "$FAILED" -eq 0 ]; then
  printf 'true\n}\n' >> "$TMP_REPORT"
else
  printf 'false\n}\n' >> "$TMP_REPORT"
fi
mv "$TMP_REPORT" "$REPORT_FILE"

if [ "$FAILED" -ne 0 ]; then
  echo "Kingsmen pre-commit hook blocked this commit. See $REPORT_FILE"
  exit 1
fi

exit 0
'@

$CommitMsgContent = @'
#!/bin/sh
# Kingsmen local commit-msg hook.
# Encourages tracker/proof discipline in commit messages.

set -eu

MSG_FILE="$1"
MSG=$(cat "$MSG_FILE")

case "$MSG" in
  *N09.3*|*CREATOR*|*N01*|*N02*|*N03*|*N04*|*N05*|*N06*|*N07*|*N08*|*N09*|*UI*|*META*)
    exit 0
    ;;
  *)
    echo "Kingsmen commit message should reference a tracker row or phase, for example: CREATOR.5: install git hooks"
    exit 1
    ;;
esac
'@

Set-Content -Path $PreCommitPath -Value $PreCommitContent -Encoding ASCII
Set-Content -Path $CommitMsgPath -Value $CommitMsgContent -Encoding ASCII

try {
    icacls $PreCommitPath /grant Everyone:RX | Out-Null
    icacls $CommitMsgPath /grant Everyone:RX | Out-Null
} catch {
    Write-KmLine -Text 'Windows permission adjustment skipped; Git for Windows can still run hook files.' -Color 'Yellow'
}

$InstalledPreCommit = Test-Path $PreCommitPath
$InstalledCommitMsg = Test-Path $CommitMsgPath
$Passed = $InstalledPreCommit -and $InstalledCommitMsg

$Report = [ordered]@{
    module = 'CREATOR'
    submodule = 'CREATOR.5'
    installer = 'scripts/install-git-hooks.ps1'
    productionReady = $false
    generatedAt = (Get-Date).ToUniversalTime().ToString('o')
    passed = $Passed
    hooks = @(
        [ordered]@{ path = '.git/hooks/pre-commit'; installed = $InstalledPreCommit },
        [ordered]@{ path = '.git/hooks/commit-msg'; installed = $InstalledCommitMsg }
    )
    blockedByPreCommit = @(
        'productionReady true before proof gates',
        'possible hardcoded credential assignments',
        'candidate documents or raw evidence committed to repo',
        'private key material committed to repo'
    )
    nextTrackerRow = $(if ($Passed) { 'N01.5 - config/environment/.env.template' } else { 'CREATOR.5 repair - reinstall hooks' })
}

$Report | ConvertTo-Json -Depth 8 | Set-Content -Path $ReportPath -Encoding UTF8
$Report | ConvertTo-Json -Depth 8

if ($Passed) {
    Write-KmLine -Text 'CREATOR.5 COMPLETE - Git hooks installed.' -Color 'Green'
    exit 0
}

Write-KmLine -Text 'CREATOR.5 FAILED - Git hooks not installed.' -Color 'Red'
exit 1
