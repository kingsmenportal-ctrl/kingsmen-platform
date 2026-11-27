-- Phase 5: durable communication delivery, retries, consent and privacy boundary.
-- Depends on db/migrations/0007_n09_notifications_communications.sql and 0008_n10_finance_payfast.sql.
-- Review-only until backup provenance, isolated restore and change-control approval pass.
begin;

alter table public.notification_outbox
  add column if not exists provider_delivery_status text not null default 'UNKNOWN',
  add column if not exists attempt_count integer not null default 0,
  add column if not exists max_attempts integer not null default 5,
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists last_attempt_at timestamptz,
  add column if not exists provider text,
  add column if not exists suppressed_at timestamptz,
  add column if not exists suppression_reason text;

do $constraint$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.notification_outbox'::regclass and conname='notification_outbox_retry_bounds_chk') then
    alter table public.notification_outbox add constraint notification_outbox_retry_bounds_chk
      check (attempt_count >= 0 and max_attempts between 1 and 12 and attempt_count <= max_attempts);
  end if;
end
$constraint$;

alter table public.candidate_private_documents
  add column if not exists deleted_at timestamptz,
  add column if not exists retention_expires_at timestamptz;
create index if not exists candidate_private_documents_retention_idx
  on public.candidate_private_documents(candidate_id,retention_expires_at)
  where deleted_at is null;

create table if not exists public.candidate_private_document_retention_requests (
  id uuid primary key default gen_random_uuid(),
  request_ref text unique not null,
  document_id uuid not null references public.candidate_private_documents(id) on delete restrict,
  candidate_id uuid not null references public.candidates(id) on delete restrict,
  requested_by_auth_user_id uuid not null,
  reason text not null check (length(trim(reason)) between 3 and 1200),
  request_status text not null default 'PENDING_REVIEW' check (request_status in ('PENDING_REVIEW','APPROVED','REJECTED','COMPLETED')),
  reviewed_by_auth_user_id uuid,
  reviewer_note text,
  approval_ref text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  completed_at timestamptz,
  evidence_ref text,
  constraint private_document_retention_review_state_chk check (
    (request_status='PENDING_REVIEW' and reviewed_at is null and completed_at is null)
    or (request_status in ('APPROVED','REJECTED') and reviewed_at is not null and completed_at is null)
    or (request_status='COMPLETED' and reviewed_at is not null and completed_at is not null)
  )
);
create unique index if not exists candidate_private_document_one_pending_deletion_uq
  on public.candidate_private_document_retention_requests(document_id)
  where request_status in ('PENDING_REVIEW','APPROVED');
alter table public.candidate_private_document_retention_requests enable row level security;
revoke all on public.candidate_private_document_retention_requests from public, anon, authenticated;
grant all on public.candidate_private_document_retention_requests to service_role;

create table if not exists public.candidate_communication_preferences (
  candidate_ref text primary key,
  transactional_email_enabled boolean not null default true,
  marketing_email_enabled boolean not null default false,
  sms_fallback_enabled boolean not null default false,
  whatsapp_urgent_enabled boolean not null default false,
  suppressed_at timestamptz,
  suppression_reason text,
  consent_source text not null default 'ACCOUNT_DEFAULT',
  consent_updated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidate_communication_suppression_pair_chk check (
    (suppressed_at is null and suppression_reason is null)
    or (suppressed_at is not null and nullif(trim(suppression_reason),'') is not null)
  )
);

create table if not exists public.notification_provider_events (
  event_id text primary key,
  provider_message_id text not null,
  event_type text not null check (event_type in ('DELIVERED','BOUNCED','COMPLAINED','DELAYED')),
  safe_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_payload)='object'),
  received_at timestamptz not null default now()
);
alter table public.notification_provider_events enable row level security;
revoke all on public.notification_provider_events from public, anon, authenticated;
grant all on public.notification_provider_events to service_role;

create table if not exists public.communication_preference_events (
  event_ref text primary key,
  candidate_ref text not null,
  actor_auth_user_id uuid not null,
  old_preferences jsonb not null check (jsonb_typeof(old_preferences)='object'),
  new_preferences jsonb not null check (jsonb_typeof(new_preferences)='object'),
  created_at timestamptz not null default now()
);
alter table public.communication_preference_events enable row level security;
revoke all on public.communication_preference_events from public, anon, authenticated;
grant all on public.communication_preference_events to service_role;

create index if not exists notification_outbox_retry_idx
  on public.notification_outbox(status, next_attempt_at, created_at)
  where status in ('QUEUED','FAILED');

alter table public.candidate_communication_preferences enable row level security;
revoke all on public.candidate_communication_preferences from public, anon, authenticated;
grant all on public.candidate_communication_preferences to service_role;

-- Outbox payloads and delivery attempts are backend-only; portal messages are the candidate read model.
drop policy if exists communication_templates_all on public.communication_templates;
drop policy if exists communication_threads_all on public.communication_threads;
drop policy if exists notification_outbox_all on public.notification_outbox;
drop policy if exists notification_delivery_attempts_all on public.notification_delivery_attempts;
drop policy if exists inbound_messages_all on public.inbound_messages;
drop policy if exists candidate_portal_messages_all on public.candidate_portal_messages;
drop policy if exists urgent_whatsapp_escalations_all on public.urgent_whatsapp_escalations;
drop policy if exists communication_quiet_hours_all on public.communication_quiet_hours;
drop policy if exists communication_rate_limits_all on public.communication_rate_limits;
drop policy if exists message_evidence_ledger_all on public.message_evidence_ledger;

do $policies$
declare t text;
begin
  foreach t in array array[
    'communication_templates','communication_threads','notification_outbox',
    'notification_delivery_attempts','inbound_messages','candidate_portal_messages',
    'urgent_whatsapp_escalations','communication_quiet_hours','communication_rate_limits',
    'message_evidence_ledger'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_service_role_all', t);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', t || '_service_role_all', t);
  end loop;
