alter table public.organisation_listings
 add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
 add column if not exists reviewed_at timestamptz,
 add column if not exists review_notes text not null default '';
create index if not exists organisation_listings_reviewed_by_idx on public.organisation_listings(reviewed_by);
