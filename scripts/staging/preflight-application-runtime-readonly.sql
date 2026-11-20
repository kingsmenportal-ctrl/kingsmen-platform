-- Read-only staging preflight for the Kingsmen candidate application runtime.
-- Run against an approved staging connection before considering migrations 0107-0109.
-- This file performs SELECTs only: no schema changes, inserts, updates, deletes or auth-user inspection.

WITH checks AS (
  SELECT
    'candidate_applications_table'::text AS gate,
    to_regclass('public.candidate_applications') IS NOT NULL AS passed,
    coalesce(to_regclass('public.candidate_applications')::text, 'missing') AS evidence
  UNION ALL
  SELECT
    'candidate_application_events_table',
    to_regclass('public.candidate_application_events') IS NOT NULL,
    coalesce(to_regclass('public.candidate_application_events')::text, 'missing')
  UNION ALL
  SELECT
    'draft_answers_table',
    to_regclass('public.candidate_application_draft_answers') IS NOT NULL,
    coalesce(to_regclass('public.candidate_application_draft_answers')::text, 'missing')
  UNION ALL
  SELECT
    'draft_read_rpc',
    to_regprocedure('public.get_candidate_application_draft(uuid)') IS NOT NULL,
    coalesce(to_regprocedure('public.get_candidate_application_draft(uuid)')::text, 'missing')
  UNION ALL
  SELECT
    'draft_save_rpc',
    to_regprocedure('public.save_candidate_application_draft(uuid,jsonb,integer,text)') IS NOT NULL,
    coalesce(to_regprocedure('public.save_candidate_application_draft(uuid,jsonb,integer,text)')::text, 'missing')
  UNION ALL
  SELECT
    'rebuild_identity_helper',
    to_regprocedure('kingsmen_security.current_verified_kingsmen_candidate_id()') IS NOT NULL,
    CASE WHEN to_regprocedure('kingsmen_security.current_verified_kingsmen_candidate_id()') IS NOT NULL
      THEN 'kingsmen_security helper exists' ELSE 'kingsmen_security helper missing' END
  UNION ALL
  SELECT
    'live_identity_helper_candidates',
    EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = 'current_verified_kingsmen_candidate_id'
        AND n.nspname IN ('public', 'private', 'kingsmen_security')
    ),
    coalesce((
      SELECT string_agg(n.nspname || '.' || p.proname || '(' ||
        pg_get_function_identity_arguments(p.oid) || ')', ', ' ORDER BY n.nspname)
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = 'current_verified_kingsmen_candidate_id'
        AND n.nspname IN ('public', 'private', 'kingsmen_security')
    ), 'no matching helper found')
  UNION ALL
  SELECT
    'draft_saved_event_allowed',
    EXISTS (
      SELECT 1 FROM pg_constraint c
      WHERE c.conrelid = 'public.candidate_application_events'::regclass
        AND c.conname = 'candidate_application_events_event_type_check'
        AND c.contype = 'c'
        AND position('APPLICATION_DRAFT_SAVED' IN pg_get_constraintdef(c.oid)) > 0
    ),
    coalesce((
      SELECT pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      WHERE c.conrelid = 'public.candidate_application_events'::regclass
        AND c.conname = 'candidate_application_events_event_type_check'
        AND c.contype = 'c'
    ), 'canonical event constraint missing')
  UNION ALL
  SELECT
    'migration_0096_source_history',
    EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE name ILIKE '%0096%'),
    coalesce((SELECT string_agg(version || ':' || name, ', ' ORDER BY version)
      FROM supabase_migrations.schema_migrations WHERE name ILIKE '%0096%'), 'no 0096 ledger entry found')
  UNION ALL
  SELECT
    'migration_0097_source_history',
    EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE name ILIKE '%0097%'),
    coalesce((SELECT string_agg(version || ':' || name, ', ' ORDER BY version)
      FROM supabase_migrations.schema_migrations WHERE name ILIKE '%0097%'), 'no 0097 ledger entry found')
  UNION ALL
  SELECT
    'migration_0098_source_history',
    EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE name ILIKE '%0098%'),
    coalesce((SELECT string_agg(version || ':' || name, ', ' ORDER BY version)
      FROM supabase_migrations.schema_migrations WHERE name ILIKE '%0098%'), 'no 0098 ledger entry found')
  UNION ALL
  SELECT
    'verified_identity_links_exist',
    (SELECT count(*) FROM public.candidate_auth_identity_links) > 0,
    (SELECT count(*)::text || ' identity-link row(s)' FROM public.candidate_auth_identity_links)
  UNION ALL
  SELECT
    'reusable_candidate_profiles_exist',
    (SELECT count(*) FROM public.candidate_master_profiles) > 0,
    (SELECT count(*)::text || ' profile row(s)' FROM public.candidate_master_profiles)
  UNION ALL
  SELECT
    'eligible_synthetic_application_fixture',
    (SELECT count(*) FROM public.candidate_applications) > 0,
    (SELECT count(*)::text || ' application row(s); use approved synthetic identities for E2E' FROM public.candidate_applications)
)
SELECT
  gate,
  CASE WHEN passed THEN 'PASS' ELSE 'BLOCKED' END AS status,
  evidence
FROM checks
ORDER BY CASE WHEN passed THEN 1 ELSE 0 END, gate;

-- Important: PASS here means a prerequisite exists, not that the migration chain is approved.
-- Never apply 0107-0109 until source-history provenance, a verified restore rehearsal,
-- exact-schema compatibility, security review and change-control approval are recorded.
