-- N06-ROUTE-02 — Route Universe PostgreSQL schema declaration.
-- Apply through approved migration runner only. Do not apply directly to production.

create table if not exists route_gates (
  code text primary key,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists route_systems (
  code text primary key,
  display_name text not null,
  gate_code text references route_gates(code),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists route_universe (
  id uuid primary key,
  gate_code text not null references route_gates(code),
  route_system_code text not null references route_systems(code),
  institution_or_provider_name text not null,
  programme_or_opportunity_name text not null,
  province text,
  source_confidence text not null default 'unverified',
  official_instruction_allowed boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists route_source_authorities (
  id uuid primary key,
  route_id uuid references route_universe(id),
  source_url text not null,
  source_name text not null,
  confidence_band text not null default 'unverified',
  verified_at timestamptz,
  evidence_id uuid,
  audit_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists candidate_route_readiness (
  id uuid primary key,
  candidate_id uuid not null references candidates(id),
  route_id uuid not null references route_universe(id),
  known_route boolean not null default false,
  document_ready boolean not null default false,
  source_verified boolean not null default false,
  payment_ready boolean not null default false,
  deadline_risk boolean not null default false,
  readiness_status text not null default 'not_ready',
  blockers jsonb not null default '[]'::jsonb,
  evidence_id uuid,
  audit_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists cao_parent_applications (
  id uuid primary key,
  candidate_id uuid not null references candidates(id),
  route_id uuid references route_universe(id),
  counts_as_kingsmen_managed_application boolean not null default true,
  status text not null default 'draft',
  evidence_id uuid,
  audit_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists cao_programme_choices (
  id uuid primary key,
  parent_application_id uuid not null references cao_parent_applications(id),
  programme_name text not null,
  institution_name text not null,
  campus text,
  choice_order integer not null,
  source_confidence text not null default 'unverified',
  evidence_id uuid,
  audit_id uuid,
  created_at timestamptz not null default now()
);

create or replace view candidate_route_readiness_view as
select
  r.id as readiness_id,
  r.candidate_id,
  r.route_id,
  u.gate_code,
  u.route_system_code,
  u.institution_or_provider_name,
  u.programme_or_opportunity_name,
  r.known_route,
  r.document_ready,
  r.source_verified,
  r.payment_ready,
  r.deadline_risk,
  r.readiness_status,
  r.blockers,
  false as candidate_can_verify_source,
  false as candidate_can_mark_submitted,
  false as candidate_can_mark_paid,
  false as production_ready
from candidate_route_readiness r
join route_universe u on u.id = r.route_id;

create or replace view candidate_cao_choices_view as
select
  p.id as parent_application_id,
  p.candidate_id,
  p.status as parent_status,
  p.counts_as_kingsmen_managed_application,
  c.id as choice_id,
  c.programme_name,
  c.institution_name,
  c.campus,
  c.choice_order,
  c.source_confidence,
  false as child_choice_counts_as_separate_kingsmen_application,
  false as production_ready
from cao_parent_applications p
join cao_programme_choices c on c.parent_application_id = p.id;

alter table route_gates enable row level security;
alter table route_systems enable row level security;
alter table route_universe enable row level security;
alter table route_source_authorities enable row level security;
alter table candidate_route_readiness enable row level security;
alter table cao_parent_applications enable row level security;
alter table cao_programme_choices enable row level security;

insert into route_gates (code, display_name)
values
  ('higher_education', 'Higher Education'),
  ('tvet', 'TVET'),
  ('seta_learnership', 'SETA / Learnership'),
  ('internship', 'Internship'),
  ('apprenticeship', 'Apprenticeship'),
  ('employment', 'Employment')
on conflict (code) do nothing;

insert into route_systems (code, display_name, gate_code)
values
  ('cao', 'CAO', 'higher_education'),
  ('institution_direct', 'Institution Direct', 'higher_education'),
  ('nsfas', 'NSFAS', 'higher_education'),
  ('tvet_college', 'TVET College', 'tvet'),
  ('seta_provider', 'SETA Provider', 'seta_learnership'),
  ('employer', 'Employer', 'employment'),
  ('bursary_provider', 'Bursary Provider', 'higher_education'),
  ('other', 'Other', null)
on conflict (code) do nothing;