end
$policies$;

revoke all on table public.communication_templates, public.communication_threads,
  public.notification_outbox, public.notification_delivery_attempts, public.inbound_messages,
  public.candidate_portal_messages, public.urgent_whatsapp_escalations,
  public.communication_quiet_hours, public.communication_rate_limits, public.message_evidence_ledger
from public, anon, authenticated;
grant all on table public.communication_templates, public.communication_threads,
  public.notification_outbox, public.notification_delivery_attempts, public.inbound_messages,
  public.candidate_portal_messages, public.urgent_whatsapp_escalations,
  public.communication_quiet_hours, public.communication_rate_limits, public.message_evidence_ledger
to service_role;
grant select on table public.candidate_portal_messages to authenticated;

drop policy if exists candidate_portal_messages_candidate_read_own on public.candidate_portal_messages;
create policy candidate_portal_messages_candidate_read_own
  on public.candidate_portal_messages for select to authenticated
  using (
    visible_to_candidate is true
    and exists (
      select 1
      from public.candidate_auth_identity_links l
      join public.candidates c on c.id=l.candidate_id and c.is_active is true
      where l.supabase_user_id=auth.uid()
        and l.candidate_id=c.id
        and l.link_status='VERIFIED'
        and l.verified_at is not null and l.verified_at <= statement_timestamp()
        and l.verified_by is not null
        and (c.id::text = candidate_ref or c.public_ref::text = candidate_ref)
    )
  );

-- The client can read only active catalogue entries; all orders/payments/receipts remain backend-only.
drop policy if exists finance_plan_catalog_all on public.finance_plan_catalog;
drop policy if exists finance_orders_all on public.finance_orders;
drop policy if exists finance_invoices_all on public.finance_invoices;
drop policy if exists payfast_payment_intents_all on public.payfast_payment_intents;
drop policy if exists finance_payments_all on public.finance_payments;
drop policy if exists payfast_itn_receipts_all on public.payfast_itn_receipts;
drop policy if exists payfast_signature_audit_all on public.payfast_signature_audit;
drop policy if exists finance_refund_requests_all on public.finance_refund_requests;
drop policy if exists finance_ledger_entries_all on public.finance_ledger_entries;
drop policy if exists payment_evidence_ledger_all on public.payment_evidence_ledger;

drop policy if exists finance_plan_catalog_active_read on public.finance_plan_catalog;
create policy finance_plan_catalog_active_read
  on public.finance_plan_catalog for select to anon, authenticated using (active is true);

do $finance_policies$
declare t text;
begin
  foreach t in array array[
    'finance_orders','finance_invoices','payfast_payment_intents','finance_payments',
    'payfast_itn_receipts','payfast_signature_audit','finance_refund_requests',
    'finance_ledger_entries','payment_evidence_ledger'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_service_role_all', t);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', t || '_service_role_all', t);
  end loop;
end
$finance_policies$;

revoke all on table public.finance_plan_catalog from public, anon, authenticated;
grant select on table public.finance_plan_catalog to anon, authenticated;
revoke all on table public.finance_orders, public.finance_invoices, public.payfast_payment_intents,
  public.finance_payments, public.payfast_itn_receipts, public.payfast_signature_audit,
  public.finance_refund_requests, public.finance_ledger_entries, public.payment_evidence_ledger
from public, anon, authenticated;
grant all on table public.finance_orders, public.finance_invoices, public.payfast_payment_intents,
  public.finance_payments, public.payfast_itn_receipts, public.payfast_signature_audit,
  public.finance_refund_requests, public.finance_ledger_entries, public.payment_evidence_ledger
to service_role;

insert into public.communication_templates(
  template_key,template_name,channel,subject_template,body_template,purpose,allowed_when,requires_human_review,is_active,version
) values
  ('payment_verified_v1','Payment verified','EMAIL_PRIMARY','Kingsmen payment verified',
   'Your Kingsmen payment has been verified. Sign in to review your plan status and next steps.','PAYMENT_VERIFIED',array['PAYMENT_VERIFIED'],false,true,1),
  ('document_review_status_v1','Document review status','EMAIL_PRIMARY','Your Kingsmen document status changed',
   'A document status has changed in your Kingsmen vault. Sign in to review the status and next action.','DOCUMENT_REVIEW_UPDATE',array['DOCUMENT_REVIEW_UPDATE'],false,true,1)
on conflict (template_key) do nothing;

create or replace function public.enqueue_document_review_notification()
returns trigger
language plpgsql security definer
set search_path = ''
as $function$
declare
  v_email text;
  v_title text;
  v_body text;
  v_key text;
  v_created text;
