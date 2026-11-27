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
    ('notification_outbox'),
    ('notification_delivery_attempts')
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

drop trigger if exists n09_verified_payment_email_outbox_insert on public.finance_payments;
create trigger n09_verified_payment_email_outbox_insert
after insert on public.finance_payments
for each row execute function public.n09_queue_verified_payment_email();

drop trigger if exists n09_verified_payment_email_outbox_update on public.finance_payments;
create trigger n09_verified_payment_email_outbox_update
after update of payment_status, verified on public.finance_payments
for each row execute function public.n09_queue_verified_payment_email();


-- Atomic claims prevent two workers from delivering the same queued notification.
create or replace function public.claim_kingsmen_notification_outbox(p_limit integer default 10)
returns table (
  notification_ref text, channel text, purpose text, recipient text, subject text, body text,
  idempotency_key text, evidence_ref text, attempt_count integer
)
language sql
security definer
set search_path = pg_catalog, public
as $function$
  with picked as (
    select n.id
    from public.notification_outbox n
    where n.status = 'QUEUED'
      and n.scheduled_for <= now()
      and (n.locked_at is null or n.locked_at < now() - interval '5 minutes')
    order by case when n.urgency in ('URGENT','EMERGENCY') then 0 else 1 end,
             n.scheduled_for, n.created_at
    for update skip locked
    limit least(greatest(coalesce(p_limit,10),1),20)
  ),
  claimed as (
    update public.notification_outbox n
       set status='LOCKED', locked_at=now()
      from picked p
     where n.id=p.id
    returning n.*
  )
  select c.notification_ref,c.channel,c.purpose,c.recipient,c.subject,c.body,
         c.idempotency_key,c.evidence_ref,
         (select count(*)::integer from public.notification_delivery_attempts a where a.notification_ref=c.notification_ref)
  from claimed c;
$function$;

-- Record the provider outcome separately from event creation. Mock outcomes are
-- explicitly SIMULATED and can never be recorded as SENT.
create or replace function public.record_kingsmen_notification_attempt(
  p_notification_ref text,
  p_provider text,
  p_result text,
  p_response_code text default null,
  p_provider_message_id text default null,
  p_retry_after_seconds integer default 60
)
returns table (status text, attempt_no integer, scheduled_for timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_notification public.notification_outbox%rowtype;
  v_attempt_no integer;
  v_status text;
  v_scheduled_for timestamptz;
begin
  if coalesce(length(btrim(p_notification_ref)),0) < 1 or length(p_notification_ref)>200
     or coalesce(length(btrim(p_provider)),0) < 1 or length(p_provider)>80
     or coalesce(p_result,'') not in ('SENT','FAILED','SIMULATED') then
    raise exception 'notification attempt arguments are invalid';
  end if;
  if p_provider = 'MOCK' and p_result = 'SENT' then
    raise exception 'mock provider cannot assert a real send';
  end if;
  if p_result = 'SENT' and coalesce(length(btrim(p_provider_message_id)),0)=0 then
    raise exception 'provider message id is required for SENT';
  end if;

  select n.* into v_notification
  from public.notification_outbox n
  where n.notification_ref=p_notification_ref
  for update;
  if not found then raise exception 'notification outbox record not found'; end if;
  if v_notification.status <> 'LOCKED' then raise exception 'notification is not locked by a worker'; end if;

  select count(*)::integer + 1 into v_attempt_no
  from public.notification_delivery_attempts a
  where a.notification_ref=p_notification_ref;

  insert into public.notification_delivery_attempts
    (attempt_ref,notification_ref,channel,provider,provider_message_id,status,response_code,response_body,evidence_ref)
  values
    ('attempt_' || replace(gen_random_uuid()::text,'-',''),p_notification_ref,
     v_notification.channel,p_provider,
     case when p_provider='MOCK' then null else p_provider_message_id end,
     p_result, left(coalesce(p_response_code,''),80),
     jsonb_build_object('result',p_result,'live_send_executed',p_provider<>'MOCK'),
     v_notification.evidence_ref);

  if p_result='SENT' then
    v_status := 'SENT';
    v_scheduled_for := v_notification.scheduled_for;
    update public.notification_outbox
       set status='SENT', sent_at=now(), locked_at=null, failed_at=null, last_error=null
     where id=v_notification.id;
  elsif p_result='SIMULATED' then
    v_status := 'SIMULATED';
    v_scheduled_for := v_notification.scheduled_for;
    update public.notification_outbox
       set status='SIMULATED', locked_at=null, sent_at=null, failed_at=null, last_error='MOCK_PROVIDER_ONLY'
     where id=v_notification.id;
  else
    if v_attempt_no >= 3 then
      v_status := 'FAILED';
      v_scheduled_for := v_notification.scheduled_for;
      update public.notification_outbox
         set status='FAILED', locked_at=null, failed_at=now(), sent_at=null,
             last_error=left(coalesce(nullif(p_response_code,''),'PROVIDER_ERROR'),80)
       where id=v_notification.id;
    else
      v_status := 'QUEUED';
      v_scheduled_for := now() + make_interval(secs => least(greatest(coalesce(p_retry_after_seconds,60),30),3600));
      update public.notification_outbox
         set status='QUEUED', locked_at=null, scheduled_for=v_scheduled_for, sent_at=null, failed_at=null,
             last_error=left(coalesce(nullif(p_response_code,''),'PROVIDER_ERROR'),80)
       where id=v_notification.id;
    end if;
  end if;
  return query select v_status,v_attempt_no,v_scheduled_for;
end
$function$;

revoke all on function public.claim_kingsmen_notification_outbox(integer) from public, anon, authenticated;
revoke all on function public.record_kingsmen_notification_attempt(text,text,text,text,text,integer) from public, anon, authenticated;
grant execute on function public.claim_kingsmen_notification_outbox(integer) to service_role;
grant execute on function public.record_kingsmen_notification_attempt(text,text,text,text,text,integer) to service_role;

revoke all on function public.n09_queue_document_review_email() from public, anon, authenticated;
revoke all on function public.n09_queue_verified_payment_email() from public, anon, authenticated;

commit;
