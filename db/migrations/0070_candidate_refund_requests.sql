-- 0070: candidate refund requests backed by verified payments; approval and execution stay separate.
CREATE OR REPLACE FUNCTION public.request_candidate_refund(
  p_auth_user_id uuid,
  p_candidate_id uuid,
  p_payment_ref text,
  p_amount_cents integer,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment public.finance_payments%ROWTYPE;
  v_candidate_ref text;
  v_candidate public.candidates%ROWTYPE;
  v_prior_refunds integer := 0;
  v_refund_id uuid := gen_random_uuid();
  v_refund_ref text := 'REF-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16));
  v_event_id uuid := gen_random_uuid();
  v_correlation uuid := gen_random_uuid();
  v_reason text := left(trim(COALESCE(p_reason,'')), 1000);
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'SERVER_SIDE_REFUND_PROCESSOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_auth_user_id IS NULL OR p_candidate_id IS NULL OR p_payment_ref IS NULL
    OR p_amount_cents IS NULL OR p_amount_cents <= 0 OR length(v_reason) < 10
  THEN
    RAISE EXCEPTION 'INVALID_REFUND_REQUEST' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_candidate FROM public.candidates WHERE id = p_candidate_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE = '42501'; END IF;
  v_candidate_ref := v_candidate.public_ref;
  IF NOT EXISTS (
    SELECT 1 FROM public.candidate_accounts ca
    JOIN public.candidate_auth_identity_links l ON l.candidate_id = ca.candidate_id
    WHERE ca.candidate_id = p_candidate_id AND ca.auth_user_id = p_auth_user_id
      AND ca.auth_status = 'ACTIVE' AND ca.email_verified = true
      AND ca.account_recovery_required = false
      AND l.supabase_user_id = p_auth_user_id AND l.link_status = 'VERIFIED'
      AND l.verified_at IS NOT NULL AND l.verified_by IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'VERIFIED_ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_payment FROM public.finance_payments
    WHERE payment_ref = p_payment_ref AND candidate_ref = v_candidate_ref
    FOR UPDATE;
  IF NOT FOUND OR v_payment.verified IS NOT TRUE OR v_payment.payment_status <> 'COMPLETE'
    OR v_payment.provider <> 'PAYFAST' OR v_payment.amount_gross_cents <= 0
  THEN
    RAISE EXCEPTION 'REFUND_REQUIRES_VERIFIED_PAYFAST_PAYMENT' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.finance_orders o
    WHERE o.order_ref = v_payment.order_ref AND o.candidate_ref = v_candidate_ref
      AND o.order_status = 'PAID'
  ) THEN
    RAISE EXCEPTION 'REFUND_ORDER_NOT_SETTLED' USING ERRCODE = '23514';
  END IF;

  SELECT COALESCE(sum(amount_cents),0)::integer INTO v_prior_refunds
    FROM public.finance_refund_requests
    WHERE payment_ref = p_payment_ref
      AND refund_status IN ('PENDING_REVIEW','APPROVED','PROCESSING','COMPLETED','REFUNDED');
  IF v_prior_refunds + p_amount_cents > v_payment.amount_gross_cents THEN
    RAISE EXCEPTION 'REFUND_TOTAL_EXCEEDS_PAYMENT_GROSS' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.finance_refund_requests(
    id, refund_ref, candidate_ref, payment_ref, order_ref, amount_cents, currency,
    reason, refund_status, requested_by, created_at
  ) VALUES (
    v_refund_id, v_refund_ref, v_candidate_ref, p_payment_ref, v_payment.order_ref,
    p_amount_cents, v_payment.currency, v_reason, 'PENDING_REVIEW', p_auth_user_id::text, now()
  );

  INSERT INTO public.audit_events(
    event_id, event_type, severity, correlation_id, actor_id, candidate_id, message, metadata
  ) VALUES (
    v_event_id, 'CANDIDATE_REFUND_REQUESTED', 'INFO', v_correlation, p_auth_user_id, p_candidate_id,
    'Candidate requested a refund against a verified PayFast payment; no money was moved.',
    jsonb_build_object('refund_request_id', v_refund_id, 'refund_ref', v_refund_ref,
      'payment_ref', p_payment_ref, 'order_ref', v_payment.order_ref,
      'amount_cents', p_amount_cents, 'currency', v_payment.currency)
  );

  RETURN jsonb_build_object('ok', true, 'refundRequestId', v_refund_id,
    'refundRef', v_refund_ref, 'refundStatus', 'PENDING_REVIEW',
    'auditEventId', v_event_id, 'message', 'Refund request saved for authorised finance review. No refund has been executed.');
END;
$$;

REVOKE ALL ON FUNCTION public.request_candidate_refund(uuid, uuid, text, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_candidate_refund(uuid, uuid, text, integer, text) TO service_role;
