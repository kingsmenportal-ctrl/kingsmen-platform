-- 0063: atomic, idempotent PayFast ITN persistence and ledger reconciliation.
-- Only the server-side webhook runtime may call this function after provider signature/IP/VALID checks.
CREATE OR REPLACE FUNCTION public.process_payfast_itn(
  p_payload jsonb,
  p_signature_valid boolean,
  p_merchant_valid boolean,
  p_ip_valid boolean,
  p_provider_validation text,
  p_source_ip text,
  p_received_signature text,
  p_calculated_signature text,
  p_canonical_hash text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_merchant_ref text := COALESCE(p_payload->>'m_payment_id', '');
  v_provider_payment_id text := NULLIF(COALESCE(p_payload->>'pf_payment_id', ''), '');
  v_payment_status text := upper(COALESCE(p_payload->>'payment_status', ''));
  v_currency text := upper(COALESCE(NULLIF(p_payload->>'currency', ''), 'ZAR'));
  v_idempotency_key text;
  v_intent public.payfast_payment_intents%ROWTYPE;
  v_order public.finance_orders%ROWTYPE;
  v_invoice public.finance_invoices%ROWTYPE;
  v_gross integer := -1;
  v_fee integer := 0;
  v_net integer := -1;
  v_amount_valid boolean := false;
  v_provider_valid boolean := COALESCE(p_provider_validation, '') = 'VALID';
  v_merchant_valid boolean := COALESCE(p_merchant_valid, false);
  v_accepted boolean := false;
  v_duplicate boolean := false;
  v_failure_recorded boolean := false;
  v_rejection text;
  v_itn_ref text := 'ITN-' || gen_random_uuid()::text;
  v_payment_ref text;
  v_evidence_ref text;
  v_receipt_id uuid;
  v_existing_payment public.finance_payments%ROWTYPE;
  v_audit_ref text := 'PFA-' || gen_random_uuid()::text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'SERVER_SIDE_PAYMENT_PROCESSOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'INVALID_ITN_PAYLOAD' USING ERRCODE = '22023';
  END IF;
  v_idempotency_key := 'payfast-itn:' || left(v_merchant_ref, 180) || ':' ||
    left(COALESCE(v_provider_payment_id, 'no-provider-id'), 120) || ':' || left(v_payment_status, 40);

  BEGIN
    v_gross := round((p_payload->>'amount_gross')::numeric * 100)::integer;
    IF NULLIF(p_payload->>'amount_fee', '') IS NOT NULL THEN
      v_fee := abs(round((p_payload->>'amount_fee')::numeric * 100)::integer);
    END IF;
    IF NULLIF(p_payload->>'amount_net', '') IS NOT NULL THEN
      v_net := round((p_payload->>'amount_net')::numeric * 100)::integer;
    ELSE
      v_net := v_gross - v_fee;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_gross := -1; v_fee := 0; v_net := -1;
  END;

  IF v_merchant_ref <> '' THEN
    SELECT * INTO v_intent FROM public.payfast_payment_intents
      WHERE merchant_reference = v_merchant_ref
      FOR UPDATE;
  END IF;
  IF v_intent.id IS NOT NULL THEN
    SELECT * INTO v_order FROM public.finance_orders WHERE order_ref = v_intent.order_ref FOR UPDATE;
    v_amount_valid := v_gross = v_intent.amount_cents
      AND v_gross = v_order.amount_cents
      AND v_currency = v_intent.currency
      AND v_currency = v_order.currency
      AND v_net = v_gross - v_fee
      AND v_fee >= 0 AND v_net >= 0;
    IF v_intent.invoice_ref IS NOT NULL THEN
      SELECT * INTO v_invoice FROM public.finance_invoices
        WHERE invoice_ref = v_intent.invoice_ref
        FOR UPDATE;
      IF NOT FOUND OR v_invoice.order_ref <> v_order.order_ref
        OR v_invoice.candidate_ref <> v_order.candidate_ref
        OR v_invoice.currency <> v_currency
        OR v_invoice.amount_cents <> v_gross
        OR v_invoice.invoice_status NOT IN ('OPEN','OVERDUE','PAID') THEN
        v_amount_valid := false;
      END IF;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.payfast_itn_receipts r
    WHERE r.accepted = true AND r.idempotency_key = v_idempotency_key
  ) THEN
    v_duplicate := true;
    v_rejection := 'Previously accepted ITN with this idempotency key.';
  ELSIF v_merchant_ref <> '' AND EXISTS (
    SELECT 1 FROM public.finance_payments p
    WHERE p.merchant_reference = v_merchant_ref AND p.provider = 'PAYFAST'
      AND p.payment_status = 'COMPLETE' AND p.verified = true
  ) THEN
    v_duplicate := true;
    v_rejection := 'Order already has a verified completed payment.';
  ELSIF v_intent.id IS NULL THEN
    v_rejection := 'No payment intent matches the merchant reference.';
  ELSIF COALESCE(p_signature_valid, false) IS NOT TRUE THEN
    v_rejection := 'Invalid PayFast signature.';
  ELSIF NOT v_merchant_valid THEN
    v_rejection := 'PayFast merchant identifier mismatch.';
  ELSIF COALESCE(p_ip_valid, false) IS NOT TRUE THEN
    v_rejection := 'PayFast source IP is not allowlisted.';
  ELSIF NOT v_provider_valid THEN
    v_rejection := 'PayFast server validation did not return VALID.';
  ELSIF NOT v_amount_valid THEN
    v_rejection := 'Amount, currency, invoice, or intent did not match the durable order.';
  ELSIF v_payment_status NOT IN ('COMPLETE','FAILED','CANCELLED') THEN
    v_rejection := 'Unsupported provider payment status.';
  ELSIF v_payment_status = 'COMPLETE' AND v_provider_payment_id IS NULL THEN
    v_rejection := 'Completed payment is missing the provider payment identifier.';
  ELSIF v_order.order_status NOT IN ('PENDING_PAYMENT','DRAFT','FAILED') AND v_payment_status = 'COMPLETE' THEN
    v_rejection := 'Order is not in a payable state.';
  ELSE
    v_accepted := true;
  END IF;

  INSERT INTO public.payfast_itn_receipts(
    itn_ref, merchant_reference, provider_payment_id, payment_status,
    amount_gross, amount_fee, amount_net, received_payload, canonical_string,
    received_signature, calculated_signature, signature_valid, ip_valid,
    amount_valid, duplicate, accepted, rejection_reason, idempotency_key, evidence_ref
  ) VALUES (
    v_itn_ref, v_merchant_ref, v_provider_payment_id, NULLIF(v_payment_status, ''),
    p_payload->>'amount_gross', p_payload->>'amount_fee', p_payload->>'amount_net',
    p_payload, NULL, p_received_signature, p_calculated_signature,
    COALESCE(p_signature_valid, false), COALESCE(p_ip_valid, false),
    v_amount_valid, v_duplicate, v_accepted AND NOT v_duplicate, v_rejection,
    v_idempotency_key, 'PAYFAST-ITN-' || replace(v_itn_ref, 'ITN-', '')
  ) RETURNING id INTO v_receipt_id;

  INSERT INTO public.payfast_signature_audit(
    audit_ref, merchant_reference, verification_stage, signature_valid,
    canonical_string_hash, notes
  ) VALUES (
    v_audit_ref, v_merchant_ref,
    CASE WHEN v_accepted AND NOT v_duplicate THEN 'ACCEPTED' WHEN v_duplicate THEN 'DUPLICATE' ELSE 'REJECTED' END,
    COALESCE(p_signature_valid, false), p_canonical_hash,
    left(concat_ws('; ', v_rejection, 'provider_validation=' || COALESCE(p_provider_validation,'UNAVAILABLE'), 'merchant_id_valid=' || v_merchant_valid::text, 'source_ip=' || COALESCE(p_source_ip,'unknown')), 2000)
  );

  IF v_duplicate THEN
    RETURN jsonb_build_object('ok', true, 'accepted', false, 'duplicate', true, 'alreadyAccepted', true, 'receiptId', v_receipt_id, 'rejectionReason', v_rejection);
  END IF;
  IF NOT v_accepted THEN
    RETURN jsonb_build_object('ok', true, 'accepted', false, 'duplicate', false, 'receiptId', v_receipt_id, 'rejectionReason', v_rejection, 'retryable', p_provider_validation = 'UNAVAILABLE');
  END IF;

  IF v_payment_status = 'FAILED' THEN
    UPDATE public.payfast_payment_intents SET intent_status = 'FAILED', updated_at = now()
      WHERE id = v_intent.id AND intent_status <> 'PAID';
    UPDATE public.finance_orders SET order_status = 'FAILED', updated_at = now()
      WHERE order_ref = v_order.order_ref AND order_status <> 'PAID';
    v_failure_recorded := true;
  ELSIF v_payment_status = 'CANCELLED' THEN
    UPDATE public.payfast_payment_intents SET intent_status = 'CANCELLED', updated_at = now()
      WHERE id = v_intent.id AND intent_status <> 'PAID';
    UPDATE public.finance_orders SET order_status = 'CANCELLED', updated_at = now()
      WHERE order_ref = v_order.order_ref AND order_status <> 'PAID';
    v_failure_recorded := true;
  ELSE
    v_payment_ref := 'PF-' || substr(md5(v_merchant_ref || ':' || v_provider_payment_id), 1, 24);
    v_evidence_ref := 'PAYFAST-ITN-' || substr(md5(v_idempotency_key), 1, 24);
    INSERT INTO public.finance_payments(
      payment_ref, order_ref, invoice_ref, candidate_ref, provider, provider_payment_id,
      merchant_reference, amount_gross_cents, amount_fee_cents, amount_net_cents,
      currency, payment_status, verified, verified_at, evidence_ref
    ) VALUES (
      v_payment_ref, v_order.order_ref, v_intent.invoice_ref, v_order.candidate_ref,
      'PAYFAST', v_provider_payment_id, v_merchant_ref, v_gross, v_fee, v_net,
      v_currency, 'COMPLETE', true, now(), v_evidence_ref
    );

    UPDATE public.finance_orders SET order_status = 'PAID', evidence_ref = v_evidence_ref, updated_at = now()
      WHERE order_ref = v_order.order_ref;
    UPDATE public.payfast_payment_intents SET intent_status = 'PAID', evidence_ref = v_evidence_ref, updated_at = now()
      WHERE id = v_intent.id;
    IF v_intent.invoice_ref IS NOT NULL THEN
      UPDATE public.finance_invoices SET invoice_status = 'PAID', paid_at = now(), evidence_ref = v_evidence_ref
        WHERE invoice_ref = v_intent.invoice_ref;
    END IF;

    INSERT INTO public.finance_ledger_entries(
      ledger_ref, candidate_ref, order_ref, invoice_ref, payment_ref, entry_type,
      debit_cents, credit_cents, currency, description, evidence_ref
    ) VALUES (
      'PAYFAST:PAYMENT_RECEIVED:' || v_merchant_ref, v_order.candidate_ref, v_order.order_ref,
      v_intent.invoice_ref, v_payment_ref, 'PAYMENT_RECEIVED', 0, v_gross,
      v_currency, 'Verified PayFast gross payment received.', v_evidence_ref
    ) ON CONFLICT (ledger_ref) DO NOTHING;
    IF v_fee > 0 THEN
      INSERT INTO public.finance_ledger_entries(
        ledger_ref, candidate_ref, order_ref, invoice_ref, payment_ref, entry_type,
        debit_cents, credit_cents, currency, description, evidence_ref
      ) VALUES (
        'PAYFAST:FEE:' || v_merchant_ref, v_order.candidate_ref, v_order.order_ref,
        v_intent.invoice_ref, v_payment_ref, 'PAYFAST_FEE', v_fee, 0,
        v_currency, 'PayFast provider fee from verified ITN.', v_evidence_ref
      ) ON CONFLICT (ledger_ref) DO NOTHING;
    END IF;
    INSERT INTO public.payment_evidence_ledger(
      evidence_ref, source_type, source_ref, candidate_ref, order_ref, payment_ref,
      event_name, event_summary, proof_payload
    ) VALUES (
      v_evidence_ref, 'PAYFAST_ITN', v_itn_ref, v_order.candidate_ref, v_order.order_ref,
      v_payment_ref, 'PAYFAST_ITN_ACCEPTED', 'PayFast ITN validated and payment/order/invoice/ledger updated atomically.',
      jsonb_build_object('merchant_reference', v_merchant_ref, 'provider_payment_id', v_provider_payment_id,
        'amount_gross_cents', v_gross, 'amount_fee_cents', v_fee, 'amount_net_cents', v_net,
        'signature_valid', p_signature_valid, 'ip_valid', p_ip_valid, 'provider_validation', p_provider_validation)
    ) ON CONFLICT (evidence_ref) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'ok', true, 'accepted', true, 'duplicate', false, 'failureRecorded', v_failure_recorded,
    'receiptId', v_receipt_id, 'orderRef', v_order.order_ref,
    'paymentRef', v_payment_ref, 'providerStatus', v_payment_status, 'evidenceRef', COALESCE(v_evidence_ref, 'PAYFAST-ITN-' || replace(v_itn_ref, 'ITN-', ''))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_payfast_itn(jsonb, boolean, boolean, boolean, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_payfast_itn(jsonb, boolean, boolean, boolean, text, text, text, text, text) TO service_role;
