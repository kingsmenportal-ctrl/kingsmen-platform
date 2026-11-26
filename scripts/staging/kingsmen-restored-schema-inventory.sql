-- Kingsmen restored-schema inventory for compatibility reconciliation.
-- SELECT-only. Run against the verified disposable restore target and tracked-source
-- reference database separately; compare the resulting JSON inventories.
-- Never use this as a reason to replay migration SQL.
WITH
columns_inventory AS (
  SELECT jsonb_agg(jsonb_build_object(
    'schema', c.table_schema, 'table', c.table_name, 'ordinal', c.ordinal_position,
    'column', c.column_name, 'type', c.data_type, 'udt', c.udt_name,
    'nullable', c.is_nullable, 'default', c.column_default,
    'generated', c.is_generated, 'identity', c.is_identity,
    'identityGeneration', c.identity_generation
  ) ORDER BY c.table_schema, c.table_name, c.ordinal_position) AS items
  FROM information_schema.columns c
  WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema')
    AND c.table_schema NOT LIKE 'pg_toast%'
),
constraints_inventory AS (
  SELECT jsonb_agg(jsonb_build_object(
    'schema', n.nspname, 'table', t.relname, 'name', con.conname,
    'type', con.contype, 'definition', pg_get_constraintdef(con.oid, true),
    'validated', con.convalidated, 'deferrable', con.condeferrable,
    'initiallyDeferred', con.condeferred
  ) ORDER BY n.nspname, t.relname, con.conname) AS items
  FROM pg_constraint con
  JOIN pg_class t ON t.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname NOT LIKE 'pg_toast%'
),
indexes_inventory AS (
  SELECT jsonb_agg(jsonb_build_object(
    'schema', schemaname, 'table', tablename, 'name', indexname, 'definition', indexdef
  ) ORDER BY schemaname, tablename, indexname) AS items
  FROM pg_indexes
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    AND schemaname NOT LIKE 'pg_toast%'
),
triggers_inventory AS (
  SELECT jsonb_agg(jsonb_build_object(
    'schema', n.nspname, 'table', c.relname, 'name', t.tgname,
    'enabledState', t.tgenabled, 'definition', pg_get_triggerdef(t.oid, true),
    'function', pn.nspname || '.' || p.proname
  ) ORDER BY n.nspname, c.relname, t.tgname) AS items
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_proc p ON p.oid = t.tgfoid
  JOIN pg_namespace pn ON pn.oid = p.pronamespace
  WHERE NOT t.tgisinternal
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
),
functions_inventory AS (
  SELECT jsonb_agg(jsonb_build_object(
    'schema', n.nspname, 'name', p.proname,
    'identityArguments', pg_get_function_identity_arguments(p.oid),
    'result', pg_get_function_result(p.oid), 'kind', p.prokind,
    'language', l.lanname, 'securityDefiner', p.prosecdef,
    'volatility', p.provolatile, 'strict', p.proisstrict,
    'owner', pg_get_userbyid(p.proowner),
    'definition', pg_get_functiondef(p.oid)
  ) ORDER BY n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) AS items
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l ON l.oid = p.prolang
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname NOT LIKE 'pg_toast%'
    AND p.prokind IN ('f', 'p')
),
rls_inventory AS (
  SELECT jsonb_agg(jsonb_build_object(
    'schema', n.nspname, 'table', c.relname,
    'rlsEnabled', c.relrowsecurity, 'rlsForced', c.relforcerowsecurity
  ) ORDER BY n.nspname, c.relname) AS items
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname NOT LIKE 'pg_toast%'
),
policies_inventory AS (
  SELECT jsonb_agg(jsonb_build_object(
    'schema', schemaname, 'table', tablename, 'name', policyname,
    'permissive', permissive, 'roles', roles, 'command', cmd,
    'using', qual, 'withCheck', with_check
  ) ORDER BY schemaname, tablename, policyname) AS items
  FROM pg_policies
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
),
table_grants_inventory AS (
  SELECT jsonb_agg(jsonb_build_object(
    'grantee', grantee, 'schema', table_schema, 'table', table_name,
    'privilege', privilege_type, 'grantable', is_grantable
  ) ORDER BY table_schema, table_name, grantee, privilege_type) AS items
  FROM information_schema.role_table_grants
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
),
function_grants_inventory AS (
  SELECT jsonb_agg(jsonb_build_object(
    'schema', n.nspname, 'function', p.proname,
    'identityArguments', pg_get_function_identity_arguments(p.oid),
    'grantee', COALESCE(grantee.rolname, 'PUBLIC'),
    'privilege', acl.privilege_type, 'grantable', acl.is_grantable
  ) ORDER BY n.nspname, p.proname, grantee.rolname, acl.privilege_type) AS items
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) acl
  LEFT JOIN pg_roles grantee ON grantee.oid = acl.grantee
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname NOT LIKE 'pg_toast%'
    AND p.prokind IN ('f', 'p')
),
extensions_inventory AS (
  SELECT jsonb_agg(jsonb_build_object(
    'name', e.extname, 'version', e.extversion, 'schema', n.nspname
  ) ORDER BY e.extname) AS items
  FROM pg_extension e
  JOIN pg_namespace n ON n.oid = e.extnamespace
),
migration_ledger_inventory AS (
  SELECT CASE WHEN to_regclass('supabase_migrations.schema_migrations') IS NULL
    THEN jsonb_build_object('available', false, 'entries', '[]'::jsonb)
    ELSE jsonb_build_object(
      'available', true,
      'entries', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object('version', ledger_rows.version, 'name', ledger_rows.name)
          ORDER BY ledger_rows.version
        )
        FROM XMLTABLE(
          '/table/row'
          PASSING query_to_xml(
            'SELECT version::text AS version, name::text AS name FROM supabase_migrations.schema_migrations ORDER BY version',
            true, false, ''
          )
          COLUMNS version text PATH 'version', name text PATH 'name'
        ) AS ledger_rows
      ), '[]'::jsonb)
    )
  END AS item
)
SELECT jsonb_build_object(
  'schema', 'kingsmen.restored-schema-inventory.v1',
  'capturedAt', statement_timestamp(),
  'database', jsonb_build_object(
    'name', current_database(), 'serverVersion', current_setting('server_version'),
    'currentRole', current_user
  ),
  'safety', jsonb_build_object(
    'readOnly', true, 'writesPerformed', false, 'migrationsApplied', false,
    'grantsOrPoliciesChanged', false, 'authChanged', false
  ),
  'columns', COALESCE((SELECT items FROM columns_inventory), '[]'::jsonb),
  'constraints', COALESCE((SELECT items FROM constraints_inventory), '[]'::jsonb),
  'indexes', COALESCE((SELECT items FROM indexes_inventory), '[]'::jsonb),
  'triggers', COALESCE((SELECT items FROM triggers_inventory), '[]'::jsonb),
  'functions', COALESCE((SELECT items FROM functions_inventory), '[]'::jsonb),
  'rowLevelSecurity', COALESCE((SELECT items FROM rls_inventory), '[]'::jsonb),
  'policies', COALESCE((SELECT items FROM policies_inventory), '[]'::jsonb),
  'tableGrants', COALESCE((SELECT items FROM table_grants_inventory), '[]'::jsonb),
  'functionGrants', COALESCE((SELECT items FROM function_grants_inventory), '[]'::jsonb),
  'extensions', COALESCE((SELECT items FROM extensions_inventory), '[]'::jsonb),
  'migrationLedger', (SELECT item FROM migration_ledger_inventory)
) AS kingsmen_restored_schema_inventory;
