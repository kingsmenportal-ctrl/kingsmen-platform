-- Fail-closed post-application assertion for PR #206 migration 0097.
-- Does not mutate data. Run using psql -X -v ON_ERROR_STOP=1.
DO $$
DECLARE
  t record;
  role_name text;
  privilege_name text;
  relation_count integer;
BEGIN
  SELECT count(*) INTO relation_count FROM pg_tables WHERE schemaname='public';
  IF relation_count = 0 THEN
    RAISE EXCEPTION 'No public tables found; assertion cannot pass vacuously';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon')
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    RAISE EXCEPTION 'Required client roles missing; assertion cannot pass';
  END IF;

  FOR t IN SELECT schemaname, tablename FROM pg_tables WHERE schemaname='public' LOOP
    FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
      FOREACH privilege_name IN ARRAY ARRAY['TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'] LOOP
        IF has_table_privilege(role_name, format('%I.%I',t.schemaname,t.tablename), privilege_name) THEN
          RAISE EXCEPTION 'Client role % retains % on %.%',role_name,privilege_name,t.schemaname,t.tablename;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  -- These direct PUBLIC ACLs are inherited by client roles; require none remain.
  IF EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname=t.tablename
    JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname=t.schemaname
    CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
    WHERE t.schemaname='public'
      AND a.grantee=0
      AND a.privilege_type IN ('TRUNCATE','REFERENCES','TRIGGER','MAINTAIN')
  ) THEN
    RAISE EXCEPTION 'PUBLIC retains direct non-DML privileges on current public tables';
  END IF;

  -- Check default ACLs for both known DDL creator roles and inherited PUBLIC grants.
  IF EXISTS (
    SELECT 1 FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) a
    LEFT JOIN pg_roles grantee ON grantee.oid=a.grantee
    WHERE d.defaclnamespace='public'::regnamespace
      AND d.defaclobjtype='r'
      AND (a.grantee=0 OR grantee.rolname IN ('anon','authenticated'))
      AND a.privilege_type IN ('TRUNCATE','REFERENCES','TRIGGER','MAINTAIN')
  ) THEN
    RAISE EXCEPTION 'PUBLIC/anon/authenticated retains public table default non-DML privileges';
  END IF;
END $$;
