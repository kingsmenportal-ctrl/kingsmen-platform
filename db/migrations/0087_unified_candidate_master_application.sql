-- N06 unified candidate master application: reusable profile + per-provider planning records.
-- This migration intentionally does not submit to external providers or claim an application was sent.
create table if not exists public.candidate_master_profiles (
  candidate_id uuid primary key references public.candidates(id) on delete cascade,
  profile_data jsonb not null default '{}'::jsonb check (jsonb_typeof(profile_data) = 'object'),
  pathway_preferences jsonb not null default '[]'::jsonb check (jsonb_typeof(pathway_preferences) = 'array'),
  consent_version text not null,
  consent_at timestamptz not null,
  last_saved_by_auth_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidate_master_profile_consent_version check (length(trim(consent_version)) between 1 and 80)
);
create index if not exists candidate_master_profiles_updated_idx
  on public.candidate_master_profiles(updated_at desc);

create table if not exists public.candidate_master_application_targets (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  target_key text not null,
  pathway_type text not null check (pathway_type in ('HIGHER_EDUCATION','TVET','SETA_LEARNERSHIP','INTERNSHIP','APPRENTICESHIP','EMPLOYMENT','FUNDING','ACCOMMODATION','WIL')),
  provider_name text not null check (length(trim(provider_name)) between 1 and 180),
  programme_or_role text not null check (length(trim(programme_or_role)) between 1 and 240),
  provider_application_url text,
  source_reference text,
  source_confidence text not null default 'UNVERIFIED' check (source_confidence in ('A','B','C','D','UNVERIFIED')),
  planning_status text not null default 'PLANNING' check (planning_status in ('PLANNING','PREPARING','EXTERNAL_PORTAL_REQUIRED','CANCELLED')),
  idempotency_key text not null,
  created_by_auth_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, idempotency_key, target_key),
  constraint candidate_master_target_url_scheme check (
    provider_application_url is null or provider_application_url ~ '^https://'
  )
);
create index if not exists candidate_master_targets_candidate_updated_idx
  on public.candidate_master_application_targets(candidate_id, updated_at desc);
create index if not exists candidate_master_targets_idempotency_idx
  on public.candidate_master_application_targets(candidate_id, idempotency_key);

create table if not exists public.candidate_master_application_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  actor_auth_user_id uuid not null,
  event_type text not null check (event_type in ('PROFILE_SAVED','TARGETS_PLANNED')),
  idempotency_key text not null,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now(),
  unique (candidate_id, event_type, idempotency_key)
);
create index if not exists candidate_master_events_candidate_created_idx
  on public.candidate_master_application_events(candidate_id, created_at desc);

alter table public.candidate_master_profiles enable row level security;
alter table public.candidate_master_application_targets enable row level security;
alter table public.candidate_master_application_events enable row level security;

drop policy if exists candidate_master_profiles_select_own on public.candidate_master_profiles;
create policy candidate_master_profiles_select_own on public.candidate_master_profiles
 for select to authenticated using (candidate_id = kingsmen_security.current_authenticated_candidate_id());
drop policy if exists candidate_master_profiles_insert_own on public.candidate_master_profiles;
create policy candidate_master_profiles_insert_own on public.candidate_master_profiles
 for insert to authenticated with check (
   candidate_id = kingsmen_security.current_authenticated_candidate_id()
   and last_saved_by_auth_user_id = (select auth.uid())
 );
drop policy if exists candidate_master_profiles_update_own on public.candidate_master_profiles;
create policy candidate_master_profiles_update_own on public.candidate_master_profiles
 for update to authenticated
 using (candidate_id = kingsmen_security.current_authenticated_candidate_id())
 with check (
   candidate_id = kingsmen_security.current_authenticated_candidate_id()
   and last_saved_by_auth_user_id = (select auth.uid())
 );

drop policy if exists candidate_master_targets_select_own on public.candidate_master_application_targets;
create policy candidate_master_targets_select_own on public.candidate_master_application_targets
 for select to authenticated using (candidate_id = kingsmen_security.current_authenticated_candidate_id());
drop policy if exists candidate_master_targets_insert_own on public.candidate_master_application_targets;
create policy candidate_master_targets_insert_own on public.candidate_master_application_targets
 for insert to authenticated with check (
   candidate_id = kingsmen_security.current_authenticated_candidate_id()
   and created_by_auth_user_id = (select auth.uid())
   and planning_status = 'PLANNING'
   and source_confidence = 'UNVERIFIED'
 );
drop policy if exists candidate_master_targets_update_own on public.candidate_master_application_targets;
create policy candidate_master_targets_update_own on public.candidate_master_application_targets
 for update to authenticated using (candidate_id = kingsmen_security.current_authenticated_candidate_id())
 with check (
   candidate_id = kingsmen_security.current_authenticated_candidate_id()
   and created_by_auth_user_id = (select auth.uid())
   and planning_status in ('PLANNING','PREPARING','EXTERNAL_PORTAL_REQUIRED','CANCELLED')
 );
drop policy if exists candidate_master_events_select_own on public.candidate_master_application_events;
create policy candidate_master_events_select_own on public.candidate_master_application_events
 for select to authenticated using (candidate_id = kingsmen_security.current_authenticated_candidate_id());
drop policy if exists candidate_master_events_insert_own on public.candidate_master_application_events;
create policy candidate_master_events_insert_own on public.candidate_master_application_events
 for insert to authenticated with check (
   candidate_id = kingsmen_security.current_authenticated_candidate_id()
   and actor_auth_user_id = (select auth.uid())
 );

revoke all on public.candidate_master_profiles, public.candidate_master_application_targets, public.candidate_master_application_events from anon;
grant select, insert, update on public.candidate_master_profiles to authenticated;
grant select, insert, update on public.candidate_master_application_targets to authenticated;
grant select, insert on public.candidate_master_application_events to authenticated;

comment on table public.candidate_master_profiles is
 'Candidate-owned reusable master application data. Provider-specific submissions are never implied by saving this profile.';
comment on table public.candidate_master_application_targets is
 'Candidate-selected provider targets planned from one master profile; source confidence defaults to UNVERIFIED until source verification.';
comment on table public.candidate_master_application_events is
 'Candidate-owned append-only event evidence for master profile and target planning actions.';
