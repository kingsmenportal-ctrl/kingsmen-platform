create table if not exists public.observability_runtime_config (
  id uuid primary key default gen_random_uuid(),
  config_key text unique not null,
  config_value jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  doctrine_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_ref text unique not null,
  status text not null default 'UNKNOWN',
  active_candidates integer not null default 0,
  active_candidate_cap integer not null default 500,
  pending_workflows integer not null default 0,
  failed_workflows integer not null default 0,
  document_backlog integer not null default 0,
  manual_fallback_backlog integer not null default 0,
  payment_pending_count integer not null default 0,
  source_review_backlog integer not null default 0,
  incident_open_count integer not null default 0,
  oracle_lite_pressure text not null default 'LOW',
  summary text not null default '',
  evidence_refs text[] not null default array[]::text[],
  captured_at timestamptz not null default now(),
  constraint system_health_status_chk check (status in ('GREEN','AMBER','RED','UNKNOWN')),
  constraint oracle_lite_pressure_chk check (oracle_lite_pressure in ('LOW','MEDIUM','HIGH','CRITICAL'))
);

create table if not exists public.service_health_checks (
  id uuid primary key default gen_random_uuid(),
  check_ref text unique not null,
  service_name text not null,
  service_domain text not null,
  status text not null default 'UNKNOWN',
  latency_ms integer,
  error_rate numeric(8,4),
  last_success_at timestamptz,
  last_failure_at timestamptz,
  reason text not null default '',
  fix_path text not null default '',
  evidence_refs text[] not null default array[]::text[],
  checked_at timestamptz not null default now(),
  constraint service_health_domain_chk check (service_domain in (
    'API','WEB','POSTGRES','AIRTABLE','N8N','PAYFAST','EMAIL','WHATSAPP','PLAYWRIGHT','DOCUMENTS','AI','GITHUB','ORACLE_LITE','SUPABASE','UNKNOWN'
  )),
  constraint service_health_status_chk check (status in ('UP','DEGRADED','DOWN','BLOCKED','UNKNOWN'))
);

create table if not exists public.metric_samples (
  id uuid primary key default gen_random_uuid(),
  metric_ref text unique not null,
  metric_name text not null,
  metric_domain text not null,
  metric_value numeric(18,4) not null,
  metric_unit text not null default 'count',
  warning_threshold numeric(18,4),
  critical_threshold numeric(18,4),
  status text not null default 'OK',
  tags jsonb not null default '{}'::jsonb,
  sampled_at timestamptz not null default now(),
  constraint metric_domain_chk check (metric_domain in (
    'CAPACITY','QUEUE','WORKFLOW','DOCUMENT','FINANCE','COMMUNICATION','MATCHING','PLAYWRIGHT','DB','API','WEB','STORAGE','AI','RISK'
  )),
  constraint metric_status_chk check (status in ('OK','WARN','CRITICAL','UNKNOWN'))
);

create table if not exists public.incident_events (
  id uuid primary key default gen_random_uuid(),
  incident_ref text unique not null,
  title text not null,
  severity text not null default 'SEV3',
  status text not null default 'OPEN',
  incident_domain text not null,
  cause text not null default '',
  reason text not null default '',
  fix_path text not null default '',
  owner_ref text,
  candidate_ref text,
  application_ref text,
  workflow_ref text,
  service_ref text,
  policy_ref text,
  evidence_refs text[] not null default array[]::text[],
  opened_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  constraint incident_severity_chk check (severity in ('SEV1','SEV2','SEV3','SEV4')),
  constraint incident_status_chk check (status in ('OPEN','ACKNOWLEDGED','MITIGATING','RESOLVED','CLOSED','CANCELLED')),
  constraint incident_domain_chk check (incident_domain in (
    'SYSTEM','WORKFLOW','PAYMENT','DOCUMENT','COMMUNICATION','PLAYWRIGHT','PORTAL','SOURCE','PRIVACY','SECURITY','MATCHING','MANUAL_FALLBACK','CAPACITY','OTHER'
  ))
);

create table if not exists public.incident_timeline_entries (
  id uuid primary key default gen_random_uuid(),
  timeline_ref text unique not null,
  incident_ref text not null,
  event_type text not null,
  actor_ref text not null default 'system',
  note text not null,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint incident_timeline_type_chk check (event_type in (
    'DETECTED','ACKNOWLEDGED','DIAGNOSED','ESCALATED','MITIGATION_STARTED','MITIGATION_DONE','RESOLVED','CLOSED','REOPENED','NOTE'
  ))
);

create table if not exists public.incident_actions (
  id uuid primary key default gen_random_uuid(),
  action_ref text unique not null,
  incident_ref text not null,
  action_title text not null,
  action_status text not null default 'PENDING',
  owner_ref text,
  due_at timestamptz,
  completed_at timestamptz,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint incident_action_status_chk check (action_status in ('PENDING','IN_PROGRESS','DONE','BLOCKED','CANCELLED'))
);

