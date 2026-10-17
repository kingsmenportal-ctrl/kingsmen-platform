-- Store the identity and timestamp for the latest review decision.
alter table public.organisations
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;
alter table public.organisation_listings
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_notes text not null default '';
do $block$
begin
  if not exists (select 1 from pg_constraint where conname='organisations_verified_requires_review_evidence') then
    alter table public.organisations add constraint organisations_verified_requires_review_evidence
      check (verification_status <> 'VERIFIED' or (reviewed_by is not null and reviewed_at is not null and cardinality(verification_evidence)>0));
  end if;
  if not exists (select 1 from pg_constraint where conname='listings_published_requires_source_evidence') then
    alter table public.organisation_listings add constraint listings_published_requires_source_evidence
      check (status <> 'PUBLISHED' or (source_verified_at is not null and source_verified_by is not null and cardinality(evidence_refs)>0));
  end if;
end
$block$;
