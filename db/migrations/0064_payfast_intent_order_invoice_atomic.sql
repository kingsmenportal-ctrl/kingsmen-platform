-- 0064: atomic, idempotent PayFast order/invoice/intent creation for verified candidates.
CREATE OR REPLACE FUNCTION public.create_payfast_payment_intent(
  p_auth_user_id uuid,
  p_candidate_ref text,
  p_plan_code text,
  p_idempotency_key text,
  p_order_ref text,
  p_invoice_ref text,
  p_intent_ref text,
  p_amount_cents integer,
  p_currency text,
  p_item_name text,
  p_item_description text,
  p_return_url text,
  p_cancel_url text,
  p_notify_url text,
  p_environment text,
  p_payment_url text,
  p_signed_payload jsonb,
  p_signature text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan public.finance_plan_catalog%ROWTYPE;
  v_existing public.payfast_payment_intents%ROWTYPE;
  v_order public.finance_orders%ROWTYPE;
  v_invoice public.finance_invoices%ROWTYPE;
  v_candidate_id uuid;
  v_evidence_ref text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'SERVER_SIDE_FINANCE_PROCESSOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_auth_user_id IS NULL OR length(trim(COALESCE(p_candidate_ref,''))) = 0
    OR length(trim(COALESCE(p_idempotency_key,''))) < 8 OR length(p_idempotency_key) > 200
    OR p_order_ref IS NULL OR p_invoice_ref IS NULL OR p_intent_ref IS NULL
    OR p_amount_cents IS NULL OR p_amount_cents <= 0
    OR upper(COALESCE(p_currency,'')) <> 'ZAR'
    OR p_environment NOT IN ('sandbox','live')
    OR p_signature IS NULL OR length(p_signature) <> 32
    OR p_signed_payload IS NULL OR jsonb_typeof(p_signed_payload) <> 'object'
  THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_INTENT_REQUEST' USING ERRCODE = '22023';
  END IF;
  IF p_payment_url <> CASE WHEN p_environment = 'live'
    THEN 'https://www.payfast.co.za/eng/process'
    ELSE 'https://sandbox.payfast.co.za/eng/process' END
    OR p_notify_url !~* '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
    OR p_return_url !~* '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
    OR p_cancel_url !~* '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
  THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_DESTINATION' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.candidates c
    JOIN public.candidate_accounts ca ON ca.candidate_id = c.id
    JOIN public.candidate_auth_identity_links l ON l.candidate_id = c.id
    WHERE c.public_ref = p_candidate_ref AND c.is_active = true
      AND ca.auth_user_id = p_auth_user_id AND ca.auth_status = 'ACTIVE'
      AND ca.email_verified = true AND ca.account_recovery_required = false
      AND l.supabase_user_id = p_auth_user_id AND l.link_status = 'VERIFIED'
      AND l.verified_at IS NOT NULL AND l.verified_by IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'VERIFIED_ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_plan FROM public.finance_plan_catalog
    WHERE plan_code = p_plan_code AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACTIVE_FINANCE_PLAN_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF v_plan.amount_cents <> p_amount_cents OR v_plan.currency <> upper(p_currency)
    OR v_plan.plan_name <> p_item_name OR v_plan.description <> p_item_description THEN
    RAISE EXCEPTION 'FINANCE_PLAN_PRICE_MISMATCH' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO v_existing FROM public.payfast_payment_intents
    WHERE idempotency_key = p_idempotency_key FOR UPDATE;
  IF FOUND THEN
    SELECT * INTO v_order FROM public.finance_orders WHERE order_ref = v_existing.order_ref;
    IF v_existing.candidate_ref <> p_candidate_ref OR v_order.plan_code <> p_plan_code THEN
      RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED_FOR_DIFFERENT_PURCHASE' USING ERRCODE = '23505';
    END IF;
    RETURN jsonb_build_object(
      'ok', true, 'replayed', true, 'intentRef', v_existing.intent_ref,
      'merchantReference', v_existing.merchant_reference, 'paymentUrl', v_existing.payment_url,
      'signedPayload', v_existing.signed_payload, 'orderRef', v_existing.order_ref,
      'invoiceRef', v_existing.invoice_ref, 'amountCents', v_existing.amount_cents,
      'currency', v_existing.currency, 'environment', v_existing.payfast_environment
    );
  END IF;

  INSERT INTO public.finance_orders(order_ref, candidate_ref, plan_code, order_status, amount_cents, currency)
    VALUES (p_order_ref, p_candidate_ref, p_plan_code, 'PENDING_PAYMENT', p_amount_cents, upper(p_currency))
    RETURNING * INTO v_order;
  INSERT INTO public.finance_invoices(invoice_ref, order_ref, candidate_ref, invoice_status, amount_cents, currency)
    VALUES (p_invoice_ref, p_order_ref, p_candidate_ref, 'OPEN', p_amount_cents, upper(p_currency))
    RETURNING * INTO v_invoice;
  INSERT INTO public.payfast_payment_intents(
    intent_ref, order_ref, invoice_ref, candidate_ref, merchant_reference,
    amount_cents, currency, item_name, item_description, return_url, cancel_url,
    notify_url, payfast_environment, payment_url, signed_payload, signature, intent_status, idempotency_key
  ) VALUES (
    p_intent_ref, p_order_ref, p_invoice_ref, p_candidate_ref, p_order_ref,
    p_amount_cents, upper(p_currency), p_item_name, p_item_description, p_return_url, p_cancel_url,
    p_notify_url, p_environment, p_payment_url, p_signed_payload, p_signature, 'CREATED', p_idempotency_key
  ) RETURNING * INTO v_existing;

  v_evidence_ref := 'FINANCE-ORDER-' || replace(v_existing.intent_ref, 'pf_intent_', '');
  INSERT INTO public.finance_ledger_entries(
    ledger_ref, candidate_ref, order_ref, invoice_ref, entry_type, debit_cents, credit_cents,
    currency, description, evidence_ref
  ) VALUES (
    'ORDER_CREATED:' || p_order_ref, p_candidate_ref, p_order_ref, p_invoice_ref,
    'ORDER_CREATED', p_amount_cents, 0, upper(p_currency), 'Finance order created from active plan catalogue.', v_evidence_ref
  ) ON CONFLICT (ledger_ref) DO NOTHING;
  INSERT INTO public.finance_ledger_entries(
    ledger_ref, candidate_ref, order_ref, invoice_ref, entry_type, debit_cents, credit_cents,
    currency, description, evidence_ref
  ) VALUES (
    'INVOICE_ISSUED:' || p_invoice_ref, p_candidate_ref, p_order_ref, p_invoice_ref,
    'INVOICE_ISSUED', 0, p_amount_cents, upper(p_currency), 'Invoice issued for finance order.', v_evidence_ref
  ) ON CONFLICT (ledger_ref) DO NOTHING;
  INSERT INTO public.payment_evidence_ledger(
    evidence_ref, source_type, source_ref, candidate_ref, order_ref, event_name, event_summary, proof_payload
  ) VALUES (
    v_evidence_ref, 'PAYFAST_INTENT', v_existing.intent_ref, p_candidate_ref, p_order_ref,
    'ORDER_AND_INVOICE_CREATED', 'Order, invoice, signed payment intent, and initial ledger entries created atomically.',
    jsonb_build_object('invoice_ref', p_invoice_ref, 'plan_code', p_plan_code, 'amount_cents', p_amount_cents, 'currency', upper(p_currency), 'idempotency_key', p_idempotency_key)
  ) ON CONFLICT (evidence_ref) DO NOTHING;

  RETURN jsonb_build_object(
    'ok', true, 'replayed', false, 'intentRef', v_existing.intent_ref,
    'merchantReference', v_existing.merchant_reference, 'paymentUrl', v_existing.payment_url,
    'signedPayload', v_existing.signed_payload, 'orderRef', v_existing.order_ref,
    'invoiceRef', v_existing.invoice_ref, 'amountCents', v_existing.amount_cents,
    'currency', v_existing.currency, 'environment', v_existing.payfast_environment
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_payfast_payment_intent(uuid, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_payfast_payment_intent(uuid, text, text, text, text, text, text, integer, text, text, text, text, text, text, text, text, jsonb, text) TO service_role;
