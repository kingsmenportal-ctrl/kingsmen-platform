-- Only founder/operator sessions may review or verify partner submissions.
drop policy if exists organisations_reviewer_update on public.organisations;
create policy organisations_reviewer_update on public.organisations
  for update to authenticated using (kingsmen_security.is_founder_or_operator())
  with check (kingsmen_security.is_founder_or_operator());
drop policy if exists listings_reviewer_update on public.organisation_listings;
create policy listings_reviewer_update on public.organisation_listings
  for update to authenticated using (kingsmen_security.is_founder_or_operator())
  with check (kingsmen_security.is_founder_or_operator());
