# N16 Durable Worker Recovery — 2026-10-25

## This batch

Migration `202610250001_n16_durable_worker_recovery.sql` connects recovery decisions to the existing `orchestrator_dispatch_queue` and existing audit/handoff tables.

- `n16_claim_dispatches` uses `FOR UPDATE SKIP LOCKED`, bounds claim count and lease duration, and atomically leases due work. Expired LOCKED leases may be reclaimed; SENT work is excluded.
- `n16_record_dispatch_result` locks the dispatch row and atomically records the worker result, execution event and queue decision.
- Transient/unknown failures are rescheduled with bounded exponential delay until the attempt budget is exhausted, then persisted as DEAD_LETTER.
- Authentication, policy and invalid-payload failures stop without retry. Portal/manual/approval blocks create a durable handoff.
- `n16_reconcile_expired_sent` quarantines expired SENT work for manual reconciliation. It does not replay potentially completed external side effects.
- Queue RPCs are executable only by `service_role`; ordinary/anonymous JWT roles are explicitly revoked.
- The migration also revokes legacy broad table grants on the queue, results, events and handoff tables. This was necessary because pre-existing table grants and permissive RLS policies otherwise allowed client roles to bypass the RPC boundary.
- Result refs and handoff/event refs are deterministic to support safe repeat calls. State transitions remain separately guarded; an audited result does not automatically authorize a candidate/application state change.

## Staging evidence — Supabase project `euhubhhnumtibbyufghm`

All three migrations were applied successfully to staging on 2026-10-25:

1. `n16_durable_worker_recovery_202610250001`
2. `n16_worker_send_boundary_202610250002`
3. `n16_exhausted_lease_recovery_202610250003`

The Supabase migration ledger shows all three entries. Live schema checks confirmed all five N16 RPCs exist. Privilege checks showed `anon_can_execute=false` and `authenticated_can_execute=false` for every N16 RPC, while `service_role_can_execute=true`. Table-grant checks showed no remaining direct grants on the four protected worker tables for `anon` or `authenticated`.

### Runtime checks actually executed

- **Overlapping claims:** two claim calls were launched concurrently against one due test dispatch. Worker A received the row with `LOCKED` / attempt 1; worker B received no row. The test dispatch was never returned to both callers.
- **Claim crash recovery:** simulated a worker crash by expiring a `LOCKED` lease; a new worker reclaimed it and attempt count advanced from 1 to 2.
- **SENT crash recovery:** marked the dispatch `SENT`, expired its lease, and ran reconciliation. The queue became `FAILED` with `EXPIRED_SENT_REQUIRES_RECONCILIATION`; one manual handoff and one critical quarantine event persisted. The dispatch was not reset to `READY`.
- **Retry scheduling:** a transient failure returned `RETRY`; a later attempt persisted a 30-second future `dispatch_after` and `RETRY_SCHEDULED` event.
- **Duplicate result:** replaying the same `result_ref` returned `duplicate=true`; one worker-result row and one result-received event remained.
- **Dead letter:** a dispatch at its retry budget persisted `DEAD_LETTER`, the failure code, worker result and `RUN_FAILED` event.
- **Manual handoff:** a manual-only block persisted a worker result, failed queue state, handoff row and handoff event.
- **Transaction rollback:** deliberately caused a unique-key conflict after the result function had started writing. PostgreSQL rolled back the attempted worker-result row, result event and queue changes; the pre-existing conflicting event remained, and the queue stayed `LOCKED`.
- **Cleanup:** all synthetic staging queue rows and related test result/event/handoff records were deleted; follow-up counts were zero for all four categories.

These checks prove database function behavior for the scenarios above. The crash cases simulated lease expiry; no operating-system worker process was killed.

## Still not verified

- The API adapter in `apps/api/src/orchestrator/durable-worker-queue.ts` is not yet connected to a running worker loop in `apps/api/src/server.ts` or a deployed worker service.
- Netlify currently has public Supabase URL/client-key variables, but no configured privileged worker credential or database connection string. No worker was deployed through Netlify.
- A real worker process has not been started and terminated at runtime; only database lease-expiry recovery was exercised.
- The TypeScript build and static contract test have not yet been verified green on the latest PR commit.
- Independent PR review and final CI checks remain outstanding.

