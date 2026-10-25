-- N16 durable queue recovery. Apply only after independent review.
-- All state changes below occur in one PostgreSQL transaction per RPC call.
alter table public.orchestrator_dispatch_queue
  add column if not exists idempotency_key text,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists last_failure_class text,
  add column if not exists last_failure_code text,
  add column if not exists updated_at timestamptz not null default now();

update public.orchestrator_dispatch_queue
set idempotency_key = 'legacy:' || dispatch_ref
where idempotency_key is null;

-- Backfill leases on pre-existing active rows so old LOCKED/SENT work is recoverable.
update public.orchestrator_dispatch_queue
set lease_expires_at = coalesce(locked_at, created_at) + interval '60 seconds',
    updated_at = clock_timestamp()
where queue_status in ('LOCKED','SENT') and lease_expires_at is null;

create unique index if not exists orchestrator_dispatch_idempotency_uq
  on public.orchestrator_dispatch_queue(idempotency_key)
  where idempotency_key is not null;

create index if not exists orchestrator_dispatch_due_idx
  on public.orchestrator_dispatch_queue(dispatch_after, priority_lane, created_at)
  where queue_status = 'READY';

create index if not exists orchestrator_dispatch_expired_lock_idx
  on public.orchestrator_dispatch_queue(lease_expires_at)
  where queue_status = 'LOCKED';

-- A claimant atomically leases due work using SKIP LOCKED; simultaneous workers
-- cannot receive the same row. SENT rows are deliberately never auto-replayed.
create or replace function public.n16_claim_dispatches(
  p_worker_id text,
  p_limit integer default 1,
  p_lease_seconds integer default 60
)
returns setof public.orchestrator_dispatch_queue
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_worker_id is null or length(trim(p_worker_id)) = 0 then
    raise exception 'N16_WORKER_ID_REQUIRED' using errcode = '22023';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 50 then
    raise exception 'N16_CLAIM_LIMIT_INVALID' using errcode = '22023';
  end if;
  if p_lease_seconds is null or p_lease_seconds < 5 or p_lease_seconds > 3600 then
    raise exception 'N16_LEASE_DURATION_INVALID' using errcode = '22023';
  end if;

  return query
  with candidates as (
    select q.id
    from public.orchestrator_dispatch_queue q
    where (
      (q.queue_status = 'READY' and q.dispatch_after <= clock_timestamp())
      or
      (q.queue_status = 'LOCKED' and q.lease_expires_at <= clock_timestamp())
    )
    and q.attempt_count < q.max_attempts
    order by
      case q.priority_lane
        when 'FOUNDER_OVERRIDE' then 0 when 'URGENT' then 1
        when 'HIGH' then 2 when 'NORMAL' then 3 else 4
      end,
      q.dispatch_after, q.created_at
    for update skip locked
    limit p_limit
  )
  update public.orchestrator_dispatch_queue q
  set queue_status = 'LOCKED',
      locked_at = clock_timestamp(),
      locked_by = p_worker_id,
      lease_expires_at = clock_timestamp() + make_interval(secs => p_lease_seconds),
      attempt_count = q.attempt_count + 1,
      updated_at = clock_timestamp()
  from candidates c
  where q.id = c.id
  returning q.*;
end;
$$;

