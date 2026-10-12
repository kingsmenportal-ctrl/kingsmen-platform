-- N20 Final Assembly / System Lock / Production Readiness
-- PostgreSQL remains truth. This migration adds release locks, readiness gates, module registry, launch runbooks, and production evidence tables.
-- Markers: POSTGRES_TRUTH AIRTABLE_MIRROR_ONLY BACKEND_CONTROLS_STATE N8N_STATELESS_THIN_WORKERS
-- Markers: EMAIL_PRIMARY WHATSAPP_URGENT_ONLY SMS_BACKUP_ONLY PAYFAST_PROVIDER_BOUNDARY
-- Markers: NO_FAKE_STATUS NO_FAKE_DEADLINES NO_FAKE_ACCEPTANCE_CLAIMS NO_FAKE_PAYMENT_SUCCESS
-- Markers: NO_FAKE_AI_GOVERNANCE MAP_FALLBACK_REQUIRED PHOENIX_FALLBACK_CONTROLLED CAPS_LIMIT_VOLUME_NOT_SCOPE
-- Markers: ORACLE_LITE_DISCIPLINE POPIA_MINIMIZATION FOUNDER_FINAL_AUTHORITY

create extension if not exists pgcrypto;

create table if not exists public.release_module_registry (
  id uuid primary key default gen_random_uuid(),
  module_key text not null unique,
  module_name text not null,
  phase_order integer not null,
  release_status text not null default 'materialized' check (release_status in ('planned','materialized','validated','locked','deferred')),
  owner_boundary text not null,
  truth_source text not null default 'postgres',
  has_validator boolean not null default true,
  has_report boolean not null default true,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.system_release_locks (
  id uuid primary key default gen_random_uuid(),
  release_key text not null unique,
  release_name text not null,
  lock_status text not null default 'draft' check (lock_status in ('draft','locked','unlocked_for_repair','retired')),
  lock_reason text not null,
  locked_by text null,
  locked_at timestamptz null,
  unlocked_at timestamptz null,
  doctrine_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.production_readiness_checks (
  id uuid primary key default gen_random_uuid(),
  check_key text not null unique,
  check_group text not null,
  title text not null,
  description text not null,
  severity text not null default 'required' check (severity in ('required','recommended','watch')),
  status text not null default 'pending' check (status in ('pending','passed','failed','waived','not_applicable')),
  evidence_ref text null,
  remediation text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.launch_gate_decisions (
  id uuid primary key default gen_random_uuid(),
  gate_key text not null unique,
  gate_name text not null,
  gate_status text not null default 'closed' check (gate_status in ('closed','open','blocked','manual_review')),
  required_before text not null,
  decision_by text null,
  decision_at timestamptz null,
  decision_reason text null,
  evidence_ref text null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.deployment_environment_registry (
  id uuid primary key default gen_random_uuid(),
  environment_key text not null unique,
  environment_name text not null,
  environment_type text not null check (environment_type in ('local','staging','production','backup')),
  provider text not null,
  status text not null default 'not_connected' check (status in ('not_connected','configured','healthy','degraded','paused')),
  allowed_capacity integer not null default 0,
  secrets_required jsonb not null default '[]'::jsonb,
  secrets_committed boolean not null default false,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.release_artifact_evidence (
  id uuid primary key default gen_random_uuid(),
  artifact_key text not null unique,
  artifact_type text not null,
  artifact_path text not null,
  phase_key text not null,
  validation_status text not null default 'pending' check (validation_status in ('pending','passed','failed','manual_review')),
  commit_sha text null,
  evidence_summary text not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.backup_restore_drills (
  id uuid primary key default gen_random_uuid(),
  drill_key text not null unique,
  environment_key text not null,
  drill_type text not null check (drill_type in ('database_backup','database_restore','file_export','repo_clone','secrets_rotation')),
  status text not null default 'pending' check (status in ('pending','passed','failed','deferred')),
  scheduled_frequency text not null,
  last_tested_at timestamptz null,
  evidence_ref text null,
  failure_reason text null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.operational_runbooks (
  id uuid primary key default gen_random_uuid(),
  runbook_key text not null unique,
  title text not null,
  scenario text not null,
  owner_role text not null,
  severity text not null default 'normal' check (severity in ('normal','urgent','critical')),
  steps jsonb not null default '[]'::jsonb,
  automation_allowed boolean not null default false,
  human_approval_required boolean not null default true,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.final_system_manifest_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_key text not null unique,
  release_key text not null,
  active_candidate_cap integer not null default 500,
  route_scope text not null,
  doctrine_summary text not null,
  module_count integer not null,
  validation_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_release_module_registry_order on public.release_module_registry(phase_order);
create index if not exists idx_production_readiness_group on public.production_readiness_checks(check_group, status);
create index if not exists idx_launch_gate_status on public.launch_gate_decisions(gate_status);
create index if not exists idx_release_artifact_phase on public.release_artifact_evidence(phase_key, validation_status);
create index if not exists idx_runbook_severity on public.operational_runbooks(severity);

alter table public.release_module_registry enable row level security;
alter table public.system_release_locks enable row level security;
alter table public.production_readiness_checks enable row level security;
alter table public.launch_gate_decisions enable row level security;
alter table public.deployment_environment_registry enable row level security;
alter table public.release_artifact_evidence enable row level security;
alter table public.backup_restore_drills enable row level security;
alter table public.operational_runbooks enable row level security;
alter table public.final_system_manifest_snapshots enable row level security;

drop policy if exists service_all_release_module_registry on public.release_module_registry;
create policy service_all_release_module_registry on public.release_module_registry TO service_role for all using (true) with check (true);

drop policy if exists service_all_system_release_locks on public.system_release_locks;
create policy service_all_system_release_locks on public.system_release_locks TO service_role for all using (true) with check (true);

drop policy if exists service_all_production_readiness_checks on public.production_readiness_checks;
create policy service_all_production_readiness_checks on public.production_readiness_checks TO service_role for all using (true) with check (true);

drop policy if exists service_all_launch_gate_decisions on public.launch_gate_decisions;
create policy service_all_launch_gate_decisions on public.launch_gate_decisions TO service_role for all using (true) with check (true);

drop policy if exists service_all_deployment_environment_registry on public.deployment_environment_registry;
create policy service_all_deployment_environment_registry on public.deployment_environment_registry TO service_role for all using (true) with check (true);

drop policy if exists service_all_release_artifact_evidence on public.release_artifact_evidence;
create policy service_all_release_artifact_evidence on public.release_artifact_evidence TO service_role for all using (true) with check (true);

drop policy if exists service_all_backup_restore_drills on public.backup_restore_drills;
create policy service_all_backup_restore_drills on public.backup_restore_drills TO service_role for all using (true) with check (true);

drop policy if exists service_all_operational_runbooks on public.operational_runbooks;
create policy service_all_operational_runbooks on public.operational_runbooks TO service_role for all using (true) with check (true);

drop policy if exists service_all_final_system_manifest_snapshots on public.final_system_manifest_snapshots;
create policy service_all_final_system_manifest_snapshots on public.final_system_manifest_snapshots TO service_role for all using (true) with check (true);