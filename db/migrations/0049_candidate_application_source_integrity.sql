-- Prevent moving a candidate tracker to another person or opportunity after creation.
create or replace function public.prevent_candidate_route_application_source_change()
returns trigger language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if new.user_id is distinct from old.user_id
    or new.source_kind is distinct from old.source_kind
    or new.route_programme_id is distinct from old.route_programme_id
    or new.organisation_listing_id is distinct from old.organisation_listing_id then
    raise exception 'APPLICATION_SOURCE_IMMUTABLE' using errcode = '42501';
  end if;
  return new;
end;
$function$;
drop trigger if exists candidate_route_application_source_immutable on public.candidate_route_applications;
create trigger candidate_route_application_source_immutable
before update on public.candidate_route_applications
for each row execute function public.prevent_candidate_route_application_source_change();
