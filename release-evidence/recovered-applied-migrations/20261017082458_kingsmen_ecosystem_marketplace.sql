-- Kingsmen ecosystem marketplace foundation.
-- Candidate-facing publication is restricted to reviewed records; provider submissions
-- are never public merely because an organisation created them.
create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (length(trim(display_name)) between 2 and 180),
  organisation_type text not null check (organisation_type in
    ('EMPLOYER','RECRUITER','UNIVERSITY','TVET','PRIVATE_COLLEGE','TRAINING_PROVIDER','SETA','FUNDER','ACCOMMODATION_PROVIDER','COMMUNITY_PARTNER','OTHER')),
  official_website text,
  contact_email text not null,
  province text,
  verification_status text not null default 'PENDING_REVIEW' check (verification_status in ('PENDING_REVIEW','VERIFIED','REJECTED','SUSPENDED')),
  verification_evidence text[] not null default array[]::text[],
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organisations_website_http check (official_website is null or official_website ~ '^https?://')
);
create index if not exists organisations_status_type_idx on public.organisations(verification_status, organisation_type);

create table if not exists public.organisation_listings (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete restrict,
  listing_type text not null check (listing_type in ('JOB','INTERNSHIP','LEARNERSHIP','APPRENTICESHIP','BURSARY','FUNDING','UNIVERSITY_COURSE','TVET_COURSE','TRAINING','ACCOMMODATION','SERVICE')),
  title text not null check (length(trim(title)) between 3 and 220),
  description text not null check (length(trim(description)) between 10 and 12000),
  province text,
  location_text text,
  official_source_url text not null check (official_source_url ~ '^https?://'),
  application_url text check (application_url is null or application_url ~ '^https?://'),
  application_method text not null default 'EXTERNAL_PORTAL' check (application_method in ('EXTERNAL_PORTAL','EMAIL','INTERNAL_REVIEW','IN_PERSON','UNKNOWN')),
  eligibility jsonb not null default '{}'::jsonb,
  opens_at timestamptz,
  closes_at timestamptz,
  status text not null default 'PENDING_REVIEW' check (status in ('DRAFT','PENDING_REVIEW','PUBLISHED','CLOSED','REJECTED','ARCHIVED')),
  source_verified_at timestamptz,
  source_verified_by uuid references auth.users(id) on delete set null,
  evidence_refs text[] not null default array[]::text[],
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_deadline_order check (opens_at is null or closes_at is null or closes_at >= opens_at)
);
create index if not exists organisation_listings_public_idx on public.organisation_listings(status, listing_type, province, closes_at);
create index if not exists organisation_listings_org_idx on public.organisation_listings(organisation_id, created_at desc);

create table if not exists public.candidate_saved_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  listing_id uuid not null references public.organisation_listings(id) on delete cascade,
  note text not null default '' check (length(note) <= 2000),
  created_at timestamptz not null default now(),
  unique(user_id, listing_id)
);
create index if not exists candidate_saved_listings_user_idx on public.candidate_saved_listings(user_id, created_at desc);

alter table public.organisations enable row level security;
alter table public.organisation_listings enable row level security;
alter table public.candidate_saved_listings enable row level security;

drop policy if exists organisations_read_verified_or_owner on public.organisations;
create policy organisations_read_verified_or_owner on public.organisations
  for select to authenticated
  using (verification_status = 'VERIFIED' or created_by = (select auth.uid()));
drop policy if exists organisations_submit on public.organisations;
create policy organisations_submit on public.organisations
  for insert to authenticated
  with check (created_by = (select auth.uid()) and verification_status = 'PENDING_REVIEW' and reviewed_by is null and reviewed_at is null);
-- No client UPDATE/DELETE policy: verification and organisation changes require trusted review.

drop policy if exists listings_read_published on public.organisation_listings;
create policy listings_read_published on public.organisation_listings
  for select to anon, authenticated
  using (
    status = 'PUBLISHED'
    and source_verified_at is not null
    and exists (
      select 1 from public.organisations o
      where o.id = organisation_id and o.verification_status = 'VERIFIED'
    )
    and (closes_at is null or closes_at >= now())
  );
drop policy if exists listings_read_submitter on public.organisation_listings;
create policy listings_read_submitter on public.organisation_listings
  for select to authenticated
  using (created_by = (select auth.uid()));
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
      where o.id = organisation_id and o.created_by = (select auth.uid()) and o.verification_status = 'VERIFIED'
    )
  );
-- No client UPDATE/DELETE policy: publication requires trusted review and source evidence.

drop policy if exists candidate_saved_listings_select_own on public.candidate_saved_listings;
create policy candidate_saved_listings_select_own on public.candidate_saved_listings
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists candidate_saved_listings_insert_own on public.candidate_saved_listings;
create policy candidate_saved_listings_insert_own on public.candidate_saved_listings
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists candidate_saved_listings_update_own on public.candidate_saved_listings;
create policy candidate_saved_listings_update_own on public.candidate_saved_listings
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists candidate_saved_listings_delete_own on public.candidate_saved_listings;
create policy candidate_saved_listings_delete_own on public.candidate_saved_listings
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.organisations, public.organisation_listings, public.candidate_saved_listings from anon, authenticated;
grant select, insert on public.organisations to authenticated;
grant select, insert on public.organisation_listings to authenticated;
grant select on public.organisation_listings to anon;
grant select, insert, update, delete on public.candidate_saved_listings to authenticated;