begin
  if new.from_status is not distinct from new.to_status
     or new.to_status not in ('UNDER_REVIEW','VERIFIED','CORRECTION_REQUIRED','REJECTED') then
    return new;
  end if;
  v_title := case new.to_status
    when 'VERIFIED' then 'Document verified'
    when 'CORRECTION_REQUIRED' then 'Document correction requested'
    when 'REJECTED' then 'Document review rejected'
    else 'Document under review' end;
  v_body := case new.to_status
    when 'VERIFIED' then 'A Kingsmen reviewer has verified a document in your vault. Sign in to view the updated status.'
    when 'CORRECTION_REQUIRED' then 'A Kingsmen reviewer requested a correction. Sign in to read the next steps and upload corrected evidence.'
    when 'REJECTED' then 'A Kingsmen reviewer rejected a document. Sign in to review the recorded reason and next steps.'
    else 'A Kingsmen reviewer has started reviewing a document. Sign in to view its status.' end;
  v_created := to_char(new.created_at at time zone 'UTC','YYYYMMDDHH24MISSMS');
  v_key := 'document-review:' || new.document_id::text || ':' || new.to_status || ':' || v_created;
  select ca.email into v_email from public.candidate_accounts ca
    where ca.candidate_id=new.candidate_id and ca.email_verified is true limit 1;
  insert into public.candidate_portal_messages(
    portal_message_ref,candidate_ref,title,body,message_type,visible_to_candidate,evidence_ref
  ) values (
    'portal-' || v_key,new.candidate_id::text,v_title,v_body,'DOCUMENT_STATUS',true,'document-review:' || new.document_id::text
  ) on conflict (portal_message_ref) do nothing;
  if v_email is not null then
    insert into public.notification_outbox(
      notification_ref,candidate_ref,template_key,channel,recipient,subject,body,purpose,urgency,status,
      idempotency_key,scheduled_for,evidence_ref
    ) values (
      'notif-' || v_key,new.candidate_id::text,'document_review_status_v1','EMAIL_PRIMARY',v_email,
      v_title,v_body,'DOCUMENT_REVIEW_UPDATE','NORMAL','QUEUED',v_key,statement_timestamp(),
      'document-review:' || new.document_id::text
    ) on conflict (idempotency_key) do nothing;
  end if;
  return new;
end;
$function$;

do $document_trigger$
begin
  if to_regclass('public.candidate_private_document_events') is null then
    raise exception 'PHASE5_REQUIRES_candidate_private_document_events_SCHEMA_RECONCILIATION';
  end if;
  drop trigger if exists candidate_private_document_review_notify on public.candidate_private_document_events;
  create trigger candidate_private_document_review_notify
    after insert on public.candidate_private_document_events
    for each row execute function public.enqueue_document_review_notification();
end;
$document_trigger$;

revoke all on function public.enqueue_document_review_notification() from public, anon, authenticated;
grant execute on function public.enqueue_document_review_notification() to service_role;

create or replace function public.request_candidate_private_document_deletion(
  p_supabase_user_id uuid, p_candidate_id uuid, p_document_id uuid, p_reason text
) returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare v_doc public.candidate_private_documents%rowtype; v_request public.candidate_private_document_retention_requests%rowtype;
begin
  if p_supabase_user_id is null or p_candidate_id is null or p_document_id is null
     or p_reason is null or length(trim(p_reason)) not between 3 and 1200 then
    raise exception 'INVALID_DOCUMENT_DELETION_REQUEST' using errcode='22023';
  end if;
  if not exists (select 1 from public.candidate_auth_identity_links l
    join public.candidates c on c.id=l.candidate_id and c.is_active is true
    where l.supabase_user_id=p_supabase_user_id and l.candidate_id=p_candidate_id
      and l.link_status='VERIFIED' and l.verified_at is not null
      and l.verified_at<=statement_timestamp() and l.verified_by is not null) then
    raise insufficient_privilege using message='VERIFIED_CANDIDATE_IDENTITY_REQUIRED';
  end if;
  select * into v_doc from public.candidate_private_documents d
    where d.id=p_document_id and d.candidate_id=p_candidate_id and d.deleted_at is null for update;
  if not found then raise exception 'DOCUMENT_NOT_FOUND' using errcode='P0002'; end if;
  if v_doc.status='UPLOAD_PENDING' then raise exception 'PENDING_UPLOAD_CANNOT_BE_DELETED' using errcode='55000'; end if;
  select * into v_request from public.candidate_private_document_retention_requests r
    where r.document_id=p_document_id and r.request_status in ('PENDING_REVIEW','APPROVED') limit 1;
  if found then return jsonb_build_object('ok',true,'request_id',v_request.id,'request_ref',v_request.request_ref,
    'request_status',v_request.request_status,'idempotent',true,'file_deleted',false); end if;
  insert into public.candidate_private_document_retention_requests(
    request_ref,document_id,candidate_id,requested_by_auth_user_id,reason,evidence_ref
  ) values ('doc-delete-' || replace(gen_random_uuid()::text,'-',''),p_document_id,p_candidate_id,
    p_supabase_user_id,left(trim(p_reason),1200),'doc-retention:' || p_document_id::text)
  returning * into v_request;
  return jsonb_build_object('ok',true,'request_id',v_request.id,'request_ref',v_request.request_ref,
    'request_status',v_request.request_status,'idempotent',false,'file_deleted',false);
end;
$function$;

create or replace function public.review_candidate_private_document_deletion(
  p_request_id uuid, p_reviewer_auth_user_id uuid, p_decision text, p_reviewer_note text, p_approval_ref text default null
) returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare v_request public.candidate_private_document_retention_requests%rowtype; v_status text;
begin
  if p_request_id is null or p_reviewer_auth_user_id is null or p_decision not in ('APPROVE','REJECT')
     or p_reviewer_note is null or length(trim(p_reviewer_note)) not between 3 and 1200
     or (p_decision='APPROVE' and nullif(trim(coalesce(p_approval_ref,'')),'') is null) then
    raise exception 'INVALID_DOCUMENT_DELETION_REVIEW' using errcode='22023';
  end if;
  if not exists (select 1 from public.platform_reviewers r where r.auth_user_id=p_reviewer_auth_user_id
    and r.is_active is true and r.revoked_at is null and r.role_code='PLATFORM_ADMIN') then
    raise insufficient_privilege using message='PLATFORM_ADMIN_REQUIRED_FOR_DOCUMENT_DELETION';
  end if;
  select * into v_request from public.candidate_private_document_retention_requests where id=p_request_id for update;
  if not found then raise exception 'DOCUMENT_DELETION_REQUEST_NOT_FOUND' using errcode='P0002'; end if;
  if v_request.request_status='APPROVED' and p_decision='APPROVE' then
    return jsonb_build_object('ok',true,'request_id',v_request.id,'request_status','APPROVED','document_id',v_request.document_id,'idempotent',true);
  end if;
  if v_request.request_status='REJECTED' and p_decision='REJECT' then
    return jsonb_build_object('ok',true,'request_id',v_request.id,'request_status','REJECTED','document_id',v_request.document_id,'idempotent',true);
  end if;
  if v_request.request_status<>'PENDING_REVIEW' then raise exception 'DOCUMENT_DELETION_REQUEST_ALREADY_FINALIZED' using errcode='55000'; end if;
  v_status:=case when p_decision='APPROVE' then 'APPROVED' else 'REJECTED' end;
  update public.candidate_private_document_retention_requests set request_status=v_status,
    reviewed_by_auth_user_id=p_reviewer_auth_user_id,reviewer_note=left(trim(p_reviewer_note),1200),
    approval_ref=case when p_decision='APPROVE' then p_approval_ref else null end,reviewed_at=statement_timestamp()
    where id=v_request.id;
  return jsonb_build_object('ok',true,'request_id',v_request.id,'request_status',v_status,
    'document_id',v_request.document_id,'candidate_id',v_request.candidate_id,'idempotent',false);
