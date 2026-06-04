-- N07-AIRTABLE-02 — Airtable mirror job schema declaration.
-- Apply through approved migration runner only. Do not apply directly to production.

create table if not exists airtable_mirror_jobs (
  id uuid primary key,
  idempotency_key text not null unique,
  source_entity_type text not null,
  source_entity_id text not null,
  target_base_name text not null,
  target_table_name text not null,
  operation text not null,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  postgres_truth_preserved boolean not null default true,
  airtable_mirror_only boolean not null default true,
  next_attempt_at timestamptz,
  last_error text,
  evidence_id uuid,
  audit_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists airtable_mirror_dlq (
  id uuid primary key,
  mirror_job_id uuid references airtable_mirror_jobs(id),
  reason text not null,
  last_error text not null,
  attempt_count integer not null,
  operator_review_required boolean not null default true,
  evidence_id uuid,
  audit_id uuid,
  created_at timestamptz not null default now()
);

create or replace view airtable_mirror_job_health_view as
select
  status,
  count(*) as job_count,
  max(updated_at) as last_seen_at,
  false as production_ready
from airtable_mirror_jobs
group by status;

alter table airtable_mirror_jobs enable row level security;
alter table airtable_mirror_dlq enable row level security;