-- Founder/operator-only marketplace review queue and evidence-backed publication constraints.
alter table public.organisations drop constraint if exists organisations_verified_requires_review_evidence;
alter table public.organisations add constraint organisations_verified_requires_review_evidence check (
 verification_status <> 'VERIFIED'
 or (reviewed_by is not null and reviewed_at is not null and cardinality(verification_evidence)>0)
);
alter table public.organisation_listings drop constraint if exists listings_published_requires_source_evidence;
alter table public.organisation_listings add constraint listings_published_requires_source_evidence check (
 status <> 'PUBLISHED'
 or (source_verified_at is not null and source_verified_by is not null and cardinality(evidence_refs)>0)
);
drop policy if exists organisations_reviewer_read on public.organisations;
create policy organisations_reviewer_read on public.organisations for select to authenticated
 using (kingsmen_security.is_founder_or_operator());
drop policy if exists organisations_reviewer_update on public.organisations;
create policy organisations_reviewer_update on public.organisations for update to authenticated
 using (kingsmen_security.is_founder_or_operator())
 with check (kingsmen_security.is_founder_or_operator());
drop policy if exists listings_reviewer_read on public.organisation_listings;
create policy listings_reviewer_read on public.organisation_listings for select to authenticated
 using (kingsmen_security.is_founder_or_operator());
drop policy if exists listings_reviewer_update on public.organisation_listings;
create policy listings_reviewer_update on public.organisation_listings for update to authenticated
 using (kingsmen_security.is_founder_or_operator())
 with check (kingsmen_security.is_founder_or_operator());
grant select,update on public.organisations,public.organisation_listings to authenticated;
