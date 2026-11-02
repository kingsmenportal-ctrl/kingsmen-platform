-- READ-ONLY Kingsmen schema consolidation inventory.
-- Run against staging with an authorized database role. This script does not mutate data.
-- Capture outputs with timestamp, project ref, commit SHA and role. Never attach candidate PII.
BEGIN TRANSACTION READ ONLY;

-- 1. Public tables, RLS flags, estimates and relationship/policy counts.
SELECT n.nspname AS schema_name, c.relname AS table_name, c.relkind,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
       COALESCE(s.n_live_tup, 0) AS estimated_live_rows,
       (SELECT count(*) FROM pg_policies p
         WHERE p.schemaname = n.nspname AND p.tablename = c.relname) AS policy_count,
       (SELECT count(*) FROM pg_constraint fk
         WHERE fk.contype = 'f' AND fk.conrelid = c.oid) AS outgoing_fk_count,
       (SELECT count(*) FROM pg_constraint fk
         WHERE fk.contype = 'f' AND fk.confrelid = c.oid) AS incoming_fk_count,
       (SELECT count(*) FROM pg_indexes i
         WHERE i.schemaname = n.nspname AND i.tablename = c.relname) AS index_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','f')
ORDER BY n.nspname, c.relname;

-- 2. Exact foreign-key dependency edges (table consolidation blockers).
SELECT con.conname AS constraint_name,
       src_ns.nspname AS source_schema, src.relname AS source_table,
       dst_ns.nspname AS target_schema, dst.relname AS target_table,
       pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con
JOIN pg_class src ON src.oid = con.conrelid
JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
JOIN pg_class dst ON dst.oid = con.confrelid
JOIN pg_namespace dst_ns ON dst_ns.oid = dst.relnamespace
WHERE con.contype = 'f' AND (src_ns.nspname = 'public' OR dst_ns.nspname = 'public')
ORDER BY source_schema, source_table, constraint_name;

-- 3. RLS policies and expressions; review for candidate ownership and role scope.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Views/materialized views and their source definitions.
SELECT schemaname, viewname, definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
SELECT schemaname, matviewname, definition
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;

-- 5. Functions and procedures, including security-definer and search-path posture.
SELECT n.nspname AS schema_name, p.proname AS routine_name,
       pg_get_function_identity_arguments(p.oid) AS identity_arguments,
       p.prokind, p.prosecdef AS security_definer,
       p.provolatile, p.proconfig AS routine_settings,
       pg_get_userbyid(p.proowner) AS owner,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public','app_private')
ORDER BY n.nspname, p.proname, identity_arguments;

-- 6. Triggers, including trigger functions and enabled mode.
SELECT trigger_schema, event_object_table AS table_name, trigger_name,
       action_timing, event_manipulation, action_orientation,
       action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name, event_manipulation;

-- 7. Effective table privileges for common API roles; compare with intended policy.
SELECT table_schema, table_name, grantee, privilege_type, is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee IN ('PUBLIC','anon','authenticated','service_role','postgres','supabase_admin')
ORDER BY table_name, grantee, privilege_type;

-- 8. Default privileges (important: RLS alone is not an ACL audit).
SELECT defaclrole::regrole AS grantor,
       defaclnamespace::regnamespace AS schema_name,
       defaclobjtype AS object_type,
       defaclacl
FROM pg_default_acl
ORDER BY grantor::text, schema_name::text, object_type;

-- 9. Storage bucket privacy and file constraints; never select object names or owner PII.
SELECT id AS bucket_id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- 10. Known overlap clusters for targeted code/SQL reference search.
SELECT 'route_vs_opportunity' AS overlap_family, table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND (table_name LIKE 'route_%' OR table_name LIKE 'opportunity_%')
UNION ALL
SELECT 'application_models', table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND
 (table_name = 'applications' OR table_name LIKE 'candidate_application%' OR table_name LIKE 'candidate_master_application%' OR table_name LIKE 'candidate_route_application%')
UNION ALL
SELECT 'catalogue_models', table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('service_packages','finance_plan_catalog','public_website_package_cards')
UNION ALL
SELECT 'orchestration_models', table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND (table_name LIKE 'orchestrator_%' OR table_name LIKE 'workflow_%' OR table_name LIKE 'integration_%' OR table_name LIKE 'control_plane_%' OR table_name LIKE 'founder_%')
ORDER BY overlap_family, table_name;

ROLLBACK;
