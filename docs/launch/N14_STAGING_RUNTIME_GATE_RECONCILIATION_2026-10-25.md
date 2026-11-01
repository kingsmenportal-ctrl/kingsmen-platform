# N14 connector security and staging evidence reconciliation — 2026-10-25

## Observed directly in Supabase staging

Project: `euhubhhnumtibbyufghm`. Inspection was read-only.

- `integration_connectors`, `workflow_connector_registry`, `integration_outbox`, `integration_inbox`, `workflow_result_events`, `webhook_security_events`, `n8n_workflow_dispatches`, `integration_dead_letter_queue`, and `airtable_mirror_events`: **0 rows each**.
- Candidate identity-link and reviewer/document-review tables: **0 rows**.
- No registered connector or workflow is configured in the N14 registry; Airtable Kingsmen mirror remains `NOT_CONFIGURED`.
- The N14 tables have RLS policies restricted to `service_role`, but inspection also found table-level grants to `anon` and `authenticated`. The accompanying migration proposes revoking those excess grants. It has **not** been applied to staging by this change.
- The three candidate identity/review tables have grants only to `service_role` in the inspected role grant list.
- Deployed Edge Functions observed: candidate identity review request v3, candidate workspace readiness v4, candidate profile review v2, candidate application preparation v14, candidate private documents v13, N15 source ingestion v2, N15 candidate opportunities v2, N07 Airtable enqueue v2, and N08 founder health v3. The N08 PR's proposed persisted-health change is not proven deployed by this evidence.

## Verification status

- GitHub PR #164 N14 boundary tests were authored but explicitly not executed in the PR environment.
- `reports/validation/n14-connector-contract-latest.json` on the default branch remains `not_run`, 0/0 checks.
- No connector lifecycle was executed: staging has no target/outbox rows, and no authenticated staging worker/webhook invocation was performed. Therefore retry, DLQ transition, and recovery are **NOT VERIFIED**.
- No candidate A/B authenticated journey was run. SQL executed with administrative credentials cannot establish candidate RLS isolation; this requires two real authenticated candidate sessions.
- Webhook rejection, duplicate webhook idempotency, and authorized workflow-result handling are **NOT VERIFIED at runtime**.
- This report does not treat CI/source guard passes as runtime proof. No provider was enabled, no candidate data was inserted, and no provider transaction was created.

## Required release gates before N15 can be treated as cleared

1. Review and apply the least-privilege migration; verify role grants and RLS using actual anon/authenticated sessions.
2. Deploy/review the N14 boundary runner and execute against an isolated staging connector target with synthetic references: transient failures through retry exhaustion to DLQ, then authorized recovery and audit evidence.
3. Invoke webhook endpoint with missing/invalid signature and duplicate idempotency key; prove rejected request and single persisted accepted event.
4. Submit unauthorized and authorized workflow-result requests; prove invalid state transitions cannot mutate business state.
5. Run two-candidate isolation checks through real JWT-authenticated requests across profile, application, document and review endpoints.
6. Reconcile generated runtime evidence into the release inventory; only then update N13/N08/N14 release gates.


## Read-only staging recheck — 1 November 2026

A fresh read-only SQL inspection confirmed all 11 backend-only N14 operational tables exist and have RLS enabled. Their policies target `service_role` only:
- `integration_connectors`
- `workflow_connector_registry`
- `integration_outbox`
- `integration_inbox`
- `workflow_result_events`
- `webhook_security_events`
- `n8n_workflow_dispatches`
- `airtable_mirror_events`
- `playwright_probe_events`
- `integration_dead_letter_queue`
- `integration_health_snapshots`

The same inspection found table-level grants to `anon` and `authenticated` remain on these tables; `service_role` grants are also present. This demonstrates why the migration still needs approved application and post-apply role-privilege verification. The `0087_n14_connector_table_grant_hardening.sql` migration has **not** been applied by this workstream.

All 11 tables currently contain zero rows. No connector, webhook delivery, workflow result, outbox retry/dead-letter cycle, or provider transaction is evidenced. Providers remain `NOT_CONFIGURED`.

### Migration contract gate

Added `scripts/validators/validate-n14-connector-table-grant-migration.mjs`, wired into the root `npm test` chain. It enforces the explicit list of 11 tables, transactional DDL, revocation from `anon`, `authenticated`, and `PUBLIC`, no new grants, and no destructive `DROP` statements.

The N14 migration and runtime remain on HOLD pending complete exact-head CI, independent review, an approved migration application with post-apply ACL assertions, and isolated synthetic connector/webhook lifecycle tests. This addendum records observations only; it performs no database writes.
