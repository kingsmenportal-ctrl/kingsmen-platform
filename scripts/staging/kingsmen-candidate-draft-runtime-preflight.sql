-- Read-only Kingsmen candidate-draft runtime + schema-compatibility preflight.
-- Run only in the intended Supabase staging SQL editor after confirming the project ref.
-- SELECT-only: no DDL, DML, grants, policy or Auth changes.
-- The report deliberately does not authorize migration replay.

WITH ledger AS (
  SELECT version::text AS version, name::text AS name
  FROM supabase_migrations.schema_migrations
),
wanted_migrations(migration_id) AS (
  VALUES ('0096'), ('0097'), ('0098'), ('0107'), ('0108'), ('0109'), ('0110')
),
migration_matches AS (
  SELECT w.migration_id,
         COALESCE(
           jsonb_agg(jsonb_build_object('version', l.version, 'name', l.name)
                     ORDER BY l.version)
             FILTER (WHERE l.version IS NOT NULL),
           '[]'::jsonb
         ) AS records
  FROM wanted_migrations w
  LEFT JOIN ledger l
    ON l.name ILIKE '%' || w.migration_id || '%'
    OR l.version LIKE '%' || w.migration_id || '%'
  GROUP BY w.migration_id
),
runtime_objects AS (
  SELECT
    to_regclass('public.candidate_applications') IS NOT NULL AS candidate_applications_table,
    to_regclass('public.candidate_application_events') IS NOT NULL AS candidate_application_events_table,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'candidate_applications'
        AND column_name = 'kingsmen_status' AND data_type = 'text'
    ) AS candidate_applications_kingsmen_status_text_column,
    to_regclass('public.candidate_application_draft_answers') IS NOT NULL AS draft_answers_table,
    EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name = 'get_candidate_application_draft'
        AND specific_schema = 'public'
    ) AS get_draft_rpc,
    EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name = 'save_candidate_application_draft'
        AND specific_schema = 'public'
    ) AS save_draft_rpc,
    EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'kingsmen_security'
        AND routine_name = 'current_verified_kingsmen_candidate_id'
    ) AS verified_candidate_security_helper,
    EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public' AND t.relname = 'candidate_application_events'
        AND c.conname = 'candidate_application_events_event_type_check'
        AND pg_get_constraintdef(c.oid) LIKE '%APPLICATION_DRAFT_SAVED%'
    ) AS application_draft_saved_event_allowed
),
required_draft_columns AS (
  SELECT jsonb_agg(jsonb_build_object(
    'column', required.column_name,
    'present', actual.column_name IS NOT NULL,
    'type', actual.data_type,
    'nullable', actual.is_nullable
  ) ORDER BY required.ordinal) AS checks
  FROM (VALUES
    (1, 'application_id', 'uuid'),
    (2, 'candidate_id', 'uuid'),
    (3, 'draft_version', 'integer'),
    (4, 'answer_data', 'jsonb'),
    (5, 'last_idempotency_key', 'text'),
    (6, 'saved_by_auth_user_id', 'uuid'),
    (7, 'created_at', 'timestamp with time zone'),
    (8, 'updated_at', 'timestamp with time zone')
  ) AS required(ordinal, column_name, expected_type)
  LEFT JOIN information_schema.columns actual
    ON actual.table_schema = 'public'
   AND actual.table_name = 'candidate_application_draft_answers'
   AND actual.column_name = required.column_name
   AND actual.data_type = required.expected_type
),
draft_security AS (
  SELECT
    COALESCE((SELECT c.relrowsecurity FROM pg_class c
      WHERE c.oid = to_regclass('public.candidate_application_draft_answers')), false) AS rls_enabled,
    COALESCE((SELECT c.relforcerowsecurity FROM pg_class c
      WHERE c.oid = to_regclass('public.candidate_application_draft_answers')), false) AS force_rls,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'policy', p.policyname, 'command', p.cmd, 'roles', p.roles,
        'using', p.qual, 'withCheck', p.with_check
      ) ORDER BY p.policyname)
      FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = 'candidate_application_draft_answers'
    ), '[]'::jsonb) AS policies,
    has_table_privilege('anon', 'public.candidate_application_draft_answers', 'SELECT') AS anon_can_select,
    has_table_privilege('authenticated', 'public.candidate_application_draft_answers', 'SELECT') AS authenticated_can_select,
    has_table_privilege('anon', 'public.candidate_application_draft_answers', 'INSERT') AS anon_can_insert,
    has_table_privilege('authenticated', 'public.candidate_application_draft_answers', 'INSERT') AS authenticated_can_insert
),
rpc_signatures AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'schema', n.nspname,
    'name', p.proname,
    'identityArguments', pg_get_function_identity_arguments(p.oid),
    'returns', pg_get_function_result(p.oid),
    'securityDefiner', p.prosecdef,
    'searchPath', (SELECT string_agg(s.setting, ', ' ORDER BY s.ordinality)
      FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) WITH ORDINALITY AS s(setting, ordinality)
      WHERE s.setting LIKE 'search_path=%')
  ) ORDER BY n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)), '[]'::jsonb) AS functions
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE (n.nspname = 'public' AND p.proname IN ('get_candidate_application_draft', 'save_candidate_application_draft'))
     OR (n.nspname = 'kingsmen_security' AND p.proname = 'current_verified_kingsmen_candidate_id')
),
ledger_summary AS (
  SELECT count(*)::integer AS record_count,
         count(DISTINCT version)::integer AS distinct_version_count,
         (SELECT jsonb_build_object('version', version, 'name', name)
          FROM ledger ORDER BY version DESC LIMIT 1) AS latest_record,
         (SELECT jsonb_agg(jsonb_build_object('version', version, 'name', name)
                           ORDER BY version DESC)
          FROM (SELECT version, name FROM ledger ORDER BY version DESC LIMIT 15) tail) AS latest_15_records
  FROM ledger
)
SELECT jsonb_build_object(
  'schema', 'kingsmen.candidate-draft-runtime-preflight.v2',
  'capturedAt', statement_timestamp(),
  'expectedProjectRef', 'euhubhhnumtibbyufghm',
  'projectRefMustBeConfirmedInSupabaseDashboard', true,
  'safety', jsonb_build_object(
    'readOnly', true,
    'writesPerformed', false,
    'migrationsApplied', false,
    'authOrRlsChanged', false,
    'migrationReplayAuthorized', false
  ),
  'ledger', (SELECT to_jsonb(ledger_summary) FROM ledger_summary),
  'migrationIdNameMatches', (SELECT jsonb_agg(jsonb_build_object(
      'migrationId', migration_id, 'matchingLedgerRecords', records
    ) ORDER BY migration_id) FROM migration_matches),
  'runtimeObjects', (SELECT to_jsonb(runtime_objects) FROM runtime_objects),
  'draftTableColumnCompatibility', (SELECT checks FROM required_draft_columns),
  'draftTableSecurity', (SELECT to_jsonb(draft_security) FROM draft_security),
  'rpcSignaturesAndSecurityDefiner', (SELECT functions FROM rpc_signatures),
  'releaseDecision', jsonb_build_object(
    'candidateDraftRuntimeReady', false,
    'reason', 'Read-only evidence only. Require exact migration body provenance, schema and constraint compatibility, reviewed RPC signatures/search_path/grants, isolated Candidate A/B authorization tests, backup/restore rehearsal, security review and approved change control before any migration.'
  )
) AS kingsmen_candidate_draft_runtime_preflight;
