# Kingsmen controlled capacity test plan

## Registered operating stages

The product starts at **500 active candidates**. Growth stages are strictly sequential:

1. 500 active candidates — initial operating-cap proof.
2. 1,000 — only after the 500-stage evidence and founder approval.
3. 5,000 — only after the 1,000-stage evidence and founder approval.
4. 10,000 — only after the 5,000-stage evidence and founder approval.
5. 25,000 — only after the 10,000-stage evidence and founder approval.

The cap limits managed volume, not access to any of the six opportunity pathways.

## Read-only k6 load harness

apps/web/scripts/kingsmen-capacity.k6.js exercises:
- Candidate profile read through POST /api/candidate/profile with action=load.
- Application tracker read through GET /api/candidate/applications.
- Unique, verified candidate identity preflight for every virtual user.

The harness is read-only. It requires one distinct, authorised, disposable staging token per virtual user. It refuses to run unless the exact token count matches the selected stage. Stages above 500 additionally require references for previous-stage results, founder approval, risk review, backup/restore evidence and security review evidence.

Required environment variables (inject through the approved secret manager, never commit tokens):
- K6_BASE_URL
- K6_STAGE_CAP (one of 500, 1000, 5000, 10000, 25000)
- K6_CANDIDATE_TOKENS (JSON array of exactly that many distinct staging bearer tokens)
- K6_P95_MAX_MS and K6_MAX_ERROR_RATE (approved service-level thresholds)
- For stages above 500: K6_PREVIOUS_STAGE_EVIDENCE_REF, K6_FOUNDER_APPROVAL_REF, K6_RISK_REVIEW_EVIDENCE_REF, K6_BACKUP_RESTORE_EVIDENCE_REF, K6_SECURITY_REVIEW_EVIDENCE_REF.

Example after authorisation and fixture provisioning: k6 run apps/web/scripts/kingsmen-capacity.k6.js

## Required evidence per stage

Capture exact release SHA, fixture cohort manifest (no tokens), active-candidate count, distinct verified identity count, HTTP p50/p95/p99, error rate, database CPU/connections/locks, queue age/depth, storage latency, Edge Function errors, Netlify latency/5xx, incident log, manual-fallback staffing capacity, and founder decision.

Do not advance if error thresholds fail, candidate isolation fails, backup/restore evidence is missing, queues fail to drain, reviewer capacity is inadequate, or rollback/stop-selling is untested.

## Current status

No candidate fixtures or load test were created in production or staging during this code pass. No k6 load test has been executed. Staging previously had zero verified Auth-to-candidate identity links, so a genuine test cohort is not available.

The current capacity code includes a reporting snapshot and assertion helper, plus growth-review governance. This is not evidence of database-atomic admission reservation. Before a live 500-candidate pilot, the backend needs a transactionally serialized admission guard that checks and reserves an active slot against the authoritative count. Do not claim the 500 hard cap is operationally enforced until that guard is implemented, tested under concurrency and read back from staging.
