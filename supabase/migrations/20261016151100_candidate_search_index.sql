-- N: Candidate search index. DRAFT ONLY; founder-only search authorization is required.
begin;
create table if not exists public.candidate_search_index (
 candidate_id uuid primary key references public.candidates(id) on delete cascade,
 search_vector tsvector not null default ''::tsvector,
 last_indexed_at timestamptz not null default now()
);
create index if not exists candidate_search_index_vector_gin on public.candidate_search_index using gin(search_vector);
alter table public.candidate_search_index enable row level security;
revoke all on table public.candidate_search_index from public,anon,authenticated;
create policy candidate_search_index_founder_read on public.candidate_search_index for select to authenticated
 using(kingsmen_security.is_kingsmen_founder());
create or replace function public.refresh_candidate_search(p_candidate_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_name text;
begin
 if not kingsmen_security.is_kingsmen_founder() then raise exception 'founder role required' using errcode='42501'; end if;
 select cp.full_name into v_name from public.candidate_profiles cp where cp.candidate_id=p_candidate_id;
 if not found then raise exception 'candidate profile not found' using errcode='P0002'; end if;
 insert into public.candidate_search_index(candidate_id,search_vector,last_indexed_at)
 values(p_candidate_id,to_tsvector('english',coalesce(v_name,'')),now())
 on conflict(candidate_id) do update set search_vector=excluded.search_vector,last_indexed_at=now();
end $$;
revoke all on function public.refresh_candidate_search(uuid) from public,anon;
grant execute on function public.refresh_candidate_search(uuid) to authenticated;
commit;
