# N07 durable outbox — staging verification evidence

Date: 2026-10-23  
Environment: Supabase staging project `euhubhhnumtibbyufghm`  
Migration: `0020_n07_durable_outbox_leases_retry`  
Status: database contract verified; full N07 integration remains incomplete.

## Verified in staging

- Migration applied successfully.
- Outbox contains the added `updated_at`, `max_attempts`, `lease_expires_at`, and `error_code` columns.
- Three RPCs exist: `n07_enqueue_airtable_mirror`, `n07_claim_airtable_mirror_batch`, and `n07_finish_airtable_mirror_job`.
- All three functions are invoker-security (`security_definer=false`).
- Execute privileges: `service_role=true`; `anon=false`; `authenticated=false`.
- Direct outbox privileges: anon/authenticated SELECT and INSERT are false; service_role SELECT and INSERT are true.
- Claim indexes exist for claimable rows, expired leases, and target/status.
- Transactional rollback test passed: same idempotency key/event persisted one row; three failed attempts reached `DEAD_LETTER`.
- Transactional rollback test passed: sensitive `candidateEmail` payload rejected; wrong worker could not finish a leased job; expired lease was reclaimed; matching worker completed the job.
- Post-test cleanup verified: queue rows = 0 and temporary test targets = 0.

All behavioral tests ran inside explicit transactions followed by `ROLLBACK`, so no test records were left in staging.

## Not proven yet

- Static Node contract test has not been executed in GitHub Actions or a local shell.
- The authenticated enqueue adapter is now wired through the web route to the deployed `n07-airtable-enqueue` Edge Function (version 2, `verify_jwt=true`). It forwards the caller JWT and public anon key only; service_role stays server-side.
- No live authorized HTTP request has been proven yet because staging has zero active outbound target mappings and zero active reviewer grants. The function must reject unauthorized callers and cannot enqueue without a valid target.
- No worker service or Airtable provider call was executed; the database claim/finish RPCs were exercised transactionally.
- No active outbound target/base mapping exists in staging.
- Candidate journey independence from a live deployment has not been run as an end-to-end browser test.
- No production deployment or production readiness is claimed.

## Next gates

1. Pass repository CI and source contract test.
2. Verify the deployed Edge Function with valid/invalid JWTs and reviewer grants.
3. Implement and supervise a worker that calls the claim/finish RPCs and provider adapter.
4. Add and review an approved outbound target mapping only after Airtable is connected.
5. Run staging browser/runtime tests for founder authorization and candidate journey independence.
