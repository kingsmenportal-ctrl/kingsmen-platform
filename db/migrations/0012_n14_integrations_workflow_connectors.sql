create table if not exists public.integration_connectors (
  id uuid primary key default gen_random_uuid(),
  connector_key text unique not null,
  connector_name text not null,
  connector_type text not null,
  trust_boundary text not null,
  enabled boolean not null default false,
  requires_secret boolean not null default true,
  secret_ref text,
  endpoint_ref text,
  rate_limit_per_minute integer not null default 30,
  timeout_ms integer not null default 30000,
  doctrine_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_connector_registry (
  id uuid primary key default gen_random_uuid(),
  workflow_code text unique not null,
  workflow_name text not null,
  target_state text not null,
  connector_key text not null,
  enabled boolean not null default false,
  same_state_worker boolean not null default false,
  standard_contract_required boolean not null default true,
  max_airtable_writes integer not null default 1,
  max_backend_result_posts integer not null default 1,
  doctrine_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflow_connector_write_limits_chk check (max_airtable_writes <= 1 and max_backend_result_posts = 1)
);

create table if not exists public.integration_outbox (
  id uuid primary key default gen_random_uuid(),
  outbox_ref text unique not null,
  command_ref text,
  workflow_code text,
  connector_key text not null,
  payload jsonb not null default '{}'::jsonb,
  payload_hash text not null,
  dispatch_status text not null default 'PENDING',
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  next_attempt_at timestamptz not null default now(),
  failure_reason text,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint integration_outbox_status_chk check (dispatch_status in ('PENDING','DISPATCHING','SENT','ACKED','FAILED','DLQ','CANCELLED'))
);

create table if not exists public.integration_inbox (
  id uuid primary key default gen_random_uuid(),
  inbox_ref text unique not null,
  connector_key text not null,
  workflow_code text,
  event_type text not null,
  idempotency_key text not null,
  signature_status text not null default 'UNVERIFIED',
  payload jsonb not null default '{}'::jsonb,
  payload_hash text not null,
  ingest_status text not null default 'RECEIVED',
  reject_reason text,
  evidence_refs text[] not null default array[]::text[],
  received_at timestamptz not null default now(),
  unique(connector_key, idempotency_key)
);

create table if not exists public.workflow_result_events (
  id uuid primary key default gen_random_uuid(),
  result_ref text unique not null,
  workflow_code text not null,
  command_ref text,
  candidate_ref text,
  application_ref text,
  previous_state text,
  requested_state text,
  accepted_state text,
  state_change_allowed boolean not null default false,
  result_status text not null default 'RECEIVED',
  worker_node_count integer not null default 8,
  airtable_write_count integer not null default 0,
  backend_result_post_count integer not null default 1,
  evidence_refs text[] not null default array[]::text[],
  rejection_reason text,
  received_at timestamptz not null default now(),
  constraint workflow_result_worker_node_count_chk check (worker_node_count = 8),
  constraint workflow_result_airtable_write_count_chk check (airtable_write_count <= 1),
  constraint workflow_result_backend_result_post_count_chk check (backend_result_post_count = 1)
);

create table if not exists public.webhook_security_events (
  id uuid primary key default gen_random_uuid(),
  security_ref text unique not null,
  connector_key text not null,
  event_ref text,
  signature_status text not null,
  blocked boolean not null default false,
  reason text not null default '',
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now()
);

create table if not exists public.n8n_workflow_dispatches (
  id uuid primary key default gen_random_uuid(),
  dispatch_ref text unique not null,
  workflow_code text not null,
  command_ref text,
  n8n_webhook_ref text not null,
  dispatch_status text not null default 'PENDING',
  worker_contract_valid boolean not null default false,
  airtable_write_count integer not null default 0,
  backend_result_post_count integer not null default 0,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint n8n_dispatch_write_limits_chk check (airtable_write_count <= 1 and backend_result_post_count <= 1)
);

create table if not exists public.airtable_mirror_events (
  id uuid primary key default gen_random_uuid(),
  mirror_ref text unique not null,
  base_name text not null,
  table_name text not null,
  postgres_source_table text not null,
  source_record_ref text not null,
  mirror_status text not null default 'PENDING',
  direction text not null default 'POSTGRES_TO_AIRTABLE_MIRROR',
  conflict_policy text not null default 'POSTGRES_WINS',
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now()
);

create table if not exists public.playwright_probe_events (
  id uuid primary key default gen_random_uuid(),
  probe_ref text unique not null,
  portal_ref text not null,
  candidate_ref text,
  application_ref text,
  probe_type text not null,
  probe_status text not null default 'PENDING',
  block_reason text,
  map_required boolean not null default false,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now()
);

create table if not exists public.integration_dead_letter_queue (
  id uuid primary key default gen_random_uuid(),
  dlq_ref text unique not null,
  source_ref text not null,
  source_type text not null,
  connector_key text not null,
  severity text not null default 'WATCH',
  status text not null default 'OPEN',
  cause text not null default '',
  reason text not null default '',
  fix_path text not null default '',
  payload jsonb not null default '{}'::jsonb,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now()
);

create table if not exists public.integration_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  health_ref text unique not null,
  connector_key text not null,
  health_status text not null default 'UNKNOWN',
  failure_rate numeric(8,4) not null default 0,
  backlog_count integer not null default 0,
  latency_ms integer,
  reason text not null default '',
  fix_path text not null default '',
  evidence_refs text[] not null default array[]::text[],
  captured_at timestamptz not null default now()
);

