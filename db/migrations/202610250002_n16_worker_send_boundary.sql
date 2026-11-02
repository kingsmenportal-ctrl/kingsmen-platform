-- N16 explicit worker send boundary and exhausted lease recovery.
create or replace function public.n16_mark_dispatch_sent(p_dispatch_ref text, p_worker_id text, p_lease_seconds integer default 120)
returns public.orchestrator_dispatch_queue
language plpgsql security definer set search_path = pg_catalog, public as $$
declare q public.orchestrator_dispatch_queue%rowtype;
begin
  if coalesce(trim(p_dispatch_ref), '') = '' or coalesce(trim(p_worker_id), '') = '' then raise exception 'N16_SEND_IDENTIFIERS_REQUIRED'; end if;
  if p_lease_seconds is null or p_lease_seconds < 5 or p_lease_seconds > 3600 then raise exception 'N16_LEASE_DURATION_INVALID'; end if;
  select * into q from public.orchestrator_dispatch_queue where dispatch_ref = p_dispatch_ref for update;
  if not found then raise exception 'N16_DISPATCH_NOT_FOUND'; end if;
  if q.queue_status <> 'LOCKED' or q.locked_by is distinct from p_worker_id or q.lease_expires_at is null or q.lease_expires_at <= clock_timestamp() then raise exception 'N16_DISPATCH_LEASE_NOT_OWNED'; end if;
  update public.orchestrator_dispatch_queue set queue_status = 'SENT', lease_expires_at = clock_timestamp() + make_interval(secs => p_lease_seconds), updated_at = clock_timestamp() where id = q.id returning * into q;
  insert into public.orchestrator_execution_events(event_ref,run_ref,step_ref,event_type,severity,event_message,event_payload,evidence_refs)
  values ('n16_sent:' || q.dispatch_ref || ':' || q.attempt_count,q.run_ref,q.step_ref,'WORKER_SENT','INFO','Dispatch crossed external-side-effect boundary.',jsonb_build_object('dispatch_ref',q.dispatch_ref,'worker_id',p_worker_id,'attempt_count',q.attempt_count),q.evidence_refs) on conflict(event_ref) do nothing;
  return q;
end; $$;
revoke all on function public.n16_mark_dispatch_sent(text,text,integer) from public, anon, authenticated;
grant execute on function public.n16_mark_dispatch_sent(text,text,integer) to service_role;
comment on function public.n16_mark_dispatch_sent(text,text,integer) is 'Checks lease ownership and records the external send boundary; expired SENT work requires manual reconciliation.';
