#requires -Version 5.1
<#
KINGSMEN ORACLE_01 — Materialize Oracle Free / Oracle Lite Access Boundary

What it does:
- Creates repo-safe Oracle docs, manifest, local ignored config folder, validator, and seed report.
- Runs the validator.
- Optionally commits and pushes.

What it never does:
- Does not store OCI API private key.
- Does not store SSH private key.
- Does not deploy to Oracle.
- Does not claim production.
#>

[CmdletBinding()]
param(
  [string]$RepoRoot = "C:\Users\dell\kingsmen-platform",
  [switch]$Commit,
  [switch]$Push
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-KmLine {
  param([string]$Message, [string]$Color = "Cyan")
  Write-Host $Message -ForegroundColor $Color
}

function Resolve-KmPath {
  param([string]$RelativePath)
  return Join-Path $RepoRoot $RelativePath
}

function Write-Utf8NoBom {
  param(
    [string]$RelativePath,
    [string]$Content
  )

  $path = Resolve-KmPath $RelativePath
  $dir = Split-Path -Parent $path

  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }

  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($path, $Content, $utf8)
}

function Assert-Repo {
  if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
    throw "Not a Git repo: $RepoRoot"
  }
}

function Invoke-Git {
  param([string[]]$Args)
  Push-Location $RepoRoot
  try {
    & git @Args
    if ($LASTEXITCODE -ne 0) {
      throw "git $($Args -join ' ') failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

function Invoke-NodeValidator {
  Push-Location $RepoRoot
  try {
    & node ".\scripts\validators\validate-oracle-access-boundary.mjs"
    if ($LASTEXITCODE -ne 0) {
      throw "Oracle access boundary validator failed."
    }
  } finally {
    Pop-Location
  }
}

Write-KmLine "KINGSMEN ORACLE_01 — Materialize Oracle Free Access Boundary"
Write-KmLine "Repo: $RepoRoot"

Assert-Repo

Push-Location $RepoRoot
try {
  $statusBefore = git status --porcelain
  if ($statusBefore) {
    Write-KmLine "Repo has existing changes. This script will still write Oracle boundary files, but review git status before commit." "Yellow"
  }
} finally {
  Pop-Location
}

$doc = @'
# ORACLE-01 — Oracle Free Access Boundary

## Purpose

This layer records how Kingsmen connects safely to Oracle Free / Oracle Lite.

Oracle access has two separate parts:

1. OCI API access
   Used by OCI CLI, Terraform, and PowerShell to create or manage Oracle resources.

2. SSH access
   Used by PowerShell to enter the Oracle VM after the VM exists.

## What may be stored in Git

Allowed in repo:
- documentation
- templates
- validators
- proof reports
- Terraform variable examples
- public SSH key placeholders

Not allowed in repo:
- OCI API private key
- SSH private key
- Oracle password
- GitHub token
- Supabase service_role
- payment secret
- SMTP password

## Local Windows paths

Recommended local paths:

```text
C:\Users\dell\.oci\config
C:\Users\dell\.oci\oci_api_key.pem
C:\Users\dell\.ssh\oracle_kingsmen.key
C:\Users\dell\.ssh\oracle_kingsmen.pub
 