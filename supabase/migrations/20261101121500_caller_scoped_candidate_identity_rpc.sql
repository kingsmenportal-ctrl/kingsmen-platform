-- Caller-scoped identity lookup. The base identity-link table remains backend-only.
-- The function accepts no identity argument: auth.uid() is derived from the verified JWT.
create or replace function public.resolve_my_candidate_identity()
returns table (candidate_id uuid, link_status text)
language sql
stable
security definer
set search_path = ''
as $function$
  select link.candidate_id, link.link_status
  from public.candidate_auth_identity_links as link
  where link.supabase_user_id = (select auth.uid())
    and link.link_status = 'VERIFIED'
    and (
      select count(*)
      from public.candidate_auth_identity_links as all_links
      where all_links.supabase_user_id = (select auth.uid())
    ) = 1
  limit 1;
$function$;

revoke all on function public.resolve_my_candidate_identity() from public;
revoke all on function public.resolve_my_candidate_identity() from anon;
grant execute on function public.resolve_my_candidate_identity() to authenticated;
