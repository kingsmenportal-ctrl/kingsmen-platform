-- Institution identity evidence and application decision/handoff boundaries.
-- This migration is a proposal only until reviewed backup/restore and change-control gates pass.
begin;

create table public.route_provider_aliases (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.route_providers(id) on delete restrict,
  alias_name text not null check (length(btrim(alias_name)) between 2 and 240),
  normalized_alias text generated always as (lower(regexp_replace(btrim(alias_name), '[[:space:][:punct:]]+', '', 'g'))) stored,
  alias_type text not null default 'COMMON_NAME'
    check (alias_type in ('FORMER_NAME','LEGAL_NAME','COMMON_NAME','ACRONYM','BRAND','TRANSLITERATION','OTHER')),
  source_url text not null check (source_url ~ '^https://'),
  source_snapshot_date date,
  source_checked_at timestamptz not null default now(),
  evidence_status text not null default 'NEEDS_REVIEW'
    check (evidence_status in ('NEEDS_REVIEW','SUPPORTED','CONFLICTED','REJECTED','STALE')),
  notes text,
  created_at timestamptz not null default now(),
  unique(provider_id, normalized_alias)
);
create index route_provider_aliases_normalized_idx on public.route_provider_aliases(normalized_alias);
alter table public.route_provider_aliases enable row level security;
revoke all on public.route_provider_aliases from public, anon, authenticated;
grant select, insert, update, delete on public.route_provider_aliases to service_role;

create table public.route_provider_campuses (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.route_providers(id) on delete restrict,
  campus_key text not null check (campus_key ~ '^[a-z0-9][a-z0-9_-]{1,119}$'),
  campus_name text not null check (length(btrim(campus_name)) between 2 and 240),
  campus_type text not null default 'CAMPUS'
    check (campus_type in ('MAIN_CAMPUS','CAMPUS','SATELLITE','DELIVERY_SITE','COMMUNITY_LEARNING_CENTRE','ADMIN_OFFICE','OTHER')),
  province text check (province is null or province in ('Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','Northern Cape','North West','Western Cape')),
  municipality text,
  locality text,
  address_text text,
  official_url text check (official_url is null or official_url ~ '^https://'),
  source_url text not null check (source_url ~ '^https://'),
  source_snapshot_date date,
  source_checked_at timestamptz not null default now(),
  operational_status text not null default 'UNKNOWN'
    check (operational_status in ('ACTIVE','INACTIVE','UNKNOWN','CLOSED','MERGED')),
  verification_status text not null default 'NEEDS_REVIEW'
    check (verification_status in ('NEEDS_REVIEW','VERIFIED','CONFLICTED','REJECTED','STALE')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider_id, campus_key)
);
create index route_provider_campuses_provider_idx on public.route_provider_campuses(provider_id, verification_status);
create index route_provider_campuses_location_idx on public.route_provider_campuses(province, municipality);
alter table public.route_provider_campuses enable row level security;
revoke all on public.route_provider_campuses from public, anon, authenticated;
grant select, insert, update, delete on public.route_provider_campuses to service_role;

create table public.institution_register_observations (
  id uuid primary key default gen_random_uuid(),
  register_kind text not null check (register_kind in ('PRIVATE_HIGHER_EDUCATION','PRIVATE_COLLEGE','PUBLIC_INSTITUTION','CET','TVET')),
  institution_name text not null check (length(btrim(institution_name)) between 2 and 300),
  registration_number text,
  observed_status text not null
    check (observed_status in ('REGISTERED','PROVISIONAL','CANCELLED','LAPSED','WITHDRAWN','NOT_LISTED','UNRESOLVED','OTHER')),
  source_url text not null check (source_url ~ '^https://'),
  source_snapshot_date date not null,
  source_retrieved_at timestamptz not null default now(),
  source_locator text,
  matched_provider_id uuid references public.route_providers(id) on delete restrict,
  reconciliation_status text not null default 'UNRESOLVED'
    check (reconciliation_status in ('UNRESOLVED','MATCHED','DUPLICATE','CONFLICTED','REJECTED')),
  record_evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(record_evidence) = 'object'),
  created_at timestamptz not null default now(),
  unique(register_kind, source_snapshot_date, registration_number, institution_name)
);
create index institution_register_observations_status_idx on public.institution_register_observations(register_kind, observed_status, reconciliation_status);
create index institution_register_observations_provider_idx on public.institution_register_observations(matched_provider_id);
alter table public.institution_register_observations enable row level security;
revoke all on public.institution_register_observations from public, anon, authenticated;
grant select, insert, update, delete on public.institution_register_observations to service_role;

