create table if not exists public.ai_decision_runtime_config (
  id uuid primary key default gen_random_uuid(),
  config_key text unique not null,
  config_value jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  doctrine_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_decision_signals (
  id uuid primary key default gen_random_uuid(),
  signal_ref text unique not null,
  candidate_ref text not null,
  profile_completeness numeric(5,2) not null default 0,
  document_readiness numeric(5,2) not null default 0,
  academic_fit numeric(5,2) not null default 0,
  funding_need numeric(5,2) not null default 0,
  accommodation_need numeric(5,2) not null default 0,
  urgency_score numeric(5,2) not null default 0,
  province_preference text,
  sector_preferences text[] not null default array[]::text[],
  risk_flags text[] not null default array[]::text[],
  evidence_refs text[] not null default array[]::text[],
  source_confidence text not null default 'MEDIUM',
  created_at timestamptz not null default now(),
  constraint candidate_decision_source_confidence_chk check (source_confidence in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED')),
  constraint candidate_decision_scores_chk check (
    profile_completeness between 0 and 100 and
    document_readiness between 0 and 100 and
    academic_fit between 0 and 100 and
    funding_need between 0 and 100 and
    accommodation_need between 0 and 100 and
    urgency_score between 0 and 100
  )
);

create table if not exists public.eligibility_screen_results (
  id uuid primary key default gen_random_uuid(),
  screen_ref text unique not null,
  candidate_ref text not null,
  route_ref text not null,
  eligibility_status text not null default 'NEEDS_REVIEW',
  blockers text[] not null default array[]::text[],
  missing_documents text[] not null default array[]::text[],
  review_required boolean not null default true,
  explanation text not null default '',
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint eligibility_screen_status_chk check (eligibility_status in ('ELIGIBLE','LIKELY_ELIGIBLE','NEEDS_REVIEW','BLOCKED','UNKNOWN'))
);

create table if not exists public.route_match_candidates (
  id uuid primary key default gen_random_uuid(),
  match_ref text unique not null,
  candidate_ref text not null,
  route_ref text not null,
  route_sector text not null,
  institution_ref text,
  source_confidence text not null default 'MEDIUM',
  portal_health text not null default 'UNKNOWN',
  match_score numeric(5,2) not null default 0,
  readiness_score numeric(5,2) not null default 0,
  urgency_score numeric(5,2) not null default 0,
  evidence_refs text[] not null default array[]::text[],
  match_reasons text[] not null default array[]::text[],
  risk_reasons text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint route_match_source_confidence_chk check (source_confidence in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED')),
  constraint route_match_portal_health_chk check (portal_health in ('HEALTHY','DEGRADED','BLOCKED','CAPTCHA','OTP_REQUIRED','DOWN','UNKNOWN')),
  constraint route_match_scores_chk check (match_score between 0 and 100 and readiness_score between 0 and 100 and urgency_score between 0 and 100)
);

create table if not exists public.placement_scores (
  id uuid primary key default gen_random_uuid(),
  placement_ref text unique not null,
  candidate_ref text not null,
  route_ref text not null,
  academic_score numeric(5,2) not null default 0,
  document_score numeric(5,2) not null default 0,
  deadline_score numeric(5,2) not null default 0,
  funding_score numeric(5,2) not null default 0,
  accommodation_score numeric(5,2) not null default 0,
  source_confidence_score numeric(5,2) not null default 0,
  final_score numeric(5,2) not null default 0,
  score_band text not null default 'REVIEW',
  explanation text not null default '',
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint placement_score_band_chk check (score_band in ('PRIORITY','STRONG','VIABLE','REVIEW','RISK')),
  constraint placement_score_values_chk check (
    academic_score between 0 and 100 and
    document_score between 0 and 100 and
    deadline_score between 0 and 100 and
    funding_score between 0 and 100 and
    accommodation_score between 0 and 100 and
    source_confidence_score between 0 and 100 and
    final_score between 0 and 100
  )
);

create table if not exists public.route_recommendations (
  id uuid primary key default gen_random_uuid(),
  recommendation_ref text unique not null,
  candidate_ref text not null,
  route_ref text not null,
  match_ref text,
  placement_ref text,
  recommendation_rank integer not null default 0,
  recommendation_status text not null default 'DRAFT',
  recommendation_type text not null default 'ROUTE_OPTION',
  ai_confidence text not null default 'MEDIUM',
  human_review_required boolean not null default true,
  explanation text not null,
  evidence_refs text[] not null default array[]::text[],
  sealed_details boolean not null default false,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint route_recommendation_status_chk check (recommendation_status in ('DRAFT','READY_FOR_REVIEW','APPROVED','REJECTED','ARCHIVED')),
  constraint route_recommendation_type_chk check (recommendation_type in ('ROUTE_OPTION','DOCUMENT_REQUEST','FALLBACK','URGENT_REVIEW','ACCOMMODATION','FUNDING','EMPLOYER_ROUTE')),
  constraint route_recommendation_ai_confidence_chk check (ai_confidence in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED'))
);

create table if not exists public.destiny_maps (
  id uuid primary key default gen_random_uuid(),
  destiny_map_ref text unique not null,
  candidate_ref text not null,
  map_status text not null default 'DRAFT',
  free_preview boolean not null default false,
  sealed_exact_targets boolean not null default true,
  summary text not null default '',
  route_count integer not null default 0,
  sector_coverage text[] not null default array[]::text[],
  recommendation_refs text[] not null default array[]::text[],
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint destiny_map_status_chk check (map_status in ('DRAFT','READY_FOR_REVIEW','PUBLISHED','ARCHIVED'))
);

create table if not exists public.phoenix_fallback_plans (
  id uuid primary key default gen_random_uuid(),
  phoenix_ref text unique not null,
  candidate_ref text not null,
  failed_route_ref text,
  fallback_status text not null default 'DRAFT',
  failure_reason text not null default '',
  new_route_refs text[] not null default array[]::text[],
  map_package_required boolean not null default true,
  false_rescue_blocked boolean not null default true,
  human_review_required boolean not null default true,
  explanation text not null default '',
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint phoenix_fallback_status_chk check (fallback_status in ('DRAFT','READY_FOR_REVIEW','APPROVED','REJECTED','EXECUTING','COMPLETED','FAILED'))
);

create table if not exists public.ai_decision_events (
  id uuid primary key default gen_random_uuid(),
  event_ref text unique not null,
  candidate_ref text,
  route_ref text,
  event_type text not null,
  event_summary text not null,
  model_name text,
  prompt_ref text,
  input_hash text,
  output_hash text,
  evidence_refs text[] not null default array[]::text[],
  blocked_actions text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint ai_decision_event_type_chk check (
    event_type in ('SIGNAL_BUILT','ELIGIBILITY_SCREENED','ROUTE_MATCHED','PLACEMENT_SCORED','RECOMMENDATION_DRAFTED','DESTINY_MAP_BUILT','PHOENIX_PLANNED','HUMAN_OVERRIDE_REQUESTED','ACTION_BLOCKED','LEARNING_SIGNAL_CAPTURED')
  )
);

create table if not exists public.ai_learning_signals (
  id uuid primary key default gen_random_uuid(),
  learning_ref text unique not null,
  candidate_ref text,
  workflow_ref text,
  signal_type text not null,
  signal_summary text not null,
  safe_for_aggregate_learning boolean not null default false,
  human_reviewed boolean not null default false,
  no_silent_learning boolean not null default true,
  no_uncontrolled_rl boolean not null default true,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint ai_learning_signal_type_chk check (
    signal_type in ('OUTCOME','CONFUSION','DOCUMENT_DELAY','PORTAL_FAILURE','MATCH_QUALITY','CANDIDATE_FEEDBACK','HUMAN_OVERRIDE','PHOENIX_OUTCOME','HARM_SIGNAL')
  )
);

create index if not exists idx_candidate_decision_signals_candidate on public.candidate_decision_signals(candidate_ref, created_at desc);
create index if not exists idx_eligibility_screen_candidate on public.eligibility_screen_results(candidate_ref, created_at desc);
create index if not exists idx_route_match_candidate on public.route_match_candidates(candidate_ref, match_score desc);
create index if not exists idx_placement_scores_candidate on public.placement_scores(candidate_ref, final_score desc);
create index if not exists idx_route_recommendations_candidate on public.route_recommendations(candidate_ref, recommendation_rank asc);
create index if not exists idx_destiny_maps_candidate on public.destiny_maps(candidate_ref, created_at desc);
create index if not exists idx_phoenix_candidate on public.phoenix_fallback_plans(candidate_ref, created_at desc);
create index if not exists idx_ai_decision_events_candidate on public.ai_decision_events(candidate_ref, created_at desc);
create index if not exists idx_ai_learning_signals_type on public.ai_learning_signals(signal_type, created_at desc);

alter table public.ai_decision_runtime_config enable row level security;
alter table public.candidate_decision_signals enable row level security;
alter table public.eligibility_screen_results enable row level security;
alter table public.route_match_candidates enable row level security;
alter table public.placement_scores enable row level security;
alter table public.route_recommendations enable row level security;
alter table public.destiny_maps enable row level security;
alter table public.phoenix_fallback_plans enable row level security;
alter table public.ai_decision_events enable row level security;
alter table public.ai_learning_signals enable row level security;

drop policy if exists ai_decision_runtime_config_all on public.ai_decision_runtime_config;
create policy ai_decision_runtime_config_all on public.ai_decision_runtime_config TO service_role for all using (true) with check (true);
drop policy if exists candidate_decision_signals_all on public.candidate_decision_signals;
create policy candidate_decision_signals_all on public.candidate_decision_signals TO service_role for all using (true) with check (true);
drop policy if exists eligibility_screen_results_all on public.eligibility_screen_results;
create policy eligibility_screen_results_all on public.eligibility_screen_results TO service_role for all using (true) with check (true);
drop policy if exists route_match_candidates_all on public.route_match_candidates;
create policy route_match_candidates_all on public.route_match_candidates TO service_role for all using (true) with check (true);
drop policy if exists placement_scores_all on public.placement_scores;
create policy placement_scores_all on public.placement_scores TO service_role for all using (true) with check (true);
drop policy if exists route_recommendations_all on public.route_recommendations;
create policy route_recommendations_all on public.route_recommendations TO service_role for all using (true) with check (true);
drop policy if exists destiny_maps_all on public.destiny_maps;
create policy destiny_maps_all on public.destiny_maps TO service_role for all using (true) with check (true);
drop policy if exists phoenix_fallback_plans_all on public.phoenix_fallback_plans;
create policy phoenix_fallback_plans_all on public.phoenix_fallback_plans TO service_role for all using (true) with check (true);
drop policy if exists ai_decision_events_all on public.ai_decision_events;
create policy ai_decision_events_all on public.ai_decision_events TO service_role for all using (true) with check (true);
drop policy if exists ai_learning_signals_all on public.ai_learning_signals;
create policy ai_learning_signals_all on public.ai_learning_signals TO service_role for all using (true) with check (true);