end;
$function$;

create or replace function public.complete_candidate_private_document_deletion(
  p_request_id uuid, p_reviewer_auth_user_id uuid, p_evidence_ref text
) returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare v_request public.candidate_private_document_retention_requests%rowtype;
begin
  if p_request_id is null or p_reviewer_auth_user_id is null or p_evidence_ref is null then
    raise exception 'INVALID_DOCUMENT_DELETION_COMPLETION' using errcode='22023';
  end if;
  if not exists (select 1 from public.platform_reviewers r where r.auth_user_id=p_reviewer_auth_user_id
    and r.is_active is true and r.revoked_at is null and r.role_code='PLATFORM_ADMIN') then
    raise insufficient_privilege using message='PLATFORM_ADMIN_REQUIRED_FOR_DOCUMENT_DELETION';
  end if;
  select * into v_request from public.candidate_private_document_retention_requests where id=p_request_id for update;
  if not found then raise exception 'DOCUMENT_DELETION_REQUEST_NOT_FOUND' using errcode='P0002'; end if;
  if v_request.request_status='COMPLETED' then
    return jsonb_build_object('ok',true,'request_id',v_request.id,'request_status','COMPLETED','file_deleted',true,'idempotent',true);
  end if;
  if v_request.request_status<>'APPROVED' then raise exception 'APPROVED_DELETION_REQUEST_REQUIRED' using errcode='55000'; end if;
  update public.candidate_private_documents set deleted_at=coalesce(deleted_at,statement_timestamp()),
    retention_expires_at=null,updated_at=statement_timestamp() where id=v_request.document_id and candidate_id=v_request.candidate_id;
  if not found then raise exception 'DOCUMENT_NOT_FOUND' using errcode='P0002'; end if;
  update public.candidate_private_document_retention_requests set request_status='COMPLETED',
    completed_at=statement_timestamp(),evidence_ref=p_evidence_ref where id=v_request.id;
  return jsonb_build_object('ok',true,'request_id',v_request.id,'request_status','COMPLETED','file_deleted',true,'idempotent',false);
end;
$function$;

