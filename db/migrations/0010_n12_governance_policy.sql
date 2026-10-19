create table if not exists public.governance_runtime_config (
  id uuid primary key default gen_random_uuid(),
  config_key text unique not null,
  config_value jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  doctrine_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.governance_policies (
  id uuid primary key default gen_random_uuid(),
  policy_ref text unique not null,
  policy_domain text not null,
  policy_name text not null,
  policy_version text not null default 'v1',
  enforcement_level text not null default 'HARD_BLOCK',
  policy_status text not null default 'ACTIVE',
  policy_text text not null,
  evidence_required boolean not null default true,
  human_review_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_policy_domain_chk check (policy_domain in (
    'STATE_MACHINE',
    'AI_BOUNDARY',
    'SUBMISSION',
    'FINANCE_REFUND',
    'POPIA_PRIVACY',
    'SOURCE_CONFIDENCE',
    'DOCUMENT_FRAUD',
    'HUMAN_OVERRIDE',
    'PHOENIX_FALLBACK',
    'COMMUNICATION',
    'GROWTH_CAP',
    'ORACLE_LITE'
  )),
  constraint governance_policy_level_chk check (enforcement_level in ('HARD_BLOCK','REVIEW_REQUIRED','WARN','ALLOW')),
  constraint governance_policy_status_chk check (policy_status in ('ACTIVE','DRAFT','RETIRED'))
);

create table if not exists public.policy_gate_evaluations (
  id uuid primary key default gen_random_uuid(),
  gate_ref text unique not null,
  policy_ref text not null,
  candidate_ref text,
  application_ref text,
  route_ref text,
  command_ref text,
  workflow_ref text,
  gate_name text not null,
  gate_status text not null default 'REVIEW_REQUIRED',
  action_requested text not null,
  decision_summary text not null default '',
  blocked_reason text,
  review_reason text,
  evidence_refs text[] not null default array[]::text[],
  source_confidence text not null default 'MEDIUM',
  evaluated_by text not null default 'system',
  created_at timestamptz not null default now(),
  constraint policy_gate_status_chk check (gate_status in ('ALLOW','WARN','REVIEW_REQUIRED','BLOCK')),
  constraint policy_gate_source_confidence_chk check (source_confidence in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED'))
);

create table if not exists public.governance_decisions (
  id uuid primary key default gen_random_uuid(),
  decision_ref text unique not null,
  gate_ref text,
  policy_ref text,
  candidate_ref text,
  application_ref text,
  route_ref text,
  decision_type text not null,
  decision_status text not null default 'PENDING_REVIEW',
  human_actor_ref text,
  decision_reason text not null default '',
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint governance_decision_type_chk check (decision_type in (
    'ALLOW',
    'BLOCK',
    'ESCALATE',
    'APPROVE_OVERRIDE',
    'REJECT_OVERRIDE',
    'REQUEST_MORE_EVIDENCE',
    'MARK_AS_SAFE',
    'MARK_AS_RISK'
  )),
  constraint governance_decision_status_chk check (decision_status in ('PENDING_REVIEW','APPROVED','REJECTED','COMPLETED','CANCELLED'))
);

create table if not exists public.human_override_requests (
  id uuid primary key default gen_random_uuid(),
  override_ref text unique not null,
  requested_by text not null default 'system',
  candidate_ref text,
  application_ref text,
  route_ref text,
  policy_ref text not null,
  override_type text not null,
  override_status text not null default 'PENDING_REVIEW',
  override_reason text not null,
  risk_summary text not null default '',
  evidence_refs text[] not null default array[]::text[],
  no_silent_override boolean not null default true,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  constraint human_override_type_chk check (override_type in (
    'STATE_TRANSITION',
    'OFFICIAL_SUBMISSION',
    'REFUND',
    'FRAUD_REVIEW',
    'PRIVACY_SENSITIVE_CHANGE',
    'SOURCE_CONFIDENCE_EXCEPTION',
    'PHOENIX_FALLBACK',
    'COMMUNICATION_EXCEPTION',
    'GROWTH_CAP_INCREASE',
    'ORACLE_LITE_EXCEPTION'
  )),
  constraint human_override_status_chk check (override_status in ('PENDING_REVIEW','APPROVED','REJECTED','CANCELLED','EXPIRED'))
);

create table if not exists public.privacy_consent_records (
  id uuid primary key default gen_random_uuid(),
  consent_ref text unique not null,
  candidate_ref text not null,
  consent_type text not null,
  lawful_basis text not null default 'CONSENT',
  consent_status text not null default 'ACTIVE',
  consent_text_snapshot text not null default '',
  evidence_refs text[] not null default array[]::text[],
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint privacy_consent_type_chk check (consent_type in (
    'PROFILE_PROCESSING',
    'DOCUMENT_PROCESSING',
    'APPLICATION_SUPPORT',
    'COMMUNICATION_EMAIL',
    'URGENT_WHATSAPP',
    'PAYMENT_PROCESSING',
    'PARTNER_ROUTE_SHARING',
    'OUTCOME_LEARNING_SIGNAL'
  )),
  constraint privacy_consent_basis_chk check (lawful_basis in ('CONSENT','CONTRACT','LEGAL_OBLIGATION','LEGITIMATE_INTEREST','VITAL_INTEREST','PUBLIC_TASK')),
  constraint privacy_consent_status_chk check (consent_status in ('ACTIVE','REVOKED','EXPIRED','SUPERSEDED'))
);

create table if not exists public.source_confidence_reviews (
  id uuid primary key default gen_random_uuid(),
  review_ref text unique not null,
  source_ref text not null,
  source_url text,
  route_ref text,
  institution_ref text,
  claim_summary text not null,
  confidence_before text not null default 'LOW',
  confidence_after text not null default 'MEDIUM',
  review_status text not null default 'PENDING_REVIEW',
  evidence_refs text[] not null default array[]::text[],
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint source_confidence_before_chk check (confidence_before in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED')),
  constraint source_confidence_after_chk check (confidence_after in ('LOW','MEDIUM','HIGH','OFFICIAL_VERIFIED')),
  constraint source_confidence_review_status_chk check (review_status in ('PENDING_REVIEW','APPROVED','REJECTED','SUPERSEDED'))
);

create table if not exists public.growth_cap_reviews (
  id uuid primary key default gen_random_uuid(),
  cap_review_ref text unique not null,
  current_active_candidate_cap integer not null default 500,
  requested_active_candidate_cap integer not null,
  review_status text not null default 'PENDING_REVIEW',
  outcome_quality_evidence_refs text[] not null default array[]::text[],
  risk_summary text not null default '',
  operator_decision text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint growth_cap_positive_chk check (current_active_candidate_cap > 0 and requested_active_candidate_cap > 0),
  constraint growth_cap_review_status_chk check (review_status in ('PENDING_REVIEW','APPROVED','REJECTED','CANCELLED')),
  constraint growth_cap_operator_decision_chk check (operator_decision is null or operator_decision in ('APPROVE','REJECT','REQUEST_MORE_EVIDENCE'))
);

create table if not exists public.policy_exception_register (
  id uuid primary key default gen_random_uuid(),
  exception_ref text unique not null,
  policy_ref text not null,
  exception_status text not null default 'PENDING_REVIEW',
  exception_reason text not null,
  expiry_at timestamptz,
  evidence_refs text[] not null default array[]::text[],
  created_by text not null default 'system',
  reviewed_by text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint policy_exception_status_chk check (exception_status in ('PENDING_REVIEW','APPROVED','REJECTED','EXPIRED','REVOKED'))
);

create table if not exists public.governance_audit_events (
  id uuid primary key default gen_random_uuid(),
  audit_ref text unique not null,
  actor_ref text not null default 'system',
  event_type text not null,
  event_summary text not null,
  policy_ref text,
  gate_ref text,
  decision_ref text,
  candidate_ref text,
  application_ref text,
  route_ref text,
  evidence_refs text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint governance_audit_event_type_chk check (event_type in (
    'POLICY_REGISTERED',
    'GATE_EVALUATED',
    'ACTION_BLOCKED',
    'REVIEW_REQUESTED',
    'HUMAN_OVERRIDE_REQUESTED',
    'HUMAN_OVERRIDE_RESOLVED',
    'CONSENT_RECORDED',
    'SOURCE_CONFIDENCE_REVIEWED',
    'GROWTH_CAP_REVIEWED',
    'POLICY_EXCEPTION_REVIEWED',
    'COMPLIANCE_EVENT'
  ))
);

create index if not exists idx_governance_policies_domain on public.governance_policies(policy_domain, policy_status);
create index if not exists idx_policy_gate_candidate on public.policy_gate_evaluations(candidate_ref, created_at desc);
create index if not exists idx_policy_gate_status on public.policy_gate_evaluations(gate_status, created_at desc);
create index if not exists idx_governance_decisions_status on public.governance_decisions(decision_status, created_at desc);
create index if not exists idx_human_override_status on public.human_override_requests(override_status, created_at desc);
create index if not exists idx_privacy_consent_candidate on public.privacy_consent_records(candidate_ref, consent_status);
create index if not exists idx_source_confidence_reviews_source on public.source_confidence_reviews(source_ref, review_status);
create index if not exists idx_growth_cap_reviews_status on public.growth_cap_reviews(review_status, created_at desc);
create index if not exists idx_policy_exception_status on public.policy_exception_register(exception_status, created_at desc);
create index if not exists idx_governance_audit_events_candidate on public.governance_audit_events(candidate_ref, created_at desc);

alter table public.governance_runtime_config enable row level security;
alter table public.governance_policies enable row level security;
alter table public.policy_gate_evaluations enable row level security;
alter table public.governance_decisions enable row level security;
alter table public.human_override_requests enable row level security;
alter table public.privacy_consent_records enable row level security;
alter table public.source_confidence_reviews enable row level security;
alter table public.growth_cap_reviews enable row level security;
alter table public.policy_exception_register enable row level security;
alter table public.governance_audit_events enable row level security;

drop policy if exists governance_runtime_config_all on public.governance_runtime_config;
create policy governance_runtime_config_all on public.governance_runtime_config for all TO service_role using (true) with check (true);
drop policy if exists governance_policies_all on public.governance_policies;
create policy governance_policies_all on public.governance_policies for all TO service_role using (true) with check (true);
drop policy if exists policy_gate_evaluations_all on public.policy_gate_evaluations;
create policy policy_gate_evaluations_all on public.policy_gate_evaluations for all TO service_role using (true) with check (true);
drop policy if exists governance_decisions_all on public.governance_decisions;
create policy governance_decisions_all on public.governance_decisions for all TO service_role using (true) with check (true);
drop policy if exists human_override_requests_all on public.human_override_requests;
create policy human_override_requests_all on public.human_override_requests for all TO service_role using (true) with check (true);
drop policy if exists privacy_consent_records_all on public.privacy_consent_records;
create policy privacy_consent_records_all on public.privacy_consent_records for all TO service_role using (true) with check (true);
drop policy if exists source_confidence_reviews_all on public.source_confidence_reviews;
create policy source_confidence_reviews_all on public.source_confidence_reviews for all TO service_role using (true) with check (true);
drop policy if exists growth_cap_reviews_all on public.growth_cap_reviews;
create policy growth_cap_reviews_all on public.growth_cap_reviews for all TO service_role using (true) with check (true);
drop policy if exists policy_exception_register_all on public.policy_exception_register;
create policy policy_exception_register_all on public.policy_exception_register for all TO service_role using (true) with check (true);
drop policy if exists governance_audit_events_all on public.governance_audit_events;
create policy governance_audit_events_all on public.governance_audit_events for all TO service_role using (true) with check (true);