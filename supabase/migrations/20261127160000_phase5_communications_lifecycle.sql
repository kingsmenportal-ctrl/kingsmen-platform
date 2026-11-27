-- Phase 5: durable communication delivery, retries, consent and privacy boundary.
-- Depends on db/migrations/0007_n09_notifications_communications.sql and 0008_n10_finance_payfast.sql.
-- Review-only until backup provenance, isolated restore and change-control approval pass.
begin;

alter table public.notification_outbox
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

create policy candidate_portal_messages_candidate_read_own
  on public.candidate_portal_messages for select to authenticated
  using (
    visible_to_candidate is true
    and exists (
      select 1 from public.candidates c
      where c.id = kingsmen_security.current_verified_kingsmen_candidate_id()
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
      and o.status in ('QUEUED','FAILED')
      and coalesce(o.next_attempt_at,o.scheduled_for) <= statement_timestamp()
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
    return jsonb_build_object('ok',true,'status','SENT','delivery_confirmed',true,'attempt_ref',v_attempt_ref);
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

revoke all on function public.claim_notification_outbox(integer) from public, anon, authenticated;
grant execute on function public.claim_notification_outbox(integer) to service_role;
revoke all on function public.record_notification_delivery_attempt(text,text,text,text,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.record_notification_delivery_attempt(text,text,text,text,text,jsonb,text) to service_role;
revoke all on function public.suppress_candidate_email_after_bounce(text,text) from public, anon, authenticated;
grant execute on function public.suppress_candidate_email_after_bounce(text,text) to service_role;

commit;
