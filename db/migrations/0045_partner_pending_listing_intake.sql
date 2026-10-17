-- Permit an organisation owner to submit a listing for review before the organisation is verified.
-- Publication remains separately guarded by reviewer policy and the database publication trigger.
drop policy if exists listings_submit_pending on public.organisation_listings;
create policy listings_submit_pending
on public.organisation_listings for insert to authenticated
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
