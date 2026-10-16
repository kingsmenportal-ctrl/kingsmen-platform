-- K: Append-only audit log. DRAFT ONLY; reconcile with existing audit_log before application.
begin;
create table if not exists public.audit_log (
 id uuid primary key default gen_random_uuid(), actor_id uuid, action text not null, entity_type text not null,
 entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists audit_log_entity_created_idx on public.audit_log(entity_type,entity_id,created_at desc);
alter table public.audit_log enable row level security;
revoke all on table public.audit_log from public,anon,authenticated;
grant select on table public.audit_log to authenticated;
drop policy if exists audit_log_founder_read on public.audit_log;
create policy audit_log_founder_read on public.audit_log for select to authenticated using(kingsmen_security.is_kingsmen_founder());
-- Trusted SECURITY DEFINER RPCs must write audit rows atomically with their business changes.
commit;
