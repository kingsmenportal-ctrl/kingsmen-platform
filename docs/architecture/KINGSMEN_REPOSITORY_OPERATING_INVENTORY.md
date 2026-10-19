# Kingsmen repository-wide operating inventory

This inventory is the cross-module map for Kingsmen. It is generated from the checked-out repository and the release module registry, rather than copied from an old branch snapshot.

## Authority and interpretation

- Module ownership and declared release status come from `apps/api/src/final-assembly/module-registry.ts`.
- Required release gates and their declared blockers come from `manifests/launch/kingsmen-launch-readiness-v1.json`.
- File counts are measured from the current checked-out tree when the validator runs.
- Evidence-file presence is reported, but **file presence does not mean evidence is current, reviewed, redacted, or a live test passed**.
- In authenticated GitHub Actions, the generator also paginates the live GitHub API to capture every repository branch, open pull request (including head/base, changed-file count and mergeability), and open issue (including labels). The job has read-only `contents`, `pull-requests`, and `issues` permissions. If the live census cannot be fetched in CI, verification fails rather than silently reporting a partial remote inventory.
- Live database state, provider credentials, and actual production deployment are not inferred from GitHub metadata.

## Module map: N00–N20

| Module | Responsibility | Declared registry status | Authoritative truth source | Runtime proof |
|---|---|---|---|---|
| N00 | Constitution / doctrine lock | Locked | Repository | Separate launch/runtime evidence required |
| N01 | Monorepo / Oracle Lite runtime | Validated | Repository | Separate launch/runtime evidence required |
| N02 | Backend API kernel / state machine | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N03 | PostgreSQL Truth Vault | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N04 | Candidate core / portal | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N05 | Document vault | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N06 | Route universe / application workbench | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N07 | Airtable sync | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N08 | Control plane | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N09 | Communications | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N10 | Finance / PayFast | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N11 | AI decision | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N12 | Governance | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N13 | Observability / reports / incidents | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N14 | Integrations / workflow connectors | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N15 | Opportunity engine / source intelligence | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N16 | Orchestrator / execution runtime | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N17 | Founder control plane / command operations | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N18 | Public website / route house front door | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N19 | Candidate mobile / public-to-portal experience | Validated | PostgreSQL | Separate launch/runtime evidence required |
| N20 | Final assembly / system lock / production readiness | Locked | PostgreSQL | Release lock remains evidence-gated |

The table reflects the source registry, not a claim that 19 modules have passed production acceptance. The generated JSON repeats each module's registered owner boundary, validator/report registration, and an explicit unverified runtime-proof state.

## Connected candidate journey

The intended data flow is:

1. Register and authenticate.
2. Link the signed-in user to the correct candidate record through authorised identity review.
3. Build and correct the candidate profile through controlled review.
4. Assess the six pathways: higher education, TVET, SETA, employment, entrepreneurship, and other relevant opportunity routes.
5. Track opportunities and applications, preparation tasks, deadlines, and required documents.
6. Upload private documents through quarantine, scanning, review, and access-controlled storage.
7. Capture provider submission evidence and outcomes without inventing success.
8. Use communications with email primary, WhatsApp urgent-only, and SMS backup-only.
9. Record payments/refunds and activate entitlements only after verified financial events.
10. Preserve audit, evidence, consent, correction, retention, observability, and incident records.
11. Give founders/operators controlled review and operational views.
12. Open public launch only after release gates and founder review pass.

Each link must be proven across web/API/database/authorization boundaries. A UI route or source validator alone does not prove the journey works end to end.

## Current release blockers

The canonical manifest remains the release gate authority. At minimum, verify:

- GitHub main-branch protection and required checks.
- Staging Truth Vault persistence, idempotency, audit/evidence and DLQ paths.
- Live role-isolation tests for anonymous, candidate, reviewer/operator/founder, and service roles.
- Deployed web-to-backend health and command intake.
- PayFast sandbox checkout, ITN signature, replay, duplicate, amount mismatch, failure and refund-review cases.
- Real staging backup/restore drill and recovery measurements.
- Masked proof that required secrets exist outside Git.
- Communications provider staging send/receive, bounce, opt-out and channel-boundary evidence.
- Observability, alerting, DLQ and incident drill.
- Published/versioned privacy, consent, terms and refund surfaces with appropriate review.
- Complete reviewed staging proof pack and final assembly evidence bundle.

## Run the inventory

```bash
npm run kingsmen:inventory
npm run kingsmen:inventory:verify
```

The generator writes `reports/architecture/kingsmen-repository-operating-inventory-latest.json`. CI output reports current checkout counts, live branch/PR/issue counts, and integrity failures. The JSON contains the full branch list, every open PR with its base/head, and open issue titles/labels, so competing branches and stacked work are visible in one revisioned evidence artifact. Use the artifact/report from a specific commit to compare growth; do not compare an old scan's counts with current values as if they came from the same revision.

## Contribution accounting rule

For every future batch, record:
- commit/PR and changed file count;
- tests added and tests actually run;
- contracts or module records added/changed;
- CI run IDs and results;
- staging/production evidence actually captured;
- newly closed launch blockers and any blockers still open.

A change is credited as source implementation until its test, integration, live-runtime, and release evidence gates pass. This prevents source volume from being mistaken for functional completion.
