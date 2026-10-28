-- Harden PayFast checkout/settlement: catalog-authoritative checkout records and
-- activate the purchased candidate service order only after verified ITN settlement.
-- This migration intentionally does not enable live PayFast payments.

create or replace function public.payfast_create_sandbox_checkout(
  p_order jsonb, p_invoice jsonb, p_intent jsonb, p_evidence jsonb
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_candidate_ref text := p_order->>'candidate_ref';
  v_candidate_id uuid;
  v_idempotency_key text := p_intent->>'idempotency_key';
  v_existing public.payfast_payment_intents%rowtype;
  v_plan public.finance_plan_catalog%rowtype;
  v_package public.service_packages%rowtype;
  v_package_code text;
  v_entitlement jsonb;
begin
  if coalesce(v_candidate_ref,'') = '' or coalesce(v_idempotency_key,'') = '' then
    raise exception 'candidate_and_idempotency_key_required';
  end if;
  begin
    v_candidate_id := v_candidate_ref::uuid;
  exception when invalid_text_representation then
    raise exception 'candidate_reference_must_be_uuid';
  end;
  if p_order->>'candidate_ref' <> p_invoice->>'candidate_ref'
     or p_order->>'candidate_ref' <> p_intent->>'candidate_ref'
     or p_order->>'order_ref' <> p_invoice->>'order_ref'
     or p_order->>'order_ref' <> p_intent->>'order_ref'
     or p_invoice->>'invoice_ref' <> p_intent->>'invoice_ref' then
    raise exception 'checkout_record_binding_mismatch';
  end if;
  if coalesce(p_intent->>'payfast_environment','sandbox') <> 'sandbox' then
    raise exception 'live_payments_disabled';
  end if;

  select * into v_existing from public.payfast_payment_intents
   where candidate_ref=v_candidate_ref and idempotency_key=v_idempotency_key for update;
  if found then
    return jsonb_build_object('reused',true,'intentRef',v_existing.intent_ref,
      'merchantReference',v_existing.merchant_reference,'paymentUrl',v_existing.payment_url,
      'intentStatus',v_existing.intent_status);
  end if;

  select * into v_plan from public.finance_plan_catalog
   where plan_code = p_order->>'plan_code' and active = true for share;
  if not found or v_plan.amount_cents <= 0 or v_plan.currency <> 'ZAR' then
    raise exception 'active_payable_plan_not_found';
  end if;
  if (p_order->>'amount_cents')::integer <> v_plan.amount_cents
     or (p_invoice->>'amount_cents')::integer <> v_plan.amount_cents
     or (p_intent->>'amount_cents')::integer <> v_plan.amount_cents
     or coalesce(p_order->>'currency','ZAR') <> v_plan.currency
     or coalesce(p_invoice->>'currency','ZAR') <> v_plan.currency
     or coalesce(p_intent->>'currency','ZAR') <> v_plan.currency then
    raise exception 'checkout_amount_or_currency_does_not_match_catalog';
  end if;

  v_package_code := regexp_replace(v_plan.plan_code, '_R[0-9]+_[0-9]+$', '');
  select * into v_package from public.service_packages
   where package_code = v_package_code and active = true for share;
  if not found or v_package.price_minor <> v_plan.amount_cents or v_package.currency <> v_plan.currency then
    raise exception 'active_service_package_missing_or_price_mismatch';
  end if;

  v_entitlement := jsonb_build_object(
    'plan_code',v_plan.plan_code,'plan_name',v_plan.plan_name,'amount_cents',v_plan.amount_cents,
    'currency',v_plan.currency,'catalogue_version',v_plan.catalogue_version,
    'service_term_days',v_plan.service_term_days,
    'managed_application_count',v_plan.managed_application_count,
    'accommodation_route_count',v_plan.accommodation_route_count,
    'cv_versions',v_plan.cv_versions,'motivation_letters',v_plan.motivation_letters,
    'service_scope',v_plan.service_scope,'refund_policy_version',v_plan.refund_policy_version,
    'package_code',v_package.package_code,'package_entitlement',v_package.entitlement_snapshot
  );

  insert into public.candidate_service_orders (
    order_ref,candidate_id,package_id,package_code,package_name,currency,amount_minor,
    entitlement_snapshot,status,idempotency_key
  ) values (
    p_order->>'order_ref',v_candidate_id,v_package.id,v_package.package_code,v_package.display_name,
    v_package.currency,v_package.price_minor,v_entitlement,'PENDING_PAYMENT',v_idempotency_key
  );

  insert into public.finance_orders (
    order_ref,candidate_ref,plan_code,order_status,amount_cents,currency,catalogue_version,
    service_term_days,managed_application_count,accommodation_route_count,cv_versions,motivation_letters,
    acknowledgement_target_business_hours,first_response_target_business_hours,upgrade_bonus_routes,
    refund_policy_version,service_scope,entitlement_snapshot,evidence_ref
  ) values (
    p_order->>'order_ref',v_candidate_ref,v_plan.plan_code,'PENDING_PAYMENT',v_plan.amount_cents,v_plan.currency,
    v_plan.catalogue_version,v_plan.service_term_days,v_plan.managed_application_count,
    v_plan.accommodation_route_count,v_plan.cv_versions,v_plan.motivation_letters,
    v_plan.acknowledgement_target_business_hours,v_plan.first_response_target_business_hours,
    v_plan.upgrade_bonus_routes_when_cv_revamp_owned,v_plan.refund_policy_version,v_plan.service_scope,
    v_entitlement,p_evidence->>'evidence_ref'
  );
  insert into public.finance_invoices (
    invoice_ref,order_ref,candidate_ref,invoice_status,amount_cents,currency,evidence_ref
  ) values (
    p_invoice->>'invoice_ref',p_invoice->>'order_ref',v_candidate_ref,'OPEN',
    v_plan.amount_cents,v_plan.currency,p_evidence->>'evidence_ref'
  );
  insert into public.payfast_payment_intents (
    intent_ref,order_ref,invoice_ref,candidate_ref,merchant_reference,amount_cents,currency,
    item_name,item_description,return_url,cancel_url,notify_url,payfast_environment,payment_url,
    signed_payload,signature,intent_status,idempotency_key,evidence_ref
  ) values (
    p_intent->>'intent_ref',p_intent->>'order_ref',p_intent->>'invoice_ref',v_candidate_ref,
    p_intent->>'merchant_reference',v_plan.amount_cents,v_plan.currency,v_plan.plan_name,
    left(v_plan.description,255),p_intent->>'return_url',p_intent->>'cancel_url',p_intent->>'notify_url',
    'sandbox',p_intent->>'payment_url',coalesce(p_intent->'signed_payload','{}'::jsonb),
    p_intent->>'signature','CREATED',v_idempotency_key,p_evidence->>'evidence_ref'
  );
  insert into public.payment_evidence_ledger (
    evidence_ref,source_type,source_ref,candidate_ref,order_ref,event_name,event_summary,proof_payload
  ) values (
    p_evidence->>'evidence_ref','payfast_intent',p_intent->>'intent_ref',v_candidate_ref,
    p_order->>'order_ref','PAYFAST_SANDBOX_INTENT_CREATED',
    'Sandbox checkout intent created; not proof of payment.',
    coalesce(p_evidence->'proof_payload','{}'::jsonb) || jsonb_build_object('catalogValidated',true,'entitlementActivated',false)
  );
  return jsonb_build_object('reused',false,'intentRef',p_intent->>'intent_ref',
    'merchantReference',p_intent->>'merchant_reference','paymentUrl',p_intent->>'payment_url','intentStatus','CREATED');
end;
$$;
revoke all on function public.payfast_create_sandbox_checkout(jsonb,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.payfast_create_sandbox_checkout(jsonb,jsonb,jsonb,jsonb) to service_role;

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
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_intent public.payfast_payment_intents%rowtype;
  v_existing public.finance_payments%rowtype;
  v_service_order public.candidate_service_orders%rowtype;
  v_was_pending boolean := false;
  v_now timestamptz := now();
begin
  if coalesce(p_merchant_reference,'') = '' or coalesce(p_provider_payment_id,'') = '' then
    raise exception 'merchant_reference_and_provider_payment_id_required';
  end if;
  select * into v_intent from public.payfast_payment_intents
   where merchant_reference=p_merchant_reference for update;
  if not found then raise exception 'payment_intent_not_found'; end if;
  if v_intent.payfast_environment <> 'sandbox' then raise exception 'live_payments_disabled'; end if;
  if v_intent.candidate_ref::text <> p_candidate_ref then raise exception 'candidate_reference_mismatch'; end if;
  if v_intent.currency <> 'ZAR' or v_intent.amount_cents <> p_amount_gross_cents then
    raise exception 'payment_amount_or_currency_mismatch';
  end if;
  if p_amount_fee_cents < 0 or p_amount_net_cents < 0 or p_amount_fee_cents + p_amount_net_cents <> p_amount_gross_cents then
    raise exception 'payment_amount_breakdown_mismatch';
  end if;
  select * into v_service_order from public.candidate_service_orders
   where order_ref=v_intent.order_ref and candidate_id=v_intent.candidate_ref::uuid for update;
  if not found then raise exception 'candidate_service_order_missing'; end if;
  if v_service_order.amount_minor <> v_intent.amount_cents or v_service_order.currency <> v_intent.currency then
    raise exception 'candidate_service_order_amount_mismatch';
  end if;
  if v_service_order.status not in ('PENDING_PAYMENT','PAID') then
    raise exception 'candidate_service_order_not_payable';
  end if;
  select * into v_existing from public.finance_payments
   where provider='PAYFAST' and provider_payment_id=p_provider_payment_id limit 1;
  if found then
    if v_existing.merchant_reference <> p_merchant_reference
       or v_existing.amount_gross_cents <> p_amount_gross_cents then
      raise exception 'provider_payment_id_conflict';
    end if;
    v_was_pending := v_service_order.status = 'PENDING_PAYMENT';
    if v_was_pending then
      update public.candidate_service_orders set status='PAID',paid_at=v_now,updated_at=v_now
       where id=v_service_order.id and status='PENDING_PAYMENT';
      if not found then raise exception 'service_entitlement_activation_failed'; end if;
      update public.candidates set active_package_code=v_service_order.package_code,updated_at=v_now
       where id=v_service_order.candidate_id;
      if not found then raise exception 'candidate_activation_target_missing'; end if;
    end if;
    update public.finance_orders set order_status='PAID',updated_at=v_now where order_ref=v_intent.order_ref;
    update public.finance_invoices set invoice_status='PAID',paid_at=coalesce(paid_at,v_now)
     where invoice_ref=v_intent.invoice_ref;
    update public.payfast_payment_intents set intent_status='PAID',updated_at=v_now where intent_ref=v_intent.intent_ref;
    return jsonb_build_object('status','already_settled','payment_ref',v_existing.payment_ref,
      'entitlementActivated',true);
  end if;

  insert into public.finance_payments (
    payment_ref,order_ref,invoice_ref,candidate_ref,provider,provider_payment_id,
    merchant_reference,amount_gross_cents,amount_fee_cents,amount_net_cents,
    currency,payment_status,verified,verified_at,evidence_ref
  ) values (
    p_payment_ref,v_intent.order_ref,v_intent.invoice_ref,v_intent.candidate_ref,'PAYFAST',
    p_provider_payment_id,p_merchant_reference,p_amount_gross_cents,p_amount_fee_cents,p_amount_net_cents,
    'ZAR','COMPLETE',true,v_now,p_evidence_ref
  );
  update public.finance_orders set order_status='PAID',updated_at=v_now where order_ref=v_intent.order_ref;
  update public.finance_invoices set invoice_status='PAID',paid_at=v_now where invoice_ref=v_intent.invoice_ref;
  update public.payfast_payment_intents set intent_status='PAID',updated_at=v_now where intent_ref=v_intent.intent_ref;
  update public.candidate_service_orders set status='PAID',paid_at=v_now,updated_at=v_now
   where id=v_service_order.id and status='PENDING_PAYMENT';
  if not found and v_service_order.status <> 'PAID' then raise exception 'service_entitlement_activation_failed'; end if;
  update public.candidates set active_package_code=v_service_order.package_code,updated_at=v_now
   where id=v_service_order.candidate_id;
  if not found then raise exception 'candidate_activation_target_missing'; end if;
  insert into public.payment_evidence_ledger (
    evidence_ref,source_type,source_ref,candidate_ref,order_ref,payment_ref,
    event_name,event_summary,proof_payload
  ) values (
    p_evidence_ref,'payfast_itn',p_receipt_ref,v_intent.candidate_ref,v_intent.order_ref,p_payment_ref,
    'PAYFAST_SANDBOX_PAYMENT_VERIFIED',
    'Provider-confirmed sandbox payment accepted after ITN verification; matching candidate service entitlement activated.',
    jsonb_build_object('environment','sandbox','providerValidated',true,'signatureValidated',true,
      'merchantValidated',true,'amountValidated',true,'entitlementActivated',true,'livePaymentsEnabled',false)
  );
  return jsonb_build_object('status','settled','payment_ref',p_payment_ref,'entitlementActivated',true);
end;
$$;
revoke all on function public.payfast_settle_sandbox_payment(text,text,integer,integer,integer,text,text,text,text) from public,anon,authenticated;
grant execute on function public.payfast_settle_sandbox_payment(text,text,integer,integer,integer,text,text,text,text) to service_role;
