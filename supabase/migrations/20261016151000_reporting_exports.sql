-- M: Reporting/export request metadata. DRAFT ONLY; no export worker or file generation is included.
begin;
create table if not exists public.report_exports (
 id uuid primary key default gen_random_uuid(),
 report_type text not null check(report_type in ('candidates','finance','compliance','performance')),
 requested_by uuid not null,
 status text not null default 'pending' check(status in ('pending','processing','completed','failed','cancelled')),
 file_path text,
 created_at timestamptz not null default now(),
 completed_at timestamptz
);
create table if not exists public.report_snapshots (
 id uuid primary key default gen_random_uuid(),
 snapshot_date date not null,
 report_type text not null check(report_type in ('candidates','finance','compliance','performance')),
 data jsonb not null,
 created_at timestamptz not null default now(),
 unique(snapshot_date,report_type)
);
alter table public.report_exports enable row level security;
alter table public.report_snapshots enable row level security;
revoke all on table public.report_exports,public.report_snapshots from public,anon,authenticated;
grant select on table public.report_exports to authenticated;
create policy report_exports_requester_read on public.report_exports for select to authenticated
 using(requested_by=auth.uid() or kingsmen_security.is_kingsmen_founder());
create policy report_snapshots_founder_read on public.report_snapshots for select to authenticated
 using(kingsmen_security.is_kingsmen_founder());
create or replace function public.request_report_export(p_report_type text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
 if not kingsmen_security.is_kingsmen_founder() then raise exception 'founder role required' using errcode='42501'; end if;
 if p_report_type not in ('candidates','finance','compliance','performance') then raise exception 'invalid report type'; end if;
 insert into public.report_exports(report_type,requested_by) values(p_report_type,auth.uid()) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.request_report_export(text) from public,anon;
grant execute on function public.request_report_export(text) to authenticated;
commit;
