-- Phase 5 PayFast sandbox transaction boundary.
-- Depends on the canonical finance schema in db/migrations/0008_n10_finance_payfast.sql.
-- Review-only: do not apply until backup provenance, isolated restore and change control pass.
begin;

create unique index if not exists finance_payments_payfast_provider_payment_uidx
  on public.finance_payments(provider, provider_payment_id)
  where provider = 'PAYFAST' and provider_payment_id is not null;

create or replace function public.create_payfast_sandbox_checkout_bundle(
  p_supabase_user_id uuid,
  p_candidate_ref text,
  p_plan_code text,
  p_idempotency_key text,
  p_order_ref text,
  p_invoice_ref text,
  p_intent_ref text,
  p_evidence_ref text,
  p_return_url text,
  p_cancel_url text,
  p_notify_url text,
  p_signed_payload jsonb
) returns jsonb
language plpgsql security definer
set search_path = ''
as $function$
declare
  v_plan public.finance_plan_catalog%rowtype;
  v_intent public.payfast_payment_intents%rowtype;
  v_order public.finance_orders%rowtype;
  v_invoice public.finance_invoices%rowtype;
  v_safe_payload jsonb;
  v_payment_status text;
begin
  if p_supabase_user_id is null or p_candidate_ref is null or p_candidate_ref !~ '^[0-9a-f-]{36}$'
     or p_plan_code is null or length(p_plan_code) not between 3 and 80
     or p_idempotency_key is null or length(p_idempotency_key) not between 8 and 160
     or p_order_ref is null or p_invoice_ref is null or p_intent_ref is null
     or p_evidence_ref is null or jsonb_typeof(p_signed_payload) is distinct from 'object'
     or p_return_url !~ '^https://' or p_cancel_url !~ '^https://' or p_notify_url !~ '^https://' then
    raise exception 'INVALID_CHECKOUT_BUNDLE_INPUT' using errcode = '22023';
  end if;

  if p_signed_payload ?| array['merchant_key','signature','passphrase','PAYFAST_MERCHANT_KEY','PAYFAST_PASSPHRASE'] then
    raise exception 'CHECKOUT_SECRET_MUST_NOT_BE_PERSISTED' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.candidate_auth_identity_links l
    join public.candidates c on c.id = l.candidate_id and c.is_active is true
    where l.supabase_user_id = p_supabase_user_id
      and l.candidate_id::text = p_candidate_ref
      and l.link_status = 'VERIFIED'
      and l.verified_at is not null
      and l.verified_at <= statement_timestamp()
      and l.verified_by is not null
  ) then
    raise insufficient_privilege using message = 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED';
  end if;

  select * into v_intent from public.payfast_payment_intents
    where idempotency_key = p_idempotency_key for update;
  if found then
    select * into v_order from public.finance_orders where order_ref = v_intent.order_ref;
    if v_intent.candidate_ref is distinct from p_candidate_ref
       or v_order.plan_code is distinct from p_plan_code then
      raise exception 'CHECKOUT_IDEMPOTENCY_CONFLICT' using errcode = '23505';
    end if;
    select * into v_invoice from public.finance_invoices where invoice_ref = v_intent.invoice_ref;
    select p.payment_status into v_payment_status from public.finance_payments p
      where p.order_ref = v_order.order_ref order by p.created_at desc limit 1;
    return jsonb_build_object(
      'intent', jsonb_build_object('intentRef', v_intent.intent_ref,
        'merchantReference', v_intent.merchant_reference,
        'paymentUrl', v_intent.payment_url,
        'signedPayload', v_intent.signed_payload),
      'orderStatus', v_order.order_status,
      'paymentStatus', coalesce(v_payment_status, 'PENDING'),
      'reused', true,
      'note', 'Existing idempotent sandbox intent reused; payment is not confirmed until a verified ITN settles.'
    );
  end if;

  select * into v_plan from public.finance_plan_catalog
    where plan_code = p_plan_code and active is true for share;
  if not found or v_plan.amount_cents <= 0 or v_plan.currency is distinct from 'ZAR' then
    raise exception 'ACTIVE_ZAR_PLAN_REQUIRED' using errcode = '22023';
  end if;
  if p_signed_payload->>'m_payment_id' is distinct from p_order_ref
     or p_signed_payload->>'amount' is distinct from to_char(v_plan.amount_cents::numeric / 100, 'FM999999990.00')
     or p_signed_payload->>'item_name' is distinct from left(v_plan.plan_name,100) then
    raise exception 'PLAN_PRICE_OR_SIGNED_PAYLOAD_CHANGED' using errcode = '22023';
  end if;

  v_safe_payload := p_signed_payload - 'merchant_key' - 'signature' - 'passphrase';
  insert into public.finance_orders (
    order_ref, candidate_ref, plan_code, order_status, amount_cents, currency, evidence_ref
  ) values (
    p_order_ref, p_candidate_ref, p_plan_code, 'PENDING_PAYMENT', v_plan.amount_cents, 'ZAR', p_evidence_ref
  ) returning * into v_order;

  insert into public.finance_invoices (
    invoice_ref, order_ref, candidate_ref, invoice_status, amount_cents, currency, evidence_ref
  ) values (
    p_invoice_ref, p_order_ref, p_candidate_ref, 'OPEN', v_plan.amount_cents, 'ZAR', p_evidence_ref
  ) returning * into v_invoice;

  insert into public.payfast_payment_intents (
    intent_ref, order_ref, invoice_ref, candidate_ref, merchant_reference, amount_cents, currency,
    item_name, item_description, return_url, cancel_url, notify_url, payfast_environment,
    payment_url, signed_payload, intent_status, idempotency_key, evidence_ref
  ) values (
    p_intent_ref, p_order_ref, p_invoice_ref, p_candidate_ref, p_order_ref, v_plan.amount_cents, 'ZAR',
    left(v_plan.plan_name, 100), left(v_plan.description, 255), p_return_url, p_cancel_url, p_notify_url,
    'sandbox', 'https://sandbox.payfast.co.za/eng/process', v_safe_payload, 'CREATED',
    p_idempotency_key, p_evidence_ref
  ) returning * into v_intent;

  insert into public.finance_ledger_entries (
    ledger_ref, candidate_ref, order_ref, invoice_ref, entry_type, debit_cents, credit_cents,
    currency, description, evidence_ref
  ) values
    ('ledger-order:' || p_order_ref, p_candidate_ref, p_order_ref, p_invoice_ref,
     'ORDER_CREATED', 0, 0, 'ZAR', 'Sandbox order created; no payment settled.', p_evidence_ref),
    ('ledger-invoice:' || p_invoice_ref, p_candidate_ref, p_order_ref, p_invoice_ref,
     'INVOICE_ISSUED', 0, 0, 'ZAR', 'Sandbox invoice issued; no entitlement activated.', p_evidence_ref);

  insert into public.payment_evidence_ledger (
    evidence_ref, source_type, source_ref, candidate_ref, order_ref, event_name, event_summary, proof_payload
  ) values (
    p_evidence_ref, 'PAYFAST_SANDBOX_CHECKOUT', p_intent_ref, p_candidate_ref, p_order_ref,
    'SANDBOX_CHECKOUT_CREATED', 'Checkout intent created without treating a browser return as payment proof.',
    jsonb_build_object('plan_code', p_plan_code, 'amount_cents', v_plan.amount_cents,
      'currency', 'ZAR', 'environment', 'sandbox', 'secret_fields_persisted', false)
  );

  return jsonb_build_object(
    'intent', jsonb_build_object('intentRef', v_intent.intent_ref,
      'merchantReference', v_intent.merchant_reference,
      'paymentUrl', v_intent.payment_url,
      'signedPayload', v_intent.signed_payload),
    'orderStatus', v_order.order_status,
    'paymentStatus', 'PENDING',
    'reused', false,
    'note', 'Sandbox intent created. Entitlements remain inactive until a verified provider ITN is accepted.'
  );
