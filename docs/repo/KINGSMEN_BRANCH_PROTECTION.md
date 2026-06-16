# Kingsmen Branch Protection

Status: **foundation built, GitHub apply pending**  
Production ready: **false**

This document defines the branch protection boundary for `main` in `kingsmenportal-ctrl/kingsmen-platform`.

Kingsmen may not launch from an unprotected `main` branch.

## Required protections

`main` must have:

- deletion blocked;
- force push blocked;
- pull request required before merge;
- at least one approving review;
- stale approvals dismissed;
- conversation resolution required;
- required status checks enabled;
- strict status checks enabled;
- `source-guard` required;
- admins included;
- linear history required where available.

## Source guard

The source guard workflow lives at:

```text
.github/workflows/kingsmen-source-guard.yml
```

It runs the current source-level launch validators:

```bash
npm run api:validate:truth-vault
npm run web:validate:backend-boundary
npm run payments:prove:sandbox
npm run payments:validate:sandbox
npm run security:prove:rls
npm run security:validate:rls
npm run backup:prove:restore
npm run backup:validate:restore
npm run kingsmen:launch:audit
```

It does **not** run `npm run kingsmen:launch:gate` because the public launch gate is intentionally blocked until real staging evidence exists. The source guard protects merges; the launch gate protects public release.

## Apply command

Run from repo root after authenticating `gh` with admin access:

```powershell
.\scripts\github\Set-KingsmenMainBranchProtection.ps1
```

Dry run:

```powershell
.\scripts\github\Set-KingsmenMainBranchProtection.ps1 -DryRun
```

## Validate source boundary

```bash
npm run repo:prove:branch-protection
npm run repo:validate:branch-protection
```

These commands prove that the branch-protection source boundary exists. They do not prove GitHub settings have been applied. After running the apply script, verify through GitHub UI or `gh api` that `main` is protected.

## Launch status

Public launch remains blocked until GitHub confirms branch protection is active and required source guard checks are passing.
