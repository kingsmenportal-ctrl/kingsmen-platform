create table if not exists public.founder_runtime_config (
  config_key text primary key,
  config_value jsonb not null,
  config_scope text not null default 'FOUNDER_OPS',
  locked boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.founder_operator_profiles (
  id uuid primary key default gen_random_uuid(),
  operator_ref text unique not null,
  display_name text not null,
  role_key text not null,
  phone_access_enabled boolean not null default true,
  emergency_contact_enabled boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint founder_operator_role_chk check (role_key in ('FOUNDER','OPS_LEAD','DOCUMENT_REVIEWER','ROUTE_REVIEWER','COMMS_REVIEWER','FINANCE_REVIEWER','READ_ONLY_AUDITOR'))
);

create table if not exists public.founder_command_catalog (
  command_key text primary key,
  command_name text not null,
  command_group text not null,
  command_intent text not null,
  routes_through text not null default 'N12_GOVERNANCE_AND_N16_ORCHESTRATOR',
  requires_approval boolean not null default false,
  requires_evidence boolean not null default true,
  allowed_from_phone boolean not null default true,
  dangerous boolean not null default false,
  active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint founder_command_group_chk check (command_group in ('INSPECT','PRIORITIZE','PAUSE_RESUME','APPROVAL','ESCALATION','MAP','PHOENIX','COMMS','FINANCE','DOCUMENTS','ROUTES','INCIDENT','REPORT','CAPACITY','SOURCE_REVIEW')),
  constraint founder_command_route_chk check (routes_through in ('N12_GOVERNANCE_AND_N16_ORCHESTRATOR','N13_OBSERVABILITY_ONLY','N08_CONTROL_PLANE_READ_ONLY'))
);

create table if not exists public.founder_command_requests (
  id uuid primary key default gen_random_uuid(),
  command_ref text unique not null,
  command_key text not null references public.founder_command_catalog(command_key),
  requested_by text not null,
  requested_from text not null default 'CONTROL_PLANE',
  command_status text not null default 'DRAFT',
  priority_lane text not null default 'NORMAL',
  candidate_ref text,
  application_ref text,
  target_ref text,
  command_payload jsonb not null default '{}'::jsonb,
  reason text not null,
  evidence_refs text[] not null default array[]::text[],
  approval_ref text,
  orchestrator_plan_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint founder_command_status_chk check (command_status in ('DRAFT','SUBMITTED','GOVERNANCE_BLOCKED','WAITING_APPROVAL','APPROVED','REJECTED','ROUTED','RUNNING','COMPLETED','FAILED','CANCELLED')),
  constraint founder_command_source_chk check (requested_from in ('CONTROL_PLANE','MOBILE','EMAIL_REVIEW','SYSTEM_BRIEF','INCIDENT_PANEL')),
  constraint founder_command_priority_chk check (priority_lane in ('LOW','NORMAL','HIGH','URGENT','FOUNDER_OVERRIDE'))
);

create table if not exists public.founder_command_results (
  id uuid primary key default gen_random_uuid(),
  result_ref text unique not null,
  command_ref text not null,
  result_status text not null,
  result_summary text not null,
  orchestrator_run_ref text,
  governance_gate_ref text,
  failure_reason text,
  fix_path text,
  evidence_refs text[] not null default array[]::text[],
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint founder_command_result_status_chk check (result_status in ('ACCEPTED','BLOCKED','APPROVAL_REQUIRED','ROUTED','SUCCEEDED','FAILED','NEEDS_MANUAL','NO_ACTION'))
);

create table if not exists public.founder_daily_briefs (
  id uuid primary key default gen_random_uuid(),
  brief_ref text unique not null,
  brief_type text not null,
  brief_date date not null default current_date,
  brief_status text not null default 'DRAFT',
  system_health jsonb not null default '{}'::jsonb,
  queue_summary jsonb not null default '{}'::jsonb,
  finance_summary jsonb not null default '{}'::jsonb,
  document_summary jsonb not null default '{}'::jsonb,
  matching_summary jsonb not null default '{}'::jsonb,
  map_playwright_summary jsonb not null default '{}'::jsonb,
  incident_summary jsonb not null default '{}'::jsonb,
  capacity_summary jsonb not null default '{}'::jsonb,
  urgent_candidates jsonb not null default '[]'::jsonb,
  recommended_actions jsonb not null default '[]'::jsonb,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  constraint founder_brief_type_chk check (brief_type in ('MORNING','MIDDAY','EVENING','INCIDENT','WEEKLY','MONTHLY')),
  constraint founder_brief_status_chk check (brief_status in ('DRAFT','READY','DELIVERED','FAILED','ARCHIVED'))
);

create table if not exists public.founder_watchlist_items (
  id uuid primary key default gen_random_uuid(),
  watch_ref text unique not null,
  watch_type text not null,
  watch_status text not null default 'ACTIVE',
  candidate_ref text,
  application_ref text,
  source_ref text,
  title text not null,
  reason text not null,
  risk_level text not null default 'WATCH',
  next_action text not null,
  due_at timestamptz,
  evidence_refs text[] not null default ARRAY[]::text[],
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint founder_watch_type_chk check (watch_type in ('CANDIDATE','APPLICATION','DOCUMENT','ROUTE','SOURCE','FINANCE','COMMS','INCIDENT','CAPACITY','PLAYWRIGHT','MAP','PHOENIX')),
  constraint founder_watch_status_chk check (watch_status in ('ACTIVE','SNOOZED','ESCALATED','RESOLVED','CANCELLED')),
  constraint founder_watch_risk_chk check (risk_level in ('INFO','WATCH','WARNING','CRITICAL'))
);

create table if not exists public.founder_escalation_threads (
  id uuid primary key default gen_random_uuid(),
  escalation_ref text unique not null,
  escalation_type text not null,
  escalation_status text not null default 'OPEN',
  opened_by text not null default 'system',
  candidate_ref text,
  application_ref text,
  incident_ref text,
  title text not null,
  cause text not null,
  current_risk text not null,
  fix_path text not null,
  owner_ref text,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint founder_escalation_type_chk check (escalation_type in ('DEADLINE','DOCUMENT','PORTAL_BLOCKED','PAYMENT','REFUND','FRAUD_REVIEW','PRIVACY','SOURCE_REVIEW','SYSTEM_INCIDENT','CANDIDATE_HARM','MANUAL_BACKLOG','CAPACITY')),
  constraint founder_escalation_status_chk check (escalation_status in ('OPEN','ASSIGNED','WAITING_APPROVAL','WAITING_CANDIDATE','WAITING_EXTERNAL','RESOLVED','CANCELLED'))
);

create table if not exists public.founder_decision_log (
  id uuid primary key default gen_random_uuid(),
  decision_ref text unique not null,
  command_ref text,
  decision_type text not null,
  decided_by text not null,
  decision_status text not null,
  decision_reason text not null,
  boundary_checked text not null default 'N12_GOVERNANCE',
  resulting_action text not null,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint founder_decision_type_chk check (decision_type in ('APPROVE','REJECT','PAUSE','RESUME','PRIORITIZE','ESCALATE','REQUEST_MAP','REQUEST_PHOENIX','REQUEST_REVIEW','NO_ACTION')),
  constraint founder_decision_status_chk check (decision_status in ('RECORDED','ROUTED','BLOCKED','COMPLETED','FAILED'))
);

create table if not exists public.founder_mobile_cards (
  card_key text primary key,
  card_title text not null,
  card_group text not null,
  card_order integer not null default 0,
  enabled boolean not null default true,
  requires_attention_threshold text not null default 'WARNING',
  summary_query_hint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint founder_mobile_card_group_chk check (card_group in ('TODAY','QUEUE','CANDIDATES','DOCUMENTS','ROUTES','FINANCE','COMMS','INCIDENTS','CAPACITY','MAP','PHOENIX','HEALTH'))
);

create table if not exists public.founder_ops_audit_events (
  id uuid primary key default gen_random_uuid(),
  audit_ref text unique not null,
  actor_ref text not null,
  action_key text not null,
  command_ref text,
  target_ref text,
  severity text not null default 'INFO',
  audit_message text not null,
  audit_payload jsonb not null default '{}'::jsonb,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint founder_audit_severity_chk check (severity in ('INFO','WATCH','WARNING','CRITICAL'))
);

create index if not exists idx_founder_commands_status on public.founder_command_requests(command_status, priority_lane, created_at desc);
create index if not exists idx_founder_results_command on public.founder_command_results(command_ref, created_at desc);
create index if not exists idx_founder_briefs_date on public.founder_daily_briefs(brief_date desc, brief_type);
create index if not exists idx_founder_watch_status on public.founder_watchlist_items(watch_status, risk_level, due_at);
create index if not exists idx_founder_escalations_status on public.founder_escalation_threads(escalation_status, created_at desc);
create index if not exists idx_founder_decisions_command on public.founder_decision_log(command_ref, created_at desc);
create index if not exists idx_founder_audit_actor on public.founder_ops_audit_events(actor_ref, created_at desc);

alter table public.founder_runtime_config enable row level security;
alter table public.founder_operator_profiles enable row level security;
alter table public.founder_command_catalog enable row level security;
alter table public.founder_command_requests enable row level security;
alter table public.founder_command_results enable row level security;
alter table public.founder_daily_briefs enable row level security;
alter table public.founder_watchlist_items enable row level security;
alter table public.founder_escalation_threads enable row level security;
alter table public.founder_decision_log enable row level security;
alter table public.founder_mobile_cards enable row level security;
alter table public.founder_ops_audit_events enable row level security;

drop policy if exists founder_runtime_config_all on public.founder_runtime_config;
create policy founder_runtime_config_all on public.founder_runtime_config TO service_role for all using (true) with check (true);
drop policy if exists founder_operator_profiles_all on public.founder_operator_profiles;
create policy founder_operator_profiles_all on public.founder_operator_profiles TO service_role for all using (true) with check (true);
drop policy if exists founder_command_catalog_all on public.founder_command_catalog;
create policy founder_command_catalog_all on public.founder_command_catalog TO service_role for all using (true) with check (true);
drop policy if exists founder_command_requests_all on public.founder_command_requests;
create policy founder_command_requests_all on public.founder_command_requests TO service_role for all using (true) with check (true);
drop policy if exists founder_command_results_all on public.founder_command_results;
create policy founder_command_results_all on public.founder_command_results TO service_role for all using (true) with check (true);
drop policy if exists founder_daily_briefs_all on public.founder_daily_briefs;
create policy founder_daily_briefs_all on public.founder_daily_briefs TO service_role for all using (true) with check (true);
drop policy if exists founder_watchlist_items_all on public.founder_watchlist_items;
create policy founder_watchlist_items_all on public.founder_watchlist_items TO service_role for all using (true) with check (true);
drop policy if exists founder_escalation_threads_all on public.founder_escalation_threads;
create policy founder_escalation_threads_all on public.founder_escalation_threads TO service_role for all using (true) with check (true);
drop policy if exists founder_decision_log_all on public.founder_decision_log;
create policy founder_decision_log_all on public.founder_decision_log TO service_role for all using (true) with check (true);
drop policy if exists founder_mobile_cards_all on public.founder_mobile_cards;
create policy founder_mobile_cards_all on public.founder_mobile_cards TO service_role for all using (true) with check (true);
drop policy if exists founder_ops_audit_events_all on public.founder_ops_audit_events;
create policy founder_ops_audit_events_all on public.founder_ops_audit_events TO service_role for all using (true) with check (true);