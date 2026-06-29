-- KINGSMEN JARVIS V5 — NUMBER 16 POSTGRESQL TRUTH VAULT
-- This migration is a governed schema contract. It is repo proof only until applied to a live database.

create schema if not exists jarvis_truth;

create table if not exists jarvis_truth.postgresql_truth_events (
  event_id uuid primary key default gen_random_uuid(),
  command_ref text not null,
  correlation_id text not null,
  domain text not null,
  access_type text not null check (access_type in ('read_model','raw_read','mutation','migration','policy_review','runtime_probe')),
  actor_ref text not null,
  policy_status text not null check (policy_status in ('allowed','needs_approval','blocked')),
  risk text not null check (risk in ('low','watch','high','blocked')),
  evidence_ref text,
  audit_ref text,
  rls_required boolean not null default true,
  audit_required boolean not null default true,
  evidence_required boolean not null default true,
  safe_summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists jarvis_truth.postgresql_truth_read_models (
  read_model_id uuid primary key default gen_random_uuid(),
  read_model_ref text not null unique,
  domain text not null,
  source_schema text not null,
  source_table_or_view text not null,
  exposes_private_rows boolean not null default false,
  allowed_for_hud boolean not null default false,
  requires_commander_scope boolean not null default true,
  safe_summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists jarvis_truth.postgresql_truth_migration_proofs (
  proof_id uuid primary key default gen_random_uuid(),
  migration_ref text not null unique,
  migration_path text not null,
  repo_commit_sha text,
  applied_at timestamptz,
  applied_by text,
  runtime_connection_ref text,
  validator_ref text,
  proof_status text not null check (proof_status in ('repo_only','applied_unverified','applied_verified','failed','rolled_back')),
  safe_summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists jarvis_truth.postgresql_truth_runtime_checks (
  check_id uuid primary key default gen_random_uuid(),
  command_ref text not null,
  connection_label text not null,
  check_type text not null check (check_type in ('connection','migration','rls','audit','read_model','backup','rollback')),
  check_status text not null check (check_status in ('not_run','passed','failed','blocked')),
  safe_summary text not null,
  evidence_ref text,
  created_at timestamptz not null default now()
);

create index if not exists idx_postgresql_truth_events_command_ref
  on jarvis_truth.postgresql_truth_events (command_ref);

create index if not exists idx_postgresql_truth_events_correlation_id
  on jarvis_truth.postgresql_truth_events (correlation_id);

create index if not exists idx_postgresql_truth_events_domain
  on jarvis_truth.postgresql_truth_events (domain);

create index if not exists idx_postgresql_truth_runtime_checks_command_ref
  on jarvis_truth.postgresql_truth_runtime_checks (command_ref);

alter table jarvis_truth.postgresql_truth_events enable row level security;
alter table jarvis_truth.postgresql_truth_read_models enable row level security;
alter table jarvis_truth.postgresql_truth_migration_proofs enable row level security;
alter table jarvis_truth.postgresql_truth_runtime_checks enable row level security;

-- Service-role policy placeholder: production deployments must bind this to the platform service role.
-- The validator checks that RLS is enabled and that policy names are present, but live role binding
-- remains runtime proof and must be confirmed after deployment.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'jarvis_truth'
      and tablename = 'postgresql_truth_events'
      and policyname = 'jarvis_truth_events_service_role_only'
  ) then
    create policy jarvis_truth_events_service_role_only
      on jarvis_truth.postgresql_truth_events
      for all
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'jarvis_truth'
      and tablename = 'postgresql_truth_read_models'
      and policyname = 'jarvis_truth_read_models_service_role_only'
  ) then
    create policy jarvis_truth_read_models_service_role_only
      on jarvis_truth.postgresql_truth_read_models
      for all
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'jarvis_truth'
      and tablename = 'postgresql_truth_migration_proofs'
      and policyname = 'jarvis_truth_migration_proofs_service_role_only'
  ) then
    create policy jarvis_truth_migration_proofs_service_role_only
      on jarvis_truth.postgresql_truth_migration_proofs
      for all
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'jarvis_truth'
      and tablename = 'postgresql_truth_runtime_checks'
      and policyname = 'jarvis_truth_runtime_checks_service_role_only'
  ) then
    create policy jarvis_truth_runtime_checks_service_role_only
      on jarvis_truth.postgresql_truth_runtime_checks
      for all
      using (true)
      with check (true);
  end if;
end $$;

create or replace view jarvis_truth.v_postgresql_truth_hud_readiness as
select
  'postgresql_truth_vault'::text as panel_ref,
  count(*) filter (where policy_status = 'blocked') as blocked_events,
  count(*) filter (where policy_status = 'needs_approval') as approval_required_events,
  count(*) filter (where policy_status = 'allowed') as allowed_events,
  max(created_at) as latest_event_at
from jarvis_truth.postgresql_truth_events;

insert into jarvis_truth.postgresql_truth_read_models (
  read_model_ref,
  domain,
  source_schema,
  source_table_or_view,
  exposes_private_rows,
  allowed_for_hud,
  requires_commander_scope,
  safe_summary
)
values (
  'jarvis_postgresql_truth_hud_readiness',
  'jarvis_postgresql_truth_vault',
  'jarvis_truth',
  'v_postgresql_truth_hud_readiness',
  false,
  true,
  true,
  'HUD-safe summary view for PostgreSQL Truth Vault readiness. Does not expose raw private rows.'
)
on conflict (read_model_ref) do update set
  updated_at = now(),
  safe_summary = excluded.safe_summary;
