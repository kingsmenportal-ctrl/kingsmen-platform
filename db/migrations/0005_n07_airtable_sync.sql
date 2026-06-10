-- N07 Airtable Sync
-- PostgreSQL remains the truth vault.
-- Airtable is an operational mirror only and must never orchestrate Kingsmen state.

create table if not exists public.airtable_base_registry (
  id uuid primary key default gen_random_uuid(),
  base_key text not null unique,
  base_name text not null,
  purpose text not null,
  mirror_allowed boolean not null default true,
  inbound_allowed boolean not null default false,
  outbound_allowed boolean not null default true,
  stores_secrets boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint airtable_base_registry_no_secret_storage check (stores_secrets = false)
);

create table if not exists public.airtable_sync_targets (
  id uuid primary key default gen_random_uuid(),
  base_key text not null references public.airtable_base_registry(base_key),
  table_key text not null,
  table_name text not null,
  postgres_table text not null,
  direction text not null,
  sync_priority integer not null default 50,
  mirror_frequency_seconds integer not null default 300,
  inbound_requires_operator_review boolean not null default true,
  backend_state_authoritative boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint airtable_sync_targets_direction_chk check (
    direction in (
      'POSTGRES_TO_AIRTABLE',
      'AIRTABLE_TO_POSTGRES_INTAKE_ONLY',
      'AIRTABLE_TO_POSTGRES_OPERATOR_NOTES_ONLY',
      'BIDIRECTIONAL_REVIEWED'
    )
  ),
  constraint airtable_sync_targets_state_truth_chk check (backend_state_authoritative = true),
  unique (base_key, table_key)
);

create table if not exists public.airtable_field_mappings (
  id uuid primary key default gen_random_uuid(),
  sync_target_id uuid not null references public.airtable_sync_targets(id) on delete cascade,
  postgres_column text not null,
  airtable_field_name text not null,
  field_class text not null default 'mirror',
  transform_rule text not null default 'copy',
  confidence_required text not null default 'medium',
  sensitive boolean not null default false,
  write_to_airtable boolean not null default true,
  read_from_airtable boolean not null default false,
  requires_operator_review boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint airtable_field_mappings_class_chk check (
    field_class in ('mirror', 'intake', 'operator_note', 'computed_status', 'evidence_pointer')
  ),
  constraint airtable_field_mappings_confidence_chk check (
    confidence_required in ('low', 'medium', 'high', 'official')
  )
);

create table if not exists public.airtable_sync_outbox (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  sync_target_id uuid not null references public.airtable_sync_targets(id),
  source_table text not null,
  source_record_id uuid,
  source_external_ref text,
  operation text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING',
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint airtable_sync_outbox_operation_chk check (
    operation in ('CREATE_MIRROR', 'UPDATE_MIRROR', 'ARCHIVE_MIRROR', 'UPSERT_MIRROR')
  ),
  constraint airtable_sync_outbox_status_chk check (
    status in ('PENDING', 'LOCKED', 'COMPLETED', 'FAILED', 'DEAD_LETTER')
  )
);

create table if not exists public.airtable_sync_runs (
  id uuid primary key default gen_random_uuid(),
  run_ref text not null unique,
  worker_ref text not null,
  sync_target_id uuid references public.airtable_sync_targets(id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'RUNNING',
  pulled_count integer not null default 0,
  pushed_count integer not null default 0,
  skipped_count integer not null default 0,
  conflict_count integer not null default 0,
  failed_count integer not null default 0,
  report jsonb not null default '{}'::jsonb,
  constraint airtable_sync_runs_status_chk check (
    status in ('RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL', 'CANCELLED')
  )
);

create table if not exists public.airtable_webhook_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_ref text not null unique,
  base_key text not null,
  table_key text,
  airtable_record_id text,
  event_type text not null,
  received_payload jsonb not null default '{}'::jsonb,
  normalized_payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  accepted boolean not null default false,
  rejection_reason text,
  requires_operator_review boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_airtable_sync_outbox_status_next
  on public.airtable_sync_outbox (status, next_attempt_at);

create index if not exists idx_airtable_sync_runs_target_started
  on public.airtable_sync_runs (sync_target_id, started_at desc);

create index if not exists idx_airtable_webhook_receipts_base_created
  on public.airtable_webhook_receipts (base_key, created_at desc);

alter table public.airtable_base_registry enable row level security;
alter table public.airtable_sync_targets enable row level security;
alter table public.airtable_field_mappings enable row level security;
alter table public.airtable_sync_outbox enable row level security;
alter table public.airtable_sync_runs enable row level security;
alter table public.airtable_webhook_receipts enable row level security;

drop policy if exists airtable_base_registry_service_all on public.airtable_base_registry;
create policy airtable_base_registry_service_all
  on public.airtable_base_registry
  for all
  using (true)
  with check (true);

drop policy if exists airtable_sync_targets_service_all on public.airtable_sync_targets;
create policy airtable_sync_targets_service_all
  on public.airtable_sync_targets
  for all
  using (true)
  with check (true);

drop policy if exists airtable_field_mappings_service_all on public.airtable_field_mappings;
create policy airtable_field_mappings_service_all
  on public.airtable_field_mappings
  for all
  using (true)
  with check (true);

drop policy if exists airtable_sync_outbox_service_all on public.airtable_sync_outbox;
create policy airtable_sync_outbox_service_all
  on public.airtable_sync_outbox
  for all
  using (true)
  with check (true);

drop policy if exists airtable_sync_runs_service_all on public.airtable_sync_runs;
create policy airtable_sync_runs_service_all
  on public.airtable_sync_runs
  for all
  using (true)
  with check (true);

drop policy if exists airtable_webhook_receipts_service_all on public.airtable_webhook_receipts;
create policy airtable_webhook_receipts_service_all
  on public.airtable_webhook_receipts
  for all
  using (true)
  with check (true);