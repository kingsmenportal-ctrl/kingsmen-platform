-- Index marketplace foreign keys and combine permissive listing-read policies.
create index if not exists candidate_saved_listings_listing_idx on public.candidate_saved_listings(listing_id);
create index if not exists organisation_listings_created_by_idx on public.organisation_listings(created_by);
create index if not exists organisation_listings_source_verified_by_idx on public.organisation_listings(source_verified_by);
create index if not exists organisations_created_by_idx on public.organisations(created_by);
create index if not exists organisations_reviewed_by_idx on public.organisations(reviewed_by);

drop policy if exists listings_read_published on public.organisation_listings;
drop policy if exists listings_read_submitter on public.organisation_listings;
drop policy if exists listings_read_public_or_submitter on public.organisation_listings;
create policy listings_read_public_or_submitter on public.organisation_listings
  for select to anon, authenticated
  using (
    (
      status = 'PUBLISHED'
      and source_verified_at is not null
      and exists (
        select 1 from public.organisations o
        where o.id = organisation_id and o.verification_status = 'VERIFIED'
      )
      and (closes_at is null or closes_at >= now())
    )
    or created_by = (select auth.uid())
  );