revoke all on function public.request_candidate_private_document_deletion(uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.request_candidate_private_document_deletion(uuid,uuid,uuid,text) to service_role;
revoke all on function public.review_candidate_private_document_deletion(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.review_candidate_private_document_deletion(uuid,uuid,text,text,text) to service_role;
revoke all on function public.complete_candidate_private_document_deletion(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.complete_candidate_private_document_deletion(uuid,uuid,text) to service_role;

create or replace function public.get_candidate_communication_preferences()
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare v_uid uuid:=auth.uid(); v_candidate uuid; v_count integer; v_preferences public.candidate_communication_preferences%rowtype;
begin
  if v_uid is null then raise insufficient_privilege using message='AUTHENTICATION_REQUIRED'; end if;
  select count(*),(array_agg(l.candidate_id order by l.id))[1] into v_count,v_candidate
  from public.candidate_auth_identity_links l join public.candidates c on c.id=l.candidate_id and c.is_active is true
  where l.supabase_user_id=v_uid and l.link_status='VERIFIED' and l.verified_at is not null
    and l.verified_at<=statement_timestamp() and l.verified_by is not null;
  if v_count<>1 or v_candidate is null then raise insufficient_privilege using message='VERIFIED_CANDIDATE_IDENTITY_REQUIRED'; end if;
  select * into v_preferences from public.candidate_communication_preferences where candidate_ref=v_candidate::text;
  if not found then return jsonb_build_object('transactional_email_enabled',true,'marketing_email_enabled',false,
    'sms_fallback_enabled',false,'whatsapp_urgent_enabled',false,'suppressed_at',null,'suppression_reason',null); end if;
  return jsonb_build_object('transactional_email_enabled',v_preferences.transactional_email_enabled,
    'marketing_email_enabled',v_preferences.marketing_email_enabled,'sms_fallback_enabled',v_preferences.sms_fallback_enabled,
    'whatsapp_urgent_enabled',v_preferences.whatsapp_urgent_enabled,'suppressed_at',v_preferences.suppressed_at,
    'suppression_reason',v_preferences.suppression_reason);
end;
$function$;

create or replace function public.update_candidate_communication_preferences(
  p_transactional_email_enabled boolean, p_marketing_email_enabled boolean,
  p_sms_fallback_enabled boolean, p_whatsapp_urgent_enabled boolean
) returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_uid uuid:=auth.uid(); v_candidate uuid; v_count integer;
  v_old jsonb; v_new jsonb; v_saved public.candidate_communication_preferences%rowtype;
  v_event_ref text:='comm-pref-' || replace(gen_random_uuid()::text,'-','');
begin
  if v_uid is null then raise insufficient_privilege using message='AUTHENTICATION_REQUIRED'; end if;
  if p_transactional_email_enabled is null or p_marketing_email_enabled is null or
     p_sms_fallback_enabled is null or p_whatsapp_urgent_enabled is null then
    raise exception 'ALL_COMMUNICATION_PREFERENCES_REQUIRED' using errcode='22023';
  end if;
  select count(*),(array_agg(l.candidate_id order by l.id))[1] into v_count,v_candidate
  from public.candidate_auth_identity_links l join public.candidates c on c.id=l.candidate_id and c.is_active is true
  where l.supabase_user_id=v_uid and l.link_status='VERIFIED' and l.verified_at is not null
    and l.verified_at<=statement_timestamp() and l.verified_by is not null;
  if v_count<>1 or v_candidate is null then raise insufficient_privilege using message='VERIFIED_CANDIDATE_IDENTITY_REQUIRED'; end if;
  select to_jsonb(p) into v_old from public.candidate_communication_preferences p where p.candidate_ref=v_candidate::text for update;
  v_old:=coalesce(v_old,jsonb_build_object('transactional_email_enabled',true,'marketing_email_enabled',false,
    'sms_fallback_enabled',false,'whatsapp_urgent_enabled',false,'suppressed_at',null,'suppression_reason',null));
  if p_transactional_email_enabled is true and v_old->>'suppressed_at' is not null then
    raise exception 'EMAIL_PROVIDER_SUPPRESSED' using errcode='55000';
  end if;
  insert into public.candidate_communication_preferences(
    candidate_ref,transactional_email_enabled,marketing_email_enabled,sms_fallback_enabled,whatsapp_urgent_enabled,
    consent_source,consent_updated_at,updated_at
  ) values (v_candidate::text,p_transactional_email_enabled,p_marketing_email_enabled,p_sms_fallback_enabled,
    p_whatsapp_urgent_enabled,'USER_PREFERENCE',statement_timestamp(),statement_timestamp())
  on conflict(candidate_ref) do update set
    transactional_email_enabled=excluded.transactional_email_enabled,marketing_email_enabled=excluded.marketing_email_enabled,
    sms_fallback_enabled=excluded.sms_fallback_enabled,whatsapp_urgent_enabled=excluded.whatsapp_urgent_enabled,
    consent_source='USER_PREFERENCE',consent_updated_at=statement_timestamp(),updated_at=statement_timestamp()
  returning * into v_saved;
  v_new:=jsonb_build_object('transactional_email_enabled',v_saved.transactional_email_enabled,
    'marketing_email_enabled',v_saved.marketing_email_enabled,'sms_fallback_enabled',v_saved.sms_fallback_enabled,
    'whatsapp_urgent_enabled',v_saved.whatsapp_urgent_enabled,'suppressed_at',v_saved.suppressed_at,
    'suppression_reason',v_saved.suppression_reason);
  insert into public.communication_preference_events(event_ref,candidate_ref,actor_auth_user_id,old_preferences,new_preferences)
    values(v_event_ref,v_candidate::text,v_uid,v_old,v_new);
  return jsonb_build_object('ok',true,'preferences',v_new,'event_ref',v_event_ref);
end;
$function$;

revoke all on function public.get_candidate_communication_preferences() from public, anon;
grant execute on function public.get_candidate_communication_preferences() to authenticated;
revoke all on function public.update_candidate_communication_preferences(boolean,boolean,boolean,boolean) from public, anon;
grant execute on function public.update_candidate_communication_preferences(boolean,boolean,boolean,boolean) to authenticated;

create or replace function public.claim_notification_outbox(p_limit integer default 20)
returns setof public.notification_outbox
language plpgsql security definer
set search_path = ''
as $function$
begin
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'INVALID_NOTIFICATION_BATCH_SIZE' using errcode='22023';
  end if;
  return query
  with eligible as (
    select o.id
    from public.notification_outbox o
    left join public.candidate_communication_preferences p on p.candidate_ref=o.candidate_ref
    where o.channel='EMAIL_PRIMARY'
      and (
        (o.status in ('QUEUED','FAILED') and coalesce(o.next_attempt_at,o.scheduled_for) <= statement_timestamp())
        or (o.status='LOCKED' and o.locked_at < statement_timestamp() - interval '10 minutes')
      )
      and o.attempt_count < o.max_attempts
      and o.suppressed_at is null
      and coalesce(p.transactional_email_enabled,true) is true
      and p.suppressed_at is null
    order by case o.urgency when 'EMERGENCY' then 0 when 'URGENT' then 1 else 2 end,
      coalesce(o.next_attempt_at,o.scheduled_for), o.created_at
    for update of o skip locked
    limit p_limit
  )
  update public.notification_outbox o
  set status='LOCKED', locked_at=statement_timestamp(), last_attempt_at=statement_timestamp(),
      attempt_count=o.attempt_count+1, provider='PENDING_PROVIDER'
  from eligible e where o.id=e.id
  returning o.*;
end;
$function$;

create or replace function public.record_notification_delivery_attempt(
  p_notification_ref text,
  p_outcome text,
  p_provider text,
  p_provider_message_id text default null,
  p_response_code text default null,
  p_safe_response jsonb default '{}'::jsonb,
  p_error_code text default null
) returns jsonb
language plpgsql security definer
set search_path = ''
as $function$
declare
  v_outbox public.notification_outbox%rowtype;
  v_attempt_ref text := 'attempt_' || replace(gen_random_uuid()::text,'-','');
  v_next_status text;
begin
  if p_notification_ref is null or p_outcome not in ('SENT','FAILED','SIMULATED')
     or p_provider is null or length(p_provider) not between 1 and 60
     or jsonb_typeof(coalesce(p_safe_response,'{}'::jsonb)) is distinct from 'object' then
    raise exception 'INVALID_NOTIFICATION_DELIVERY_RESULT' using errcode='22023';
  end if;
  select * into v_outbox from public.notification_outbox
    where notification_ref=p_notification_ref for update;
  if not found then raise exception 'NOTIFICATION_NOT_FOUND' using errcode='P0002'; end if;
  if v_outbox.status not in ('LOCKED','FAILED') then
    raise exception 'NOTIFICATION_NOT_CLAIMED' using errcode='55000';
  end if;

  insert into public.notification_delivery_attempts (
    attempt_ref, notification_ref, channel, provider, provider_message_id,
    status, response_code, response_body, attempted_at, evidence_ref
  ) values (
    v_attempt_ref, p_notification_ref, v_outbox.channel, p_provider, p_provider_message_id,
    p_outcome, p_response_code, coalesce(p_safe_response,'{}'::jsonb), statement_timestamp(), v_outbox.evidence_ref
  );

  if p_outcome='SENT' then
    update public.notification_outbox set status='SENT', sent_at=statement_timestamp(),
      failed_at=null, last_error=null, provider=p_provider, locked_at=null
    where id=v_outbox.id;
    return jsonb_build_object('ok',true,'status','SENT','delivery_confirmed',false,'attempt_ref',v_attempt_ref);
  elsif p_outcome='SIMULATED' then
    update public.notification_outbox set status='SIMULATED', sent_at=null,
      last_error=null, provider=p_provider, locked_at=null
    where id=v_outbox.id;
    return jsonb_build_object('ok',true,'status','SIMULATED','delivery_confirmed',false,'attempt_ref',v_attempt_ref);
  end if;

  v_next_status := case when v_outbox.attempt_count >= v_outbox.max_attempts then 'DEAD_LETTER' else 'FAILED' end;
  update public.notification_outbox
    set status=v_next_status, failed_at=statement_timestamp(), locked_at=null,
      last_error=left(coalesce(p_error_code,'PROVIDER_DELIVERY_FAILED'),120),
      provider=p_provider,
      next_attempt_at=statement_timestamp() + make_interval(secs => least(3600, 30 * (2 ^ least(greatest(v_outbox.attempt_count-1,0),7))::integer))
    where id=v_outbox.id;
  return jsonb_build_object('ok',true,'status',v_next_status,'delivery_confirmed',false,'attempt_ref',v_attempt_ref);
end;
$function$;

create or replace function public.suppress_candidate_email_after_bounce(
  p_candidate_ref text, p_reason text
) returns boolean
language plpgsql security definer
set search_path = ''
as $function$
begin
  if p_candidate_ref is null or length(p_candidate_ref) not between 1 and 200
     or p_reason is null or length(trim(p_reason)) not between 3 and 120 then
    raise exception 'INVALID_EMAIL_SUPPRESSION_INPUT' using errcode='22023';
  end if;
  insert into public.candidate_communication_preferences(
    candidate_ref, transactional_email_enabled, suppressed_at, suppression_reason,
    consent_source, consent_updated_at, updated_at
  ) values (
    p_candidate_ref, false, statement_timestamp(), left(trim(p_reason),120),
    'PROVIDER_BOUNCE', statement_timestamp(), statement_timestamp()
  )
  on conflict(candidate_ref) do update set transactional_email_enabled=false,
    suppressed_at=excluded.suppressed_at, suppression_reason=excluded.suppression_reason,
    consent_source='PROVIDER_BOUNCE', consent_updated_at=excluded.consent_updated_at,
    updated_at=excluded.updated_at;
  return true;
end;
$function$;

create or replace function public.get_candidate_finance_summary()
returns jsonb
language plpgsql security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_candidate_id uuid;
  v_identity_count integer;
begin
  if v_uid is null then raise insufficient_privilege using message='AUTHENTICATION_REQUIRED'; end if;
  select count(*), (array_agg(l.candidate_id order by l.id))[1]
    into v_identity_count, v_candidate_id
  from public.candidate_auth_identity_links l
  join public.candidates c on c.id=l.candidate_id and c.is_active is true
  where l.supabase_user_id=v_uid and l.link_status='VERIFIED'
    and l.verified_at is not null and l.verified_at <= statement_timestamp()
    and l.verified_by is not null;
  if v_identity_count <> 1 or v_candidate_id is null then
    raise insufficient_privilege using message='VERIFIED_CANDIDATE_IDENTITY_REQUIRED';
  end if;

  return jsonb_build_object(
    'orders', coalesce((
      select jsonb_agg(jsonb_build_object(
        'order_ref',o.order_ref,'plan_code',o.plan_code,'order_status',o.order_status,
        'amount_cents',o.amount_cents,'currency',o.currency,'created_at',o.created_at
      ) order by o.created_at desc)
      from public.finance_orders o where o.candidate_ref=v_candidate_id::text
    ),'[]'::jsonb),
    'invoices', coalesce((
      select jsonb_agg(jsonb_build_object(
        'invoice_ref',i.invoice_ref,'order_ref',i.order_ref,'invoice_status',i.invoice_status,
        'amount_cents',i.amount_cents,'currency',i.currency,'issued_at',i.issued_at,'paid_at',i.paid_at
      ) order by i.issued_at desc)
      from public.finance_invoices i where i.candidate_ref=v_candidate_id::text
    ),'[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'payment_ref',p.payment_ref,'order_ref',p.order_ref,'payment_status',p.payment_status,
        'amount_gross_cents',p.amount_gross_cents,'currency',p.currency,'verified',p.verified,
        'verified_at',p.verified_at,'created_at',p.created_at
      ) order by p.created_at desc)
      from public.finance_payments p where p.candidate_ref=v_candidate_id::text
    ),'[]'::jsonb),
    'refunds', coalesce((
      select jsonb_agg(jsonb_build_object(
        'refund_ref',r.refund_ref,'payment_ref',r.payment_ref,'amount_cents',r.amount_cents,
        'currency',r.currency,'refund_status',r.refund_status,'reason',r.reason,'created_at',r.created_at
      ) order by r.created_at desc)
      from public.finance_refund_requests r where r.candidate_ref=v_candidate_id::text
    ),'[]'::jsonb),
    'entitlements_activate_only_on_verified_payment', true
  );
