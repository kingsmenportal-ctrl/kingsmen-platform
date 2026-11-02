-- Private, request-scoped evidence for candidate identity review.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'identity-review-evidence',
  'identity-review-evidence',
  false,
  8388608,
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = 8388608,
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']::text[];

create table if not exists public.candidate_identity_review_evidence (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.candidate_identity_review_requests(id) on delete cascade,
  supabase_user_id uuid not null references auth.users(id) on delete cascade,
  storage_bucket text not null default 'identity-review-evidence'
    check (storage_bucket = 'identity-review-evidence'),
  storage_path text not null unique,
  original_filename text not null check (length(trim(original_filename)) between 1 and 255),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes bigint not null check (size_bytes between 1 and 8388608),
  sha256_hex text not null check (sha256_hex ~ '^[0-9a-f]{64}$'),
  review_status text not null default 'PENDING'
    check (review_status in ('PENDING', 'ACCEPTED', 'REJECTED')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  reviewer_note text,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint candidate_identity_review_evidence_review_fields check (
    (review_status = 'PENDING' and reviewed_by is null and reviewed_at is null)
    or (review_status in ('ACCEPTED', 'REJECTED') and reviewed_by is not null and reviewed_at is not null)
  ),
  constraint candidate_identity_review_evidence_reviewer_note check (
    reviewer_note is null or length(trim(reviewer_note)) between 3 and 1200
  )
);

create index if not exists candidate_identity_review_evidence_request_idx
  on public.candidate_identity_review_evidence (request_id, uploaded_at);

alter table public.candidate_identity_review_evidence enable row level security;
revoke all on public.candidate_identity_review_evidence from public, anon, authenticated;
grant select, insert, update, delete on public.candidate_identity_review_evidence to service_role;

alter table public.candidate_identity_review_audit
  drop constraint if exists candidate_identity_review_audit_action_check;
alter table public.candidate_identity_review_audit
  add constraint candidate_identity_review_audit_action_check
  check (action = any (array[
    'SUBMITTED','APPROVED','REJECTED','NEEDS_INFORMATION','CANDIDATE_RESPONSE',
    'EVIDENCE_ACCEPTED','EVIDENCE_REJECTED'
  ]::text[]));
