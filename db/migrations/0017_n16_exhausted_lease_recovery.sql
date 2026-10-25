-- N16: close the crash-recovery edge where an expired LOCKED row has no attempts left.
create or replace function public.n16_deadletter_exhausted_locked(p_limit integer default 50)
returns integer
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare q record; v_count integer := 0;
begin
  if p_limit is null or p_limit < 1 or p_limit > 500 then raise exception 'N16_RECOVERY_LIMIT_INVALID'; end if;
  for q in
    select * from public.orchestrator_dispatch_queue
    where queue_status = 'LOCKED' and lease_expires_at <= clock_timestamp()
      and attempt_count >= max_attempts
    order by lease_expires_at for update skip locked limit p_limit
  loop
    update public.orchestrator_dispatch_queue
    set queue_status = 'DEAD_LETTER', lease_expires_at = null,
        last_failure_class = 'UNKNOWN',
        last_failure_code = 'EXPIRED_LOCKED_RETRY_BUDGET_EXHAUSTED',
        updated_at = clock_timestamp()
    where id = q.id;
    insert into public.orchestrator_execution_events
      (event_ref,run_ref,step_ref,event_type,severity,event_message,event_payload,evidence_refs)
    values ('n16_locked_deadletter:' || q.dispatch_ref,q.run_ref,q.step_ref,'RUN_FAILED','CRITICAL',
      'Expired LOCKED lease exhausted retry budget; dead-lettered.',
      jsonb_build_object('dispatch_ref',q.dispatch_ref,'attempt_count',q.attempt_count,'max_attempts',q.max_attempts),
      q.evidence_refs) on conflict(event_ref) do nothing;
    v_count := v_count + 1;
  end loop;
  return v_count;
end; $$;
revoke all on function public.n16_deadletter_exhausted_locked(integer) from public, anon, authenticated;
grant execute on function public.n16_deadletter_exhausted_locked(integer) to service_role;
comment on function public.n16_deadletter_exhausted_locked(integer) is
  'Dead-letters expired LOCKED leases when the retry budget is exhausted, preventing permanently stuck rows.';
