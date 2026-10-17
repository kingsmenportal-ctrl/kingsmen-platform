create or replace function public.enforce_verified_organisation_for_published_listing()
returns trigger language plpgsql set search_path=public,pg_temp as $$
declare organisation_status text;
begin
 if new.status='PUBLISHED' then
  select verification_status into organisation_status from public.organisations where id=new.organisation_id;
  if organisation_status is distinct from 'VERIFIED' then
   raise exception 'ORGANISATION_MUST_BE_VERIFIED_BEFORE_PUBLICATION' using errcode='23514';
  end if;
  if new.source_verified_at is null or new.source_verified_by is null or cardinality(new.evidence_refs)=0 then
   raise exception 'PUBLISHED_LISTING_REQUIRES_SOURCE_EVIDENCE' using errcode='23514';
  end if;
 end if;
 return new;
end;
$$;
drop trigger if exists organisation_listing_publication_guard on public.organisation_listings;
create trigger organisation_listing_publication_guard
 before insert or update on public.organisation_listings
 for each row execute function public.enforce_verified_organisation_for_published_listing();
revoke all on function public.enforce_verified_organisation_for_published_listing() from public,anon,authenticated;
