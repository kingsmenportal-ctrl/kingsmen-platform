-- Phase 5: enqueue auditable transactional email when a document decision or
-- server-verified payment is persisted. This migration never sends email.
begin;

do $phase5_comms_preflight$
declare missing_tables text[];
begin
  select array_agg(t.table_name order by t.table_name) into missing_tables
  from (values
    ('candidate_private_document_reviews'),
    ('candidate_private_documents'),
    ('candidate_communication_preferences'),
    ('finance_payments'),
    ('communication_templates'),
    ('notification_outbox')
  ) as t(table_name)
  where to_regclass('public.' || quote_ident(t.table_name)) is null;
  if missing_tables is not null then
    raise exception 'PHASE5_COMMUNICATION_SCHEMA_INCOMPLETE: %', array_to_string(missing_tables, ', ');
  end if;
end
$phase5_comms_preflight$;

insert into public.communication_templates
  (template_key, template_name, channel, subject_template, body_template, purpose, allowed_when, requires_human_review, is_active, version)
values
  ('candidate.document.review.updated.email','Candidate document review update','EMAIL_PRIMARY',
   'A document review update is available',
   'A document review update is available in your Kingsmen portal. Sign in to view the current status and next action.',
   'TRANSACTIONAL', array['DOCUMENT_REVIEWED']::text[], false, true, 1),
  ('candidate.payment.verified.email','Candidate verified payment notice','EMAIL_PRIMARY',
   'Your Kingsmen payment has been verified',
   'Kingsmen has verified your payment. Sign in to review your package and entitlement status.',
   'TRANSACTIONAL', array['PAYMENT_VERIFIED']::text[], false, true, 1)
on conflict (template_key) do nothing;

create or replace function public.n09_queue_document_review_email()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_recipient text;
  v_application_id uuid;
  v_subject text;
  v_body text;
begin
  if new.decision not in ('VERIFIED','CORRECTION_REQUIRED','REJECTED') then
    return new;
  end if;

  select p.email_address into v_recipient
  from public.candidate_communication_preferences p
  where p.candidate_id = new.candidate_id
    and p.email_transactional is true
    and p.email_address ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  limit 1;
  if v_recipient is null then return new; end if;

  select d.application_id into v_application_id
  from public.candidate_private_documents d
  where d.id = new.document_id and d.candidate_id = new.candidate_id;
  select t.subject_template,t.body_template into v_subject,v_body
  from public.communication_templates t
  where t.template_key='candidate.document.review.updated.email' and t.is_active is true
  limit 1;
  if v_subject is null or v_body is null then return new; end if;

  insert into public.notification_outbox
    (notification_ref,candidate_ref,application_ref,template_key,channel,recipient,subject,body,
     purpose,urgency,status,idempotency_key,evidence_ref)
  values
    ('notif_' || replace(gen_random_uuid()::text,'-',''),new.candidate_id::text,
     v_application_id::text,'candidate.document.review.updated.email','EMAIL_PRIMARY',v_recipient,
     v_subject,v_body,'TRANSACTIONAL','NORMAL','QUEUED',
     'document-review:' || new.id::text,'document-review:' || new.id::text)
  on conflict (idempotency_key) do nothing;
  return new;
end
$function$;

create or replace function public.n09_queue_verified_payment_email()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_candidate_id uuid;
  v_recipient text;
  v_subject text;
  v_body text;
begin
  if new.payment_status <> 'COMPLETE' or new.verified is not true then return new; end if;
  if tg_op = 'UPDATE' then
    if old.payment_status = new.payment_status and old.verified is not distinct from new.verified then
      return new;
    end if;
  end if;
  if not pg_input_is_valid(new.candidate_ref,'uuid') then return new; end if;
  v_candidate_id := new.candidate_ref::uuid;

  select p.email_address into v_recipient
  from public.candidate_communication_preferences p
  where p.candidate_id = v_candidate_id
    and p.email_transactional is true
    and p.email_address ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  limit 1;
  if v_recipient is null then return new; end if;

  select t.subject_template,t.body_template into v_subject,v_body
  from public.communication_templates t
  where t.template_key='candidate.payment.verified.email' and t.is_active is true
  limit 1;
  if v_subject is null or v_body is null then return new; end if;

  insert into public.notification_outbox
    (notification_ref,candidate_ref,template_key,channel,recipient,subject,body,
     purpose,urgency,status,idempotency_key,evidence_ref)
  values
    ('notif_' || replace(gen_random_uuid()::text,'-',''),new.candidate_ref,
     'candidate.payment.verified.email','EMAIL_PRIMARY',v_recipient,v_subject,v_body,
     'TRANSACTIONAL','NORMAL','QUEUED',
     'payment-verified:' || new.payment_ref,'payment-verified:' || new.payment_ref)
  on conflict (idempotency_key) do nothing;
  return new;
end
$function$;

drop trigger if exists n09_document_review_email_outbox on public.candidate_private_document_reviews;
create trigger n09_document_review_email_outbox
after insert on public.candidate_private_document_reviews
for each row execute function public.n09_queue_document_review_email();

drop trigger if exists n09_verified_payment_email_outbox on public.finance_payments;
create trigger n09_verified_payment_email_outbox
after insert or update of payment_status, verified on public.finance_payments
for each row execute function public.n09_queue_verified_payment_email();

revoke all on function public.n09_queue_document_review_email() from public, anon, authenticated;
revoke all on function public.n09_queue_verified_payment_email() from public, anon, authenticated;

commit;
