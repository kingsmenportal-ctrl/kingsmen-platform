# Kingsmen Kimi Repo Access Law

Status: LOCKED
Scope: Kimi, Kimi coding agents, Kimi browser agents, and any Kimi-powered assistant given access to the Kingsmen repository.
Repository: kingsmen-platform
Doctrine group: N00 Constitution / Doctrine Lock
Depends on: docs/N00-doctrine/jarvis-app-connector-law.md

---

## 1. Purpose

This document defines how Kimi may access and work on the Kingsmen repository.

Kimi may help read, explain, generate, refactor, test, and prepare pull requests for Kingsmen. Kimi must not become the uncontrolled brain of Kingsmen and must not bypass repository law, production approval, validators, security rules, or the backend state machine.

---

## 2. Approved Access Methods

Kimi may access the repository through these methods only:

1. Local cloned repository folder
2. GitHub OAuth/App integration limited to selected repositories
3. Fine-grained GitHub personal access token limited to `kingsmenportal-ctrl/kingsmen-platform`
4. Read-only deploy key for server-side clone/pull use
5. Branch-and-pull-request workflow for write access

Forbidden access methods:

1. GitHub password shared with Kimi
2. Classic token with broad account access unless no safer option exists
3. All-repositories permission where selected-repository access is available
4. Production secrets pasted into Kimi chat
5. Direct push to `main`

---

## 3. Minimum Permission Rule

Kimi must receive the smallest permission needed for the task.

Default access:

```txt
Contents: Read
Metadata: Read
```

Write access is allowed only when Kimi is expected to create branches, commits, or pull requests.

Write access should be limited to:

```txt
Contents: Read and Write
Pull Requests: Read and Write
Issues: Read and Write
Metadata: Read
Actions: Read
```

Kimi must not receive unrestricted organization/account access unless explicitly approved by the founder and justified in the repo.

---

## 4. Required Kimi Startup Instruction

Every Kimi session working on Kingsmen must begin with this instruction:

```txt
You are working inside the Kingsmen repository only: kingsmenportal-ctrl/kingsmen-platform.
Read docs/N00-doctrine/jarvis-app-connector-law.md and docs/N00-doctrine/kimi-repo-access-law.md before making changes.
Do not push directly to main.
Create a branch for all changes.
Stay inside the requested N-series/module.
Do not invent useless layers.
Do not expose secrets.
Do not touch production.
Do not activate n8n, Airtable, Supabase, payments, WhatsApp, email, or Oracle production actions.
Create or update repo files first.
Run validators where available.
Show changed files and failures before push or pull request.
```

---

## 5. Branch Rule

Kimi must work on a branch, never directly on `main`.

Branch naming pattern:

```txt
kimi/<n-series-or-module>/<short-task-name>
```

Examples:

```txt
kimi/n00/kimi-repo-access-law
kimi/n04/candidate-auth-review
kimi/n07/airtable-sync-dry-run
```

---

## 6. Pull Request Rule

Any Kimi-generated change that is intended for merge must go through a pull request unless the founder explicitly instructs a direct documentation commit.

Pull request description must include:

1. What changed
2. Why it changed
3. Files changed
4. Tests or validators run
5. Known failures or untested areas
6. Production impact: none / staging only / requires approval

---

## 7. Production Boundary

Kimi must never perform the following without explicit founder approval:

1. Production deployment
2. Production workflow activation
3. n8n production activation
4. Airtable production schema deletion
5. Supabase/PostgreSQL destructive migration
6. Payment action, refund, capture, reversal
7. Mass email, WhatsApp, or SMS sending
8. Candidate application submission
9. Credential rotation
10. Branch protection weakening
11. Security rule weakening

Kimi may prepare code for these actions, but execution must be approved separately.

---

## 8. Secrets Law

Kimi must never read, request, print, commit, summarize, screenshot, or expose secrets.

Forbidden secret examples:

```txt
GitHub tokens
Airtable PATs
n8n API keys
Supabase service role keys
Database URLs with passwords
PayFast passphrases
SMTP passwords
Google OAuth client secrets
WhatsApp access tokens
Oracle SSH keys
```

Allowed secret handling:

```txt
.env.example     names only, no real values
.env.local       local only, ignored by Git
GitHub Secrets   CI/CD only
Vault/config     production only
```

---

## 9. App Connector Boundary

Kimi may generate connector code and documentation for:

```txt
GitHub
Airtable
n8n
Supabase/PostgreSQL
Google Workspace
PayFast
WhatsApp/SMS
Email
Oracle deployment
Public portal scout scripts
```

Kimi must keep durable changes repository-first.

Correct path:

```txt
Generate repo files
Run validators
Show changed files
Open pull request
Deploy to staging if approved
Production only after explicit approval
```

Incorrect path:

```txt
Directly change Airtable, n8n, Supabase, payments, or production without repo evidence
```

---

## 10. No Useless Layers

Kimi must not add complexity for appearance.

Kimi must not create:

1. Unnecessary microservices
2. Duplicate control planes
3. Extra orchestration layers
4. Fake AI modules
5. Mock-only modules presented as production-ready
6. Provider routers not needed at the current stage
7. New frameworks that duplicate existing repo structure

Every module must be necessary, repository-materializable, validator-provable, Oracle Lite realistic, and directly useful to Kingsmen.

---

## 11. Kimi Review Checklist

Before Kimi says work is complete, it must report:

```txt
Files changed:
Tests/validators run:
Failures:
Secrets touched: no
Production touched: no
Main branch touched: no
Open questions:
Next safe step:
```

---

## 12. Enforcement

This document is a doctrine lock.

Any Kimi action that conflicts with this document is invalid until this document is explicitly updated by founder instruction and committed to the repository.

The Jarvis app connector law remains binding on Kimi where connector, app, production, or automation access is involved.
