\set ON_ERROR_STOP on

DO $$
DECLARE
  v_function oid := 'public.n13_commit_observability_capture(jsonb,jsonb,jsonb)'::regprocedure;
  v_is_definer boolean;
  v_has_safe_search_path boolean;
  v_first jsonb;
  v_second jsonb;
  v_snapshot jsonb;
  v_checks jsonb;
  v_metrics jsonb;
  v_count_snapshots integer;
  v_count_checks integer;
  v_count_metrics integer;
BEGIN
  IF has_function_privilege('anon', v_function, 'EXECUTE')
     OR has_function_privilege('authenticated', v_function, 'EXECUTE') THEN
    RAISE EXCEPTION 'N13 capture RPC must not be executable by anon or authenticated';
  END IF;
  IF NOT has_function_privilege('service_role', v_function, 'EXECUTE') THEN
    RAISE EXCEPTION 'N13 capture RPC must be executable by service_role';
  END IF;

  SELECT p.prosecdef, p.proconfig @> ARRAY['search_path=pg_catalog']
    INTO v_is_definer, v_has_safe_search_path
  FROM pg_proc p
  WHERE p.oid = v_function;
  IF v_is_definer IS NOT TRUE OR v_has_safe_search_path IS NOT TRUE THEN
    RAISE EXCEPTION 'N13 capture RPC must be SECURITY DEFINER with a pinned pg_catalog search_path';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    WHERE p.oid = v_function
      AND a.grantee = 0
      AND a.privilege_type = 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'N13 capture RPC must not retain PUBLIC EXECUTE';
  END IF;
END;
$$;

TRUNCATE public.system_health_snapshots, public.service_health_checks, public.metric_samples;

SET ROLE service_role;

DO $$
DECLARE
  v_first jsonb;
  v_second jsonb;
  v_snapshot jsonb;
  v_checks jsonb;
  v_metrics jsonb;
  v_bad_metrics jsonb;
  v_count_snapshots integer;
  v_count_checks integer;
  v_count_metrics integer;
BEGIN
  v_snapshot := jsonb_build_object(
    'snapshot_ref', 'n13-postgres-integration-first',
    'status', 'AMBER',
    'active_candidates', 4,
    'active_candidate_cap', 500,
    'pending_workflows', 1,
    'failed_workflows', 0,
    'document_backlog', 0,
    'manual_fallback_backlog', 0,
    'payment_pending_count', 0,
    'source_review_backlog', 2,
    'incident_open_count', 0,
    'oracle_lite_pressure', 'LOW',
    'summary', 'Synthetic PostgreSQL 17 integration capture.',
    'evidence_refs', ARRAY['synthetic:n13-postgres-test'],
    'captured_at', clock_timestamp()
  );
  v_checks := jsonb_build_array(jsonb_build_object(
    'check_ref', 'n13-postgres-check-first',
    'service_name', 'Synthetic PostgreSQL',
    'service_domain', 'POSTGRES',
    'status', 'UP',
    'latency_ms', 7,
    'error_rate', 0,
    'last_success_at', clock_timestamp(),
    'last_failure_at', NULL,
    'reason', 'Synthetic integration check.',
    'fix_path', 'No action required.',
    'evidence_refs', ARRAY['synthetic:n13-postgres-test'],
    'checked_at', clock_timestamp()
  ));
  v_metrics := jsonb_build_array(jsonb_build_object(
    'metric_ref', 'n13-postgres-metric-first',
    'metric_name', 'active_candidates',
    'metric_domain', 'CAPACITY',
    'metric_value', 4,
    'metric_unit', 'count',
    'warning_threshold', 400,
    'critical_threshold', 501,
    'status', 'OK',
    'tags', jsonb_build_object('synthetic', true),
    'sampled_at', clock_timestamp()
  ));

  v_first := public.n13_commit_observability_capture(v_snapshot, v_checks, v_metrics);
  IF v_first ->> 'status' IS DISTINCT FROM 'n13_capture_committed'
     OR v_first ->> 'rateLimited' IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'First N13 capture did not commit: %', v_first;
  END IF;

  SELECT count(*) INTO v_count_snapshots FROM public.system_health_snapshots;
  SELECT count(*) INTO v_count_checks FROM public.service_health_checks;
  SELECT count(*) INTO v_count_metrics FROM public.metric_samples;
  IF v_count_snapshots <> 1 OR v_count_checks <> 1 OR v_count_metrics <> 1 THEN
    RAISE EXCEPTION 'N13 capture was not persisted as one atomic bundle: snapshots %, checks %, metrics %',
      v_count_snapshots, v_count_checks, v_count_metrics;
  END IF;

  v_second := public.n13_commit_observability_capture(
    jsonb_set(v_snapshot, '{snapshot_ref}', '"n13-postgres-integration-second"'),
    v_checks,
    v_metrics
  );
  IF v_second ->> 'status' IS DISTINCT FROM 'n13_capture_rate_limited'
     OR v_second ->> 'rateLimited' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Second N13 capture should be rate limited: %', v_second;
  END IF;

  SELECT count(*) INTO v_count_snapshots FROM public.system_health_snapshots;
  SELECT count(*) INTO v_count_checks FROM public.service_health_checks;
  SELECT count(*) INTO v_count_metrics FROM public.metric_samples;
  IF v_count_snapshots <> 1 OR v_count_checks <> 1 OR v_count_metrics <> 1 THEN
    RAISE EXCEPTION 'Rate-limited N13 capture wrote partial rows.';
  END IF;
