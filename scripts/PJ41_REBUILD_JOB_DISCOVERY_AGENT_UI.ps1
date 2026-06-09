<#
PJ41_REBUILD_JOB_DISCOVERY_AGENT_UI.ps1
Run from CMD:
  cd /d C:\Kingsmen\kingsmen-platform
  git pull origin main
  powershell -ExecutionPolicy Bypass -File scripts\PJ41_REBUILD_JOB_DISCOVERY_AGENT_UI.ps1
  powershell -ExecutionPolicy Bypass -File scripts\PJ41_REBUILD_JOB_DISCOVERY_AGENT_UI.ps1 -Commit -Push
#>

[CmdletBinding()]
param(
  [string]$RepoRoot = "C:\Kingsmen\kingsmen-platform",
  [switch]$Commit,