-- N15 live ingestion execution and candidate-feed safeguards.
create table if not exists public.n15_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  run_ref text unique not null,
  status text not null check (status in ('RUNNING','COMPLETED','PARTIAL','FAILED')),
  sources_checked integer not null default 0,
  sources_succeeded integer not null default 0,
  observations_created integer not null default 0,
  observations_updated integer not null default 0,
  observations_skipped integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
alter table public.n15_ingestion_runs enable row level security;
drop policy if exists n15_ingestion_runs_service_role_all on public.n15_ingestion_runs;
create policy n15_ingestion_runs_service_role_all on public.n15_ingestion_runs
  for all to service_role using (true) with check (true);

create index if not exists external_source_observations_authority_freshness_idx
  on public.external_source_observations (authority_ref, observation_status, stale_after desc);
create index if not exists external_source_observations_url_idx
  on public.external_source_observations (source_url);
create index if not exists candidate_opportunity_matches_candidate_status_idx
  on public.candidate_opportunity_matches (candidate_ref, match_status, created_at desc);

comment on table public.n15_ingestion_runs is
  'Auditable N15 source ingestion run ledger. Only service role can read/write. A successful crawl creates review-needed observations, not live opportunity claims.';
