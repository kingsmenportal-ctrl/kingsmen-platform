alter table public.candidate_route_applications drop constraint if exists candidate_reported_submission_evidence;
alter table public.candidate_route_applications add constraint candidate_reported_submission_evidence check (
 (status='CANDIDATE_REPORTED_SUBMITTED'
  and candidate_reported_submitted_at is not null
  and coalesce(length(trim(candidate_submission_reference)),0)>=3)
 or
 (status<>'CANDIDATE_REPORTED_SUBMITTED'
  and candidate_reported_submitted_at is null
  and candidate_submission_reference is null)
);
create or replace function public.prevent_candidate_route_application_source_change()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.user_id is distinct from old.user_id
   or new.source_kind is distinct from old.source_kind
   or new.route_programme_id is distinct from old.route_programme_id
   or new.organisation_listing_id is distinct from old.organisation_listing_id then
  raise exception 'APPLICATION_SOURCE_IMMUTABLE' using errcode='42501';
 end if;
 return new;
end;
$$;
drop trigger if exists candidate_route_application_source_immutable on public.candidate_route_applications;
create trigger candidate_route_application_source_immutable
 before update on public.candidate_route_applications
 for each row execute function public.prevent_candidate_route_application_source_change();
revoke all on function public.prevent_candidate_route_application_source_change() from public,anon,authenticated;
