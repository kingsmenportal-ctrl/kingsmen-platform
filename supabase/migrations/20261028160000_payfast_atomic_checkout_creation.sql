-- Create the PayFast checkout's finance records in one transaction.
create or replace function public.payfast_create_sandbox_checkout(
  p_order jsonb, p_invoice jsonb, p_intent jsonb, p_evidence jsonb
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_candidate_ref text := p_order->>'candidate_ref';
  v_idempotency_key text := p_intent->>'idempotency_key';
  v_existing public.payfast_payment_intents%rowtype;
begin
  if coalesce(v_candidate_ref,'') = '' or coalesce(v_idempotency_key,'') = '' then
    raise exception 'candidate_and_idempotency_key_required';
  end if;
  if p_order->>'candidate_ref' <> p_invoice->>'candidate_ref'
     or p_order->>'candidate_ref' <> p_intent->>'candidate_ref'
     or p_order->>'order_ref' <> p_invoice->>'order_ref'
     or p_order->>'order_ref' <> p_intent->>'order_ref'
     or p_invoice->>'invoice_ref' <> p_intent->>'invoice_ref' then
    raise exception 'checkout_record_binding_mismatch';
  end if;
  select * into v_existing from public.payfast_payment_intents
   where candidate_ref=v_candidate_ref and idempotency_key=v_idempotency_key for update;
  if found then
    return jsonb_build_object('reused',true,'intentRef',v_existing.intent_ref,
      'merchantReference',v_existing.merchant_reference,'paymentUrl',v_existing.payment_url,
      'intentStatus',v_existing.intent_status);
  end if;
  insert into public.finance_orders (
    order_ref,candidate_ref,plan_code,order_status,amount_cents,currency,catalogue_version,
    service_term_days,managed_application_count,accommodation_route_count,cv_versions,motivation_letters,
    acknowledgement_target_business_hours,first_response_target_business_hours,upgrade_bonus_routes,
    refund_policy_version,service_scope,entitlement_snapshot,evidence_ref
  ) values (
    p_order->>'order_ref',v_candidate_ref,p_order->>'plan_code',coalesce(p_order->>'order_status','PENDING_PAYMENT'),
    (p_order->>'amount_cents')::integer,coalesce(p_order->>'currency','ZAR'),
    coalesce(p_order->>'catalogue_version','1.0'),coalesce((p_order->>'service_term_days')::integer,0),
    coalesce((p_order->>'managed_application_count')::integer,0),coalesce((p_order->>'accommodation_route_count')::integer,0),
    coalesce((p_order->>'cv_versions')::integer,0),coalesce((p_order->>'motivation_letters')::integer,0),
    coalesce((p_order->>'acknowledgement_target_business_hours')::integer,0),
    coalesce((p_order->>'first_response_target_business_hours')::integer,0),
    coalesce((p_order->>'upgrade_bonus_routes')::integer,0),
    coalesce(p_order->>'refund_policy_version','ZA_CONSUMER_REVIEW_PENDING_PUBLICATION_V1'),
    coalesce(p_order->>'service_scope',''),coalesce(p_order->'entitlement_snapshot','{}'::jsonb),
    p_evidence->>'evidence_ref'
  );
  insert into public.finance_invoices (
    invoice_ref,order_ref,candidate_ref,invoice_status,amount_cents,currency,evidence_ref
  ) values (
    p_invoice->>'invoice_ref',p_invoice->>'order_ref',v_candidate_ref,
    coalesce(p_invoice->>'invoice_status','OPEN'),(p_invoice->>'amount_cents')::integer,
    coalesce(p_invoice->>'currency','ZAR'),p_evidence->>'evidence_ref'
  );
  insert into public.payfast_payment_intents (
    intent_ref,order_ref,invoice_ref,candidate_ref,merchant_reference,amount_cents,currency,
    item_name,item_description,return_url,cancel_url,notify_url,payfast_environment,payment_url,
    signed_payload,signature,intent_status,idempotency_key,evidence_ref
  ) values (
    p_intent->>'intent_ref',p_intent->>'order_ref',p_intent->>'invoice_ref',v_candidate_ref,
    p_intent->>'merchant_reference',(p_intent->>'amount_cents')::integer,coalesce(p_intent->>'currency','ZAR'),
    p_intent->>'item_name',p_intent->>'item_description',p_intent->>'return_url',p_intent->>'cancel_url',
    p_intent->>'notify_url',coalesce(p_intent->>'payfast_environment','sandbox'),p_intent->>'payment_url',
    coalesce(p_intent->'signed_payload','{}'::jsonb),p_intent->>'signature',
    coalesce(p_intent->>'intent_status','CREATED'),v_idempotency_key,p_evidence->>'evidence_ref'
  );
  insert into public.payment_evidence_ledger (
    evidence_ref,source_type,source_ref,candidate_ref,order_ref,event_name,event_summary,proof_payload
  ) values (
    p_evidence->>'evidence_ref','payfast_intent',p_intent->>'intent_ref',v_candidate_ref,
    p_order->>'order_ref','PAYFAST_SANDBOX_INTENT_CREATED',
    'Sandbox checkout intent created; not proof of payment.',coalesce(p_evidence->'proof_payload','{}'::jsonb)
  );
  return jsonb_build_object('reused',false,'intentRef',p_intent->>'intent_ref',
    'merchantReference',p_intent->>'merchant_reference','paymentUrl',p_intent->>'payment_url','intentStatus','CREATED');
end;
$$;
revoke all on function public.payfast_create_sandbox_checkout(jsonb,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.payfast_create_sandbox_checkout(jsonb,jsonb,jsonb,jsonb) to service_role;
