# PR #206 — Migration 0097 Security Package

Date: 2026-10-28  
Status: **technically examined; independent approval absent; do not merge/apply yet.**

## Candidate and scope

Candidate file: `db/migrations/0097_revoke_client_non_dml_privileges.sql`  
PR: https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/206  
Head at the last connected check: `9079794bc02990a7888ab14508b26c31d2aae1a9`. Re-fetch the latest head before independent review; any push changes the review target.

The SQL transaction revokes only `TRUNCATE`, `REFERENCES`, `TRIGGER` and `MAINTAIN` from `PUBLIC`, `anon` and `authenticated` for public tables listed by `pg_tables`, then adjusts public table default ACLs for creator roles `postgres` and `supabase_admin`, also revoking from `PUBLIC`. It intentionally guards inherited grants as well as direct grants. It intends to preserve `SELECT/INSERT/UPDATE/DELETE` grants and existing RLS semantics.

This is a technical scope review, **not** the required independent reviewer approval.

## Live pre-change evidence

Read-only query on staging project `euhubhhnumtibbyufghm`, PostgreSQL `17.11.0.003`, over the same `pg_tables` population the migration loops over:

| Role | Public table relations | TRUNCATE | REFERENCES | TRIGGER | MAINTAIN |
|---|---:|---:|---:|---:|---:|
| `anon` | 230 | 171 | 171 | 171 | 172 |
| `authenticated` | 230 | 181 | 181 | 181 | 182 |

Read-only default-ACL inspection independently found all four non-DML privilege types granted to both client roles in public table defaults for both `postgres` and `supabase_admin`. Direct `PUBLIC` ACL counts for these four privileges were zero on current public relations and zero in public table defaults; the migration now explicitly revokes from `PUBLIC` as a future-proof guard. This is a misconfiguration, not evidence of exploitation.

## Dry-run: no DDL against staging

1. Confirm the exact PR head, current diff, author-independent approval, fresh exact-head CI and backup/restore approval.
2. Confirm project ref is staging, not production.
3. Capture pre-migration table privileges and default ACLs as sanitized, sorted outputs. Store in restricted local/offsite evidence, not Git.
4. Do not attempt to “dry-run” the migration by executing it in staging. The safe SQL rehearsal is a disposable restored target.
5. Verify the migration text/blob SHA from the approved PR and that the migration ledger does not already contain this migration.

Pre-check command (secure environment variable, no URL in history or output):

```powershell
$env:KINGSMEN_DATABASE_URL = '<inject securely; never commit>'
psql "$env:KINGSMEN_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f release-evidence/0097-privilege-audit.sql > .local/0097-pre-audit.txt
if ($LASTEXITCODE -ne 0) { throw 'Read-only pre-audit failed; stop.' }
```

Save the pre-change privilege baseline with this SELECT, canonical-sort its output, then compare post-change output with it:

```sql
SELECT t.schemaname, t.tablename, r.rolname AS grantee,
       p.privilege_type, p.is_grantable
FROM pg_tables t
CROSS JOIN (VALUES ('anon'), ('authenticated')) AS r(rolname)
CROSS JOIN LATERAL (
  SELECT unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) AS privilege_type
) p
WHERE t.schemaname='public'
  AND has_table_privilege(r.rolname, format('%I.%I',t.schemaname,t.tablename), p.privilege_type)
ORDER BY t.schemaname,t.tablename,r.rolname,p.privilege_type;
```

Capture default ACL output too. Do not store credentials or candidate data in the audit files.

## Approved application steps

Only after independent approval and restore evidence:
1. Verify fresh required CI on the exact current head SHA.
2. Confirm isolated restore evidence and founder/operator sign-off.
3. Apply only the reviewed migration through the approved Supabase migration process in staging.
4. Confirm expected migration ledger row and no partial/duplicate application.
5. Run post-assertions below and all candidate/reviewer, document, finance and RLS regressions.
6. Compare normalized pre/post grants. Expected change is removal of these four non-DML privileges only; DML rows must remain unchanged.
7. Record UTC timestamp, project ref, operator, exact migration/blob SHA, integrated commit SHA, sanitized logs and outcomes.

## Exact post-application assertions

Authoritative checked-in assertion: `scripts/security/test-client-non-dml-privileges.sql`. It raises an error if any public table retains one of the four non-DML privileges for either client role, or a public default table ACL retains such a grant.

```powershell
psql "$env:KINGSMEN_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f scripts/security/test-client-non-dml-privileges.sql
if ($LASTEXITCODE -ne 0) { throw '0097 assertion failed; block release.' }
```

Independent catalog assertion:

```sql
DO $$
DECLARE
  t record;
  role_name text;
  privilege_name text;
  relation_count integer;
BEGIN
  SELECT count(*) INTO relation_count FROM pg_tables WHERE schemaname='public';
  IF relation_count = 0 THEN RAISE EXCEPTION 'No public tables found; assertion cannot pass vacuously'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon')
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    RAISE EXCEPTION 'Required client roles missing; assertion cannot pass';
  END IF;
  FOR t IN SELECT schemaname, tablename FROM pg_tables WHERE schemaname='public' LOOP
    FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
      FOREACH privilege_name IN ARRAY ARRAY['TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'] LOOP
        IF has_table_privilege(role_name,format('%I.%I',t.schemaname,t.tablename),privilege_name) THEN
          RAISE EXCEPTION 'Client role % retains % on %.%',role_name,privilege_name,t.schemaname,t.tablename;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  IF EXISTS (
    SELECT 1 FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) x
    JOIN pg_roles grantee ON grantee.oid=x.grantee
    WHERE d.defaclnamespace='public'::regnamespace
      AND d.defaclobjtype='r'
      AND grantee.rolname IN ('anon','authenticated')
      AND x.privilege_type IN ('TRUNCATE','REFERENCES','TRIGGER','MAINTAIN')
  ) THEN RAISE EXCEPTION 'Public table default ACL grants client non-DML privileges'; END IF;
END $$;
```

The catalog assertion alone does not prove the DML baseline was preserved. Compare the saved normalized pre/post SELECT/INSERT/UPDATE/DELETE rows; they must be identical after sorting.

## Rollback / recovery

- **Before commit / SQL failure:** transaction must abort; verify migration ledger and rerun read-only baseline. Stop release.
- **After committed application:** do not run blanket `GRANT ... ON ALL TABLES` rollback. Baseline is heterogeneous: only some tables had non-DML grants. Restore only from exact captured pre-change per-table and per-creator default-ACL snapshots, using a separately reviewed corrective migration.
- Because original table grants vary, a generic inverse migration cannot safely be prepared from counts alone. Restore only grants actually present in the pre-snapshot and documented as intentionally required. Prefer forward correction rather than reintroducing broad grants.
- Save before/after ACL outputs and rerun regression tests after any corrective migration.

## Remaining merge/application blockers

1. No independent approval for the exact latest PR #206 diff; the only submitted review at last inspection was a COMMENTED author review.
2. No demonstrated backup/restore drill; Supabase branch inventory showed only `main` with `with_data=false`.
3. Fresh exact-head checks must be confirmed after latest changes.
4. No post-application evidence exists because 0097 remains unapplied.
5. DML grant comparison and regression suites remain to be run after approved application.

No merge or staging application is authorized by this package.