create table public.candidate_application_eligibility_decisions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete restrict,
  opportunity_id uuid not null references public.candidate_opportunities(id) on delete restrict,
  decision text not null check (decision in ('ELIGIBLE','INELIGIBLE','REVIEW_REQUIRED','INSUFFICIENT_EVIDENCE')),
  evaluator_version text not null check (length(btrim(evaluator_version)) between 1 and 100),
  rules_snapshot jsonb not null check (jsonb_typeof(rules_snapshot) = 'object'),
  reason_codes text[] not null default '{}',
  evidence_refs text[] not null default '{}',
  source_checked_at timestamptz,
  decided_at timestamptz not null default now(),
  supersedes_decision_id uuid references public.candidate_application_eligibility_decisions(id) on delete restrict,
  created_by text not null default 'SYSTEM'
    check (created_by in ('SYSTEM','REVIEWER','CANDIDATE_REQUESTED_RECHECK')),
  created_at timestamptz not null default now()
);
create index candidate_eligibility_candidate_opportunity_idx on public.candidate_application_eligibility_decisions(candidate_id, opportunity_id, decided_at desc);
alter table public.candidate_application_eligibility_decisions enable row level security;
revoke all on public.candidate_application_eligibility_decisions from public, anon, authenticated;
grant select, insert on public.candidate_application_eligibility_decisions to service_role;

create table public.candidate_application_handoff_events (
  id uuid primary key default gen_random_uuid(),
  submission_job_id uuid not null references public.candidate_application_submission_jobs(id) on delete restrict,
  candidate_id uuid not null references public.candidates(id) on delete restrict,
  event_type text not null
    check (event_type in ('HANDOFF_PREPARED','EXTERNAL_PORTAL_OPENED','CANDIDATE_REPORTED_SUBMITTED','PROVIDER_RECEIPT_CONFIRMED','PROVIDER_DECISION_RECEIVED','HANDOFF_FAILED','HANDOFF_CANCELLED')),
  evidence_origin text not null
    check (evidence_origin in ('KNGSMEN_SYSTEM','CANDIDATE_REPORT','PROVIDER_ORIGIN','REVIEWER_VERIFIED')),
  external_reference text,
  evidence_url text check (evidence_url is null or evidence_url ~ '^https://'),
  evidence_sha256 text check (evidence_sha256 is null or evidence_sha256 ~ '^[0-9a-f]{64}$'),
  provider_event_at timestamptz,
  verified_by_auth_user_id uuid,
  verification_notes text,
  event_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(event_payload) = 'object'),
  created_at timestamptz not null default now(),
  check (
    event_type <> 'PROVIDER_RECEIPT_CONFIRMED'
    or (evidence_origin in ('PROVIDER_ORIGIN','REVIEWER_VERIFIED') and verified_by_auth_user_id is not null
        and (external_reference is not null or evidence_url is not null or evidence_sha256 is not null))
  ),
  check (
    event_type <> 'PROVIDER_DECISION_RECEIVED'
    or (evidence_origin in ('PROVIDER_ORIGIN','REVIEWER_VERIFIED') and verified_by_auth_user_id is not null
        and (external_reference is not null or evidence_url is not null or evidence_sha256 is not null))
  )
);
create index candidate_handoff_events_job_idx on public.candidate_application_handoff_events(submission_job_id, created_at);
create index candidate_handoff_events_candidate_idx on public.candidate_application_handoff_events(candidate_id, created_at desc);
alter table public.candidate_application_handoff_events enable row level security;
revoke all on public.candidate_application_handoff_events from public, anon, authenticated;
grant select, insert on public.candidate_application_handoff_events to service_role;

comment on table public.route_provider_aliases is 'Evidence-backed provider aliases; a name match alone never establishes legal identity or accreditation.';
comment on table public.route_provider_campuses is 'Structured campus/delivery-site records with independent source and verification status.';
comment on table public.institution_register_observations is 'Immutable-snapshot observations from dated official registers; registered/provisional/cancelled/lapsed are distinct states.';
comment on table public.candidate_application_eligibility_decisions is 'Persisted, versioned eligibility decisions; REVIEW_REQUIRED and INSUFFICIENT_EVIDENCE fail closed.';
comment on table public.candidate_application_handoff_events is 'External handoff events kept distinct from provider-confirmed receipt and provider decisions.';

commit;
