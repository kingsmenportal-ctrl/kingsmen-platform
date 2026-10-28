# Kingsmen 90-Day Execution Plan — Evidence-First Release

Date: 2026-10-28  
Status: execution plan and evidence contract; NOT a release approval.

## Release rules
- One immutable release candidate (RC1) SHA must be selected and recorded before the combined suite runs.
- Every result must name repository, branch, full commit SHA, workflow/run URL, environment, timestamp, and outcome.
- Separate **implemented**, **tested**, **deployed**, and **end-to-end verified** percentages. Never infer one from another.
- Do not merge PRs, apply staging migrations, create test identities, or deploy production without the relevant approval and prerequisites.
- No synthetic staging rows or identity creation until backup/restore is demonstrated.
- Do not treat a source directory entry as proof a programme is open, a deadline is current, eligibility is met, or an outcome is provider-confirmed.
- Candidate-reported submission and provider-confirmed outcomes remain separate states.
- No WhatsApp or SMS in this release scope; email remains primary.
- AI is decision support only. Human decisions remain authoritative.

## Days 1–14 — Release foundation
1. Reconcile the dependency chain: #204 → #205 → #190 → #202 → #192.
2. Obtain independent review for PR #206 and verify its exact head SHA and checks.
3. Recover both historical SQL bodies for ledger versions 20261019112452 and 20261019112511; identify the exact execution artifact for each.
4. Compare historical 0078 SQL semantics with live schema: tables, columns, types, nullability, defaults, constraints, indexes, RLS, policies, triggers, functions, grants and ownership.
5. Complete backup/restore drill and retain evidence before staging mutation.
6. Freeze one RC1 SHA only after dependency integration and approval.
7. Run full build, lint, unit, integration, authorization, migration and security suites on that exact SHA.

Exit criteria: immutable RC1 SHA, clean combined suite, reviewed migration history, demonstrated recovery, approved change set, evidence register complete.

## Days 15–45 — Authenticated staging proof
- Reuse suitable existing test identities where authorized; avoid duplicates.
- Establish two distinct candidate identities and one least-privilege reviewer only after the recovery gate.
- Prove profile create/save/reload/update; identity request/evidence/reviewer decision/audit; application preparation and tracking; private document upload/download/expiry; candidate A/B isolation; reviewer authorization.
- Verify persistent PostgreSQL records and server-enforced ownership. No email-only reviewer linkage.
- Run PayFast sandbox checkout and ITN lifecycle with signature, merchant, amount, reference, status, idempotency, invalid payload, failed settlement recovery, receipt/audit and entitlement checks.
- Verify each canonical package price and that entitlements activate only after verified payment.

Exit criteria: full authenticated journey and negative authorization/payment tests pass in staging with sanitized evidence.

## Days 46–70 — Opportunity intelligence and operations
- Ingest opportunities from traceable sources; store provenance, verification state and timestamps.
- Enforce candidate-safe delivery: unverified, expired or closed opportunities cannot be represented as open/verified.
- Prove connector retry, idempotency, dead-letter and recovery behavior.
- Verify founder health/incident controls, audit/history, access denial for ordinary users and fail-closed behavior.
- Review POPIA consent, retention, access logging, secret handling and data minimization.
- Validate email delivery and retry state. No WhatsApp/SMS dependency.

Exit criteria: sourced catalogue, safe opportunity delivery, observable/recoverable operations and privacy/security evidence.

## Days 71–90 — Controlled private beta
- Only after all release gates pass, onboard a controlled cohort (initial operating cap remains 500 active candidates; the initial pilot can be much smaller).
- Monitor health, incidents, application persistence, reviewer decisions, opportunity freshness, payment reconciliation and support burden.
- Run rollback/recovery drill and document incident response.
- Collect candidate feedback without presenting unverified outcomes as facts.
- Produce go/no-go decision with exact deployed commit, test evidence, known risks and named owners.

Exit criteria: approved release deployed to the intended URL, exact commit proven, authenticated E2E passed, recovery/security gates passed, pilot monitoring operational.

## Current known evidence gaps (must be refreshed before release)
- Historical body-to-ledger mapping for both 0078 entries is not yet established.
- PR #206 independent approval is not yet established.
- Backup/restore success evidence is not yet established.
- A two-candidate authenticated staging journey and reviewer decision/audit are not yet established.
- Exact Netlify published deploy ID/commit and route smoke evidence are not yet established.
- Complete PayFast sandbox checkout → verified ITN → entitlement lifecycle is not yet established.

## Evidence register template
For each gate record: `gate_id`, `status` (NOT_STARTED / IN_PROGRESS / PASS / FAIL / BLOCKED), `environment`, `commit_sha`, `workflow_or_artifact_url`, `executed_at_utc`, `operator`, `evidence_summary`, `failure_or_exception`, `next_action`.

A status-only statement is not evidence. PASS requires an attached reproducible result.