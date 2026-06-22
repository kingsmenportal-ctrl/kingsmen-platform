# Main Sync PayFast Carry Forward

Status: clean sync branch started from current `main`.

## Purpose

This file marks the clean repair lane for carrying the PayFast/Kingsmen payment work from the superseded PR into a branch that is not behind `main`.

## Source reference

Superseded source PR:

```text
#40 [superseded] Finish live operating gate: PayFast runtime activation boundary
```

Clean branch:

```text
finish/full-live-operating-system-main-sync
```

## Carry-forward scope

The clean branch must carry forward these pieces without committing raw PayFast credentials:

1. PayFast runtime live gate.
2. PayFast HTTP ITN, return, cancel, and status boundary.
3. PayFast API server mount.
4. PostgreSQL finance persistence.
5. Service entitlement activation.
6. Candidate payment status UI.
7. Candidate backend status mapping.
8. Validators and runbooks.

## Current clean-branch seed

The first clean-branch commit restores the current `main` package scripts and adds the PayFast validation script entries. The remaining source files still need to be copied from PR #40 into this clean branch.

## Live payment rule

No live payments may be enabled until PayFast verification, runtime secrets, sandbox ITN proof, and founder approval are complete.