END;
$$;

RESET ROLE;

TRUNCATE public.system_health_snapshots, public.service_health_checks, public.metric_samples;

SET ROLE service_role;

DO $$
DECLARE
  v_snapshot jsonb;
  v_checks jsonb;
  v_bad_metrics jsonb;
  v_failed_as_expected boolean := false;
  v_count_snapshots integer;
  v_count_checks integer;
  v_count_metrics integer;
BEGIN
  v_snapshot := jsonb_build_object(
    'snapshot_ref', 'n13-postgres-integration-atomicity-failure',
    'status', 'UNKNOWN',
    'active_candidates', 0,
    'active_candidate_cap', 500,
    'pending_workflows', 0,
    'failed_workflows', 0,
    'document_backlog', 0,
    'manual_fallback_backlog', 0,
    'payment_pending_count', 0,
    'source_review_backlog', 0,
    'incident_open_count', 0,
    'oracle_lite_pressure', 'HIGH',
    'summary', 'Synthetic rollback test.',
    'evidence_refs', ARRAY['synthetic:n13-atomicity-failure'],
    'captured_at', clock_timestamp()
  );
  v_checks := jsonb_build_array(jsonb_build_object(
    'check_ref', 'n13-postgres-check-atomicity-failure',
    'service_name', 'Synthetic PostgreSQL',
    'service_domain', 'POSTGRES',
    'status', 'UNKNOWN',
    'latency_ms', 1,
    'error_rate', NULL,
    'last_success_at', NULL,
    'last_failure_at', clock_timestamp(),
    'reason', 'Synthetic failure-path check.',
    'fix_path', 'Investigate the synthetic test failure.',
    'evidence_refs', ARRAY['synthetic:n13-atomicity-failure'],
    'checked_at', clock_timestamp()
  ));
  v_bad_metrics := jsonb_build_array(jsonb_build_object(
    'metric_ref', 'n13-postgres-metric-invalid-number',
    'metric_name', 'invalid_numeric_cast',
    'metric_domain', 'TEST',
    'metric_value', 'not-a-number',
    'metric_unit', 'count',
    'warning_threshold', NULL,
    'critical_threshold', NULL,
    'status', 'UNKNOWN',
    'tags', jsonb_build_object('synthetic', true),
    'sampled_at', clock_timestamp()
  ));

  BEGIN
    PERFORM public.n13_commit_observability_capture(v_snapshot, v_checks, v_bad_metrics);
    RAISE EXCEPTION 'Expected invalid metric numeric data to abort N13 capture.';
  EXCEPTION
    WHEN invalid_text_representation THEN
      v_failed_as_expected := true;
  END;

  IF NOT v_failed_as_expected THEN
    RAISE EXCEPTION 'N13 malformed metric input did not trigger the expected rollback.';
  END IF;

  SELECT count(*) INTO v_count_snapshots FROM public.system_health_snapshots;
  SELECT count(*) INTO v_count_checks FROM public.service_health_checks;
  SELECT count(*) INTO v_count_metrics FROM public.metric_samples;
  IF v_count_snapshots <> 0 OR v_count_checks <> 0 OR v_count_metrics <> 0 THEN
    RAISE EXCEPTION 'N13 failed capture left partial evidence rows: snapshots %, checks %, metrics %',
      v_count_snapshots, v_count_checks, v_count_metrics;
  END IF;
END;
$$;

RESET ROLE;

SELECT 'PASS: N13 RPC privileges, one-bundle persistence, cooldown and rollback' AS result;
