-- Read-only Kingsmen candidate-draft runtime preflight.
-- Run only in the intended Supabase staging SQL editor after confirming the project ref.
-- This query performs SELECTs only: no DDL, DML, grants, policy or Auth changes.
WITH ledger AS (
  SELECT version, name
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
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'candidate_applications'
        AND column_name = 'kingsmen_status'
    ) AS candidate_applications_kingsmen_status_column,
    to_regclass('public.candidate_application_draft_answers') IS NOT NULL AS draft_answers_table,
    EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name = 'get_candidate_application_draft'
    ) AS get_draft_rpc,
    EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name = 'save_candidate_application_draft'
    ) AS save_draft_rpc,
    EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'kingsmen_security'
        AND routine_name = 'current_verified_kingsmen_candidate_id'
    ) AS verified_candidate_security_helper,
    EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = 'candidate_application_events'
        AND c.conname = 'candidate_application_events_event_type_check'
        AND pg_get_constraintdef(c.oid) LIKE '%APPLICATION_DRAFT_SAVED%'
    ) AS application_draft_saved_event_allowed
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
  'schema', 'kingsmen.candidate-draft-runtime-preflight.v1',
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
      'migrationId', migration_id,
      'matchingLedgerRecords', records
    ) ORDER BY migration_id) FROM migration_matches),
  'runtimeObjects', (SELECT to_jsonb(runtime_objects) FROM runtime_objects),
  'releaseDecision', jsonb_build_object(
    'candidateDraftRuntimeReady', false,
    'reason', 'This read-only preflight reports present state only. Exact migration provenance, schema compatibility, backup/restore rehearsal, security review and approved change control remain separate release gates.'
  )
) AS kingsmen_candidate_draft_runtime_preflight;
