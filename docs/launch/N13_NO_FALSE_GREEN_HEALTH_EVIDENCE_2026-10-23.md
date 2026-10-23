# N13 no-false-green health gate — implementation evidence

Date: 2026-10-23

## Change
- Updated `apps/api/src/observability/health-status.ts`.
- Health derivation now treats any open incident as at least AMBER, even if severity-count telemetry is temporarily missing or stale.
- Medium capacity pressure is AMBER rather than GREEN.
- SEV1, critical capacity pressure, or a DOWN/BLOCKED service remains RED.
- Snapshot construction now runs the no-false-green invariant before returning the snapshot.
- Added `scripts/staging/test-n13-health-status.mjs` with regression assertions for baseline green, open incident, SEV1, medium pressure, down service, and defence-in-depth rejection.

## Run
```bash
node scripts/staging/test-n13-health-status.mjs
```

The test compiles the TypeScript module in memory with the repository's TypeScript dependency and exercises the actual exported functions.

## Evidence boundary
- Source changes committed on branch `fix/n13-no-false-green-incident-health-2026-10-23`.
- The test has been authored but has **not** been executed in this environment; no test pass is claimed.
- No database migration, staging deployment, Netlify deployment, or production runtime verification was performed by this change.
- This is not evidence that the full N13 module or Kingsmen is production-ready.
- Existing production-readiness gates remain closed until integrated staging tests, security checks, and required live runtime evidence pass.


## Executed CI evidence — 2026-10-23
- GitHub Actions run: `Kingsmen Release Evidence`, run ID `39992331553`, conclusion **success**.
- GitHub Actions run: `Kingsmen Source Guard`, run ID `39992331527`, conclusion **success**.
- GitHub Actions run: `Jarvis Live Runtime`, run ID `39992331721`, conclusion **success**.
- The repository test-suite step passed after the test's TypeScript module resolution was corrected. The N13 test reports six regression assertions.
- API build and web build passed in the release-evidence run.
- Isolated runtime smoke checks passed: `GET /health` returned HTTP 200; `GET /api/system/health` returned HTTP 200; unknown route returned HTTP 404.
- Runtime smoke mode was `memory_development_only`. This is real execution of the compiled API in an isolated CI process, **not** a Supabase staging integration or a production deployment.
- CI evidence artifact: `kingsmen-release-evidence-39992331553` (artifact ID `12518740920`).

## Staging integration reconciliation
A read-only query against Supabase staging project `euhubhhnumtibbyufghm` returned zero rows in each of: `incident_events`, `service_health_checks`, `integration_health_snapshots`, `system_health_snapshots`, `airtable_sync_targets`, and `airtable_sync_outbox`. Therefore, staging currently provides no stored incident/service-health observations to validate a real incident-to-health-status integration path. This is an absence of test data/evidence, **not** proof that the health path behaves correctly under live incidents.

## Remaining N13 gates
- Add/execute a controlled, authorised staging verification using real incident and service-health records (or a non-production fixture path) and capture redacted evidence for open incident => AMBER, SEV1/down/blocked => RED, degraded/medium pressure => AMBER, and healthy => GREEN.
- Verify the production-backed health computation consumes the intended incident/service-health sources; the isolated smoke endpoint alone does not prove that integration.
- No Netlify deployment or production release is claimed. Production readiness remains **false** until the above evidence and the wider launch gates are satisfied.
