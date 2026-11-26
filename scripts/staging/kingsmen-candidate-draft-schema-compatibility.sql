-- Kingsmen candidate-draft schema compatibility evidence capture.
-- READ-ONLY: run only after confirming the Supabase project ref in the dashboard.
-- Does not read candidate rows, function bodies, secrets, or raw migration SQL.
-- Does not apply migrations, alter schema, or change grants, RLS, Auth or release gates.
WITH expected_objects(object_name, object_kind) AS (
  VALUES
    ('public.candidate_applications', 'table'),
    ('public.candidate_application_events', 'table'),
    ('public.candidate_application_draft_answers', 'table'),
    ('public.get_candidate_application_draft(uuid)', 'function'),
    ('public.save_candidate_application_draft(uuid,jsonb,integer,text)', 'function'),
    ('kingsmen_security.current_verified_kingsmen_candidate_id()', 'function')
),
object_status AS (
  SELECT object_name, object_kind,
    CASE object_kind
      WHEN 'table' THEN to_regclass(object_name) IS NOT NULL
      WHEN 'function' THEN to_regprocedure(object_name) IS NOT NULL
      ELSE false
    END AS present
  FROM expected_objects
),
table_details AS (
  SELECT n.nspname AS schema_name, c.relname AS table_name,
         c.relkind, c.relrowsecurity AS rls_enabled,
         c.relforcerowsecurity AS rls_forced,
         COALESCE((
           SELECT jsonb_agg(jsonb_build_object(
             'name', a.attname,
             'type', format_type(a.atttypid, a.atttypmod),
             'notNull', a.attnotnull,
             'defaultPresent', a.atthasdef
           ) ORDER BY a.attnum)
           FROM pg_attribute a
           WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
         ), '[]'::jsonb) AS columns,
         COALESCE((
           SELECT jsonb_agg(jsonb_build_object(
             'name', con.conname,
             'type', con.contype,
             'definition', pg_get_constraintdef(con.oid)
           ) ORDER BY con.conname)
           FROM pg_constraint con WHERE con.conrelid = c.oid
         ), '[]'::jsonb) AS constraints,
         COALESCE((
           SELECT jsonb_agg(jsonb_build_object(
             'name', p.polname, 'command', p.polcmd,
             'permissive', p.polpermissive,
             'roles', (SELECT jsonb_agg(r.rolname ORDER BY r.rolname)
                       FROM pg_roles r WHERE r.oid = ANY(p.polroles)),
             'usingExpressionPresent', p.polqual IS NOT NULL,
             'checkExpressionPresent', p.polwithcheck IS NOT NULL
           ) ORDER BY p.polname)
           FROM pg_policy p WHERE p.polrelid = c.oid
         ), '[]'::jsonb) AS policies
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE (n.nspname, c.relname) IN (
    ('public','candidate_applications'),
    ('public','candidate_application_events'),
    ('public','candidate_application_draft_answers')
  )
),
function_details AS (
  SELECT n.nspname AS schema_name, p.proname AS function_name,
         pg_get_function_identity_arguments(p.oid) AS identity_arguments,
         pg_get_function_result(p.oid) AS result_type,
         p.prosecdef AS security_definer,
         p.provolatile AS volatility,
         p.proconfig IS NOT NULL AS has_function_settings,
         has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
         has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_can_execute
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE (n.nspname = 'public' AND p.proname IN (
           'get_candidate_application_draft', 'save_candidate_application_draft'))
     OR (n.nspname = 'kingsmen_security'
         AND p.proname = 'current_verified_kingsmen_candidate_id')
),
ledger_summary AS (
  SELECT count(*)::integer AS ledger_record_count,
         count(*) FILTER (WHERE cardinality(statements) = 1)::integer AS single_statement_records,
         count(*) FILTER (WHERE cardinality(statements) <> 1 OR statements IS NULL)::integer AS unusual_statement_cardinality,
         count(*) FILTER (WHERE name ILIKE '%0096%' OR version LIKE '%0096%'
                           OR name ILIKE '%0097%' OR version LIKE '%0097%'
                           OR name ILIKE '%0098%' OR version LIKE '%0098%'
                           OR name ILIKE '%0107%' OR version LIKE '%0107%'
                           OR name ILIKE '%0108%' OR version LIKE '%0108%'
                           OR name ILIKE '%0109%' OR version LIKE '%0109%'
                           OR name ILIKE '%0110%' OR version LIKE '%0110%')::integer AS target_name_or_version_matches
  FROM supabase_migrations.schema_migrations
)
SELECT jsonb_build_object(
  'schema', 'kingsmen.candidate-draft-schema-compatibility.v1',
  'capturedAt', statement_timestamp(),
  'expectedProjectRef', 'euhubhhnumtibbyufghm',
  'projectRefMustBeConfirmedInSupabaseDashboard', true,
  'safety', jsonb_build_object(
    'readOnly', true, 'candidateRowsRead', false, 'rawFunctionBodiesRead', false,
    'rawMigrationSqlReturned', false, 'writesPerformed', false,
    'migrationsApplied', false, 'authOrRlsChanged', false,
    'migrationReplayAuthorized', false, 'releaseGateOpened', false
  ),
  'ledger', (SELECT to_jsonb(ledger_summary) FROM ledger_summary),
  'requiredObjects', (SELECT jsonb_agg(to_jsonb(object_status) ORDER BY object_kind, object_name) FROM object_status),
  'tables', (SELECT COALESCE(jsonb_agg(to_jsonb(table_details) ORDER BY schema_name, table_name), '[]'::jsonb) FROM table_details),
  'functions', (SELECT COALESCE(jsonb_agg(to_jsonb(function_details) ORDER BY schema_name, function_name, identity_arguments), '[]'::jsonb) FROM function_details),
  'compatibilityDecision', jsonb_build_object(
    'ready', false,
    'reason', 'This capture reports live shape and privilege metadata only. Compare against reviewed migration source and intended API contract; it is not approval to replay or apply migrations.'
  )
) AS kingsmen_candidate_draft_schema_compatibility;