-- A worker result and its audit record are persisted with the queue decision
-- atomically. Callers must supply a stable, unique result_ref for safe retries.
create or replace function public.n16_record_dispatch_result(
  p_dispatch_ref text,
  p_result_ref text,
  p_worker_status text,
  p_proposed_state text,
  p_result_payload jsonb,
  p_evidence_refs text[],
  p_failure_class text default null,
  p_failure_code text default null,
  p_base_delay_seconds integer default 2,
  p_max_delay_seconds integer default 900
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  q public.orchestrator_dispatch_queue%rowtype;
  v_action text;
  v_delay integer;
  v_retry_at timestamptz;
  v_reason text;
  v_handoff_type text;
  v_existing public.orchestrator_worker_results%rowtype;
begin
  if coalesce(trim(p_dispatch_ref), '') = '' or coalesce(trim(p_result_ref), '') = '' then
    raise exception 'N16_RESULT_IDENTIFIERS_REQUIRED' using errcode = '22023';
  end if;
  if coalesce(cardinality(p_evidence_refs), 0) = 0 then
    raise exception 'N16_RESULT_EVIDENCE_REQUIRED' using errcode = '22023';
  end if;
  if p_worker_status not in ('SUCCEEDED','FAILED','BLOCKED','NEEDS_APPROVAL','NEEDS_MANUAL','DUPLICATE') then
    raise exception 'N16_WORKER_STATUS_INVALID' using errcode = '22023';
  end if;
  if p_proposed_state not in ('SAME','NEW','INTAKE_PENDING','EVALUATION_PENDING','DOCUMENT_PENDING','EXECUTION_PENDING','COMPLETED','FAILED') then
    raise exception 'N16_PROPOSED_STATE_INVALID' using errcode = '22023';
  end if;

  select * into q
  from public.orchestrator_dispatch_queue
  where dispatch_ref = p_dispatch_ref
  for update;

  if not found then
    raise exception 'N16_DISPATCH_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Idempotent HTTP/RPC retry: return the prior durable outcome for this result_ref.
  select * into v_existing from public.orchestrator_worker_results where result_ref = p_result_ref;
  if found then
    if v_existing.step_ref is distinct from q.step_ref
       or v_existing.worker_code is distinct from q.worker_code then
      raise exception 'N16_RESULT_REF_CONFLICT' using errcode = '23505';
    end if;
    return jsonb_build_object('duplicate', true, 'dispatch_ref', q.dispatch_ref, 'queue_status', q.queue_status);
  end if;

  if q.queue_status not in ('LOCKED','SENT') then
    raise exception 'N16_DISPATCH_NOT_ACTIVE' using errcode = '55000';
  end if;

  insert into public.orchestrator_worker_results
    (result_ref, run_ref, step_ref, worker_code, worker_status, proposed_state,
     result_payload, evidence_refs, accepted_by_orchestrator, rejection_reason)
  values
    (p_result_ref, q.run_ref, q.step_ref, q.worker_code, p_worker_status, p_proposed_state,
     coalesce(p_result_payload, '{}'::jsonb), p_evidence_refs, false,
     'RESULT_AUDITED; STATE_TRANSITION_REQUIRES_ORCHESTRATOR_GUARD');

  insert into public.orchestrator_execution_events
    (event_ref, run_ref, step_ref, event_type, severity, event_message, event_payload, evidence_refs)
  values
    ('n16_result:' || p_result_ref, q.run_ref, q.step_ref, 'WORKER_RESULT_RECEIVED',
     case when p_worker_status in ('FAILED','BLOCKED') then 'WARNING' else 'INFO' end,
     'Worker result durably recorded; state transition not implicitly authorised.',
     jsonb_build_object('dispatch_ref', q.dispatch_ref, 'result_ref', p_result_ref,
                        'worker_status', p_worker_status, 'failure_class', p_failure_class),
     p_evidence_refs);

  if p_worker_status = 'SUCCEEDED' or p_worker_status = 'DUPLICATE' then
    update public.orchestrator_dispatch_queue
    set queue_status = case when p_worker_status = 'SUCCEEDED' then 'ACKED' else 'CANCELLED' end,
        lease_expires_at = null, updated_at = clock_timestamp()
    where id = q.id;
    return jsonb_build_object('action', case when p_worker_status = 'SUCCEEDED' then 'ACK' else 'SUPPRESS_DUPLICATE' end,
                              'dispatch_ref', q.dispatch_ref);
  end if;

  if p_worker_status in ('BLOCKED','NEEDS_MANUAL','NEEDS_APPROVAL')
     or p_failure_class = 'PORTAL_BLOCKED' then
    v_action := 'MANUAL_HANDOFF';
    v_reason := coalesce(p_failure_code, p_failure_class, p_worker_status);
    v_handoff_type := case
      when v_reason ilike '%CAPTCHA%' then 'CAPTCHA'
      when v_reason ilike '%OTP%' then 'OTP'
      when v_reason ilike '%PORTAL_DOWN%' then 'PORTAL_DOWN'
      when v_reason ilike '%MANUAL_ONLY%' then 'MANUAL_ONLY'
      when p_worker_status = 'NEEDS_APPROVAL' then 'HUMAN_APPROVAL'
      else 'MAP'
    end;
    insert into public.orchestrator_manual_handoffs
      (handoff_ref, run_ref, step_ref, handoff_type, reason, fix_path, evidence_refs)
    values
      ('n16_handoff:' || p_result_ref, q.run_ref, q.step_ref, v_handoff_type, v_reason,
       'Manual operator review; do not replay blocked external action.', p_evidence_refs)
    on conflict (handoff_ref) do nothing;
    update public.orchestrator_dispatch_queue
    set queue_status = 'FAILED', lease_expires_at = null,
        last_failure_class = coalesce(p_failure_class, p_worker_status),
        last_failure_code = v_reason, updated_at = clock_timestamp()
    where id = q.id;
    insert into public.orchestrator_execution_events
      (event_ref, run_ref, step_ref, event_type, severity, event_message, event_payload, evidence_refs)
    values ('n16_handoff_event:' || p_result_ref, q.run_ref, q.step_ref, 'MANUAL_HANDOFF_CREATED',
      'WARNING', 'Manual handoff persisted; automatic replay disabled.',
      jsonb_build_object('dispatch_ref', q.dispatch_ref, 'handoff_ref', 'n16_handoff:' || p_result_ref),
      p_evidence_refs);
    return jsonb_build_object('action', v_action, 'handoff_ref', 'n16_handoff:' || p_result_ref);
  end if;

  if p_failure_class in ('AUTHENTICATION','POLICY','INVALID_PAYLOAD') then
    v_action := 'STOP';
    v_reason := coalesce(p_failure_code, p_failure_class || '_NOT_RETRYABLE');
    update public.orchestrator_dispatch_queue
    set queue_status = 'FAILED', lease_expires_at = null,
        last_failure_class = p_failure_class, last_failure_code = v_reason,
        updated_at = clock_timestamp()
    where id = q.id;
  else
    if q.attempt_count < q.max_attempts then
      v_action := 'RETRY';
      v_delay := least(greatest(coalesce(p_base_delay_seconds, 2), 1),
                       greatest(coalesce(p_max_delay_seconds, 900), 1),
                       900) * (2 ^ least(greatest(q.attempt_count - 1, 0), 16));
      v_delay := least(v_delay, least(greatest(coalesce(p_max_delay_seconds, 900), 1), 900));
      v_retry_at := clock_timestamp() + make_interval(secs => v_delay);
      v_reason := coalesce(p_failure_code, 'TRANSIENT_FAILURE_RETRY_SCHEDULED');
      update public.orchestrator_dispatch_queue
      set queue_status = 'READY', dispatch_after = v_retry_at,
          locked_at = null, locked_by = null, lease_expires_at = null,
          last_failure_class = coalesce(p_failure_class, 'UNKNOWN'),
          last_failure_code = v_reason, updated_at = clock_timestamp()
      where id = q.id;
      insert into public.orchestrator_execution_events
        (event_ref, run_ref, step_ref, event_type, severity, event_message, event_payload, evidence_refs)
      values ('n16_retry:' || p_result_ref, q.run_ref, q.step_ref, 'RETRY_SCHEDULED', 'WATCH',
        'Retry schedule persisted transactionally.',
        jsonb_build_object('dispatch_ref', q.dispatch_ref, 'attempt_count', q.attempt_count,
                           'retry_at', v_retry_at, 'delay_seconds', v_delay, 'failure_class', p_failure_class),
        p_evidence_refs);
      return jsonb_build_object('action', v_action, 'retry_at', v_retry_at, 'delay_seconds', v_delay);
    else
      v_action := 'DEAD_LETTER';
      v_reason := coalesce(p_failure_code, 'RETRY_BUDGET_EXHAUSTED');
      update public.orchestrator_dispatch_queue
      set queue_status = 'DEAD_LETTER', lease_expires_at = null,
          last_failure_class = coalesce(p_failure_class, 'UNKNOWN'),
          last_failure_code = v_reason, updated_at = clock_timestamp()
      where id = q.id;
    end if;
  end if;

  insert into public.orchestrator_execution_events
    (event_ref, run_ref, step_ref, event_type, severity, event_message, event_payload, evidence_refs)
  values ('n16_recovery:' || p_result_ref, q.run_ref, q.step_ref,
    case when v_action = 'DEAD_LETTER' then 'RUN_FAILED' else 'STATE_TRANSITION_REJECTED' end,
    case when v_action = 'DEAD_LETTER' then 'CRITICAL' else 'WARNING' end,
    case when v_action = 'DEAD_LETTER' then 'Retry budget exhausted; dead-letter state persisted.'
         else 'Non-retryable failure stopped; operator review required.' end,
    jsonb_build_object('dispatch_ref', q.dispatch_ref, 'action', v_action,
                       'failure_class', p_failure_class, 'reason', v_reason),
    p_evidence_refs);

  return jsonb_build_object('action', v_action, 'dispatch_ref', q.dispatch_ref, 'reason', v_reason);
end;
$$;

-- Expired SENT work is ambiguous: record an incident/handoff instead of replaying it.
create or replace function public.n16_reconcile_expired_sent(p_limit integer default 50)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  q record;
  v_count integer := 0;
begin
  if p_limit is null or p_limit < 1 or p_limit > 500 then
    raise exception 'N16_RECONCILE_LIMIT_INVALID' using errcode = '22023';
  end if;
  for q in
    select * from public.orchestrator_dispatch_queue
    where queue_status = 'SENT' and lease_expires_at <= clock_timestamp()
    order by lease_expires_at
    for update skip locked
    limit p_limit
  loop
    insert into public.orchestrator_manual_handoffs
      (handoff_ref, run_ref, step_ref, handoff_type, reason, fix_path, evidence_refs)
    values
      ('n16_sent_lease:' || q.dispatch_ref, q.run_ref, q.step_ref, 'MAP',
       'Expired SENT lease is ambiguous; external side effect may have occurred.',
       'Reconcile provider state and evidence before any new dispatch.', q.evidence_refs)
    on conflict (handoff_ref) do nothing;
    update public.orchestrator_dispatch_queue
    set queue_status = 'FAILED', lease_expires_at = null,
        last_failure_class = 'UNKNOWN', last_failure_code = 'EXPIRED_SENT_REQUIRES_RECONCILIATION',
        updated_at = clock_timestamp()
    where id = q.id;
    insert into public.orchestrator_execution_events
      (event_ref, run_ref, step_ref, event_type, severity, event_message, event_payload, evidence_refs)
    values ('n16_sent_expired:' || q.dispatch_ref, q.run_ref, q.step_ref, 'MANUAL_HANDOFF_CREATED',
      'CRITICAL', 'Expired SENT dispatch quarantined; no automatic replay.',
      jsonb_build_object('dispatch_ref', q.dispatch_ref, 'queue_status', 'FAILED'), q.evidence_refs)
    on conflict (event_ref) do nothing;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- RPCs are privileged worker operations only. Do not expose the queue to candidate JWTs.
revoke all on function public.n16_claim_dispatches(text, integer, integer) from public, anon, authenticated;
revoke all on function public.n16_record_dispatch_result(text, text, text, text, jsonb, text[], text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.n16_reconcile_expired_sent(integer) from public, anon, authenticated;
grant execute on function public.n16_claim_dispatches(text, integer, integer) to service_role;
grant execute on function public.n16_record_dispatch_result(text, text, text, text, jsonb, text[], text, text, integer, integer) to service_role;
grant execute on function public.n16_reconcile_expired_sent(integer) to service_role;

comment on function public.n16_claim_dispatches(text, integer, integer) is
  'Atomic N16 claim using row locks and SKIP LOCKED; expired LOCKED leases can be reclaimed, SENT work cannot.';
comment on function public.n16_record_dispatch_result(text, text, text, text, jsonb, text[], text, text, integer, integer) is
  'Atomically audit worker result and persist ACK/retry/manual handoff/stop/dead-letter decision.';
comment on function public.n16_reconcile_expired_sent(integer) is
  'Quarantine expired SENT work for manual reconciliation; never replay ambiguous external side effects.';
