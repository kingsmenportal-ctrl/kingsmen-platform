-- N03-TRUTH-01 — PostgreSQL Truth Vault Core Tables
-- This is a controlled schema declaration. Apply through migrations only after runtime gate approval.

create table if not exists candidates (
  id uuid primary key,
  owner_user_id uuid not null,
  full_name text,
  province text,
  created_at timestamptz not null default now()
);

create table if not exists service_orders (
  id uuid primary key,
  candidate_id uuid not null references candidates(id),
  package_code text not null,
  payment_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists payment_events (
  id uuid primary key,
  service_order_id uuid not null references service_orders(id),
  provider text not null,
  provider_event_id text,
  verification_status text not null default 'pending_review',
  amount_cents integer,
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key,
  candidate_id uuid not null references candidates(id),
  route_gate text not null,
  application_kind text not null,
  status text not null default 'draft',
  submitted_proof_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists application_choices (
  id uuid primary key,
  application_id uuid not null references applications(id),
  parent_system text,
  programme_name text,
  institution_name text,
  choice_order integer,
  source_confidence text not null default 'unverified',
  created_at timestamptz not null default now()
);

create table if not exists candidate_documents (
  id uuid primary key,
  candidate_id uuid not null references candidates(id),
  document_type text not null,
  verification_status text not null default 'pending_review',
  storage_ref text,
  created_at timestamptz not null default now()
);

create table if not exists evidence_ledger (
  id uuid primary key,
  candidate_id uuid,
  entity_type text not null,
  entity_id uuid,
  evidence_type text not null,
  safe_summary text not null,
  append_only boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key,
  actor_type text not null,
  actor_id text not null,
  action text not null,
  entity_type text,
  entity_id text,
  reason text not null,
  append_only boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists source_authorities (
  id uuid primary key,
  source_name text not null,
  source_url text,
  confidence_band text not null default 'unverified',
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists outcomes (
  id uuid primary key,
  candidate_id uuid not null references candidates(id),
  outcome_type text not null,
  proof_status text not null default 'pending_proof',
  public_story_consent boolean not null default false,
  created_at timestamptz not null default now()
);

alter table candidates enable row level security;
alter table service_orders enable row level security;
alter table payment_events enable row level security;
alter table applications enable row level security;
alter table application_choices enable row level security;
alter table candidate_documents enable row level security;
alter table evidence_ledger enable row level security;
alter table audit_events enable row level security;
alter table source_authorities enable row level security;
alter table outcomes enable row level security;