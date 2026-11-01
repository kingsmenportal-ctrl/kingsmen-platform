-- N13 aggregate observability capture: atomic persistence and database-enforced cooldown.
-- Only the Supabase service_role may invoke this RPC. The Edge Function must still
-- authenticate the caller and require an active, non-revoked PLATFORM_ADMIN grant.

create or replace function public.n13_commit_observability_capture(
  p_snapshot jsonb,
  p_service_checks jsonb,
  p_metric_samples jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_latest_snapshot_ref text;
  v_latest_captured_at timestamptz;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_retry_after integer;
begin
  if pg_catalog.jsonb_typeof(p_snapshot) is distinct from 'object' then
    raise exception 'N13 snapshot must be a JSON object' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_typeof(p_service_checks) is distinct from 'array' then
    raise exception 'N13 service checks must be a JSON array' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_typeof(p_metric_samples) is distinct from 'array' then
    raise exception 'N13 metric samples must be a JSON array' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_array_length(p_service_checks) > 25 then
    raise exception 'N13 service-check batch exceeds its bound' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_array_length(p_metric_samples) > 100 then
    raise exception 'N13 metric-sample batch exceeds its bound' using errcode = '22023';
  end if;

  -- The transaction-level advisory lock serializes simultaneous captures.
  -- A second request cannot pass the cooldown check before the first commits.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('kingsmen:n13:observability-capture', 0)
  );

  select s.snapshot_ref, s.captured_at
    into v_latest_snapshot_ref, v_latest_captured_at
  from public.system_health_snapshots as s
  order by s.captured_at desc
  limit 1;

  if v_latest_captured_at is not null
     and v_latest_captured_at > v_now - interval '60 seconds' then
    v_retry_after := greatest(
      1,
      pg_catalog.ceil(extract(epoch from (v_latest_captured_at + interval '60 seconds' - v_now)))::integer
    );
    return pg_catalog.jsonb_build_object(
      'status', 'n13_capture_rate_limited',
      'rateLimited', true,
      'retryAfterSeconds', v_retry_after,
      'latestSnapshotRef', v_latest_snapshot_ref
    );
  end if;

  insert into public.system_health_snapshots (
    snapshot_ref, status, active_candidates, active_candidate_cap,
    pending_workflows, failed_workflows, document_backlog,
    manual_fallback_backlog, payment_pending_count, source_review_backlog,
    incident_open_count, oracle_lite_pressure, summary, evidence_refs, captured_at
  )
  select
    x.snapshot_ref, x.status, x.active_candidates, x.active_candidate_cap,
    x.pending_workflows, x.failed_workflows, x.document_backlog,
    x.manual_fallback_backlog, x.payment_pending_count, x.source_review_backlog,
    x.incident_open_count, x.oracle_lite_pressure, x.summary, x.evidence_refs, x.captured_at
  from pg_catalog.jsonb_to_record(p_snapshot) as x(
    snapshot_ref text, status text, active_candidates integer, active_candidate_cap integer,
    pending_workflows integer, failed_workflows integer, document_backlog integer,
    manual_fallback_backlog integer, payment_pending_count integer, source_review_backlog integer,
    incident_open_count integer, oracle_lite_pressure text, summary text,
    evidence_refs text[], captured_at timestamptz
  );

  insert into public.service_health_checks (
    check_ref, service_name, service_domain, status, latency_ms, error_rate,
    last_success_at, last_failure_at, reason, fix_path, evidence_refs, checked_at
  )
  select
    x.check_ref, x.service_name, x.service_domain, x.status, x.latency_ms, x.error_rate,
    x.last_success_at, x.last_failure_at, x.reason, x.fix_path, x.evidence_refs, x.checked_at
  from pg_catalog.jsonb_to_recordset(p_service_checks) as x(
    check_ref text, service_name text, service_domain text, status text,
    latency_ms integer, error_rate numeric, last_success_at timestamptz,
    last_failure_at timestamptz, reason text, fix_path text,
    evidence_refs text[], checked_at timestamptz
  );

  insert into public.metric_samples (
    metric_ref, metric_name, metric_domain, metric_value, metric_unit,
    warning_threshold, critical_threshold, status, tags, sampled_at
  )
  select
    x.metric_ref, x.metric_name, x.metric_domain, x.metric_value, x.metric_unit,
    x.warning_threshold, x.critical_threshold, x.status, x.tags, x.sampled_at
  from pg_catalog.jsonb_to_recordset(p_metric_samples) as x(
    metric_ref text, metric_name text, metric_domain text, metric_value numeric,
    metric_unit text, warning_threshold numeric, critical_threshold numeric,
    status text, tags jsonb, sampled_at timestamptz
  );

  return pg_catalog.jsonb_build_object(
    'status', 'n13_capture_committed',
    'rateLimited', false,
    'snapshotRef', p_snapshot ->> 'snapshot_ref'
  );
end;
$function$;

revoke all on function public.n13_commit_observability_capture(jsonb, jsonb, jsonb) from public;
revoke all on function public.n13_commit_observability_capture(jsonb, jsonb, jsonb) from anon;
revoke all on function public.n13_commit_observability_capture(jsonb, jsonb, jsonb) from authenticated;
grant execute on function public.n13_commit_observability_capture(jsonb, jsonb, jsonb) to service_role;
