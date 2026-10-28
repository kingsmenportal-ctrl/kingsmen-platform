-- READ-ONLY AUDIT. Run against the authorized staging database.
-- This inventories live state; it does NOT prove which SQL body was historically executed.
-- Save raw output with timestamp, project ref, operator and immutable RC1 SHA.
BEGIN TRANSACTION READ ONLY;

-- 1) Exact ledger records. If schema/table differs in this project, stop and adapt using
-- the actual Supabase migration ledger; do not silently treat a missing ledger as zero rows.
SELECT version, name
FROM supabase_migrations.schema_migrations
WHERE version IN ('20261019112452', '20261019112511')
ORDER BY version;

-- 2) Relevant relations and RLS flags.
SELECT n.nspname AS schema_name, c.relname AS relation_name,
       c.relkind, c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE (n.nspname, c.relname) IN (
  ('public','candidate_application_tracker'),
  ('public','candidate_application_preparation_items'),
  ('public','candidate_application_preparation_events')
)
ORDER BY 1,2;

-- 3) Columns, types, nullability, defaults, generated/identity flags.
SELECT table_schema, table_name, ordinal_position, column_name, data_type,
       udt_schema, udt_name, is_nullable, column_default,
       is_identity, identity_generation, is_generated, generation_expression
FROM information_schema.columns
WHERE (table_schema, table_name) IN (
  ('public','candidate_application_tracker'),
  ('public','candidate_application_preparation_items'),
  ('public','candidate_application_preparation_events')
)
ORDER BY table_name, ordinal_position;

-- 4) Constraints and definitions (PK, FK, unique, check, exclusion).
SELECT n.nspname AS schema_name, c.relname AS table_name,
       con.conname, con.contype, con.convalidated,
       pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE (n.nspname, c.relname) IN (
  ('public','candidate_application_tracker'),
  ('public','candidate_application_preparation_items'),
  ('public','candidate_application_preparation_events')
)
ORDER BY 1,2,3;

-- 5) Indexes including uniqueness, predicate and expression definitions.
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname='public'
  AND tablename IN ('candidate_application_tracker',
                    'candidate_application_preparation_items',
                    'candidate_application_preparation_events')
ORDER BY tablename, indexname;

-- 6) RLS policies, including command, roles, USING and WITH CHECK.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('candidate_application_tracker',
                    'candidate_application_preparation_items',
                    'candidate_application_preparation_events')
ORDER BY tablename, policyname;

-- 7) Triggers, including enabled state and trigger function identity.
SELECT n.nspname AS schema_name, c.relname AS table_name, t.tgname,
       t.tgenabled, pg_get_triggerdef(t.oid, true) AS definition,
       pn.nspname AS function_schema, p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS identity_arguments
FROM pg_trigger t
JOIN pg_class c ON c.oid=t.tgrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
JOIN pg_proc p ON p.oid=t.tgfoid
JOIN pg_namespace pn ON pn.oid=p.pronamespace
WHERE NOT t.tgisinternal
  AND n.nspname='public'
  AND c.relname IN ('candidate_application_tracker',
                    'candidate_application_preparation_items',
                    'candidate_application_preparation_events')
ORDER BY c.relname, t.tgname;

-- 8) Functions relevant to candidate identity and preparation events.
SELECT pn.nspname AS function_schema, p.proname,
       pg_get_function_identity_arguments(p.oid) AS identity_arguments,
       p.prosecdef AS security_definer, p.proconfig,
       pg_get_function_result(p.oid) AS result_type,
       pg_get_userbyid(p.proowner) AS owner,
       p.proacl
FROM pg_proc p
JOIN pg_namespace pn ON pn.oid=p.pronamespace
WHERE p.proname IN ('current_verified_candidate_id',
                    'record_candidate_application_preparation_event')
ORDER BY pn.nspname, p.proname;

-- 9) Table privileges for anon/authenticated; compare DML and non-DML separately.
SELECT table_schema, table_name, grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema='public'
  AND table_name IN ('candidate_application_tracker',
                     'candidate_application_preparation_items',
                     'candidate_application_preparation_events')
  AND grantee IN ('anon','authenticated')
ORDER BY table_name, grantee, privilege_type;

ROLLBACK;