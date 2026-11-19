-- Atomic settlement for PayFast sandbox ITNs.
-- The Edge Function must complete provider validation, signature, merchant, amount,
-- COMPLETE status, and replay checks before calling this service-role-only RPC.
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
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_intent public.payfast_payment_intents%rowtype;
  v_existing public.finance_payments%rowtype;
  v_now timestamptz := now();
begin
  if coalesce(p_merchant_reference, '') = '' or coalesce(p_provider_payment_id, '') = '' then
    raise exception 'merchant_reference_and_provider_payment_id_required';
  end if;
  select * into v_intent
    from public.payfast_payment_intents
   where merchant_reference = p_merchant_reference
   for update;
  if not found then raise exception 'payment_intent_not_found'; end if;
  if v_intent.candidate_ref::text <> p_candidate_ref then raise exception 'candidate_reference_mismatch'; end if;
  if v_intent.currency <> 'ZAR' or v_intent.amount_cents <> p_amount_gross_cents then
    raise exception 'payment_amount_or_currency_mismatch';
  end if;
  select * into v_existing from public.finance_payments
   where provider = 'PAYFAST' and provider_payment_id = p_provider_payment_id
   limit 1;
  if found then
    if v_existing.merchant_reference <> p_merchant_reference
       or v_existing.amount_gross_cents <> p_amount_gross_cents then
      raise exception 'provider_payment_id_conflict';
    end if;
    return jsonb_build_object('status', 'already_settled', 'payment_ref', v_existing.payment_ref);
  end if;

  insert into public.finance_payments (
    payment_ref, order_ref, invoice_ref, candidate_ref, provider, provider_payment_id,
    merchant_reference, amount_gross_cents, amount_fee_cents, amount_net_cents,
    currency, payment_status, verified, verified_at, evidence_ref
  ) values (
    p_payment_ref, v_intent.order_ref, v_intent.invoice_ref, v_intent.candidate_ref,
    'PAYFAST', p_provider_payment_id, p_merchant_reference,
    p_amount_gross_cents, p_amount_fee_cents, p_amount_net_cents,
    'ZAR', 'COMPLETE', true, v_now, p_evidence_ref
  );

  update public.finance_orders set order_status = 'PAID', updated_at = v_now
   where order_ref = v_intent.order_ref;
  update public.finance_invoices set invoice_status = 'PAID', paid_at = v_now
   where invoice_ref = v_intent.invoice_ref;
  update public.payfast_payment_intents set intent_status = 'PAID', updated_at = v_now
   where intent_ref = v_intent.intent_ref;

  insert into public.payment_evidence_ledger (
    evidence_ref, source_type, source_ref, candidate_ref, order_ref, payment_ref,
    event_name, event_summary, proof_payload
  ) values (
    p_evidence_ref, 'payfast_itn', p_receipt_ref, v_intent.candidate_ref,
    v_intent.order_ref, p_payment_ref, 'PAYFAST_SANDBOX_PAYMENT_VERIFIED',
    'Provider-confirmed sandbox payment accepted after ITN verification.',
    jsonb_build_object('environment','sandbox','providerValidated',true,'signatureValidated',true,
      'merchantValidated',true,'amountValidated',true,'livePaymentsEnabled',false)
  );
  return jsonb_build_object('status', 'settled', 'payment_ref', p_payment_ref);
end;
$$;
revoke all on function public.payfast_settle_sandbox_payment(text,text,integer,integer,integer,text,text,text,text) from public, anon, authenticated;
grant execute on function public.payfast_settle_sandbox_payment(text,text,integer,integer,integer,text,text,text,text) to service_role;