end;
$function$;

create or replace function public.request_candidate_finance_refund(
  p_payment_ref text, p_amount_cents integer, p_reason text
) returns jsonb
language plpgsql security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_candidate_id uuid;
  v_identity_count integer;
  v_payment public.finance_payments%rowtype;
  v_refund_ref text := 'refund_' || replace(gen_random_uuid()::text,'-','');
  v_evidence_ref text := 'refund_ev_' || replace(gen_random_uuid()::text,'-','');
begin
  if v_uid is null then raise insufficient_privilege using message='AUTHENTICATION_REQUIRED'; end if;
  if p_payment_ref is null or length(p_payment_ref) not between 1 and 120
     or p_amount_cents is null or p_amount_cents <= 0
     or p_reason is null or length(trim(p_reason)) not between 3 and 1200 then
    raise exception 'INVALID_REFUND_REQUEST' using errcode='22023';
  end if;
  select count(*), (array_agg(l.candidate_id order by l.id))[1]
    into v_identity_count, v_candidate_id
  from public.candidate_auth_identity_links l
  join public.candidates c on c.id=l.candidate_id and c.is_active is true
  where l.supabase_user_id=v_uid and l.link_status='VERIFIED'
    and l.verified_at is not null and l.verified_at <= statement_timestamp()
    and l.verified_by is not null;
  if v_identity_count <> 1 or v_candidate_id is null then
    raise insufficient_privilege using message='VERIFIED_CANDIDATE_IDENTITY_REQUIRED';
  end if;

  select * into v_payment from public.finance_payments p
  where p.payment_ref=p_payment_ref and p.candidate_ref=v_candidate_id::text
    and p.payment_status='COMPLETE' and p.verified is true for share;
  if not found then raise insufficient_privilege using message='VERIFIED_OWN_PAYMENT_REQUIRED'; end if;
  if p_amount_cents > v_payment.amount_gross_cents then
    raise exception 'REFUND_EXCEEDS_VERIFIED_PAYMENT' using errcode='22023';
  end if;

  insert into public.finance_refund_requests(
    refund_ref,payment_ref,order_ref,candidate_ref,amount_cents,currency,reason,
    refund_status,requested_by,evidence_ref
  ) values (
    v_refund_ref,v_payment.payment_ref,v_payment.order_ref,v_candidate_id::text,p_amount_cents,
    v_payment.currency,left(trim(p_reason),1200),'PENDING_REVIEW',v_uid::text,v_evidence_ref
  );
  insert into public.finance_ledger_entries(
    ledger_ref,candidate_ref,order_ref,payment_ref,refund_ref,entry_type,debit_cents,credit_cents,
    currency,description,evidence_ref
  ) values (
    'ledger-refund-request:' || v_refund_ref,v_candidate_id::text,v_payment.order_ref,
    v_payment.payment_ref,v_refund_ref,'REFUND_REQUESTED',0,0,v_payment.currency,
    'Candidate refund request submitted for human finance review.',v_evidence_ref
  );
  insert into public.payment_evidence_ledger(
    evidence_ref,source_type,source_ref,candidate_ref,order_ref,payment_ref,event_name,event_summary,proof_payload
  ) values (
    v_evidence_ref,'REFUND_REQUEST',v_refund_ref,v_candidate_id::text,v_payment.order_ref,
    v_payment.payment_ref,'REFUND_REQUESTED','Refund request recorded; no refund was executed.',
    jsonb_build_object('amount_cents',p_amount_cents,'currency',v_payment.currency,'automatic_refund',false)
  );
  return jsonb_build_object('ok',true,'refund_ref',v_refund_ref,'refund_status','PENDING_REVIEW','refund_executed',false);
