create table if not exists public.control_plane_operator_profiles (
  id uuid primary key default gen_random_uuid(),
  operator_ref text unique not null,
  display_name text not null,
  email text not null,
  role text not null default 'founder',
  status text not null default 'ACTIVE',
  allowed_command_scopes text[] not null default array['read','queue','approve','report'],
  can_use_dangerous_actions boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.control_plane_command_catalog (
  id uuid primary key default gen_random_uuid(),
  command_key text unique not null,
  command_name text not null,
  command_scope text not null,
  description text not null,
  requires_approval boolean not null default true,
  dangerous boolean not null default false,
  allowed_roles text[] not null default array['founder'],
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.control_plane_command_requests (
  id uuid primary key default gen_random_uuid(),
  command_ref text unique not null,
  command_key text not null,
  requested_by_operator_ref text not null,
  target_type text not null,
  target_ref text,
  payload jsonb not null default '{}'::jsonb,
  reason text not null,
  status text not null default 'REQUESTED',
  approval_ref text,
  idempotency_key text unique not null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  completed_at timestamptz,
  last_error text
);

create table if not exists public.control_plane_approval_queue (
  id uuid primary key default gen_random_uuid(),
  approval_ref text unique not null,
  command_ref text,
  approval_type text not null,
  risk_level text not null default 'MEDIUM',
  target_type text not null,
  target_ref text,
  summary text not null,
  evidence_refs text[] not null default array[]::text[],
  requested_by_operator_ref text not null,
  reviewed_by_operator_ref text,
  decision text not null default 'PENDING',
  decision_reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.control_plane_queue_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_ref text unique not null,
  queue_name text not null,
  queue_type text not null,
  total_count integer not null default 0,
  urgent_count integer not null default 0,
  blocked_count integer not null default 0,
  manual_count integer not null default 0,
  oldest_item_age_minutes integer not null default 0,
  capacity_status text not null default 'NORMAL',
  generated_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);

create table if not exists public.control_plane_kill_switches (
  id uuid primary key default gen_random_uuid(),
  switch_key text unique not null,
  switch_name text not null,
  scope text not null,
  enabled boolean not null default false,
  reason text,
  changed_by_operator_ref text,
  changed_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.control_plane_capacity_limits (
  id uuid primary key default gen_random_uuid(),
  limit_key text unique not null,
  limit_name text not null,
  current_value integer not null,
  max_value integer not null,
  warn_at integer not null,
  throttle_at integer not null,
  stop_at integer not null,
  status text not null default 'NORMAL',
  measured_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);

create table if not exists public.control_plane_worker_health (
  id uuid primary key default gen_random_uuid(),
  worker_key text not null,
  workflow_key text not null,
  status text not null default 'UNKNOWN',
  last_heartbeat_at timestamptz,
  failure_count_24h integer not null default 0,
  blocked_reason text,
  details jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create table if not exists public.control_plane_operator_audit (
  id uuid primary key default gen_random_uuid(),
  audit_ref text unique not null,
  operator_ref text not null,
  action text not null,
  target_type text not null,
  target_ref text,
  command_ref text,
  approval_ref text,
  evidence_refs text[] not null default array[]::text[],
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.control_plane_report_registry (
  id uuid primary key default gen_random_uuid(),
  report_ref text unique not null,
  report_type text not null,
  title text not null,
  status text not null default 'READY',
  summary jsonb not null default '{}'::jsonb,
  generated_by text not null default 'system',
  generated_at timestamptz not null default now()
);

create index if not exists idx_cp_commands_status on public.control_plane_command_requests(status, created_at desc);
create index if not exists idx_cp_approvals_decision on public.control_plane_approval_queue(decision, risk_level, created_at desc);
create index if not exists idx_cp_queue_snapshots on public.control_plane_queue_snapshots(queue_name, generated_at desc);
create index if not exists idx_cp_worker_health on public.control_plane_worker_health(status, recorded_at desc);
create index if not exists idx_cp_operator_audit on public.control_plane_operator_audit(operator_ref, created_at desc);

alter table public.control_plane_operator_profiles enable row level security;
alter table public.control_plane_command_catalog enable row level security;
alter table public.control_plane_command_requests enable row level security;
alter table public.control_plane_approval_queue enable row level security;
alter table public.control_plane_queue_snapshots enable row level security;
alter table public.control_plane_kill_switches enable row level security;
alter table public.control_plane_capacity_limits enable row level security;
alter table public.control_plane_worker_health enable row level security;
alter table public.control_plane_operator_audit enable row level security;
alter table public.control_plane_report_registry enable row level security;

drop policy if exists cp_operator_profiles_all on public.control_plane_operator_profiles;
create policy cp_operator_profiles_all on public.control_plane_operator_profiles for all TO service_role using (true) with check (true);
drop policy if exists cp_command_catalog_all on public.control_plane_command_catalog;
create policy cp_command_catalog_all on public.control_plane_command_catalog for all TO service_role using (true) with check (true);
drop policy if exists cp_command_requests_all on public.control_plane_command_requests;
create policy cp_command_requests_all on public.control_plane_command_requests for all TO service_role using (true) with check (true);
drop policy if exists cp_approval_queue_all on public.control_plane_approval_queue;
create policy cp_approval_queue_all on public.control_plane_approval_queue for all TO service_role using (true) with check (true);
drop policy if exists cp_queue_snapshots_all on public.control_plane_queue_snapshots;
create policy cp_queue_snapshots_all on public.control_plane_queue_snapshots for all TO service_role using (true) with check (true);
drop policy if exists cp_kill_switches_all on public.control_plane_kill_switches;
create policy cp_kill_switches_all on public.control_plane_kill_switches for all TO service_role using (true) with check (true);
drop policy if exists cp_capacity_limits_all on public.control_plane_capacity_limits;
create policy cp_capacity_limits_all on public.control_plane_capacity_limits for all TO service_role using (true) with check (true);
drop policy if exists cp_worker_health_all on public.control_plane_worker_health;
create policy cp_worker_health_all on public.control_plane_worker_health for all TO service_role using (true) with check (true);
drop policy if exists cp_operator_audit_all on public.control_plane_operator_audit;
create policy cp_operator_audit_all on public.control_plane_operator_audit for all TO service_role using (true) with check (true);
drop policy if exists cp_report_registry_all on public.control_plane_report_registry;
create policy cp_report_registry_all on public.control_plane_report_registry for all TO service_role using (true) with check (true);