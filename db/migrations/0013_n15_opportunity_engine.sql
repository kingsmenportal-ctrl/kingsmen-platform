create table if not exists public.opportunity_source_authorities (
  id uuid primary key default gen_random_uuid(),
  authority_ref text unique not null,
  authority_name text not null,
  authority_type text not null,
  base_url text not null,
  sector_scope text[] not null default array[]::text[],
  confidence_band text not null default 'OFFICIAL_VERIFIED',
  active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunity_authority_confidence_chk check (confidence_band in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED'))
);

create table if not exists public.external_source_observations (
  id uuid primary key default gen_random_uuid(),
  observation_ref text unique not null,
  authority_ref text,
  source_url text not null,
  source_title text not null,
  sector text not null,
  observed_claim text not null,
  source_confidence text not null default 'MEDIUM',
  observation_status text not null default 'NEEDS_REVIEW',
  observed_at timestamptz not null default now(),
  valid_until timestamptz,
  stale_after timestamptz,
  last_checked_at timestamptz,
  evidence_refs text[] not null default array[]::text[],
  review_reason text,
  constraint external_observation_confidence_chk check (source_confidence in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED')),
  constraint external_observation_status_chk check (observation_status in ('DRAFT','NEEDS_REVIEW','VERIFIED','STALE','REJECTED','ARCHIVED'))
);

create table if not exists public.opportunity_providers (
  id uuid primary key default gen_random_uuid(),
  provider_ref text unique not null,
  provider_name text not null,
  provider_type text not null,
  sector text not null,
  province text,
  official_url text,
  accreditation_status text not null default 'UNKNOWN',
  source_confidence text not null default 'MEDIUM',
  safe_to_recommend boolean not null default false,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunity_provider_confidence_chk check (source_confidence in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED')),
  constraint opportunity_provider_accreditation_chk check (accreditation_status in ('UNKNOWN','OFFICIAL_VERIFIED','NEEDS_REVIEW','REJECTED','NOT_APPLICABLE'))
);

create table if not exists public.opportunity_programmes (
  id uuid primary key default gen_random_uuid(),
  programme_ref text unique not null,
  provider_ref text not null,
  programme_name text not null,
  sector text not null,
  nqf_level text,
  delivery_mode text,
  location_text text,
  opening_status text not null default 'UNKNOWN',
  source_confidence text not null default 'MEDIUM',
  candidate_facing_safe boolean not null default false,
  exact_link text,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunity_programme_status_chk check (opening_status in ('OPEN','CLOSED','UPCOMING','UNKNOWN','MANUAL_CHECK_REQUIRED')),
  constraint opportunity_programme_confidence_chk check (source_confidence in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED'))
);

create table if not exists public.opportunity_deadlines (
  id uuid primary key default gen_random_uuid(),
  deadline_ref text unique not null,
  programme_ref text,
  provider_ref text,
  deadline_type text not null,
  opens_at timestamptz,
  closes_at timestamptz,
  deadline_status text not null default 'UNKNOWN',
  source_confidence text not null default 'MEDIUM',
  timezone text not null default 'Africa/Johannesburg',
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint opportunity_deadline_status_chk check (deadline_status in ('CONFIRMED','ESTIMATED','UNKNOWN','STALE','MANUAL_CHECK_REQUIRED')),
  constraint opportunity_deadline_confidence_chk check (source_confidence in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED'))
);

create table if not exists public.opportunity_eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  rule_ref text unique not null,
  programme_ref text,
  provider_ref text,
  rule_type text not null,
  rule_text text not null,
  source_confidence text not null default 'MEDIUM',
  evidence_refs text[] not null default array[]::text[],
  review_required boolean not null default true,
  created_at timestamptz not null default now(),
  constraint opportunity_rule_confidence_chk check (source_confidence in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED'))
);

create table if not exists public.opportunity_fee_records (
  id uuid primary key default gen_random_uuid(),
  fee_ref text unique not null,
  programme_ref text,
  provider_ref text,
  fee_type text not null,
  amount_cents integer,
  currency text not null default 'ZAR',
  fee_status text not null default 'UNKNOWN',
  source_confidence text not null default 'MEDIUM',
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint opportunity_fee_status_chk check (fee_status in ('CONFIRMED','UNKNOWN','STALE','MANUAL_CHECK_REQUIRED')),
  constraint opportunity_fee_confidence_chk check (source_confidence in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED'))
);

create table if not exists public.opportunity_signal_queue (
  id uuid primary key default gen_random_uuid(),
  signal_ref text unique not null,
  signal_type text not null,
  sector text not null,
  provider_ref text,
  programme_ref text,
  signal_status text not null default 'NEW',
  priority text not null default 'NORMAL',
  summary text not null,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint opportunity_signal_status_chk check (signal_status in ('NEW','REVIEWING','VERIFIED','REJECTED','ARCHIVED')),
  constraint opportunity_signal_priority_chk check (priority in ('LOW','NORMAL','HIGH','URGENT'))
);

create table if not exists public.opportunity_verification_reviews (
  id uuid primary key default gen_random_uuid(),
  review_ref text unique not null,
  target_type text not null,
  target_ref text not null,
  review_status text not null default 'PENDING_REVIEW',
  source_confidence_before text not null default 'LOW',
  source_confidence_after text,
  reviewer_ref text,
  review_reason text not null default '',
  decision_notes text,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint opportunity_review_target_chk check (target_type in ('SOURCE','PROVIDER','PROGRAMME','DEADLINE','ELIGIBILITY','FEE','SIGNAL')),
  constraint opportunity_review_status_chk check (review_status in ('PENDING_REVIEW','APPROVED','REJECTED','STALE','SUPERSEDED')),
  constraint opportunity_review_confidence_before_chk check (source_confidence_before in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED')),
  constraint opportunity_review_confidence_after_chk check (source_confidence_after is null or source_confidence_after in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED'))
);

create table if not exists public.candidate_opportunity_matches (
  id uuid primary key default gen_random_uuid(),
  candidate_match_ref text unique not null,
  candidate_ref text not null,
  programme_ref text,
  provider_ref text,
  sector text not null,
  match_status text not null default 'DRAFT',
  match_score numeric(5,2) not null default 0,
  source_confidence text not null default 'MEDIUM',
  human_review_required boolean not null default true,
  recommendation_summary text not null default '',
  sealed_exact_target boolean not null default true,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint candidate_opportunity_match_status_chk check (match_status in ('DRAFT','READY_FOR_REVIEW','APPROVED','REJECTED','ARCHIVED')),
  constraint candidate_opportunity_match_score_chk check (match_score between 0 and 100),
  constraint candidate_opportunity_match_confidence_chk check (source_confidence in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED'))
);

create table if not exists public.opportunity_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_ref text unique not null,
  alert_type text not null,
  sector text not null,
  provider_ref text,
  programme_ref text,
  severity text not null default 'INFO',
  alert_status text not null default 'OPEN',
  title text not null,
  message text not null,
  candidate_facing boolean not null default false,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint opportunity_alert_type_chk check (alert_type in ('OPENING','DEADLINE','STALE_SOURCE','SOURCE_CHANGE','REVIEW_REQUIRED','PORTAL_BLOCKED','RISK')),
  constraint opportunity_alert_severity_chk check (severity in ('INFO','WATCH','WARNING','CRITICAL')),
  constraint opportunity_alert_status_chk check (alert_status in ('OPEN','ACKNOWLEDGED','RESOLVED','CANCELLED'))
);

create index if not exists idx_opportunity_source_authorities_type on public.opportunity_source_authorities(authority_type, active);
create index if not exists idx_external_source_observations_status on public.external_source_observations(observation_status, observed_at desc);
create index if not exists idx_opportunity_providers_sector on public.opportunity_providers(sector, source_confidence);
create index if not exists idx_opportunity_programmes_provider on public.opportunity_programmes(provider_ref, opening_status);
create index if not exists idx_opportunity_deadlines_status on public.opportunity_deadlines(deadline_status, closes_at);
create index if not exists idx_opportunity_signal_queue_status on public.opportunity_signal_queue(signal_status, priority, created_at desc);
create index if not exists idx_candidate_opportunity_matches_candidate on public.candidate_opportunity_matches(candidate_ref, match_score desc);
create index if not exists idx_opportunity_alerts_status on public.opportunity_alerts(alert_status, severity, created_at desc);

alter table public.opportunity_source_authorities enable row level security;
alter table public.external_source_observations enable row level security;
alter table public.opportunity_providers enable row level security;
alter table public.opportunity_programmes enable row level security;
alter table public.opportunity_deadlines enable row level security;
alter table public.opportunity_eligibility_rules enable row level security;
alter table public.opportunity_fee_records enable row level security;
alter table public.opportunity_signal_queue enable row level security;
alter table public.opportunity_verification_reviews enable row level security;
alter table public.candidate_opportunity_matches enable row level security;
alter table public.opportunity_alerts enable row level security;

drop policy if exists opportunity_source_authorities_all on public.opportunity_source_authorities;
create policy opportunity_source_authorities_all on public.opportunity_source_authorities TO service_role for all using (true) with check (true);
drop policy if exists external_source_observations_all on public.external_source_observations;
create policy external_source_observations_all on public.external_source_observations TO service_role for all using (true) with check (true);
drop policy if exists opportunity_providers_all on public.opportunity_providers;
create policy opportunity_providers_all on public.opportunity_providers TO service_role for all using (true) with check (true);
drop policy if exists opportunity_programmes_all on public.opportunity_programmes;
create policy opportunity_programmes_all on public.opportunity_programmes TO service_role for all using (true) with check (true);
drop policy if exists opportunity_deadlines_all on public.opportunity_deadlines;
create policy opportunity_deadlines_all on public.opportunity_deadlines TO service_role for all using (true) with check (true);
drop policy if exists opportunity_eligibility_rules_all on public.opportunity_eligibility_rules;
create policy opportunity_eligibility_rules_all on public.opportunity_eligibility_rules TO service_role for all using (true) with check (true);
drop policy if exists opportunity_fee_records_all on public.opportunity_fee_records;
create policy opportunity_fee_records_all on public.opportunity_fee_records TO service_role for all using (true) with check (true);
drop policy if exists opportunity_signal_queue_all on public.opportunity_signal_queue;
create policy opportunity_signal_queue_all on public.opportunity_signal_queue TO service_role for all using (true) with check (true);
drop policy if exists opportunity_verification_reviews_all on public.opportunity_verification_reviews;
create policy opportunity_verification_reviews_all on public.opportunity_verification_reviews TO service_role for all using (true) with check (true);
drop policy if exists candidate_opportunity_matches_all on public.candidate_opportunity_matches;
create policy candidate_opportunity_matches_all on public.candidate_opportunity_matches TO service_role for all using (true) with check (true);
drop policy if exists opportunity_alerts_all on public.opportunity_alerts;
create policy opportunity_alerts_all on public.opportunity_alerts TO service_role for all using (true) with check (true);