end;
$function$;

create or replace function public.payfast_settle_sandbox_payment(
  p_merchant_reference text,
  p_provider_payment_id text,
  p_amount_gross_cents integer,
  p_amount_fee_cents integer,
  p_amount_net_cents integer,
  p_payment_ref text,
  p_evidence_ref text,
  p_receipt_ref text,
  p_candidate_ref text
) returns jsonb
language plpgsql security definer
set search_path = ''
as $function$
declare
  v_intent public.payfast_payment_intents%rowtype;
  v_receipt public.payfast_itn_receipts%rowtype;
  v_candidate_email text;
  v_existing public.finance_payments%rowtype;
  v_payment public.finance_payments%rowtype;
begin
  if p_merchant_reference is null or p_provider_payment_id is null
     or p_provider_payment_id !~ '^[0-9]{1,40}$'
     or p_amount_gross_cents is null or p_amount_gross_cents <= 0
     or p_amount_fee_cents is null or p_amount_fee_cents < 0
     or p_amount_net_cents is null or p_amount_net_cents < 0
     or p_amount_gross_cents <> p_amount_fee_cents + p_amount_net_cents
     or p_payment_ref is null or p_evidence_ref is null or p_receipt_ref is null
     or p_candidate_ref is null then
    raise exception 'INVALID_VERIFIED_PAYMENT_INPUT' using errcode = '22023';
  end if;

  select * into v_intent from public.payfast_payment_intents
    where merchant_reference = p_merchant_reference for update;
  if not found then raise exception 'PAYFAST_INTENT_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_intent.payfast_environment is distinct from 'sandbox'
     or v_intent.candidate_ref is distinct from p_candidate_ref
     or v_intent.currency is distinct from 'ZAR'
     or v_intent.amount_cents <> p_amount_gross_cents then
    raise exception 'PAYFAST_INTENT_AMOUNT_CANDIDATE_OR_ENVIRONMENT_MISMATCH' using errcode = '22023';
  end if;

  select * into v_receipt from public.payfast_itn_receipts
    where itn_ref = p_receipt_ref for share;
  if not found or v_receipt.accepted is not true
     or v_receipt.signature_valid is not true or v_receipt.ip_valid is not true
     or v_receipt.amount_valid is not true
     or v_receipt.merchant_reference is distinct from p_merchant_reference
     or v_receipt.provider_payment_id is distinct from p_provider_payment_id
     or v_receipt.payment_status is distinct from 'COMPLETE'
     or round(v_receipt.amount_gross::numeric * 100)::integer <> p_amount_gross_cents then
    raise insufficient_privilege using message = 'ACCEPTED_PAYFAST_ITN_EVIDENCE_REQUIRED';
  end if;

  select * into v_existing from public.finance_payments
    where provider = 'PAYFAST' and provider_payment_id = p_provider_payment_id for update;
  if found then
    if v_existing.merchant_reference is distinct from p_merchant_reference
       or v_existing.order_ref is distinct from v_intent.order_ref
       or v_existing.candidate_ref is distinct from p_candidate_ref
       or v_existing.amount_gross_cents <> p_amount_gross_cents
       or v_existing.amount_fee_cents <> p_amount_fee_cents
       or v_existing.amount_net_cents <> p_amount_net_cents
       or v_existing.currency is distinct from 'ZAR'
       or v_existing.payment_status is distinct from 'COMPLETE'
       or v_existing.verified is not true then
      raise exception 'CONFLICTING_DUPLICATE_PAYFAST_PAYMENT' using errcode = '23505';
    end if;
    return jsonb_build_object('outcome', 'duplicate', 'payment_ref', v_existing.payment_ref,
      'order_status', 'PAID', 'entitlement_activation', 'already_verified');
  end if;

  if v_intent.intent_status = 'PAID' then
    raise exception 'PAID_INTENT_WITHOUT_MATCHING_PAYMENT_RECORD' using errcode = '23505';
  end if;

  insert into public.finance_payments (
    payment_ref, order_ref, invoice_ref, candidate_ref, provider, provider_payment_id,
    merchant_reference, amount_gross_cents, amount_fee_cents, amount_net_cents,
    currency, payment_status, verified, verified_at, evidence_ref
  ) values (
    p_payment_ref, v_intent.order_ref, v_intent.invoice_ref, p_candidate_ref, 'PAYFAST', p_provider_payment_id,
    p_merchant_reference, p_amount_gross_cents, p_amount_fee_cents, p_amount_net_cents,
    'ZAR', 'COMPLETE', true, statement_timestamp(), p_evidence_ref
  ) returning * into v_payment;

  update public.payfast_payment_intents set intent_status = 'PAID', updated_at = statement_timestamp()
    where id = v_intent.id and intent_status <> 'PAID';
  update public.finance_orders set order_status = 'PAID', updated_at = statement_timestamp()
    where order_ref = v_intent.order_ref and order_status = 'PENDING_PAYMENT';
  if not found then
    raise exception 'ORDER_NOT_PENDING_PAYMENT' using errcode = '55000';
  end if;
  update public.finance_invoices set invoice_status = 'PAID', paid_at = statement_timestamp()
    where invoice_ref = v_intent.invoice_ref and invoice_status = 'OPEN';
  if not found then raise exception 'INVOICE_NOT_OPEN' using errcode = '55000'; end if;

  insert into public.finance_ledger_entries (
    ledger_ref, candidate_ref, order_ref, invoice_ref, payment_ref, entry_type,
    debit_cents, credit_cents, currency, description, evidence_ref
  ) values
    ('ledger-payment:' || p_payment_ref, p_candidate_ref, v_intent.order_ref, v_intent.invoice_ref,
      p_payment_ref, 'PAYMENT_RECEIVED', p_amount_net_cents, 0, 'ZAR',
      'Verified PayFast sandbox settlement; order entitlement may now be evaluated.', p_evidence_ref),
    ('ledger-fee:' || p_payment_ref, p_candidate_ref, v_intent.order_ref, v_intent.invoice_ref,
      p_payment_ref, 'PAYFAST_FEE', p_amount_fee_cents, 0, 'ZAR',
      'PayFast fee recorded from verified ITN.', p_evidence_ref);

  insert into public.payment_evidence_ledger (
    evidence_ref, source_type, source_ref, candidate_ref, order_ref, payment_ref,
    event_name, event_summary, proof_payload
  ) values (
    p_evidence_ref, 'PAYFAST_ITN', p_receipt_ref, p_candidate_ref, v_intent.order_ref, p_payment_ref,
    'PAYFAST_PAYMENT_VERIFIED', 'Verified sandbox ITN settled idempotently.',
    jsonb_build_object('provider_payment_id', p_provider_payment_id, 'amount_gross_cents', p_amount_gross_cents,
      'amount_fee_cents', p_amount_fee_cents, 'amount_net_cents', p_amount_net_cents,
      'currency', 'ZAR', 'verified', true, 'environment', 'sandbox')
  );

  -- Persist candidate-visible status and an email-first outbox event in the same settlement transaction.
  select ca.email into v_candidate_email from public.candidate_accounts ca
    where ca.candidate_id::text=p_candidate_ref and ca.email_verified is true limit 1;
  insert into public.candidate_portal_messages(
    portal_message_ref,candidate_ref,title,body,message_type,visible_to_candidate,evidence_ref
  ) values (
    'portal-payment-verified:' || p_payment_ref,p_candidate_ref,'Payment verified',
    'Your Kingsmen payment has been verified. Review your plan status and next steps in the finance workspace.',
    'PAYMENT_STATUS',true,p_evidence_ref
  ) on conflict (portal_message_ref) do nothing;
  if v_candidate_email is not null then
    insert into public.notification_outbox(
      notification_ref,candidate_ref,template_key,channel,recipient,subject,body,purpose,urgency,status,
      idempotency_key,scheduled_for,evidence_ref
    ) values (
      'notif-payment-verified:' || p_payment_ref,p_candidate_ref,'payment_verified_v1','EMAIL_PRIMARY',
      v_candidate_email,'Kingsmen payment verified',
      'Your Kingsmen payment has been verified. Sign in to review your plan status and next steps.',
      'PAYMENT_VERIFIED','NORMAL','QUEUED','payment-verified:' || p_payment_ref,
      statement_timestamp(),p_evidence_ref
    ) on conflict (idempotency_key) do nothing;
  end if;

  return jsonb_build_object('outcome', 'recorded', 'payment_ref', p_payment_ref,
    'order_status', 'PAID', 'invoice_status', 'PAID', 'entitlement_activation', 'verified_payment_only');
end;
$function$;

revoke all on function public.create_payfast_sandbox_checkout_bundle(uuid,text,text,text,text,text,text,text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_payfast_sandbox_checkout_bundle(uuid,text,text,text,text,text,text,text,text,text,text,jsonb) to service_role;
revoke all on function public.payfast_settle_sandbox_payment(text,text,integer,integer,integer,text,text,text,text) from public, anon, authenticated;
grant execute on function public.payfast_settle_sandbox_payment(text,text,integer,integer,integer,text,text,text,text) to service_role;

commit;
