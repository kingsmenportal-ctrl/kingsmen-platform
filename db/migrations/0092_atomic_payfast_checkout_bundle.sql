-- 0092: make sandbox checkout creation atomic and idempotent.
-- All inserts (order, invoice, intent, evidence) commit or roll back as one transaction.
-- This does not enable live payments and is restricted to the server-side service role.
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
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plan public.finance_plan_catalog%rowtype;
  v_intent public.payfast_payment_intents%rowtype;
  v_order public.finance_orders%rowtype;
  v_existing_evidence_ref text;
  v_expected_amount text;
  v_now timestamptz := clock_timestamp();
begin
  if p_supabase_user_id is null
     or coalesce(p_candidate_ref, '') = ''
     or coalesce(p_plan_code, '') = ''
     or coalesce(p_idempotency_key, '') !~ '^[A-Za-z0-9._:-]{8,160}$' then
    raise exception 'checkout_identity_plan_and_idempotency_required';
  end if;
  if coalesce(p_order_ref, '') = ''
     or coalesce(p_invoice_ref, '') = ''
     or coalesce(p_intent_ref, '') = ''
     or coalesce(p_evidence_ref, '') = ''
     or coalesce(p_return_url, '') !~ '^https://'
     or coalesce(p_cancel_url, '') !~ '^https://'
     or coalesce(p_notify_url, '') !~ '^https://' then
    raise exception 'checkout_references_and_https_urls_required';
  end if;
  if jsonb_typeof(p_signed_payload) <> 'object'
     or coalesce(p_signed_payload->>'merchant_id', '') = ''
     or coalesce(p_signed_payload->>'merchant_key', '') = ''
     or coalesce(p_signed_payload->>'signature', '') !~ '^[A-Fa-f0-9]{32}$'
     or p_signed_payload ? 'passphrase'
     or p_signed_payload ? 'SUPABASE_SERVICE_ROLE_KEY'
     or p_signed_payload->>'m_payment_id' is distinct from p_order_ref
     or p_signed_payload->>'return_url' is distinct from p_return_url
     or p_signed_payload->>'cancel_url' is distinct from p_cancel_url
     or p_signed_payload->>'notify_url' is distinct from p_notify_url then
    raise exception 'checkout_payload_invalid_or_secret_material_present';
  end if;

  -- The table has a global unique idempotency key; lock that key, not only candidate+key.
  perform pg_advisory_xact_lock(hashtextextended('payfast-sandbox-checkout:' || p_idempotency_key, 0));

  select * into v_intent
    from public.payfast_payment_intents
   where idempotency_key = p_idempotency_key
   for update;
  if found then
    if v_intent.candidate_ref::text <> p_candidate_ref then
      raise exception 'idempotency_key_owned_by_another_candidate';
    end if;
    select * into v_order
      from public.finance_orders
     where order_ref = v_intent.order_ref
     for update;
    if not found or v_order.plan_code <> p_plan_code then
      raise exception 'idempotency_key_reused_for_different_checkout';
    end if;

    -- Heal a legacy intent whose previous independent insert sequence stopped before evidence.
    select e.evidence_ref into v_existing_evidence_ref
      from public.payment_evidence_ledger e
     where e.source_type = 'payfast_intent'
       and e.source_ref = v_intent.intent_ref
     order by e.created_at
     limit 1;
    if not found then
      insert into public.payment_evidence_ledger (
        evidence_ref, source_type, source_ref, candidate_ref, order_ref,
        event_name, event_summary, proof_payload
      ) values (
        p_evidence_ref, 'payfast_intent', v_intent.intent_ref,
        v_intent.candidate_ref, v_intent.order_ref,
        'PAYFAST_SANDBOX_INTENT_CREATED',
        'Sandbox checkout intent created or recovered; not proof of payment.',
        jsonb_build_object(
          'environment','sandbox','amountCents',v_intent.amount_cents,
          'currency','ZAR','passphraseReturned',false,
          'merchantKeyIncludedInHostedForm',true,'serviceRoleKeyReturned',false
        )
      )
      on conflict (evidence_ref) do nothing;
      update public.payfast_payment_intents
         set evidence_ref = coalesce(evidence_ref, p_evidence_ref), updated_at = v_now
       where intent_ref = v_intent.intent_ref;
      update public.finance_orders
         set evidence_ref = coalesce(evidence_ref, p_evidence_ref), updated_at = v_now
       where order_ref = v_intent.order_ref;
      update public.finance_invoices
         set evidence_ref = coalesce(evidence_ref, p_evidence_ref)
       where invoice_ref = v_intent.invoice_ref;
    end if;

    return jsonb_build_object(
      'intent', jsonb_build_object(
        'intentRef', v_intent.intent_ref,
        'merchantReference', v_intent.merchant_reference,
        'paymentUrl', v_intent.payment_url,
        'signedPayload', v_intent.signed_payload - 'merchant_key'
      ),
      'orderStatus', v_order.order_status,
      'paymentStatus', case when v_order.order_status = 'PAID' or v_intent.intent_status = 'PAID' then 'COMPLETE' else 'PENDING' end,
      'reused', true,
      'note', 'An existing checkout was reused; only a verified provider ITN can confirm payment.'
    );
  end if;

  select * into v_plan
    from public.finance_plan_catalog
   where plan_code = p_plan_code
     and active = true
   for share;
  if not found then raise exception 'active_plan_not_found'; end if;
  if v_plan.amount_cents <= 0 or v_plan.currency <> 'ZAR' then
    raise exception 'plan_not_payable_through_payfast';
  end if;
  v_expected_amount := to_char(v_plan.amount_cents::numeric / 100, 'FM999999999990.00');
  if p_signed_payload->>'amount' is distinct from v_expected_amount then
    raise exception 'checkout_payload_amount_mismatch';
  end if;
  if p_signed_payload->>'item_name' is distinct from left(v_plan.plan_name, 100) then
    raise exception 'checkout_payload_plan_name_mismatch';
  end if;

  if (select count(*) from public.candidate_auth_identity_links l
      where l.supabase_user_id = p_supabase_user_id
        and l.candidate_id::text = p_candidate_ref
        and l.link_status = 'VERIFIED'
        and l.verified_at is not null) <> 1 then
    raise exception 'exactly_one_verified_candidate_identity_link_required';
  end if;

  insert into public.finance_orders (
    order_ref,candidate_ref,plan_code,order_status,amount_cents,currency,evidence_ref,
    created_at,updated_at,catalogue_version,service_term_days,managed_application_count,
    accommodation_route_count,cv_versions,motivation_letters,
    acknowledgement_target_business_hours,first_response_target_business_hours,
    upgrade_bonus_routes,refund_policy_version,service_scope,entitlement_snapshot
  ) values (
    p_order_ref,p_candidate_ref,v_plan.plan_code,'PENDING_PAYMENT',v_plan.amount_cents,'ZAR',p_evidence_ref,
    v_now,v_now,v_plan.catalogue_version,v_plan.service_term_days,v_plan.managed_application_count,
    v_plan.accommodation_route_count,v_plan.cv_versions,v_plan.motivation_letters,
    v_plan.acknowledgement_target_business_hours,v_plan.first_response_target_business_hours,
    v_plan.upgrade_bonus_routes_when_cv_revamp_owned,v_plan.refund_policy_version,v_plan.service_scope,
    jsonb_build_object(
      'plan_code',v_plan.plan_code,'plan_name',v_plan.plan_name,'amount_cents',v_plan.amount_cents,
      'currency','ZAR','catalogue_version',v_plan.catalogue_version,
      'managed_application_count',v_plan.managed_application_count,
      'accommodation_route_count',v_plan.accommodation_route_count,
      'cv_versions',v_plan.cv_versions,'motivation_letters',v_plan.motivation_letters,
      'service_scope',v_plan.service_scope,'refund_policy_version',v_plan.refund_policy_version,
      'service_term_days',v_plan.service_term_days,
      'upgrade_bonus_routes',v_plan.upgrade_bonus_routes_when_cv_revamp_owned
    )
  );

  insert into public.finance_invoices (
    invoice_ref,order_ref,candidate_ref,invoice_status,amount_cents,currency,evidence_ref,issued_at,created_at
  ) values (
    p_invoice_ref,p_order_ref,p_candidate_ref,'OPEN',v_plan.amount_cents,'ZAR',p_evidence_ref,v_now,v_now
  );

  insert into public.payfast_payment_intents (
    intent_ref,order_ref,invoice_ref,candidate_ref,merchant_reference,amount_cents,currency,
    item_name,item_description,return_url,cancel_url,notify_url,payfast_environment,
    payment_url,signed_payload,signature,intent_status,idempotency_key,evidence_ref,created_at,updated_at
  ) values (
    p_intent_ref,p_order_ref,p_invoice_ref,p_candidate_ref,p_order_ref,v_plan.amount_cents,'ZAR',
    v_plan.plan_name,left(coalesce(v_plan.description,v_plan.plan_name),255),
    p_return_url,p_cancel_url,p_notify_url,'sandbox',
    'https://sandbox.payfast.co.za/eng/process',p_signed_payload - 'merchant_key',
    p_signed_payload->>'signature','CREATED',p_idempotency_key,p_evidence_ref,v_now,v_now
  );

  insert into public.payment_evidence_ledger (
    evidence_ref,source_type,source_ref,candidate_ref,order_ref,
    event_name,event_summary,proof_payload
  ) values (
    p_evidence_ref,'payfast_intent',p_intent_ref,p_candidate_ref,p_order_ref,
    'PAYFAST_SANDBOX_INTENT_CREATED',
    'Sandbox checkout intent created; not proof of payment.',
    jsonb_build_object(
      'environment','sandbox','amountCents',v_plan.amount_cents,'currency','ZAR',
      'passphraseReturned',false,'merchantKeyIncludedInHostedForm',true,'serviceRoleKeyReturned',false
    )
  );

  return jsonb_build_object(
    'intent', jsonb_build_object(
      'intentRef',p_intent_ref,'merchantReference',p_order_ref,
      'paymentUrl','https://sandbox.payfast.co.za/eng/process',
      'signedPayload',p_signed_payload
    ),
    'orderStatus','PENDING_PAYMENT',
    'paymentStatus','PENDING',
    'reused',false,
    'note','A checkout intent is not payment success. Only a verified provider ITN can confirm payment.'
  );
end;
$$;

revoke all on function public.create_payfast_sandbox_checkout_bundle(uuid,text,text,text,text,text,text,text,text,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.create_payfast_sandbox_checkout_bundle(uuid,text,text,text,text,text,text,text,text,text,text,jsonb)
  to service_role;
