# N02–N03 Truth Vault: staging runtime proof and RLS hardening

**Status:** source changes only; staging proof not run; production ready: **false**.

## What this batch adds

- A follow-up migration that replaces the original implicit-PUBLIC policies on all 14 Truth Vault tables with policies explicitly scoped to the Supabase `service_role`.
- A source validator for all 14 role-scoped policies.
- A staging-only integration proof that requires an explicit acknowledgement before writing a synthetic candidate/command to the configured staging API and checking the database rows, audit event, read model, and idempotent replay.
- No credentials are committed and no migration is applied automatically.

## Important migration finding

The initial `0001_n03_truth_vault.sql` migration created permissive `FOR ALL USING (true)` policies without a `TO` clause. In PostgreSQL, an omitted policy role defaults to `PUBLIC`. The follow-up migration narrows those policies to `service_role`. Review the target Supabase role model and apply it through the approved staging migration process; do not run this against production as a shortcut.

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

The script refuses to run without the target and acknowledgement variables, checks API health for `postgres_truth_vault` before writing, uses a unique synthetic candidate reference, and verifies the command/idempotency/audit rows, read model, and duplicate replay. It does not delete proof rows; retain them as evidence or clean them up through a separately reviewed staging-only procedure.

## Remaining gates

- This script does not restart the deployed process, so it does not by itself prove survival across a process restart.
- Test direct access as `anon` and `authenticated` is denied and approved server-side role access succeeds after the migration.
- Exercise workflow-result persistence, command/workflow concurrent duplicate races, partial-write rollback, candidate isolation, and audit integrity.
- Review the backend API authentication boundary before exposing command and workflow endpoints publicly.
- Keep N05 upload/read/status routes and private bucket/security gates unchanged; this batch does not bypass them.
- Production readiness remains false until runtime evidence and founder review are recorded.
