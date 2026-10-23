# N07 / N08 staging runtime evidence — 2026-10-23

## Scope and confidence

This is a point-in-time read-only evidence capture from the connected Supabase staging database and Edge Function inventory. It is not a production-readiness certification. Authenticated HTTP probes were not executable from the current runner: it has no candidate reviewer or founder-admin access token, and its outbound DNS lookup for the Supabase endpoint failed. No tokens or service secrets are included here.

## Live staging observations

- Supabase project: `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`).
- Edge Function `n07-airtable-enqueue`: ACTIVE, version 2, JWT verification enabled.
- Edge Function `n08-founder-control-plane-health`: ACTIVE, version 3, JWT verification enabled.
- `public.airtable_sync_targets`: 0 rows total; 0 active outbound PostgreSQL-to-Airtable mirror targets.
- `public.airtable_sync_outbox`: 0 rows total; 0 pending, locked, failed, dead-lettered or completed jobs.
- N07 database RPCs are present: `n07_enqueue_airtable_mirror`, `n07_claim_airtable_mirror_batch`, and `n07_finish_airtable_mirror_job`. Their definitions require `current_user = 'service_role'`.
- N07 claim logic leases batches, increments attempts, reclaims expired leases, and dead-letters expired leases after the attempt limit. Completion failure schedules exponential backoff; successful completion uses persisted status `COMPLETED`.
- N08 health implementation declares PostgreSQL as source of truth, Airtable as an optional asynchronous mirror, returns aggregate counts only, and hard-codes `productionReady: false`. It marks health degraded when no active mirror target or reviewer grants are present.

## Runtime blockers and correct interpretation

1. **Authenticated N07 enqueue test: BLOCKED, not passed.** The staging target registry is empty, so there is no legitimate active target ID to use. Do not invent a fake live Airtable target or claim delivery success. The reviewer access token and service-role verification credential are also unavailable to the runner.
2. **N07 worker lifecycle (claim, retry, expired-lease recovery, dead-letter): NOT VERIFIED end-to-end.** The database function definitions were inspected, but no real job could be enqueued/claimed against an active target in this session.
3. **Authenticated N08 founder-health HTTP test: BLOCKED, not passed.** No founder-admin access token is available and the runner could not resolve the Supabase host for direct HTTP requests. Edge Function inventory and deployed source were inspected; that is not equivalent to a live authenticated request.
4. **Candidate-flow independence:** the N07 function is explicitly an enqueue-only mirror API and the N08 health response explicitly declares that Airtable connectivity cannot block candidate flows. This is implementation evidence, not proof from a live fault-injection test of registration, opportunity discovery, application preparation, private documents and tracking.

## Corrective test-harness fix

The N07 staging test now recognises the actual persisted success state `COMPLETED` instead of the incorrect `DONE` value. This aligns the test assertion with the deployed database function's status vocabulary.

## Required closure sequence

- Provision/confirm an actual active, outbound-only, PostgreSQL-authoritative Airtable target only when the integration is intentionally configured; keep it optional to candidate workflows.
- Supply runner-only secrets through the trusted environment (reviewer session token, founder-admin session token and service-role key); never commit or print them.
- Execute the N07 authenticated duplicate-enqueue probe and prove one idempotent outbox row.
- Exercise a non-candidate staging job through claim → failed attempt → backoff/retry → expired lease recovery → success and exhausted-attempt dead-letter; assert persisted state after each transition.
- Execute N08 no-token rejection and founder-admin authenticated response against the deployed endpoint.
- Fault-inject Airtable unavailable and independently smoke-test registration, opportunity discovery, application preparation, private-document access and candidate tracking; assert those core flows remain available.
- Keep production readiness false until these gates and the broader release gates are proven.

## Related implementation PRs

- N07 authenticated enqueue probe: https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/158
- N08 authenticated founder-health probe: https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/159