## Next release gates

Wire the adapter into an explicit, authenticated worker runner that obtains server-only credentials from the runtime secret store; add an allowlisted handler registry and no-op/side-effect boundary tests; run the real worker against staging; perform actual process-kill drills before and after SENT; run the source/contract CI checks; and obtain independent review. Do not enable external portal actions until provider-specific authorization, evidence and human-approval gates are enforced.


## Worker runner implementation added — not yet runtime-verified

The PR now adds:

- `apps/api/src/orchestrator/worker-runner.ts`: authenticated-by-server-credential runner over the durable PostgreSQL adapter, explicit handler registry, unknown-handler manual handoff, evidence-required gate, and approval + linked approval-evidence gate before the SENT boundary.
- `apps/api/src/orchestrator/worker-main.ts`: long-running process with bounded polling/batch settings, recovery on each cycle, structured logs, and SIGTERM/SIGINT shutdown.
- `scripts/staging/test-n16-worker-runner-contract.mjs` and root `n16:worker:contract` / `n16:worker:start` commands.
- The only side-effect-capable default test handler is `n16.staging-recovery-probe`; it is registered only when `KINGSMEN_WORKER_ENV=staging` and `KINGSMEN_N16_ENABLE_SYNTHETIC_PROBE=true`. It requires `syntheticOnly=true`, explicit approval and an approval evidence reference already linked to the dispatch. It performs no provider or candidate action. The read-only `evidence.verify` handler is also explicitly registered. All other worker codes are handed off rather than dynamically loaded.
- Test-only delays `KINGSMEN_N16_PRE_SENT_DELAY_MS` and `KINGSMEN_N16_POST_SENT_DELAY_MS` are capped at 60 seconds and only affect the synthetic staging probe. They allow controlled process termination before and after SENT without touching a provider.

### Runtime secret boundary

The runner fails closed unless `KINGSMEN_WORKER_ENABLED=true`, `KINGSMEN_TRUTH_VAULT_MODE=postgres`, and a server-only `KINGSMEN_DATABASE_URL` (or `DATABASE_URL`) are present. The database URL must be stored as a secret in the runtime environment with runtime scope; it must not be a client/public build variable or committed to Git. The currently inspected Netlify project environment contained only public Supabase URL/client keys and did not contain a privileged database URL. No fake value was installed and the worker was not enabled. Supplying the real privileged credential requires creating it in the deployment secret store from Supabase's project connection details; do not paste it into source, logs, or this PR.

### Required real-process kill drill (blocked until secret and runtime are configured)

1. Enable the worker only in isolated staging and insert one synthetic dispatch with a real linked evidence reference, `worker_code='n16.staging-recovery-probe'`, `syntheticOnly=true`, `approvalGranted=true`, and `approvalEvidenceRef` equal to one of its linked evidence references.
2. **Before SENT:** set `KINGSMEN_N16_PRE_SENT_DELAY_MS=20000`, start `npm run n16:worker:start`, verify the dispatch is `LOCKED`, then terminate the actual process during the delay. Wait for lease expiry and restart the worker. Verify the attempt advances, only one worker owns each lease, and no external action occurred.
3. **After SENT:** use a fresh synthetic dispatch, set `KINGSMEN_N16_POST_SENT_DELAY_MS=20000`, start the worker, wait until the durable queue says `SENT`, terminate the actual process, and wait for lease expiry. Restart recovery and verify the dispatch becomes `FAILED` with `EXPIRED_SENT_REQUIRES_RECONCILIATION`, a single handoff/quarantine event exists, and it is never returned to `READY`.
4. Save timestamps, dispatch refs, process exit signal, sanitized logs, queue rows, handoff/event refs, and cleanup counts as the evidence artifact. Delete only the synthetic fixtures after assertions pass. Never use real candidate/provider work for this drill.

The runner implementation has been committed to this PR, but the TypeScript build, contract script, live worker execution, real process-kill drills, and secret-store setup are **not yet verified** in this environment. Do not mark this release gate green until those steps actually run and evidence is attached.
