-- L: Retention metadata and soft-delete requests only; no object deletion. DRAFT ONLY.
begin;
create table if not exists public.storage_retention_policies (
 id uuid primary key default gen_random_uuid(), storage_bucket text not null, document_class text not null,
 retention_days integer not null check(retention_days>0), enabled boolean not null default true, created_at timestamptz not null default now(),
 unique(storage_bucket,document_class)
);
create table if not exists public.document_deletions (
 id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidates(id) on delete restrict,
 document_id uuid not null references public.document_files(id) on delete restrict, requested_at timestamptz not null default now(),
 requested_by uuid not null, status text not null default 'requested' check(status in ('requested','approved','retained_for_legal_hold','completed','rejected')),
 reviewed_by uuid, reviewed_at timestamptz, reason text
);
alter table public.storage_retention_policies enable row level security;
alter table public.document_deletions enable row level security;
revoke all on table public.storage_retention_policies,public.document_deletions from public,anon,authenticated;
grant select on table public.document_deletions to authenticated;
create policy document_deletions_candidate_read_own on public.document_deletions for select to authenticated using(candidate_id=kingsmen_security.current_authenticated_candidate_id());
create policy document_deletions_founder_read on public.document_deletions for select to authenticated using(kingsmen_security.is_kingsmen_founder());
create or replace function public.request_document_deletion(p_document_id uuid,p_reason text default null)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_candidate uuid; v_id uuid;
begin
 v_candidate:=kingsmen_security.current_authenticated_candidate_id();
 if v_candidate is null then raise exception 'candidate authentication required' using errcode='42501'; end if;
 insert into public.document_deletions(candidate_id,document_id,requested_by,reason)
 select v_candidate,df.id,auth.uid(),p_reason from public.document_files df where df.id=p_document_id and df.candidate_id=v_candidate returning id into v_id;
 if v_id is null then raise exception 'document not found' using errcode='P0002'; end if;
 return v_id;
end $$;
revoke all on function public.request_document_deletion(uuid,text) from public,anon;
grant execute on function public.request_document_deletion(uuid,text) to authenticated;
commit;
