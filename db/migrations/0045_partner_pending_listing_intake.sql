-- Let authenticated organisation owners submit listings while their organisation is pending.
-- Submission remains pending and is never publicly visible until an authorised review process publishes it.
drop policy if exists listings_submit_pending on public.organisation_listings;
create policy listings_submit_pending on public.organisation_listings
 for insert to authenticated
 with check (
  created_by = (select auth.uid())
  and status = 'PENDING_REVIEW'
  and source_verified_at is null
  and source_verified_by is null
  and exists (
   select 1 from public.organisations o
   where o.id = organisation_id and o.created_by = (select auth.uid())
  )
 );
