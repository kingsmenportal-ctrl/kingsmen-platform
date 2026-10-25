# Kingsmen Production Convergence — 2026-10-25

## Purpose

This branch is the single integration branch for converging Kingsmen's existing implementations into one deployable release. It was created from the post-PR-180 `main` commit:

- Baseline commit: `5393edd3aadb794929283c00350ee1a99f356323`
- Repository: `kingsmenportal-ctrl/kingsmen-platform`
- Staging database: Supabase project `euhubhhnumtibbyufghm`
- Hosting project: Netlify site `fb27d0db-b116-4890-8f7f-14e654c27dbc`
- Scope: email only. WhatsApp and SMS are excluded from this release.
- PayFast: sandbox verification in scope; live merchant activation is not a release prerequisite.

This is an **integration baseline, not yet a production-approved release**. Production approval requires the release gates below to pass against the same deployed commit.

## Integration queue

The following existing pull requests are candidates for integration, subject to review, branch dependency reconciliation, and available evidence. Their existence or mergeability does not itself prove production readiness.

| Workstream | Existing change | Integration rule |
|---|---|---|
| Truth Vault production fail-closed | PR #180 (already merged into baseline) | Retain the PostgreSQL-only production guard; verify it against the deployed runtime. |
| PayFast sandbox hardening | PR #172 | Review signature, merchant, amount, replay/idempotency and settlement behavior; run real sandbox checkout and ITN before declaring verified. |
| Candidate identity review authorization | PR #173 and prerequisite stack | Preserve reviewer capability separation, service-role-only decision RPC and audit trail. Resolve stacked PR ancestry before merge. |
| Candidate identity-review journey | PR #174 and prerequisite stack | Verify Auth session-derived ownership, private evidence and reviewer queue authorization. |
| Candidate follow-up and persisted status | PR #176 and prerequisite stack | Verify owner-only follow-up, evidence additions, status persistence and audit events. |
| Unified candidate master application | PR #175 | Reconcile branch divergence and lockfile; verify database-backed profile, targets, lifecycle and idempotency. |
| Public Route House | PR #179 | Integrate only after its public route and candidate-workspace boundaries are checked. |
| Founder control plane / durable operations | PRs #155–#171 and related dependent branches | Reconcile dependencies and merge only coherent, tested units; no false-green health or memory-only production state. |

## Mandatory release gates

### 1. Source and build
- [ ] One release commit identified and recorded.
- [ ] Stacked branches reconciled without bypassing branch protection.
- [ ] Package lockfile agrees with package manifests.
- [ ] Clean install and reproducible production build pass.
- [ ] Repository source guards and automated tests pass on the exact candidate commit.
- [ ] CI unavailability or budget restrictions are documented; missing checks are not treated as passing.

### 2. Candidate journey and identity
- [ ] Real Supabase Auth registration/sign-in and recovery.
- [ ] Candidate identity-link request derived from the authenticated session.
- [ ] Authorized reviewer queue and decision with audit evidence.
- [ ] Candidate follow-up and persisted reviewer response.
- [ ] Candidate-owned master application, profile and targets persist across restart.
- [ ] Duplicate requests are idempotent.
- [ ] Candidate A cannot read or mutate candidate B's records or documents.
- [ ] Reviewer authorization is tested with authorized and unauthorized sessions.

### 3. Documents and evidence
- [ ] Actual private upload and authorized signed read.
- [ ] Cross-candidate access denied.
- [ ] Review decisions and evidence links are persisted and audited.
- [ ] Candidate-reported submissions are distinguished from provider-confirmed submissions/outcomes.

### 4. Opportunity pathways
- [ ] Higher education, TVET, SETA/learnerships, internships, apprenticeships and employment are represented in the unified workflow.
- [ ] Funding, accommodation/transport and WIL remain supported where verified sources exist.
- [ ] Source references, freshness timestamps, eligibility and provenance are persisted.
- [ ] Stale, unavailable and unverified sources fail closed and are visibly distinguished.
- [ ] No provider submission or outcome is invented.

### 5. Founder operations and communications
- [ ] Founder operational data is protected by explicit authorization.
- [ ] Founder status comes from persisted operational records, not fabricated/sample summaries.
- [ ] Queue leases, idempotency, retries, dead-letter recovery and incident visibility are tested where enabled.
- [ ] Email delivery is verified through a real mailbox for authentication and operational messages.
- [ ] WhatsApp and SMS are not required or activated for this release.

### 6. PayFast sandbox
- [ ] Sandbox configuration is present in the correct server-side runtime without exposing secrets.
- [ ] Checkout produces the expected sandbox transaction.
- [ ] ITN callback validates merchant identity, signature, amount and transaction identity.
- [ ] Duplicate/replayed ITNs cannot settle twice.
- [ ] Settlement and ledger effects are atomic and persisted.
- [ ] Invalid, missing and delayed callbacks fail safely.

### 7. Deployment and recovery
- [ ] Netlify deploy points to the selected release commit.
- [ ] Production environment variable names/configuration are verified without exposing values.
- [ ] Public routes and authenticated candidate/reviewer/founder routes work on the deployed site.
- [ ] Live end-to-end tests pass against deployed frontend and real staging services.
- [ ] Database persistence survives API/application restart.
- [ ] Backup and restoration/recovery procedure has evidence.
- [ ] Supabase security advisor findings are reviewed; no blanket policies are added merely to silence lints.
- [ ] Deployed SHA, URLs, test outputs, and rollback target are recorded.

## Evidence and reporting

Maintain four independent measures. Do not derive one from another:

- **Implemented %**: required behavior present in the integration branch.
- **Tested %**: required checks actually executed and passed on the candidate commit.
- **Deployed %**: required components deployed from that candidate commit.
- **End-to-end verified %**: user journeys proved against the actual deployed application and persisted services.

A source validator, migration existing in the database, PR marked mergeable, or deploy marked published is not by itself end-to-end proof. Until all mandatory gates pass, the state is **NOT PRODUCTION APPROVED**.
