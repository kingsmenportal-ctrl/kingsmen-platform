-- PROPOSAL ONLY — NOT AN EXECUTABLE OR APPROVED MIGRATION.
-- Do not move into db/migrations or apply to any database until:
-- 1) full repository-to-ledger provenance reconciliation is reviewed,
-- 2) a protected backup and isolated restore drill are evidenced,
-- 3) change-control approval and independent security review are recorded,
-- 4) CI validates the exact immutable commit.
--
-- Additive canonical provider identity/evidence entities. Existing provider and
-- programme rows are deliberately not backfilled by this proposal.

begin;

create table if not exists public.opportunity_provider_aliases (
  id uuid primary key default gen_random_uuid(),
  alias_ref text not null unique,
  provider_id uuid not null references public.opportunity_providers(id) on delete restrict,
  alias_text text not null check (length(btrim(alias_text)) > 0),
  alias_type text not null check (alias_type in (
    'FORMER_NAME','REGISTERED_NAME','TRADING_NAME','ACRONYM','COMMON_NAME','SOURCE_VARIANT','OTHER'
  )),
  source_authority_id uuid references public.opportunity_source_authorities(id) on delete restrict,
  source_url text not null,
  observed_at timestamptz not null,
  valid_from date,
  valid_to date,
  review_state text not null default 'UNREVIEWED'
    check (review_state in ('UNREVIEWED','CONFIRMED','REJECTED','SUPERSEDED')),
  reviewed_by text,
  reviewed_at timestamptz,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check ((review_state = 'CONFIRMED' and reviewed_by is not null and reviewed_at is not null)
      or review_state <> 'CONFIRMED')
);

create index if not exists opportunity_provider_aliases_provider_idx
  on public.opportunity_provider_aliases(provider_id);
create index if not exists opportunity_provider_aliases_normalized_idx
  on public.opportunity_provider_aliases(lower(btrim(alias_text)));

create table if not exists public.opportunity_provider_locations (
  id uuid primary key default gen_random_uuid(),
  location_ref text not null unique,
  provider_id uuid not null references public.opportunity_providers(id) on delete restrict,
  parent_location_id uuid references public.opportunity_provider_locations(id) on delete restrict,
  location_type text not null check (location_type in (
    'HEAD_OFFICE','CAMPUS','BRANCH','TRAINING_SITE','DELIVERY_SITE','OTHER'
  )),
  canonical_name text not null check (length(btrim(canonical_name)) > 0),
  province text,
  municipality text,
  address_text text,
  official_url text,
  source_authority_id uuid references public.opportunity_source_authorities(id) on delete restrict,
  source_url text not null,
  observed_at timestamptz not null,
  verification_state text not null default 'UNRESOLVED'
    check (verification_state in ('UNRESOLVED','PENDING_REVIEW','VERIFIED','REJECTED','LAPSED')),
  verified_by text,
  verified_at timestamptz,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((verification_state = 'VERIFIED' and verified_by is not null and verified_at is not null)
      or verification_state <> 'VERIFIED'),
  check (parent_location_id is null or parent_location_id <> id)
);

create index if not exists opportunity_provider_locations_provider_idx
  on public.opportunity_provider_locations(provider_id);
create index if not exists opportunity_provider_locations_parent_idx
  on public.opportunity_provider_locations(parent_location_id);
create index if not exists opportunity_provider_locations_area_idx
  on public.opportunity_provider_locations(province, municipality);

create table if not exists public.opportunity_provider_source_observations (
  id uuid primary key default gen_random_uuid(),
  observation_ref text not null unique,
  provider_id uuid not null references public.opportunity_providers(id) on delete restrict,
  source_authority_id uuid references public.opportunity_source_authorities(id) on delete restrict,
  assertion_type text not null check (assertion_type in (
    'IDENTITY','LEGAL_REGISTRATION','ACCREDITATION','CAMPUS_RELATIONSHIP',
    'OFFICIAL_DESTINATION','CONTACT','STATUS','OTHER'
  )),
  source_url text not null,
  retrieved_at timestamptz not null,
  checked_at timestamptz not null,
  content_sha256 text check (content_sha256 is null or content_sha256 ~ '^[a-f0-9]{64}$'),
  asserted_value jsonb not null default '{}'::jsonb,
  lifecycle_state text not null default 'UNRESOLVED'
    check (lifecycle_state in ('UNRESOLVED','CURRENT','SUPERSEDED','REJECTED','EXPIRED')),
  freshness_expires_at timestamptz,
  reviewer_ref text,
  reviewed_at timestamptz,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  check (checked_at >= retrieved_at),
  check (freshness_expires_at is null or freshness_expires_at >= checked_at),
  check ((lifecycle_state = 'CURRENT' and reviewer_ref is not null and reviewed_at is not null)
      or lifecycle_state <> 'CURRENT')
);

create index if not exists opportunity_provider_source_observations_provider_idx
  on public.opportunity_provider_source_observations(provider_id, assertion_type, checked_at desc);
create index if not exists opportunity_provider_source_observations_freshness_idx
  on public.opportunity_provider_source_observations(freshness_expires_at)
  where lifecycle_state = 'CURRENT';

-- These are internal evidence records. Candidate and anonymous roles must not
-- access them directly. A server-side service-role path is required.
alter table public.opportunity_provider_aliases enable row level security;
alter table public.opportunity_provider_locations enable row level security;
alter table public.opportunity_provider_source_observations enable row level security;

revoke all on public.opportunity_provider_aliases from public, anon, authenticated;
revoke all on public.opportunity_provider_locations from public, anon, authenticated;
revoke all on public.opportunity_provider_source_observations from public, anon, authenticated;

grant all on public.opportunity_provider_aliases to service_role;
grant all on public.opportunity_provider_locations to service_role;
grant all on public.opportunity_provider_source_observations to service_role;

commit;

-- Publication remains fail-closed: this migration intentionally does not update
-- opportunity_providers.safe_to_recommend, opportunity_programmes.candidate_facing_safe,
-- programme opening status, deadlines, provider routes, or application outcomes.
