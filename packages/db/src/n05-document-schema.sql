-- N05-DOCUMENT-02 — Document Vault PostgreSQL schema declaration.
-- Apply through approved migration runner only. Do not apply directly to production.

create table if not exists document_types (
  code text primary key,
  display_name text not null,
  required_for_gate text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists document_requests (
  id uuid primary key,
  candidate_id uuid not null references candidates(id),
  document_type_code text not null references document_types(code),
  reason text not null,
  status text not null default 'requested',
  evidence_id uuid,
  audit_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists candidate_documents (
  id uuid primary key,
  candidate_id uuid not null references candidates(id),
  document_type_code text not null references document_types(code),
  storage_ref text not null,
  sha256 text,
  status text not null default 'uploaded',
  evidence_id uuid,
  audit_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists document_reviews (
  id uuid primary key,
  document_id uuid not null references candidate_documents(id),
  reviewer_actor_type text not null,
  review_status text not null,
  proof_id uuid,
  evidence_id uuid not null,
  audit_id uuid not null,
  safe_notes text,
  created_at timestamptz not null default now()
);

create table if not exists document_ocr_fraud_reviews (
  id uuid primary key,
  document_id uuid not null references candidate_documents(id),
  ocr_status text not null default 'pending',
  extracted_text_safe_summary text,
  fraud_risk text not null default 'unknown',
  human_review_required boolean not null default false,
  evidence_id uuid not null,
  audit_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists document_evidence_links (
  id uuid primary key,
  document_id uuid not null references candidate_documents(id),
  evidence_id uuid not null,
  link_reason text not null,
  append_only boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace view candidate_document_status_view as
select
  d.id as document_id,
  d.candidate_id,
  d.document_type_code,
  dt.display_name,
  d.status,
  d.created_at,
  d.evidence_id,
  d.audit_id
from candidate_documents d
join document_types dt on dt.code = d.document_type_code;

alter table document_types enable row level security;
alter table document_requests enable row level security;
alter table candidate_documents enable row level security;
alter table document_reviews enable row level security;
alter table document_ocr_fraud_reviews enable row level security;
alter table document_evidence_links enable row level security;

insert into document_types (code, display_name, required_for_gate)
values
  ('id_document', 'ID Document', 'all'),
  ('latest_results', 'Latest Results', 'higher_education'),
  ('matric_certificate', 'Matric Certificate', 'higher_education'),
  ('proof_of_residence', 'Proof of Residence', 'funding'),
  ('parent_guardian_id', 'Parent or Guardian ID', 'funding'),
  ('proof_of_income', 'Proof of Income', 'funding'),
  ('cv', 'CV', 'employment'),
  ('motivation_letter', 'Motivation Letter', 'multiple'),
  ('academic_transcript', 'Academic Transcript', 'higher_education'),
  ('bank_confirmation', 'Bank Confirmation', 'payments')
on conflict (code) do nothing;