-- Disposable PostgreSQL fixture for event-driven notification outbox integration.
do $roles$
begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end
$roles$;

create table public.candidate_private_document_reviews(
 id uuid primary key, document_id uuid not null, candidate_id uuid not null, reviewer_auth_user_id uuid not null,
 decision text not null, reviewer_note text not null, evidence_reference text not null, created_at timestamptz not null default now()
);
create table public.candidate_private_documents(
 id uuid primary key, candidate_id uuid not null, application_id uuid, original_filename text not null, status text not null
);
create table public.candidate_communication_preferences(
 candidate_id uuid primary key, email_address text, email_transactional boolean not null default false
);
create table public.finance_payments(
 id uuid primary key default gen_random_uuid(), payment_ref text unique not null, order_ref text not null,
 candidate_ref text not null, payment_status text not null, verified boolean not null default false
);
create table public.communication_templates(
 id uuid primary key default gen_random_uuid(), template_key text unique not null, template_name text not null,
 channel text not null, subject_template text, body_template text not null, purpose text not null,
 allowed_when text[] not null default array[]::text[], requires_human_review boolean not null default false,
 is_active boolean not null default true, version integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.notification_outbox(
 id uuid primary key default gen_random_uuid(), notification_ref text unique not null,
 candidate_ref text, application_ref text, thread_ref text, template_key text, channel text not null,
 recipient text not null, subject text, body text not null, purpose text not null,
 urgency text not null default 'NORMAL', status text not null default 'QUEUED',
 idempotency_key text unique not null, scheduled_for timestamptz not null default now(),
 locked_at timestamptz, sent_at timestamptz, failed_at timestamptz, last_error text,
 evidence_ref text, created_at timestamptz not null default now()
);
create table public.notification_delivery_attempts(
 id uuid primary key default gen_random_uuid(), attempt_ref text unique not null, notification_ref text not null,
 channel text not null, provider text not null default 'UNSET', provider_message_id text,
 status text not null default 'ATTEMPTED', response_code text, response_body jsonb not null default '{}'::jsonb,
 attempted_at timestamptz not null default now(), evidence_ref text
);
