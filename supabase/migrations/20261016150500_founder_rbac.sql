-- J: Founder RBAC. DRAFT ONLY. Provision founder_roles only through trusted administrative tooling.
begin;
create table if not exists public.founder_roles (
 user_id uuid primary key, role text not null check(role in ('founder','operations','reviewer')),
 granted_by uuid not null, granted_at timestamptz not null default now(), revoked_at timestamptz, reason text
);
alter table public.founder_roles enable row level security;
revoke all on table public.founder_roles from public,anon,authenticated;
create or replace function kingsmen_security.is_kingsmen_founder()
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists(select 1 from public.founder_roles fr where fr.user_id=auth.uid() and fr.role='founder' and fr.revoked_at is null);
$$;
revoke all on function kingsmen_security.is_kingsmen_founder() from public,anon;
grant execute on function kingsmen_security.is_kingsmen_founder() to authenticated;
commit;
