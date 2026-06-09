<#
PJ40_RESTORE_KIMI_PRODUCT_SHELL.ps1
Run from CMD:
  cd /d C:\Kingsmen\kingsmen-platform
  powershell -ExecutionPolicy Bypass -File scripts\PJ40_RESTORE_KIMI_PRODUCT_SHELL.ps1
  powershell -ExecutionPolicy Bypass -File scripts\PJ40_RESTORE_KIMI_PRODUCT_SHELL.ps1 -Commit -Push
#>

[CmdletBinding()]
param(
  [string]$RepoRoot = "C:\Kingsmen\kingsmen-platform",
  [switch]$Commit,
  [switch]$Push,
  [switch]$SkipBuild
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = "Stop"
$Utf8NoBom = New-Object System