create table if not exists public.founder_reports (
  id uuid primary key default gen_random_uuid(),
  report_ref text unique not null,
  report_type text not null,
  report_status text not null default 'DRAFT',
  title text not null,
  executive_summary text not null default '',
  system_status text not null default 'UNKNOWN',
  key_risks text[] not null default array[]::text[],
  key_actions text[] not null default array[]::text[],
  evidence_refs text[] not null default array[]::text[],
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  constraint founder_report_type_chk check (report_type in (
    'MORNING_FOUNDER','MIDDAY_FOUNDER','EVENING_FOUNDER','INCIDENT','FINANCE','DOCUMENT_PIPELINE','MATCHING','DISPATCH','PLAYWRIGHT','MANUAL_FALLBACK','PORTAL_HEALTH','RISK','SYSTEM_HEALTH','BACKUP','CAPACITY','WEEKLY','MONTHLY'
  )),
  constraint founder_report_status_chk check (report_status in ('DRAFT','READY','DELIVERED','FAILED','ARCHIVED')),
  constraint founder_report_system_status_chk check (system_status in ('GREEN','AMBER','RED','UNKNOWN'))
);

create table if not exists public.founder_report_sections (
  id uuid primary key default gen_random_uuid(),
  section_ref text unique not null,
  report_ref text not null,
  section_name text not null,
  section_order integer not null default 0,
  section_status text not null default 'NORMAL',
  summary text not null default '',
  details jsonb not null default '{}'::jsonb,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint founder_report_section_status_chk check (section_status in ('NORMAL','WATCH','RISK','URGENT','BLOCKED'))
);

create table if not exists public.candidate_pipeline_snapshots (
  id uuid primary key default gen_random_uuid(),
  pipeline_ref text unique not null,
  new_count integer not null default 0,
  intake_pending_count integer not null default 0,
  evaluation_pending_count integer not null default 0,
  document_pending_count integer not null default 0,
  execution_pending_count integer not null default 0,
  completed_count integer not null default 0,
  failed_count integer not null default 0,
  manual_fallback_count integer not null default 0,
  capacity_status text not null default 'OK',
  evidence_refs text[] not null default array[]::text[],
  captured_at timestamptz not null default now(),
  constraint candidate_pipeline_capacity_status_chk check (capacity_status in ('OK','WATCH','PRESSURE','CAP_REACHED'))
);

create table if not exists public.workflow_run_observations (
  id uuid primary key default gen_random_uuid(),
  observation_ref text unique not null,
  workflow_code text not null,
  workflow_run_ref text,
  status text not null default 'UNKNOWN',
  duration_ms integer,
  retry_count integer not null default 0,
  failure_reason text,
  fix_path text not null default '',
  evidence_refs text[] not null default array[]::text[],
  observed_at timestamptz not null default now(),
  constraint workflow_observation_status_chk check (status in ('SUCCESS','RUNNING','FAILED','RETRYING','BLOCKED','UNKNOWN'))
);

create table if not exists public.oracle_lite_capacity_snapshots (
  id uuid primary key default gen_random_uuid(),
  capacity_ref text unique not null,
  ocpu_limit numeric(8,2) not null default 4,
  memory_gb_limit numeric(8,2) not null default 24,
  active_candidate_cap integer not null default 500,
  active_candidates integer not null default 0,
  cpu_pressure text not null default 'LOW',
  memory_pressure text not null default 'LOW',
  storage_pressure text not null default 'LOW',
  db_pressure text not null default 'LOW',
  queue_pressure text not null default 'LOW',
  recommendation text not null default '',
  evidence_refs text[] not null default array[]::text[],
  captured_at timestamptz not null default now(),
  constraint oracle_lite_pressure_levels_chk check (
    cpu_pressure in ('LOW','MEDIUM','HIGH','CRITICAL')
    and memory_pressure in ('LOW','MEDIUM','HIGH','CRITICAL')
    and storage_pressure in ('LOW','MEDIUM','HIGH','CRITICAL')
    and db_pressure in ('LOW','MEDIUM','HIGH','CRITICAL')
    and queue_pressure in ('LOW','MEDIUM','HIGH','CRITICAL')
  )
);

create table if not exists public.system_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_ref text unique not null,
  alert_type text not null,
  severity text not null default 'INFO',
  status text not null default 'OPEN',
  title text not null,
  message text not null,
  target_channel text not null default 'EMAIL',
  escalation_allowed boolean not null default false,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint system_alert_type_chk check (alert_type in (
    'SYSTEM_HEALTH','CAPACITY','INCIDENT','WORKFLOW_FAILURE','PAYMENT','DOCUMENT','SOURCE_REVIEW','PRIVACY','SECURITY','REPORT_DELIVERY'
  )),
  constraint system_alert_severity_chk check (severity in ('INFO','WATCH','WARNING','CRITICAL')),
  constraint system_alert_status_chk check (status in ('OPEN','ACKNOWLEDGED','RESOLVED','CANCELLED')),
  constraint system_alert_channel_chk check (target_channel in ('EMAIL','PORTAL','WHATSAPP_URGENT','SMS_BACKUP','CONTROL_PLANE'))
);