end;
$function$;

create or replace function public.review_finance_refund_request(
  p_refund_ref text, p_decision text, p_reviewer_note text, p_approval_ref text default null
) returns jsonb
language plpgsql security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_refund public.finance_refund_requests%rowtype;
  v_status text;
  v_evidence_ref text := 'refund_review_ev_' || replace(gen_random_uuid()::text,'-','');
begin
  if v_uid is null then raise insufficient_privilege using message='AUTHENTICATION_REQUIRED'; end if;
  if p_refund_ref is null or p_decision not in ('APPROVE','REJECT')
     or p_reviewer_note is null or length(trim(p_reviewer_note)) not between 3 and 1200
     or (p_decision='APPROVE' and nullif(trim(coalesce(p_approval_ref,'')),'') is null) then
    raise exception 'INVALID_REFUND_REVIEW' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.platform_reviewers r
    where r.auth_user_id=v_uid and r.is_active is true and r.revoked_at is null
      and r.role_code in ('FINANCE_REVIEWER','PLATFORM_ADMIN')
  ) then
    raise insufficient_privilege using message='FINANCE_REVIEWER_REQUIRED';
  end if;
  select * into v_refund from public.finance_refund_requests
    where refund_ref=p_refund_ref for update;
  if not found then raise exception 'REFUND_REQUEST_NOT_FOUND' using errcode='P0002'; end if;
  if v_refund.refund_status <> 'PENDING_REVIEW' then
    raise exception 'REFUND_REQUEST_ALREADY_REVIEWED' using errcode='55000';
  end if;
  v_status := case when p_decision='APPROVE' then 'APPROVED' else 'REJECTED' end;
  update public.finance_refund_requests set refund_status=v_status,
    reviewed_by_operator_ref=v_uid::text, approval_ref=case when p_decision='APPROVE' then p_approval_ref else null end,
    reviewed_at=statement_timestamp(), evidence_ref=v_evidence_ref
  where id=v_refund.id;

  insert into public.finance_ledger_entries(
    ledger_ref,candidate_ref,order_ref,payment_ref,refund_ref,entry_type,debit_cents,credit_cents,
    currency,description,evidence_ref
  ) values (
    'ledger-refund-review:' || v_refund.refund_ref,v_refund.candidate_ref,v_refund.order_ref,
    v_refund.payment_ref,v_refund.refund_ref,case when p_decision='APPROVE' then 'REFUND_APPROVED' else 'ADJUSTMENT' end,
    0,0,v_refund.currency,'Finance reviewer decision: ' || v_status || '. ' || left(trim(p_reviewer_note),1200),v_evidence_ref
  );
  insert into public.payment_evidence_ledger(
    evidence_ref,source_type,source_ref,candidate_ref,order_ref,payment_ref,event_name,event_summary,proof_payload
  ) values (
    v_evidence_ref,'REFUND_REVIEW',v_refund.refund_ref,v_refund.candidate_ref,v_refund.order_ref,
    v_refund.payment_ref,'REFUND_' || v_status,'Human finance review recorded; no provider refund was executed.',
    jsonb_build_object('decision',v_status,'reviewer_auth_user_id',v_uid,'approval_ref',p_approval_ref,
      'automatic_refund',false,'note',left(trim(p_reviewer_note),1200))
  );
  return jsonb_build_object('ok',true,'refund_ref',v_refund.refund_ref,'refund_status',v_status,'refund_executed',false);
