-- 0090: create a PayFast sandbox checkout bundle atomically.
-- The checkout intent is not payment evidence. Only a verified ITN may settle an order.
begin;

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
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_link_count integer;
  v_candidate_id uuid;
  v_plan public.finance_plan_catalog%rowtype;
  v_existing public.payfast_payment_intents%rowtype;
  v_order public.finance_orders%rowtype;
  v_payment_status text;
  v_existing_plan_code text;
  v_signed_payload jsonb;
  v_now timestamptz := clock_timestamp();
begin
  if p_supabase_user_id is null
     or p_candidate_ref is null
     or p_candidate_ref !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or p_plan_code is null or p_plan_code !~ '^[A-Z0-9_]{3,80}$'
     or p_idempotency_key is null or p_idempotency_key !~ '^[A-Za-z0-9._:-]{8,160}$'
     or p_order_ref is null or p_order_ref !~ '^ord_[A-Za-z0-9_-]{8,100}$'
     or p_invoice_ref is null or p_invoice_ref !~ '^inv_[A-Za-z0-9_-]{8,100}$'
     or p_intent_ref is null or p_intent_ref !~ '^pf_intent_[A-Za-z0-9_-]{8,100}$'
     or p_evidence_ref is null or p_evidence_ref !~ '^pay_ev_[A-Za-z0-9_-]{8,100}$' then
    raise exception 'checkout_bundle_input_invalid' using errcode = '22023';
  end if;

  if p_return_url is null or p_cancel_url is null or p_notify_url is null
     or p_return_url !~ '^https://'
     or p_cancel_url !~ '^https://'
     or p_notify_url !~ '^https://'
     or position('@' in split_part(split_part(p_return_url, '://', 2), '/', 1)) > 0
     or position('@' in split_part(split_part(p_cancel_url, '://', 2), '/', 1)) > 0
     or position('@' in split_part(split_part(p_notify_url, '://', 2), '/', 1)) > 0 then
    raise exception 'checkout_urls_must_be_https' using errcode = '22023';
  end if;

  if jsonb_typeof(p_signed_payload) <> 'object'
     or p_signed_payload ? 'passphrase'
     or p_signed_payload ? 'SUPABASE_SERVICE_ROLE_KEY'
     or coalesce(p_signed_payload->>'merchant_key','') = ''
     or coalesce(p_signed_payload->>'merchant_id','') = ''
     or coalesce(p_signed_payload->>'signature','') !~ '^[0-9a-f]{32}$'
     or p_signed_payload->>'return_url' is distinct from p_return_url
     or p_signed_payload->>'cancel_url' is distinct from p_cancel_url
     or p_signed_payload->>'notify_url' is distinct from p_notify_url
     or p_signed_payload->>'m_payment_id' is distinct from p_order_ref
     or coalesce(p_signed_payload->>'email_address','') !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
     or coalesce(p_signed_payload->>'amount','') !~ '^[0-9]+[.][0-9]{2}$'
     or coalesce(p_signed_payload->>'item_name','') = ''
     or length(p_signed_payload->>'item_name') > 100
     or length(coalesce(p_signed_payload->>'item_description','')) > 255 then
    raise exception 'checkout_payload_invalid' using errcode = '22023';
  end if;

  -- Serialize idempotency before checking or creating any durable checkout rows.
  perform pg_advisory_xact_lock(hashtextextended('payfast-sandbox-checkout:' || p_idempotency_key, 0));

  select count(*), min(l.candidate_id) into v_link_count, v_candidate_id
  from public.candidate_auth_identity_links l
  where l.supabase_user_id = p_supabase_user_id
    and l.candidate_id::text = p_candidate_ref
    and l.link_status = 'VERIFIED'
    and l.verified_at is not null
    and l.verified_at <= v_now
    and l.verified_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

  if v_link_count <> 1 or v_candidate_id is null then
    raise exception 'verified_candidate_identity_link_required' using errcode = '42501';
  end if;

  if not exists (select 1 from public.candidates c where c.id = v_candidate_id and c.is_active is true) then
    raise exception 'candidate_inactive' using errcode = '42501';
  end if;

  select * into v_plan
  from public.finance_plan_catalog p
  where p.plan_code = p_plan_code and p.active is true
  for share;
  if not found then raise exception 'active_plan_not_found' using errcode = 'P0002'; end if;
  if v_plan.currency <> 'ZAR' or v_plan.amount_cents <= 0 then
    raise exception 'plan_not_payable_through_payfast_sandbox' using errcode = '22023';
  end if;
  if round((p_signed_payload->>'amount')::numeric * 100)::integer <> v_plan.amount_cents then
    raise exception 'checkout_payload_amount_does_not_match_catalogue' using errcode = '22023';
  end if;

  -- Keep rejected provider ITNs retryable, but checkout intents themselves are strictly
  -- idempotent by the client-supplied key. A key cannot be reused for another candidate/plan.
  select * into v_existing
  from public.payfast_payment_intents i
  where i.idempotency_key = p_idempotency_key
  for update;

  if found then
    select o.plan_code into v_existing_plan_code
    from public.finance_orders o where o.order_ref = v_existing.order_ref;
    if v_existing.candidate_ref <> p_candidate_ref or v_existing_plan_code <> p_plan_code then
      raise exception 'checkout_idempotency_key_conflict' using errcode = '23505';
    end if;
    select * into v_order from public.finance_orders o where o.order_ref = v_existing.order_ref;
    select coalesce((select fp.payment_status from public.finance_payments fp
       where fp.order_ref = v_existing.order_ref and fp.provider = 'PAYFAST'
       order by fp.created_at desc limit 1), 'PENDING')
      into v_payment_status;

    return jsonb_build_object(
      'intent', jsonb_build_object(
        'intentRef', v_existing.intent_ref,
        'merchantReference', v_existing.merchant_reference,
        'paymentUrl', case when v_order.order_status = 'PAID' then null else v_existing.payment_url end,
        'signedPayload', v_existing.signed_payload
      ),
      'orderStatus', v_order.order_status,
      'paymentStatus', v_payment_status,
      'reused', true,
      'note', case when v_order.order_status = 'PAID'
        then 'This order is already paid. No second checkout has been issued.'
        else 'Existing idempotent sandbox checkout reused. This is not payment success.' end
    );
  end if;

  if p_signed_payload->>'merchant_id' = ''
     or round((p_signed_payload->>'amount')::numeric * 100)::integer <> v_plan.amount_cents then
    raise exception 'checkout_payload_catalogue_mismatch' using errcode = '22023';
  end if;

  v_signed_payload := jsonb_strip_nulls(p_signed_payload - 'merchant_key' - 'signature');

  insert into public.finance_orders (
    order_ref, candidate_ref, plan_code, order_status, amount_cents, currency, evidence_ref,
    catalogue_version, service_term_days, managed_application_count, accommodation_route_count,
    cv_versions, motivation_letters, acknowledgement_target_business_hours,
    first_response_target_business_hours, upgrade_bonus_routes, refund_policy_version,
    service_scope, entitlement_snapshot, created_at, updated_at
  ) values (
    p_order_ref, p_candidate_ref, v_plan.plan_code, 'PENDING_PAYMENT', v_plan.amount_cents, 'ZAR', p_evidence_ref,
    v_plan.catalogue_version, v_plan.service_term_days, v_plan.managed_application_count,
    v_plan.accommodation_route_count, v_plan.cv_versions, v_plan.motivation_letters,
    v_plan.acknowledgement_target_business_hours, v_plan.first_response_target_business_hours,
    v_plan.upgrade_bonus_routes_when_cv_revamp_owned, v_plan.refund_policy_version, v_plan.service_scope,
    jsonb_build_object(
      'catalogueVersion', v_plan.catalogue_version,
      'planCode', v_plan.plan_code,
      'planName', v_plan.plan_name,
      'amountCents', v_plan.amount_cents,
      'currency', v_plan.currency,
      'priorityApplicationCount', v_plan.priority_application_count,
      'managedApplicationCount', v_plan.managed_application_count,
      'accommodationRouteCount', v_plan.accommodation_route_count,
      'accommodationSupportAvailable', v_plan.accommodation_support_available,
      'cvVersions', v_plan.cv_versions,
      'motivationLetters', v_plan.motivation_letters,
      'serviceTermDays', v_plan.service_term_days,
      'acknowledgementTargetBusinessHours', v_plan.acknowledgement_target_business_hours,
      'firstResponseTargetBusinessHours', v_plan.first_response_target_business_hours,
      'upgradeBonusRoutesWhenCvRevampOwned', v_plan.upgrade_bonus_routes_when_cv_revamp_owned,
      'refundPolicyVersion', v_plan.refund_policy_version,
      'serviceScope', v_plan.service_scope,
      'responseTargetDisclaimer', v_plan.response_target_disclaimer
    ),
    v_now, v_now
  );

  insert into public.finance_invoices (
    invoice_ref, order_ref, candidate_ref, invoice_status, amount_cents, currency, evidence_ref, issued_at
  ) values (
    p_invoice_ref, p_order_ref, p_candidate_ref, 'OPEN', v_plan.amount_cents, 'ZAR', p_evidence_ref, v_now
  );

  insert into public.payfast_payment_intents (
    intent_ref, order_ref, invoice_ref, candidate_ref, merchant_reference, amount_cents, currency,
    item_name, item_description, return_url, cancel_url, notify_url, payfast_environment, payment_url,
    signed_payload, signature, intent_status, idempotency_key, evidence_ref, created_at, updated_at
  ) values (
    p_intent_ref, p_order_ref, p_invoice_ref, p_candidate_ref, p_order_ref, v_plan.amount_cents, 'ZAR',
    left(v_plan.plan_name,100), left(v_plan.description,255), p_return_url, p_cancel_url, p_notify_url,
    'sandbox', 'https://sandbox.payfast.co.za/eng/process', v_signed_payload,
    p_signed_payload->>'signature', 'CREATED', p_idempotency_key, p_evidence_ref, v_now, v_now
  );

  insert into public.payment_evidence_ledger (
    evidence_ref, source_type, source_ref, candidate_ref, order_ref,
    event_name, event_summary, proof_payload, created_at
  ) values (
    p_evidence_ref, 'payfast_checkout_intent', p_intent_ref, p_candidate_ref, p_order_ref,
    'PAYFAST_SANDBOX_CHECKOUT_INTENT_CREATED',
    'Sandbox checkout intent created; no payment has been verified or posted.',
    jsonb_build_object(
      'environment', 'sandbox',
      'paid', false,
      'paymentStatus', 'PENDING',
      'planCode', v_plan.plan_code,
      'amountCents', v_plan.amount_cents,
      'currency', 'ZAR',
      'candidateIdentityVerified', true,
      'livePaymentsEnabled', false
    ),
    v_now
  );

  select * into v_order from public.finance_orders o where o.order_ref = p_order_ref;
  return jsonb_build_object(
    'intent', jsonb_build_object(
      'intentRef', p_intent_ref,
      'merchantReference', p_order_ref,
      'paymentUrl', 'https://sandbox.payfast.co.za/eng/process',
      'signedPayload', v_signed_payload
    ),
    'orderStatus', v_order.order_status,
    'paymentStatus', 'PENDING',
    'reused', false,
    'note', 'Sandbox checkout intent created. Only a verified PayFast ITN can mark the order paid.'
  );
end;
$function$;

revoke all on function public.create_payfast_sandbox_checkout_bundle(uuid,text,text,text,text,text,text,text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_payfast_sandbox_checkout_bundle(uuid,text,text,text,text,text,text,text,text,text,text,jsonb) to service_role;

comment on function public.create_payfast_sandbox_checkout_bundle(uuid,text,text,text,text,text,text,text,text,text,text,jsonb) is
  'Atomically creates a candidate-bound pending sandbox checkout bundle after checking verified identity, active plan and idempotency. It never marks payment as paid; only accepted ITN settlement can do that.';

commit;
