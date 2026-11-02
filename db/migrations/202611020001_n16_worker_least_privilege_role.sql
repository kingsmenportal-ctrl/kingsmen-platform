-- N16 worker least-privilege access contract.
-- Apply only after the independent backup/restore drill and migration change-control approval.
-- Provision a LOGIN role separately through the approved secret-management process, then grant
-- that login membership in kingsmen_n16_worker. Never store the login password in this file.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'kingsmen_n16_worker') then
    create role kingsmen_n16_worker nologin inherit nobypassrls;
  end if;
end
$$;

grant usage on schema public to kingsmen_n16_worker;

revoke all on table public.orchestrator_dispatch_queue,
  public.orchestrator_worker_results,
  public.orchestrator_execution_events,
  public.orchestrator_manual_handoffs
from kingsmen_n16_worker;

revoke all on function public.n16_claim_dispatches(text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.n16_mark_dispatch_sent(text, text, integer)
  from public, anon, authenticated;
revoke all on function public.n16_record_dispatch_result(text, text, text, text, jsonb, text[], text, text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.n16_reconcile_expired_sent(integer)
  from public, anon, authenticated;
revoke all on function public.n16_deadletter_exhausted_locked(integer)
  from public, anon, authenticated;

grant execute on function public.n16_claim_dispatches(text, integer, integer)
  to kingsmen_n16_worker;
grant execute on function public.n16_mark_dispatch_sent(text, text, integer)
  to kingsmen_n16_worker;
grant execute on function public.n16_record_dispatch_result(text, text, text, text, jsonb, text[], text, text, integer, integer)
  to kingsmen_n16_worker;
grant execute on function public.n16_reconcile_expired_sent(integer)
  to kingsmen_n16_worker;
grant execute on function public.n16_deadletter_exhausted_locked(integer)
  to kingsmen_n16_worker;

comment on role kingsmen_n16_worker is
  'Least-privilege N16 worker role: execute approved SECURITY DEFINER queue RPCs only; no direct queue-table access.';