end;
$function$;

revoke all on function public.get_candidate_finance_summary() from public, anon;
grant execute on function public.get_candidate_finance_summary() to authenticated;
revoke all on function public.request_candidate_finance_refund(text,integer,text) from public, anon;
grant execute on function public.request_candidate_finance_refund(text,integer,text) to authenticated;
revoke all on function public.review_finance_refund_request(text,text,text,text) from public, anon, authenticated;
grant execute on function public.review_finance_refund_request(text,text,text,text) to authenticated;

create or replace function public.record_notification_provider_event(
  p_event_id text, p_provider_message_id text, p_event text, p_safe_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer
set search_path = ''
as $function$
declare
  v_inserted integer;
  v_notification_ref text;
  v_candidate_ref text;
  v_status text;
begin
  if p_event_id is null or length(p_event_id) not between 1 and 200
     or p_provider_message_id is null or length(p_provider_message_id) not between 1 and 200
     or p_event not in ('DELIVERED','BOUNCED','COMPLAINED','DELAYED')
     or jsonb_typeof(coalesce(p_safe_payload,'{}'::jsonb)) is distinct from 'object' then
    raise exception 'INVALID_PROVIDER_EVENT' using errcode='22023';
  end if;
  insert into public.notification_provider_events(event_id,provider_message_id,event_type,safe_payload)
  values(p_event_id,p_provider_message_id,p_event,coalesce(p_safe_payload,'{}'::jsonb))
  on conflict(event_id) do nothing;
  get diagnostics v_inserted = row_count;
  -- Even duplicate webhooks retry the lookup so an event received before the send-attempt write can be reconciled.
  select a.notification_ref,o.candidate_ref into v_notification_ref,v_candidate_ref
  from public.notification_delivery_attempts a
  join public.notification_outbox o on o.notification_ref=a.notification_ref
  where a.provider_message_id=p_provider_message_id
  order by a.attempted_at desc limit 1;
  if v_notification_ref is null then
    return jsonb_build_object('ok',true,'duplicate',v_inserted=0,'matched',false,'delivery_status','UNMATCHED');
  end if;
  v_status := p_event;
  update public.notification_delivery_attempts set status=p_event,
    response_body=coalesce(response_body,'{}'::jsonb) || jsonb_build_object('providerEvent',p_event)
  where notification_ref=v_notification_ref and provider_message_id=p_provider_message_id;
  update public.notification_outbox set provider_delivery_status=p_event
  where notification_ref=v_notification_ref;
  if p_event in ('BOUNCED','COMPLAINED') and v_candidate_ref is not null then
    insert into public.candidate_communication_preferences(
      candidate_ref,transactional_email_enabled,suppressed_at,suppression_reason,consent_source,consent_updated_at,updated_at
    ) values (v_candidate_ref,false,statement_timestamp(),case when p_event='BOUNCED' then 'PROVIDER_BOUNCE' else 'PROVIDER_COMPLAINT' end,
      'PROVIDER_WEBHOOK',statement_timestamp(),statement_timestamp())
    on conflict(candidate_ref) do update set transactional_email_enabled=false,
      suppressed_at=excluded.suppressed_at,suppression_reason=excluded.suppression_reason,
      consent_source='PROVIDER_WEBHOOK',consent_updated_at=excluded.consent_updated_at,updated_at=excluded.updated_at;
  end if;
  return jsonb_build_object('ok',true,'duplicate',v_inserted=0,'matched',true,'delivery_status',v_status,'suppressed',p_event in ('BOUNCED','COMPLAINED'));
end;
$function$;

revoke all on function public.record_notification_provider_event(text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.record_notification_provider_event(text,text,text,jsonb) to service_role;

revoke all on function public.claim_notification_outbox(integer) from public, anon, authenticated;
grant execute on function public.claim_notification_outbox(integer) to service_role;
revoke all on function public.record_notification_delivery_attempt(text,text,text,text,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.record_notification_delivery_attempt(text,text,text,text,text,jsonb,text) to service_role;
revoke all on function public.suppress_candidate_email_after_bounce(text,text) from public, anon, authenticated;
grant execute on function public.suppress_candidate_email_after_bounce(text,text) to service_role;

commit;
