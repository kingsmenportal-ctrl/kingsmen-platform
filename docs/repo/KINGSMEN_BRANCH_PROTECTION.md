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
- `Build, validate, and smoke-test` required (repository tests, API/web builds, launch audit and runtime smoke tests);
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

## Continuous evidence capture

The read-only evidence workflow at `.github/workflows/kingsmen-branch-protection-evidence.yml` runs for pull requests targeting `main`, pushes to `main`, and manual dispatch. It queries the real GitHub branch-protection endpoint, records a redacted report, and uploads that report even when the protection check blocks.

A missing or inaccessible protection endpoint must remain a failed/blocked result. The workflow uses a dedicated repository secret named `KINGSMEN_BRANCH_PROTECTION_READ_TOKEN`, not `GITHUB_TOKEN`, because GitHub's Get branch protection endpoint requires the repository Administration read permission for fine-grained tokens. Configure that secret with repository-only access and Administration: read; do not grant write. If the secret is absent, the workflow records a blocked result. This workflow does not apply protection and cannot replace the one-time administrator action below. A green source-level check proves only that the verifier is implemented; it does not prove that GitHub settings are active.

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

Public launch remains blocked until GitHub confirms branch protection is active and both `source-guard` and `Build, validate, and smoke-test` are passing.
