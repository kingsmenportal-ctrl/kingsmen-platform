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
-- Enforce append-only semantics for ordinary SQL writes; RLS alone does not prevent UPDATE/DELETE.
create or replace function public.reject_audit_log_mutation()
returns trigger language plpgsql set search_path = ''
as $
begin
 raise exception 'audit_log is append-only' using errcode='55000';
end $;
revoke all on function public.reject_audit_log_mutation() from public,anon,authenticated;
drop trigger if exists audit_log_reject_update_delete on public.audit_log;
create trigger audit_log_reject_update_delete
 before update or delete on public.audit_log
 for each row execute function public.reject_audit_log_mutation();
drop trigger if exists audit_log_reject_truncate on public.audit_log;
create trigger audit_log_reject_truncate
 before truncate on public.audit_log
 for each statement execute function public.reject_audit_log_mutation();
-- Trusted SECURITY DEFINER RPCs must write audit rows atomically with their business changes.
commit;
