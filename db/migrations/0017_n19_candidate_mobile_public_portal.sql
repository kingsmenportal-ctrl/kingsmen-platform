-- N19 Candidate Mobile / Public-to-Portal Experience
-- PostgreSQL remains truth. Mobile is a responsive portal experience, not a second source of truth.
-- Markers: MOBILE_WEB_FIRST PUBLIC_TO_PORTAL_HANDOFF EMAIL_PRIMARY WHATSAPP_URGENT_ONLY NO_FAKE_STATUS
-- Markers: SMART_FORM_DOES_NOT_RETYPE_DOCUMENT_DATA DEVICE_TRUST_REQUIRED POPIA_MINIMIZATION

create extension if not exists pgcrypto;

create table if not exists public.candidate_mobile_devices (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid null,
  account_id uuid null,
  device_label text not null,
  device_fingerprint_hash text not null,
  trust_level text not null default 'new' check (trust_level in ('new','trusted','restricted','revoked')),
  last_seen_at timestamptz null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.candidate_mobile_sessions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid null,
  account_id uuid null,
  device_id uuid null references public.candidate_mobile_devices(id) on delete set null,
  session_status text not null default 'active' check (session_status in ('active','expired','revoked')),
  auth_context text not null default 'portal',
  ip_hash text null,
  user_agent_hash text null,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '8 hours'),
  ended_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.public_to_portal_claims (
  id uuid primary key default gen_random_uuid(),
  lead_reference text not null unique,
  candidate_id uuid null,
  account_id uuid null,
  claim_status text not null default 'created' check (claim_status in ('created','sent','claimed','expired','revoked')),
  claim_channel text not null default 'email' check (claim_channel in ('email','sms_backup','operator')),
  claim_token_hash text not null,
  expires_at timestamptz not null,
  claimed_at timestamptz null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.candidate_onboarding_checklist (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null,
  checklist_key text not null,
  title text not null,
  explanation text not null,
  source_module text not null,
  status text not null default 'pending' check (status in ('pending','in_progress','done','blocked','not_required')),
  display_order integer not null default 100,
  required_before_state text null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique(candidate_id, checklist_key)
);

create table if not exists public.candidate_mobile_quick_actions (
  id uuid primary key default gen_random_uuid(),
  action_key text not null unique,
  label text not null,
  description text not null,
  allowed_surface text not null default 'candidate_mobile',
  target_module text not null,
  action_boundary text not null,
  is_enabled boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.candidate_mobile_status_cards (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null,
  card_key text not null,
  title text not null,
  body text not null,
  source_module text not null,
  confidence_band text not null default 'system' check (confidence_band in ('official','system','manual_review','candidate_supplied')),
  severity text not null default 'info' check (severity in ('info','warning','urgent','success')),
  visible_to_candidate boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  unique(candidate_id, card_key)
);

create table if not exists public.candidate_mobile_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null unique,
  email_enabled boolean not null default true,
  whatsapp_urgent_only boolean not null default true,
  sms_backup_enabled boolean not null default false,
  quiet_hours_start time not null default '20:00',
  quiet_hours_end time not null default '07:00',
  timezone text not null default 'Africa/Johannesburg',
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.candidate_mobile_activity_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid null,
  account_id uuid null,
  device_id uuid null,
  event_type text not null,
  event_source text not null,
  event_summary text not null,
  evidence_ref text null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.candidate_portal_resume_tokens (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid null,
  account_id uuid null,
  resume_context text not null,
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active','used','expired','revoked')),
  expires_at timestamptz not null,
  used_at timestamptz null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.candidate_mobile_accessibility_preferences (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null unique,
  preferred_language text not null default 'en-ZA',
  reduced_motion boolean not null default false,
  large_text boolean not null default false,
  low_data_mode boolean not null default true,
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_candidate_mobile_devices_candidate on public.candidate_mobile_devices(candidate_id);
create index if not exists idx_candidate_mobile_sessions_candidate on public.candidate_mobile_sessions(candidate_id);
create index if not exists idx_public_to_portal_claims_status on public.public_to_portal_claims(claim_status);
create index if not exists idx_candidate_onboarding_candidate on public.candidate_onboarding_checklist(candidate_id, status);
create index if not exists idx_mobile_status_cards_candidate on public.candidate_mobile_status_cards(candidate_id, visible_to_candidate);
create index if not exists idx_mobile_activity_candidate on public.candidate_mobile_activity_events(candidate_id, created_at desc);

alter table public.candidate_mobile_devices enable row level security;
alter table public.candidate_mobile_sessions enable row level security;
alter table public.public_to_portal_claims enable row level security;
alter table public.candidate_onboarding_checklist enable row level security;
alter table public.candidate_mobile_quick_actions enable row level security;
alter table public.candidate_mobile_status_cards enable row level security;
alter table public.candidate_mobile_notification_preferences enable row level security;
alter table public.candidate_mobile_activity_events enable row level security;
alter table public.candidate_portal_resume_tokens enable row level security;
alter table public.candidate_mobile_accessibility_preferences enable row level security;

drop policy if exists service_all_candidate_mobile_devices on public.candidate_mobile_devices;
create policy service_all_candidate_mobile_devices on public.candidate_mobile_devices for all TO service_role using (true) with check (true);

drop policy if exists service_all_candidate_mobile_sessions on public.candidate_mobile_sessions;
create policy service_all_candidate_mobile_sessions on public.candidate_mobile_sessions for all TO service_role using (true) with check (true);

drop policy if exists service_all_public_to_portal_claims on public.public_to_portal_claims;
create policy service_all_public_to_portal_claims on public.public_to_portal_claims for all TO service_role using (true) with check (true);

drop policy if exists service_all_candidate_onboarding_checklist on public.candidate_onboarding_checklist;
create policy service_all_candidate_onboarding_checklist on public.candidate_onboarding_checklist for all TO service_role using (true) with check (true);

drop policy if exists service_all_candidate_mobile_quick_actions on public.candidate_mobile_quick_actions;
create policy service_all_candidate_mobile_quick_actions on public.candidate_mobile_quick_actions for all TO service_role using (true) with check (true);

drop policy if exists service_all_candidate_mobile_status_cards on public.candidate_mobile_status_cards;
create policy service_all_candidate_mobile_status_cards on public.candidate_mobile_status_cards for all TO service_role using (true) with check (true);

drop policy if exists service_all_candidate_mobile_notification_preferences on public.candidate_mobile_notification_preferences;
create policy service_all_candidate_mobile_notification_preferences on public.candidate_mobile_notification_preferences for all TO service_role using (true) with check (true);

drop policy if exists service_all_candidate_mobile_activity_events on public.candidate_mobile_activity_events;
create policy service_all_candidate_mobile_activity_events on public.candidate_mobile_activity_events for all TO service_role using (true) with check (true);

drop policy if exists service_all_candidate_portal_resume_tokens on public.candidate_portal_resume_tokens;
create policy service_all_candidate_portal_resume_tokens on public.candidate_portal_resume_tokens for all TO service_role using (true) with check (true);

drop policy if exists service_all_candidate_mobile_accessibility_preferences on public.candidate_mobile_accessibility_preferences;
create policy service_all_candidate_mobile_accessibility_preferences on public.candidate_mobile_accessibility_preferences for all TO service_role using (true) with check (true);