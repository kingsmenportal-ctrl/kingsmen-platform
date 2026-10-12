create table if not exists public.orchestrator_runtime_config (
  config_key text primary key,
  config_value jsonb not null,
  config_scope text not null default 'ORCHESTRATOR',
  locked boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orchestrator_worker_registry (
  worker_code text primary key,
  worker_name text not null,
  worker_kind text not null,
  target_state text not null,
  is_same_state_worker boolean not null default false,
  requires_w17_gate boolean not null default false,
  requires_human_approval boolean not null default false,
  can_dispatch_playwright boolean not null default false,
  active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orchestrator_worker_kind_chk check (worker_kind in ('INTAKE','EVALUATION','EXECUTION','GOVERNANCE','DOCUMENT','COMMUNICATION','FINANCE','CONTENT','ANALYTICS','COMMAND','KERNEL','PLAYWRIGHT','STATUS','OUTREACH')),
  constraint orchestrator_worker_state_chk check (target_state in ('SAME','NEW','INTAKE_PENDING','EVALUATION_PENDING','DOCUMENT_PENDING','EXECUTION_PENDING','COMPLETED','FAILED'))
);

create table if not exists public.orchestrator_state_guards (
  id uuid primary key default gen_random_uuid(),
  guard_ref text unique not null,
  from_state text not null,
  to_state text not null,
  guard_name text not null,
  required_evidence text[] not null default array[]::text[],
  human_approval_required boolean not null default false,
  blocked_by_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint orchestrator_state_guard_from_chk check (from_state in ('NEW','INTAKE_PENDING','EVALUATION_PENDING','DOCUMENT_PENDING','EXECUTION_PENDING','COMPLETED','FAILED','ANY')),
  constraint orchestrator_state_guard_to_chk check (to_state in ('NEW','INTAKE_PENDING','EVALUATION_PENDING','DOCUMENT_PENDING','EXECUTION_PENDING','COMPLETED','FAILED','SAME'))
);

create table if not exists public.orchestrator_execution_plans (
  id uuid primary key default gen_random_uuid(),
  plan_ref text unique not null,
  candidate_ref text,
  application_ref text,
  plan_type text not null,
  current_state text not null,
  desired_state text not null,
  priority_lane text not null default 'NORMAL',
  source_confidence text not null default 'MEDIUM',
  plan_status text not null default 'DRAFT',
  sealed_exact_targets boolean not null default true,
  evidence_refs text[] not null default array[]::text[],
  created_by text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orchestrator_plan_type_chk check (plan_type in ('INTAKE','EVALUATION','DOCUMENT','EXECUTION','STATUS','FEE','CONTENT','OUTREACH','ANALYTICS','COMMAND','PHOENIX_FALLBACK','MAP_HANDOFF')),
  constraint orchestrator_plan_state_chk check (current_state in ('NEW','INTAKE_PENDING','EVALUATION_PENDING','DOCUMENT_PENDING','EXECUTION_PENDING','COMPLETED','FAILED')),
  constraint orchestrator_plan_desired_chk check (desired_state in ('INTAKE_PENDING','EVALUATION_PENDING','DOCUMENT_PENDING','EXECUTION_PENDING','COMPLETED','FAILED','SAME')),
  constraint orchestrator_plan_priority_chk check (priority_lane in ('LOW','NORMAL','HIGH','URGENT','FOUNDER_OVERRIDE')),
  constraint orchestrator_plan_status_chk check (plan_status in ('DRAFT','READY','DISPATCHING','RUNNING','WAITING_APPROVAL','WAITING_MANUAL','COMPLETED','FAILED','CANCELLED')),
  constraint orchestrator_plan_confidence_chk check (source_confidence in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED'))
);

create table if not exists public.orchestrator_runs (
  id uuid primary key default gen_random_uuid(),
  run_ref text unique not null,
  plan_ref text not null,
  command_ref text,
  candidate_ref text,
  application_ref text,
  run_status text not null default 'QUEUED',
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  fix_path text,
  retry_count integer not null default 0,
  max_retries integer not null default 2,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint orchestrator_run_status_chk check (run_status in ('QUEUED','RUNNING','WAITING_WORKER','WAITING_APPROVAL','WAITING_MANUAL','COMPLETED','FAILED','CANCELLED')),
  constraint orchestrator_retry_count_chk check (retry_count >= 0 and max_retries >= 0 and retry_count <= 20)
);

create table if not exists public.orchestrator_steps (
  id uuid primary key default gen_random_uuid(),
  step_ref text unique not null,
  run_ref text not null,
  step_order integer not null,
  worker_code text not null,
  step_name text not null,
  step_status text not null default 'PENDING',
  expected_result_state text not null default 'SAME',
  started_at timestamptz,
  completed_at timestamptz,
  failure_reason text,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint orchestrator_step_status_chk check (step_status in ('PENDING','DISPATCHED','RUNNING','SUCCEEDED','FAILED','SKIPPED','WAITING_APPROVAL','WAITING_MANUAL')),
  constraint orchestrator_step_expected_state_chk check (expected_result_state in ('SAME','NEW','INTAKE_PENDING','EVALUATION_PENDING','DOCUMENT_PENDING','EXECUTION_PENDING','COMPLETED','FAILED'))
);

create table if not exists public.orchestrator_dispatch_queue (
  id uuid primary key default gen_random_uuid(),
  dispatch_ref text unique not null,
  run_ref text not null,
  step_ref text not null,
  worker_code text not null,
  queue_status text not null default 'READY',
  priority_lane text not null default 'NORMAL',
  dispatch_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  attempt_count integer not null default 0,
  max_attempts integer not null default 2,
  payload jsonb not null default '{}'::jsonb,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint orchestrator_dispatch_status_chk check (queue_status in ('READY','LOCKED','SENT','ACKED','FAILED','CANCELLED','DEAD_LETTER')),
  constraint orchestrator_dispatch_priority_chk check (priority_lane in ('LOW','NORMAL','HIGH','URGENT','FOUNDER_OVERRIDE')),
  constraint orchestrator_dispatch_attempt_chk check (attempt_count >= 0 and max_attempts >= 0 and attempt_count <= 20)
);

create table if not exists public.orchestrator_idempotency_claims (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text unique not null,
  run_ref text not null,
  worker_code text,
  claim_status text not null default 'CLAIMED',
  request_hash text not null,
  result_hash text,
  claimed_at timestamptz not null default now(),
  expires_at timestamptz,
  completed_at timestamptz,
  constraint orchestrator_idempotency_status_chk check (claim_status in ('CLAIMED','COMPLETED','FAILED','EXPIRED'))
);

create table if not exists public.orchestrator_worker_results (
  id uuid primary key default gen_random_uuid(),
  result_ref text unique not null,
  run_ref text,
  step_ref text,
  worker_code text not null,
  worker_status text not null,
  proposed_state text not null default 'SAME',
  result_payload jsonb not null default '{}'::jsonb,
  evidence_refs text[] not null default array[]::text[],
  accepted_by_orchestrator boolean not null default false,
  rejection_reason text,
  received_at timestamptz not null default now(),
  constraint orchestrator_worker_status_chk check (worker_status in ('SUCCEEDED','FAILED','BLOCKED','NEEDS_APPROVAL','NEEDS_MANUAL','DUPLICATE')),
  constraint orchestrator_result_state_chk check (proposed_state in ('SAME','NEW','INTAKE_PENDING','EVALUATION_PENDING','DOCUMENT_PENDING','EXECUTION_PENDING','COMPLETED','FAILED'))
);

create table if not exists public.orchestrator_manual_handoffs (
  id uuid primary key default gen_random_uuid(),
  handoff_ref text unique not null,
  run_ref text,
  step_ref text,
  handoff_type text not null,
  handoff_status text not null default 'OPEN',
  reason text not null,
  fix_path text not null,
  candidate_facing_message text,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint orchestrator_handoff_type_chk check (handoff_type in ('MAP','CAPTCHA','OTP','PORTAL_DOWN','MANUAL_ONLY','HUMAN_APPROVAL','PHOENIX_FALLBACK','DOCUMENT_REVIEW','SOURCE_REVIEW')),
  constraint orchestrator_handoff_status_chk check (handoff_status in ('OPEN','IN_PROGRESS','RESOLVED','CANCELLED'))
);

create table if not exists public.orchestrator_execution_events (
  id uuid primary key default gen_random_uuid(),
  event_ref text unique not null,
  run_ref text,
  step_ref text,
  event_type text not null,
  severity text not null default 'INFO',
  event_message text not null,
  event_payload jsonb not null default '{}'::jsonb,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint orchestrator_event_severity_chk check (severity in ('INFO','WATCH','WARNING','CRITICAL')),
  constraint orchestrator_event_type_chk check (event_type in ('PLAN_CREATED','STATE_GUARD_CHECKED','DISPATCH_READY','WORKER_SENT','WORKER_RESULT_RECEIVED','STATE_TRANSITION_ACCEPTED','STATE_TRANSITION_REJECTED','RETRY_SCHEDULED','MANUAL_HANDOFF_CREATED','RUN_COMPLETED','RUN_FAILED','CAPACITY_BLOCKED','APPROVAL_REQUIRED'))
);

create table if not exists public.orchestrator_capacity_lanes (
  lane_key text primary key,
  lane_name text not null,
  max_parallel_runs integer not null default 1,
  current_active_runs integer not null default 0,
  throttle_seconds integer not null default 5,
  lane_status text not null default 'OPEN',
  notes text not null default '',
  updated_at timestamptz not null default now(),
  constraint orchestrator_capacity_lane_status_chk check (lane_status in ('OPEN','THROTTLED','PAUSED','CLOSED')),
  constraint orchestrator_capacity_nonnegative_chk check (max_parallel_runs >= 0 and current_active_runs >= 0 and throttle_seconds >= 0)
);

create index if not exists idx_orchestrator_plans_status on public.orchestrator_execution_plans(plan_status, priority_lane, created_at);
create index if not exists idx_orchestrator_runs_status on public.orchestrator_runs(run_status, created_at);
create index if not exists idx_orchestrator_steps_run on public.orchestrator_steps(run_ref, step_order);
create index if not exists idx_orchestrator_dispatch_ready on public.orchestrator_dispatch_queue(queue_status, priority_lane, dispatch_after);
create index if not exists idx_orchestrator_results_worker on public.orchestrator_worker_results(worker_code, received_at desc);
create index if not exists idx_orchestrator_handoffs_status on public.orchestrator_manual_handoffs(handoff_status, handoff_type, created_at desc);
create index if not exists idx_orchestrator_events_run on public.orchestrator_execution_events(run_ref, created_at desc);

alter table public.orchestrator_runtime_config enable row level security;
alter table public.orchestrator_worker_registry enable row level security;
alter table public.orchestrator_state_guards enable row level security;
alter table public.orchestrator_execution_plans enable row level security;
alter table public.orchestrator_runs enable row level security;
alter table public.orchestrator_steps enable row level security;
alter table public.orchestrator_dispatch_queue enable row level security;
alter table public.orchestrator_idempotency_claims enable row level security;
alter table public.orchestrator_worker_results enable row level security;
alter table public.orchestrator_manual_handoffs enable row level security;
alter table public.orchestrator_execution_events enable row level security;
alter table public.orchestrator_capacity_lanes enable row level security;

drop policy if exists orchestrator_runtime_config_all on public.orchestrator_runtime_config;
create policy orchestrator_runtime_config_all on public.orchestrator_runtime_config for all TO service_role using (true) with check (true);
drop policy if exists orchestrator_worker_registry_all on public.orchestrator_worker_registry;
create policy orchestrator_worker_registry_all on public.orchestrator_worker_registry for all TO service_role using (true) with check (true);
drop policy if exists orchestrator_state_guards_all on public.orchestrator_state_guards;
create policy orchestrator_state_guards_all on public.orchestrator_state_guards for all TO service_role using (true) with check (true);
drop policy if exists orchestrator_execution_plans_all on public.orchestrator_execution_plans;
create policy orchestrator_execution_plans_all on public.orchestrator_execution_plans for all TO service_role using (true) with check (true);
drop policy if exists orchestrator_runs_all on public.orchestrator_runs;
create policy orchestrator_runs_all on public.orchestrator_runs for all TO service_role using (true) with check (true);
drop policy if exists orchestrator_steps_all on public.orchestrator_steps;
create policy orchestrator_steps_all on public.orchestrator_steps for all TO service_role using (true) with check (true);
drop policy if exists orchestrator_dispatch_queue_all on public.orchestrator_dispatch_queue;
create policy orchestrator_dispatch_queue_all on public.orchestrator_dispatch_queue for all TO service_role using (true) with check (true);
drop policy if exists orchestrator_idempotency_claims_all on public.orchestrator_idempotency_claims;
create policy orchestrator_idempotency_claims_all on public.orchestrator_idempotency_claims for all TO service_role using (true) with check (true);
drop policy if exists orchestrator_worker_results_all on public.orchestrator_worker_results;
create policy orchestrator_worker_results_all on public.orchestrator_worker_results for all TO service_role using (true) with check (true);
drop policy if exists orchestrator_manual_handoffs_all on public.orchestrator_manual_handoffs;
create policy orchestrator_manual_handoffs_all on public.orchestrator_manual_handoffs for all TO service_role using (true) with check (true);
drop policy if exists orchestrator_execution_events_all on public.orchestrator_execution_events;
create policy orchestrator_execution_events_all on public.orchestrator_execution_events for all TO service_role using (true) with check (true);
drop policy if exists orchestrator_capacity_lanes_all on public.orchestrator_capacity_lanes;
create policy orchestrator_capacity_lanes_all on public.orchestrator_capacity_lanes for all TO service_role using (true) with check (true);