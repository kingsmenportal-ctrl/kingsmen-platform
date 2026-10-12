create table if not exists public.communication_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text unique not null,
  template_name text not null,
  channel text not null,
  subject_template text,
  body_template text not null,
  purpose text not null,
  allowed_when text[] not null default array[]::text[],
  requires_human_review boolean not null default false,
  is_active boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.communication_threads (
  id uuid primary key default gen_random_uuid(),
  thread_ref text unique not null,
  candidate_ref text not null,
  application_ref text,
  thread_type text not null default 'CANDIDATE_SUPPORT',
  status text not null default 'OPEN',
  priority text not null default 'NORMAL',
  primary_channel text not null default 'EMAIL_PRIMARY',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_ref text unique not null,
  candidate_ref text,
  application_ref text,
  thread_ref text,
  template_key text,
  channel text not null,
  recipient text not null,
  subject text,
  body text not null,
  purpose text not null,
  urgency text not null default 'NORMAL',
  status text not null default 'QUEUED',
  idempotency_key text unique not null,
  scheduled_for timestamptz not null default now(),
  locked_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  last_error text,
  evidence_ref text,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  attempt_ref text unique not null,
  notification_ref text not null,
  channel text not null,
  provider text not null default 'UNSET',
  provider_message_id text,
  status text not null default 'ATTEMPTED',
  response_code text,
  response_body jsonb not null default '{}'::jsonb,
  attempted_at timestamptz not null default now(),
  evidence_ref text
);

create table if not exists public.inbound_messages (
  id uuid primary key default gen_random_uuid(),
  inbound_ref text unique not null,
  candidate_ref text,
  thread_ref text,
  channel text not null,
  sender text not null,
  subject text,
  body text not null,
  detected_intent text,
  urgency text not null default 'NORMAL',
  status text not null default 'RECEIVED',
  needs_human_review boolean not null default false,
  evidence_ref text,
  received_at timestamptz not null default now()
);

create table if not exists public.candidate_portal_messages (
  id uuid primary key default gen_random_uuid(),
  portal_message_ref text unique not null,
  candidate_ref text not null,
  thread_ref text,
  title text not null,
  body text not null,
  message_type text not null default 'STATUS_UPDATE',
  visible_to_candidate boolean not null default true,
  read_at timestamptz,
  evidence_ref text,
  created_at timestamptz not null default now()
);

create table if not exists public.urgent_whatsapp_escalations (
  id uuid primary key default gen_random_uuid(),
  escalation_ref text unique not null,
  candidate_ref text,
  application_ref text,
  thread_ref text,
  reason text not null,
  urgency text not null default 'URGENT',
  approved_by_operator_ref text,
  approval_ref text,
  status text not null default 'PENDING_APPROVAL',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  sent_at timestamptz,
  evidence_ref text
);

create table if not exists public.communication_quiet_hours (
  id uuid primary key default gen_random_uuid(),
  quiet_ref text unique not null,
  name text not null,
  timezone text not null default 'Africa/Johannesburg',
  starts_at_local time not null,
  ends_at_local time not null,
  applies_to_channels text[] not null default array['EMAIL_PRIMARY','SMS_BACKUP_ONLY','WHATSAPP_URGENT_ONLY'],
  emergency_override_allowed boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.communication_rate_limits (
  id uuid primary key default gen_random_uuid(),
  limit_ref text unique not null,
  channel text not null,
  window_name text not null,
  max_count integer not null,
  current_count integer not null default 0,
  reset_at timestamptz not null default now(),
  status text not null default 'NORMAL',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.message_evidence_ledger (
  id uuid primary key default gen_random_uuid(),
  evidence_ref text unique not null,
  source_ref text not null,
  source_type text not null,
  candidate_ref text,
  application_ref text,
  channel text not null,
  event_name text not null,
  event_summary text not null,
  proof_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_outbox_status on public.notification_outbox(status, scheduled_for, urgency);
create index if not exists idx_notification_outbox_candidate on public.notification_outbox(candidate_ref, created_at desc);
create index if not exists idx_delivery_attempts_notification on public.notification_delivery_attempts(notification_ref, attempted_at desc);
create index if not exists idx_inbound_messages_status on public.inbound_messages(status, urgency, received_at desc);
create index if not exists idx_portal_messages_candidate on public.candidate_portal_messages(candidate_ref, created_at desc);
create index if not exists idx_whatsapp_escalations_status on public.urgent_whatsapp_escalations(status, urgency, created_at desc);
create index if not exists idx_message_evidence_source on public.message_evidence_ledger(source_type, source_ref);

alter table public.communication_templates enable row level security;
alter table public.communication_threads enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.notification_delivery_attempts enable row level security;
alter table public.inbound_messages enable row level security;
alter table public.candidate_portal_messages enable row level security;
alter table public.urgent_whatsapp_escalations enable row level security;
alter table public.communication_quiet_hours enable row level security;
alter table public.communication_rate_limits enable row level security;
alter table public.message_evidence_ledger enable row level security;

drop policy if exists communication_templates_all on public.communication_templates;
create policy communication_templates_all on public.communication_templates TO service_role for all using (true) with check (true);
drop policy if exists communication_threads_all on public.communication_threads;
create policy communication_threads_all on public.communication_threads TO service_role for all using (true) with check (true);
drop policy if exists notification_outbox_all on public.notification_outbox;
create policy notification_outbox_all on public.notification_outbox TO service_role for all using (true) with check (true);
drop policy if exists notification_delivery_attempts_all on public.notification_delivery_attempts;
create policy notification_delivery_attempts_all on public.notification_delivery_attempts TO service_role for all using (true) with check (true);
drop policy if exists inbound_messages_all on public.inbound_messages;
create policy inbound_messages_all on public.inbound_messages TO service_role for all using (true) with check (true);
drop policy if exists candidate_portal_messages_all on public.candidate_portal_messages;
create policy candidate_portal_messages_all on public.candidate_portal_messages TO service_role for all using (true) with check (true);
drop policy if exists urgent_whatsapp_escalations_all on public.urgent_whatsapp_escalations;
create policy urgent_whatsapp_escalations_all on public.urgent_whatsapp_escalations TO service_role for all using (true) with check (true);
drop policy if exists communication_quiet_hours_all on public.communication_quiet_hours;
create policy communication_quiet_hours_all on public.communication_quiet_hours TO service_role for all using (true) with check (true);
drop policy if exists communication_rate_limits_all on public.communication_rate_limits;
create policy communication_rate_limits_all on public.communication_rate_limits TO service_role for all using (true) with check (true);
drop policy if exists message_evidence_ledger_all on public.message_evidence_ledger;
create policy message_evidence_ledger_all on public.message_evidence_ledger TO service_role for all using (true) with check (true);