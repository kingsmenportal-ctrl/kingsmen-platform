# Candidate Draft Restore Rehearsal and Runtime Security Gate

**State:** prepared, not executed  
**Target:** isolated disposable restore environment only  
**Live staging writes:** prohibited  
**Migration replay:** unauthorized until provenance, compatibility, security review, and change-control approval pass

## Purpose

Prove that the candidate application draft journey survives a backup/restore and that runtime authorization enforces candidate ownership. This runbook is an execution gate, not evidence that the rehearsal has passed.

## Hard stop conditions

Stop and record `BLOCKED` if any of the following is true:

- Backup source, timestamp, checksum, or database/project identity cannot be independently verified.
- Restore target is not isolated from staging/production or contains live credentials/egress.
- Restore would overwrite or connect to a live database.
- Applied migration bodies cannot be reconciled with tracked source and deployment evidence.
- Schema compatibility diff has unresolved columns, constraints, indexes, triggers, grants, functions, policies, or event-enum differences.
- Two non-production candidate identities and their separate access tokens cannot be provisioned through the approved test fixture process.
- Any test would need to disable RLS, bypass the application API, use a service-role token as a candidate, or mutate staging.

## Phase A — isolated restore rehearsal

1. Record operator, UTC start time, backup identifier, source project reference, backup timestamp, backup checksum, restore target identifier, and isolation controls. Do not include secrets or raw candidate PII in evidence.
2. Verify the target is disposable and isolated; confirm network egress and credential scope cannot reach staging or production.
3. Restore the selected backup to the isolated target using the approved database-provider procedure. Do not replay application migrations as part of restore.
4. Capture restore result, duration, database version/extensions, and object counts. Preserve provider logs with secrets redacted.
5. Run the read-only schema inventory and compare the restored schema to the backup/source manifest: tables/columns/types/nullability/defaults, constraints, indexes, triggers, functions/signatures, grants, RLS enabled/forced state, policies, and migration ledger.
   - Capture the inventory with `scripts/staging/kingsmen-restored-schema-inventory.sql` on both the restored target and the tracked-source reference. Keep the raw JSON artifacts outside the repository if function definitions or grants contain sensitive details; commit only redacted diffs.
6. Reconcile each migration ledger entry against the exact tracked SQL body hash and deployment provenance. A filename match is not proof of body identity. Unknown or mismatched bodies remain unresolved; do not replay them.
7. Execute the runtime security tests in Phase B against the restored isolated environment.
8. Record pass/fail for each assertion, attach redacted query/test output, and record the restored target's disposal/retention outcome.

**Pass criteria:** restore completes; schema diff is explained; all migration-ledger entries are reconciled or explicitly proven irrelevant to the tested path; all Phase B assertions pass; no live environment was modified. Any unexplained diff or missing evidence is a fail.

## Phase B — runtime security and journey tests

Use two distinct, verified, non-production candidate identities (A and B), separate candidate-scoped tokens, and isolated fixture applications. Never infer authorization from a client-supplied candidate/application ID.

1. **Create draft:** Candidate A creates a draft through the public application API; assert success, server-derived ownership, and expected initial version/status.
2. **Save and retry:** A saves valid answers with an idempotency key. Replay the exact request/key; assert no duplicate answer write/event and stable response semantics. Reuse the key with a different payload; assert a conflict/rejection.
3. **Reload persisted answers:** fetch through the read API after save; assert values and version match the committed save, with no dependence on browser memory.
4. **Resume in a new session:** discard client state, establish a fresh authenticated session for A, and reload the same draft; assert persisted answers and version are restored.
5. **Required fields and invalid input:** test missing required fields, malformed JSON, invalid enum/format, oversized payload, stale version, and unsupported fields. Assert validation errors are safe, deterministic, and no invalid state is persisted.
6. **Submission readiness:** submit incomplete draft and assert rejection with no status transition or submission event. Submit only after required fields and evidence/readiness rules pass; assert one valid transition and no duplicate submission on retry.
7. **Status and immutable event history:** read status and event history via the authorized API. Assert event sequence, actor, transition, and idempotency behavior. Attempt candidate-role update/delete of an existing event; assert denied. Do not test immutability using a privileged service role as the candidate actor.
8. **Cross-candidate read isolation:** as B, attempt to read A's draft by direct ID through every relevant API path; assert no answer leakage (consistent 404/403 contract).
9. **Cross-candidate write isolation:** as B, attempt update, save, submit, and version manipulation against A's draft ID; assert denied and verify A's persisted answers/status/event history are unchanged.
10. **No-auth and expired-session behavior:** assert requests without valid authentication are rejected before body processing where specified, and expired/revoked tokens cannot read or mutate.
11. **Audit evidence:** capture request IDs, status codes, assertions, and before/after counts; redact tokens, answers, and personal data.

## Required evidence bundle

- Restore metadata and redacted provider result.
- Schema compatibility diff and migration-body provenance reconciliation.
- Test run ID, code commit, isolated target identifier, and fixture IDs (non-PII).
- Assertion-by-assertion results for all 11 runtime checks.
- Before/after status, answer version, and event counts for isolation/immutability tests.
- Explicit statement: `stagingWritesPerformed=false`, `productionWritesPerformed=false`, `migrationReplayAuthorized=false`.
- Reviewer sign-off and change-control decision.

## Decision record

Until the evidence bundle passes review, report:

- `restoreRehearsalPassed=false`
- `runtimeSecurityPassed=false`
- `candidateDraftRuntimeReady=false`
- `migrationReplayAuthorized=false`

A passing disposable test is necessary but not sufficient to authorize a staging migration. Reconcile schema, approve the exact migration bodies and rollback plan, then obtain explicit change-control authorization before any staging write.