create index if not exists idx_integration_outbox_status on public.integration_outbox(dispatch_status, next_attempt_at);
create index if not exists idx_integration_inbox_idempotency on public.integration_inbox(connector_key, idempotency_key);
create index if not exists idx_workflow_result_events_code on public.workflow_result_events(workflow_code, received_at desc);
create index if not exists idx_integration_dlq_status on public.integration_dead_letter_queue(status, severity, created_at desc);

alter table public.integration_connectors enable row level security;
alter table public.workflow_connector_registry enable row level security;
alter table public.integration_outbox enable row level security;
alter table public.integration_inbox enable row level security;
alter table public.workflow_result_events enable row level security;
alter table public.webhook_security_events enable row level security;
alter table public.n8n_workflow_dispatches enable row level security;
alter table public.airtable_mirror_events enable row level security;
alter table public.playwright_probe_events enable row level security;
alter table public.integration_dead_letter_queue enable row level security;
alter table public.integration_health_snapshots enable row level security;

drop policy if exists integration_connectors_all on public.integration_connectors;
create policy integration_connectors_all on public.integration_connectors for all using (true) with check (true);
drop policy if exists workflow_connector_registry_all on public.workflow_connector_registry;
create policy workflow_connector_registry_all on public.workflow_connector_registry for all using (true) with check (true);
drop policy if exists integration_outbox_all on public.integration_outbox;
create policy integration_outbox_all on public.integration_outbox for all using (true) with check (true);
drop policy if exists integration_inbox_all on public.integration_inbox;
create policy integration_inbox_all on public.integration_inbox for all using (true) with check (true);
drop policy if exists workflow_result_events_all on public.workflow_result_events;
create policy workflow_result_events_all on public.workflow_result_events for all using (true) with check (true);
drop policy if exists webhook_security_events_all on public.webhook_security_events;
create policy webhook_security_events_all on public.webhook_security_events for all using (true) with check (true);
drop policy if exists n8n_workflow_dispatches_all on public.n8n_workflow_dispatches;
create policy n8n_workflow_dispatches_all on public.n8n_workflow_dispatches for all using (true) with check (true);
drop policy if exists airtable_mirror_events_all on public.airtable_mirror_events;
create policy airtable_mirror_events_all on public.airtable_mirror_events for all using (true) with check (true);
drop policy if exists playwright_probe_events_all on public.playwright_probe_events;
create policy playwright_probe_events_all on public.playwright_probe_events for all using (true) with check (true);
drop policy if exists integration_dead_letter_queue_all on public.integration_dead_letter_queue;
create policy integration_dead_letter_queue_all on public.integration_dead_letter_queue for all using (true) with check (true);
drop policy if exists integration_health_snapshots_all on public.integration_health_snapshots;
create policy integration_health_snapshots_all on public.integration_health_snapshots for all using (true) with check (true);