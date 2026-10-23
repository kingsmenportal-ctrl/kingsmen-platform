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