create table if not exists public.report_delivery_log (
  id uuid primary key default gen_random_uuid(),
  delivery_ref text unique not null,
  report_ref text not null,
  channel text not null default 'EMAIL',
  delivery_status text not null default 'PENDING',
  recipient_ref text not null default 'founder',
  failure_reason text,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  constraint report_delivery_channel_chk check (channel in ('EMAIL','PORTAL','WHATSAPP_URGENT','SMS_BACKUP','CONTROL_PLANE')),
  constraint report_delivery_status_chk check (delivery_status in ('PENDING','SENT','FAILED','CANCELLED'))
);

create index if not exists idx_system_health_snapshots_captured on public.system_health_snapshots(captured_at desc);
create index if not exists idx_service_health_checks_service on public.service_health_checks(service_domain, service_name, checked_at desc);
create index if not exists idx_metric_samples_name on public.metric_samples(metric_name, sampled_at desc);
create index if not exists idx_incident_events_status on public.incident_events(status, severity, opened_at desc);
create index if not exists idx_incident_timeline_incident on public.incident_timeline_entries(incident_ref, created_at);
create index if not exists idx_incident_actions_status on public.incident_actions(incident_ref, action_status);
create index if not exists idx_founder_reports_type on public.founder_reports(report_type, created_at desc);
create index if not exists idx_founder_report_sections_report on public.founder_report_sections(report_ref, section_order);
create index if not exists idx_candidate_pipeline_snapshots_captured on public.candidate_pipeline_snapshots(captured_at desc);
create index if not exists idx_workflow_observations_code on public.workflow_run_observations(workflow_code, observed_at desc);
create index if not exists idx_oracle_capacity_captured on public.oracle_lite_capacity_snapshots(captured_at desc);
create index if not exists idx_system_alerts_status on public.system_alerts(status, severity, created_at desc);
create index if not exists idx_report_delivery_log_report on public.report_delivery_log(report_ref, delivery_status);

alter table public.observability_runtime_config enable row level security;
alter table public.system_health_snapshots enable row level security;
alter table public.service_health_checks enable row level security;
alter table public.metric_samples enable row level security;
alter table public.incident_events enable row level security;
alter table public.incident_timeline_entries enable row level security;
alter table public.incident_actions enable row level security;
alter table public.founder_reports enable row level security;
alter table public.founder_report_sections enable row level security;
alter table public.candidate_pipeline_snapshots enable row level security;
alter table public.workflow_run_observations enable row level security;
alter table public.oracle_lite_capacity_snapshots enable row level security;
alter table public.system_alerts enable row level security;
alter table public.report_delivery_log enable row level security;

drop policy if exists observability_runtime_config_all on public.observability_runtime_config;
create policy observability_runtime_config_all on public.observability_runtime_config for all using (true) with check (true);
drop policy if exists system_health_snapshots_all on public.system_health_snapshots;
create policy system_health_snapshots_all on public.system_health_snapshots for all using (true) with check (true);
drop policy if exists service_health_checks_all on public.service_health_checks;
create policy service_health_checks_all on public.service_health_checks for all using (true) with check (true);
drop policy if exists metric_samples_all on public.metric_samples;
create policy metric_samples_all on public.metric_samples for all using (true) with check (true);
drop policy if exists incident_events_all on public.incident_events;
create policy incident_events_all on public.incident_events for all using (true) with check (true);
drop policy if exists incident_timeline_entries_all on public.incident_timeline_entries;
create policy incident_timeline_entries_all on public.incident_timeline_entries for all using (true) with check (true);
drop policy if exists incident_actions_all on public.incident_actions;
create policy incident_actions_all on public.incident_actions for all using (true) with check (true);
drop policy if exists founder_reports_all on public.founder_reports;
create policy founder_reports_all on public.founder_reports for all using (true) with check (true);
drop policy if exists founder_report_sections_all on public.founder_report_sections;
create policy founder_report_sections_all on public.founder_report_sections for all using (true) with check (true);
drop policy if exists candidate_pipeline_snapshots_all on public.candidate_pipeline_snapshots;
create policy candidate_pipeline_snapshots_all on public.candidate_pipeline_snapshots for all using (true) with check (true);
drop policy if exists workflow_run_observations_all on public.workflow_run_observations;
create policy workflow_run_observations_all on public.workflow_run_observations for all using (true) with check (true);
drop policy if exists oracle_lite_capacity_snapshots_all on public.oracle_lite_capacity_snapshots;
create policy oracle_lite_capacity_snapshots_all on public.oracle_lite_capacity_snapshots for all using (true) with check (true);
drop policy if exists system_alerts_all on public.system_alerts;
create policy system_alerts_all on public.system_alerts for all using (true) with check (true);
drop policy if exists report_delivery_log_all on public.report_delivery_log;
create policy report_delivery_log_all on public.report_delivery_log for all using (true) with check (true);