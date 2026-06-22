param(
  [string]$Branch = "finish/full-live-operating-system-main-sync",
  [string]$BaseBranch = "main",
  [switch]$UseMergeInsteadOfRebase,
  [switch]$PushAfterSync
)

$ErrorActionPreference = "Stop"

Write-Host "=== KINGSMEN PAYFAST CLEAN BRANCH SYNC ===" -ForegroundColor Cyan
Write-Host "Branch: $Branch" -ForegroundColor Gray
Write-Host "Base:   $BaseBranch" -ForegroundColor Gray

if (-not (Test-Path ".git")) {
  throw "Run this script from the root of the kingsmen-platform Git repository."
}

$dirty = git status --porcelain
if ($dirty) {
  Write-Host "Repository has uncommitted changes:" -ForegroundColor Yellow
  $dirty | ForEach-Object { Write-Host $_ }
  throw "Commit or stash local changes before syncing the PayFast clean branch."
}

git fetch origin --prune

git checkout $Branch

git fetch origin $BaseBranch

if ($UseMergeInsteadOfRebase) {
  Write-Host "Merging origin/$BaseBranch into $Branch" -ForegroundColor Cyan
  git merge "origin/$BaseBranch" --no-edit
} else {
  Write-Host "Rebasing $Branch onto origin/$BaseBranch" -ForegroundColor Cyan
  git rebase "origin/$BaseBranch"
}

Write-Host "Running PayFast clean-sync validators..." -ForegroundColor Cyan
npm run payments:validate:runtime-gate
npm run payments:validate:http-boundary
npm run payments:validate:server-persistence
npm run payments:validate:service-activation
npm run payments:validate:candidate-status
npm run payments:validate:clean-sync

Write-Host "Comparing branch with base..." -ForegroundColor Cyan
git status --short
git log --oneline "origin/$BaseBranch..$Branch" -n 20

if ($PushAfterSync) {
  Write-Host "Pushing synced branch to origin..." -ForegroundColor Cyan
  git push origin $Branch --force-with-lease
} else {
  Write-Host "Sync complete locally. Re-run with -PushAfterSync after reviewing results." -ForegroundColor Yellow
}

Write-Host "=== SYNC COMPLETE ===" -ForegroundColor Green
