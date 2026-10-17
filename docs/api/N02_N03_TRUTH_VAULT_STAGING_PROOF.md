# N02–N03 Truth Vault: staging runtime proof and RLS hardening

**Status:** migration applied and catalog-verified; read-only SQL role-context checks completed for `anon`, `authenticated` (without JWT identity), and `service_role`; authenticated JWT isolation, API persistence/restart proof, and rollback proof remain outstanding; production ready: **false**.

## What this batch adds

- A follow-up migration that replaces the original implicit-PUBLIC policies on all 14 Truth Vault tables with policies explicitly scoped to the Supabase `service_role`.
- A source validator for all 14 role-scoped policies.
- A staging-only integration proof that requires an explicit acknowledgement before writing a synthetic candidate/command to the configured staging API and checking the database rows, audit event, read model, and idempotent replay.
- No credentials are committed and no migration is applied automatically. The migration was subsequently applied manually through the Supabase migration operation to `kingsmen-portal-staging` and verified in `pg_policies`; it was not applied to production.

## Important migration finding

The initial `0001_n03_truth_vault.sql` migration created permissive `FOR ALL USING (true)` policies without a `TO` clause. In PostgreSQL, an omitted policy role defaults to `PUBLIC`. The follow-up migration narrows those policies to `service_role`. The approved staging migration operation completed for `kingsmen-portal-staging`. Catalog verification returned all 14 named policies with roles `{service_role}`, command `ALL`, and both predicates `true`; no `PUBLIC` role is present in these 14 policy rows. Read-only SQL role-context checks also verified: `anon` lacks SELECT/INSERT/UPDATE privileges on `public.candidates`; `authenticated` SELECT returned zero rows without a JWT identity and has no INSERT/UPDATE privileges; `service_role` can SELECT and has SELECT/INSERT/UPDATE privileges. These are SQL `SET ROLE` checks, not real Supabase REST/JWT tests, and do not prove cross-candidate isolation.

## Run the source guard

```bash
npm run api:validate:truth-vault:rls-hardening
```

This is a source check, not a database/RLS runtime test.

## Run the staging API/database proof

After a human has confirmed that both URLs target the approved staging environment and the migration has been applied:

```bash
KINGSMEN_TRUTH_VAULT_PROOF_TARGET=staging \
KINGSMEN_TRUTH_VAULT_PROOF_ACK=I_CONFIRM_STAGING_WRITES \
KINGSMEN_API_BASE_URL=https://<approved-staging-api-origin> \
KINGSMEN_DATABASE_URL=<approved-staging-postgres-connection-string> \
KINGSMEN_DATABASE_SSL=true \
npm run api:prove:truth-vault:staging
```

The script refuses to run without the target and acknowledgement variables, checks API health for `postgres_truth_vault` before writing, requires server-side API/workflow bearer credentials, verifies missing-auth rejection, command/idempotency/audit rows and the nested candidate read model, and exercises concurrent duplicate command/workflow submissions plus workflow/evidence/audit/idempotency persistence and the application workbench read model. It does not delete proof rows; retain them as evidence or clean them up through a separately reviewed staging-only procedure. The script has not yet run against staging.

## Remaining gates

- After a successful persistence proof, restart the staging API through its actual hosting provider, then run `npm run api:prove:truth-vault:restart` to prove persistence across process restart.
- Complete real Supabase REST/JWT tests: authenticated user with no candidate binding, own-candidate access, and cross-candidate denial. SQL `SET ROLE` checks are recorded but do not prove user JWT ownership boundaries.
- Run the expanded staging proof for workflow-result persistence, command/workflow concurrent duplicate races and audit integrity; separately run a controlled late-failure rollback test and process restart/re-read.
- API review found command, workflow-result, Jarvis runtime-control, and read-model routes had no request authentication. This branch now requires a server-side bearer token for business routes (`KINGSMEN_API_SERVICE_TOKEN`) and a separate token for workflow results (`KINGSMEN_WORKFLOW_SERVICE_TOKEN`); keep both server-only and do not put them in browser code. Candidate-specific user auth/ownership is not implemented by these service tokens, so these endpoints remain backend-service-only.
- Keep N05 upload/read/status routes and private bucket/security gates unchanged; this batch does not bypass them.
- Production readiness remains false until runtime evidence and founder review are recorded.
