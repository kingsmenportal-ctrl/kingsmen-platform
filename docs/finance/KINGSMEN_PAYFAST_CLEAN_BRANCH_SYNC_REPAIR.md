# Kingsmen PayFast Clean Branch Sync Repair

Status: repair support built in GitHub.

## Current problem

The clean PayFast branch carries the payment system work, but it is still behind `main`. That means GitHub may not allow a clean final merge until the branch is synced with the latest `main`.

## Clean branch

```text
finish/full-live-operating-system-main-sync
```

## Repair command

From the local repository root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/repo/Sync-KingsmenPayFastCleanBranch.ps1
```

After reviewing the local result, push the synced branch:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/repo/Sync-KingsmenPayFastCleanBranch.ps1 -PushAfterSync
```

If rebase creates conflict pressure, use a merge repair instead:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/repo/Sync-KingsmenPayFastCleanBranch.ps1 -UseMergeInsteadOfRebase -PushAfterSync
```

## Validators run by the script

```text
npm run payments:validate:runtime-gate
npm run payments:validate:http-boundary
npm run payments:validate:server-persistence
npm run payments:validate:service-activation
npm run payments:validate:candidate-status
npm run payments:validate:clean-sync
```

## Live payment rule

This repair script must not add PayFast credentials to Git. PayFast live remains blocked until provider verification, runtime secrets, sandbox ITN proof, and founder approval are complete.
