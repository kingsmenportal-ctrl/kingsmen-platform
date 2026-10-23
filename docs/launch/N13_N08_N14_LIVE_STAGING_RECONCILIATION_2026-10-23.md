# N13 / N08 / N14 Live Staging Reconciliation — 2026-10-23

Status: **BLOCKED — live transitions and provider transaction evidence not established**
Environment: Supabase staging project `euhubhhnumtibbyufghm`
Observation time: 2026-10-23 (UTC; exact timestamps are held in the Supabase advisor output and GitHub workflow runs)
Production ready: **false**
Public launch allowed: **false**

## Evidence captured

### N13 persisted observability sources

Read-only SQL against staging returned the following row counts:

| Source | Rows |
| --- | ---: |
| `public.incident_events` | 0 |
| `public.service_health_checks` | 0 |
| `public.integration_health_snapshots` | 0 |
| `public.system_health_snapshots` | 0 |

These empty sources mean that staging cannot currently demonstrate incident/service-driven status transitions from real persisted records. No fabricated incident was inserted into live staging. N13 unit/regression and CI workflows are not substitutes for this missing integration evidence.

The current schema confirms the relevant status domains: incidents use OPEN/ACKNOWLEDGED/MITIGATING/RESOLVED/CLOSED/CANCELLED and SEV1–SEV4; service checks use UP/DEGRADED/DOWN/BLOCKED/UNKNOWN; system snapshots use GREEN/AMBER/RED/UNKNOWN and LOW/MEDIUM/HIGH/CRITICAL pressure.

### N08 reconciliation defect

The deployed `n08-founder-control-plane-health` Edge Function (active, version 3, JWT verification enabled) reads queue/backlog counts, active Airtable targets, and active platform-reviewer grants. Its implementation does **not** query `incident_events`, `service_health_checks`, `integration_health_snapshots`, or `system_health_snapshots`; it therefore cannot currently reconcile the founder health response with persisted incident/service-health state. This is a real integration gap, not a green result.

Current staging counts:
- `airtable_sync_targets`: 0
- `airtable_sync_outbox`: 0
- active `platform_reviewers`: 0

N08 should fail closed/degrade when health-source queries are unavailable or no trustworthy fresh health snapshot exists, and it should incorporate open incidents and down/blocked/degraded services. It must not synthesize a healthy status from empty source tables.

### N14 provider configuration and queue evidence

Read-only staging registry counts:
- `integration_connectors`: 0
- `workflow_connector_registry`: 0
- `integration_outbox`: 0
- `integration_dead_letter_queue`: 0
- `dead_letter_queue`: 0
- `airtable_sync_targets`: 0
- `airtable_sync_outbox`: 0

Airtable account-level read access has been verified separately, but the Kingsmen staging mirror has no configured target. Therefore Airtable integration status is **NOT_CONFIGURED for Kingsmen staging**, not a successful connector transaction. A provider's account being connected does not establish application configuration, authorized sandbox access, or a persisted Kingsmen write.

No authorized provider transaction was executed in this batch because the staging provider registry and target records are empty and no safe, provider-specific sandbox credentials/configuration have been established by the available evidence. For unregistered providers, preserve explicit **NOT_CONFIGURED** rather than manufacturing a probe result. This applies until a specific provider has a registered connector, an approved endpoint/sandbox, and usable secret configuration confirmed by masked status only.

### Controlled failure/retry/dead-letter

The live staging integration outbox and both inspected DLQ tables are empty. There is no existing persisted failure to inspect and no configured connector to exercise safely. Consequently a controlled failure → retry → dead-letter lifecycle is **NOT VERIFIED**. Do not seed fake candidate/application data or use a real provider endpoint to manufacture this evidence. Implement the drill using an isolated test target and synthetic non-candidate payload, then verify each state transition and redacted error evidence by record reference.

### Security findings from current Supabase advisors

Current security advisor results report:
- INFO: RLS enabled but no policies on `candidate_identity_review_audit`, `candidate_identity_review_requests`, and `candidate_private_document_reviews`.
- WARN: leaked-password protection disabled in Supabase Auth.

RLS being enabled with no policies is default-deny for ordinary API roles, but it may also block intended reviewer workflows. These findings require an explicit least-privilege policy review and live role tests; do not add broad policies to silence the advisor. Candidate A/B isolation, anonymous denial, reviewer authorization, and service-role-only observability writes remain **NOT VERIFIED** by this read-only batch.

## Workflow evidence

- N13 Release Evidence: https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/39992818967
- N13 Source Guard: https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/39992818926
- N14 Release Evidence: https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/39992824787
- N14 Source Guard: https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/39992824948
- N13 code PR: https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/163 (open/unmerged at inspection)
- N14 code PR: https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/164 (open/unmerged at inspection)

These successful CI workflows establish source/build/regression evidence only. They do not establish live N13 database transitions, live N08 persisted-source reconciliation, external-provider transactions, or candidate isolation.

## Required next gates

1. Add a dedicated isolated staging fixture/drill for N13, with unique test refs and guaranteed cleanup; verify the actual status computation against persisted incident and service-health rows.
2. Revise N08 so it reads and reconciles the persisted incident/service-health/system snapshot sources, checks freshness/query availability, and fails closed/degrades for missing or contradictory telemetry; test the deployed function using authorized identity.
3. Register each intended N14 provider only when approved endpoint/sandbox and usable secret configuration are confirmed. Probe only those providers; record redacted correlation/request/result refs, timestamp, status, and safe error code. Keep all others `NOT_CONFIGURED`.
4. Exercise a synthetic connector failure, bounded retry, and DLQ recovery on an isolated test connector; verify persisted outbox attempts, terminal status, error code, and evidence refs.
5. Fix/review the three no-policy RLS findings, enable leaked-password protection, then run authorized Candidate A/Candidate B/anonymous/reviewer/service-role isolation checks.
6. Re-run all launch/source/security/observability validators, capture every required runtime report, reconcile the release inventory, and keep final assembly blocked until reports are present, redacted, reviewed, and passing.

No secrets, raw candidate data, or provider payloads are recorded in this document.
