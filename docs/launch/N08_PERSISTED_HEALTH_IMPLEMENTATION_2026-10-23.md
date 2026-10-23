# N08 persisted health reconciliation implementation — 2026-10-23

## Code added
- `supabase/functions/n08-founder-control-plane-health/index.ts` now reads persisted incident events, recent service-health checks, recent integration-health snapshots, and the latest system-health snapshot.
- The response includes a privacy-safe `persistedHealth` summary: status, counts, latest snapshot reference/time, freshness, and source-query availability. It does not return candidate data.
- `SEV1`, down/blocked service, or persisted RED state produce RED. Open incidents, degraded/unknown recent service observations, AMBER snapshot, elevated pressure, or failed workflows produce AMBER. GREEN requires fresh system snapshot, fresh service evidence, available source queries, no open incidents, no failed workflows, and LOW pressure. Missing/stale evidence stays UNKNOWN and the overall founder status remains DEGRADED.
- Service/integration observations older than 15 minutes are excluded from active status computation. Stale evidence is not silently treated as healthy.
- `scripts/staging/test-n13-n08-persisted-health.mjs` adds a controlled, synthetic staging drill for healthy GREEN, open SEV2 AMBER, open SEV1 RED, and down-service RED. It uses unique references, no candidate data, service-role credentials supplied only via environment, and cleanup in a `finally` block.

## Execution contract
Run only against the isolated staging project after deploying this exact function version:

`SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/staging/test-n13-n08-persisted-health.mjs`

The runner calls the deployed Edge Function through its authenticated endpoint and asserts its response against the actual inserted database records. A passing local/static test is not a substitute for running it. Do not execute against production. Do not paste secrets into logs or evidence.

## Live verification state
At code preparation time, staging health tables were empty and the deployed N08 function was still version 3. This commit is not yet deployed. Therefore no claim is made that the live status transitions have passed. Deployment and the authenticated staging run must be recorded after the PR passes review and CI.

## Remaining batch gates
- Execute the staging runner after deployment and retain redacted run reference and cleanup confirmation.
- Exercise N14 failure → bounded retry → persisted dead-letter → recovery with a synthetic isolated connector and non-candidate payload.
- Inventory every provider; record authorized probe results only when a usable sandbox/secret exists, otherwise `NOT_CONFIGURED`.
- Verify backend-only reviewer tables have no client grants; preserve intentional no-policy RLS if confirmed. Resolve leaked-password protection warning through Supabase Auth configuration.
- Run candidate A/B, anonymous, reviewer, and backend-role isolation tests.
- Reconcile the complete runtime proof pack and keep final assembly blocked until all gates have evidence.
