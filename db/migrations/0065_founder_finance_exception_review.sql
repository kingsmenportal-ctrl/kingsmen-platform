-- 0065: founder finance exception queue and audited refund decisions.
ALTER TABLE public.finance_refund_requests
  ADD COLUMN IF NOT EXISTS review_notes text;

CREATE OR REPLACE FUNCTION public.get_founder_finance_exceptions(p_limit integer DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 200);
  v_itn jsonb;
  v_refunds jsonb;
  v_stale_orders jsonb;
  v_invoice_exceptions jsonb;
  v_payment_mismatches jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT kingsmen_security.is_founder_or_operator() THEN
    RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.received_at DESC), '[]'::jsonb) INTO v_itn
  FROM (
    SELECT id, itn_ref, merchant_reference, provider_payment_id, payment_status,
      amount_gross, amount_fee, amount_net, signature_valid, ip_valid, amount_valid,
      duplicate, accepted, rejection_reason, received_at
    FROM public.payfast_itn_receipts
    WHERE accepted = false AND duplicate = false
    ORDER BY received_at DESC LIMIT v_limit
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at ASC), '[]'::jsonb) INTO v_refunds
  FROM (
    SELECT id, refund_ref, candidate_ref, payment_ref, order_ref, amount_cents, currency,
      reason, refund_status, requested_by, reviewed_by_operator_ref, approval_ref,
      evidence_ref, created_at, reviewed_at, review_notes
    FROM public.finance_refund_requests
    WHERE refund_status IN ('PENDING_REVIEW','PROCESSING','FAILED')
    ORDER BY created_at ASC LIMIT v_limit
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at ASC), '[]'::jsonb) INTO v_stale_orders
  FROM (
    SELECT o.id, o.order_ref, o.candidate_ref, o.plan_code, o.order_status,
      o.amount_cents, o.currency, o.created_at, o.updated_at
    FROM public.finance_orders o
    WHERE o.order_status = 'PENDING_PAYMENT' AND o.created_at < now() - interval '24 hours'
    ORDER BY o.created_at ASC LIMIT v_limit
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.issued_at ASC), '[]'::jsonb) INTO v_invoice_exceptions
  FROM (
    SELECT i.id, i.invoice_ref, i.order_ref, i.candidate_ref, i.invoice_status,
      i.amount_cents, i.currency, i.issued_at, i.due_at, i.paid_at
    FROM public.finance_invoices i
    WHERE (i.invoice_status = 'OVERDUE' AND i.due_at < now())
       OR (i.invoice_status = 'OPEN' AND i.issued_at < now() - interval '24 hours')
    ORDER BY i.issued_at ASC LIMIT v_limit
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC), '[]'::jsonb) INTO v_payment_mismatches
  FROM (
    SELECT p.id, p.payment_ref, p.candidate_ref, p.order_ref, p.invoice_ref,
      p.merchant_reference, p.amount_gross_cents, p.currency, p.payment_status,
      p.verified, p.verified_at, o.order_status, i.invoice_status, p.created_at
    FROM public.finance_payments p
    LEFT JOIN public.finance_orders o ON o.order_ref = p.order_ref
    LEFT JOIN public.finance_invoices i ON i.invoice_ref = p.invoice_ref
    WHERE p.provider = 'PAYFAST' AND p.verified = true AND p.payment_status = 'COMPLETE'
      AND (o.order_status IS DISTINCT FROM 'PAID' OR (p.invoice_ref IS NOT NULL AND i.invoice_status IS DISTINCT FROM 'PAID'))
    ORDER BY p.created_at DESC LIMIT v_limit
  ) x;

  RETURN jsonb_build_object(
    'ok', true,
    'rejectedItns', v_itn,
    'refundExceptions', v_refunds,
    'staleOrders', v_stale_orders,
    'invoiceExceptions', v_invoice_exceptions,
    'paymentMismatches', v_payment_mismatches,
    'generatedAt', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.review_finance_refund_request(
  p_refund_request_id uuid,
  p_decision text,
  p_notes text DEFAULT '',
  p_evidence_url text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_refund public.finance_refund_requests%ROWTYPE;
  v_payment public.finance_payments%ROWTYPE;
  v_candidate_id uuid;
  v_prior_refunds integer := 0;
  v_event_id uuid := gen_random_uuid();
  v_correlation uuid := gen_random_uuid();
  v_approval_ref text;
  v_notes text := left(COALESCE(p_notes, ''), 2000);
BEGIN
  IF v_actor IS NULL OR NOT kingsmen_security.is_founder_or_operator() THEN
    RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_refund_request_id IS NULL OR p_decision IS NULL OR p_decision NOT IN ('APPROVE','REJECT') THEN
    RAISE EXCEPTION 'INVALID_REFUND_REVIEW_ACTION' USING ERRCODE = '22023';
  END IF;
  IF p_decision = 'APPROVE' AND (p_evidence_url IS NULL OR length(trim(v_notes)) < 8) THEN
    RAISE EXCEPTION 'REFUND_APPROVAL_EVIDENCE_AND_REASON_REQUIRED' USING ERRCODE = '22023';
  END IF;
  IF p_evidence_url IS NOT NULL AND (
    length(p_evidence_url) > 2048 OR p_evidence_url !~* '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
  ) THEN
    RAISE EXCEPTION 'INVALID_REFUND_EVIDENCE_URL' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_refund FROM public.finance_refund_requests
    WHERE id = p_refund_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REFUND_REQUEST_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF v_refund.refund_status <> 'PENDING_REVIEW' THEN
    RAISE EXCEPTION 'REFUND_REQUEST_NOT_PENDING_REVIEW' USING ERRCODE = '23514';
  END IF;
  SELECT * INTO v_payment FROM public.finance_payments
    WHERE payment_ref = v_refund.payment_ref FOR UPDATE;
  IF NOT FOUND OR v_payment.verified IS NOT TRUE OR v_payment.payment_status <> 'COMPLETE'
    OR v_refund.amount_cents <= 0 OR v_refund.amount_cents > v_payment.amount_gross_cents
  THEN
    RAISE EXCEPTION 'REFUND_NOT_BACKED_BY_VERIFIED_PAYMENT' USING ERRCODE = '23514';
  END IF;
  SELECT COALESCE(sum(amount_cents),0)::integer INTO v_prior_refunds
    FROM public.finance_refund_requests
    WHERE payment_ref = v_refund.payment_ref AND id <> p_refund_request_id
      AND refund_status IN ('APPROVED','PROCESSING','COMPLETED','REFUNDED');
  IF p_decision = 'APPROVE' AND v_prior_refunds + v_refund.amount_cents > v_payment.amount_gross_cents THEN
    RAISE EXCEPTION 'REFUND_TOTAL_EXCEEDS_VERIFIED_PAYMENT' USING ERRCODE = '23514';
  END IF;
  IF v_payment.order_ref <> v_refund.order_ref OR v_payment.candidate_ref <> v_refund.candidate_ref THEN
    RAISE EXCEPTION 'REFUND_PAYMENT_OWNERSHIP_MISMATCH' USING ERRCODE = '23514';
  END IF;

  SELECT id INTO v_candidate_id FROM public.candidates WHERE public_ref = v_refund.candidate_ref LIMIT 1;
  IF p_decision = 'APPROVE' THEN
    v_approval_ref := 'REFUND-APPROVAL-' || gen_random_uuid()::text;
    UPDATE public.finance_refund_requests
      SET refund_status = 'APPROVED',
          reviewed_by_operator_ref = v_actor::text,
          approval_ref = v_approval_ref,
          evidence_ref = COALESCE(p_evidence_url, evidence_ref),
          review_notes = v_notes,
          reviewed_at = now()
      WHERE id = p_refund_request_id;
  ELSE
    UPDATE public.finance_refund_requests
      SET refund_status = 'REJECTED',
          reviewed_by_operator_ref = v_actor::text,
          review_notes = v_notes,
          reviewed_at = now()
      WHERE id = p_refund_request_id;
  END IF;

  INSERT INTO public.audit_events(
    event_id, event_type, severity, correlation_id, actor_id, candidate_id, message, metadata
  ) VALUES (
    v_event_id,
    CASE WHEN p_decision = 'APPROVE' THEN 'FINANCE_REFUND_APPROVED' ELSE 'FINANCE_REFUND_REJECTED' END,
    'INFO', v_correlation, v_actor, v_candidate_id,
    CASE WHEN p_decision = 'APPROVE' THEN 'Founder/operator approved a refund request; payment execution remains a separate controlled step.'
         ELSE 'Founder/operator rejected a refund request.' END,
    jsonb_build_object('refund_request_id', p_refund_request_id, 'refund_ref', v_refund.refund_ref,
      'payment_ref', v_refund.payment_ref, 'order_ref', v_refund.order_ref,
      'amount_cents', v_refund.amount_cents, 'decision', p_decision,
      'approval_ref', v_approval_ref, 'evidence_url', p_evidence_url, 'notes', v_notes)
  );

  RETURN jsonb_build_object('ok', true, 'refundRequestId', p_refund_request_id,
    'decision', p_decision, 'approvalRef', v_approval_ref, 'auditEventId', v_event_id,
    'message', CASE WHEN p_decision = 'APPROVE'
      THEN 'Refund approved and audited. This does not mean money has been refunded.'
      ELSE 'Refund request rejected and audited.' END);
END;
$$;

REVOKE ALL ON FUNCTION public.get_founder_finance_exceptions(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_finance_refund_request(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_founder_finance_exceptions(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_finance_refund_request(uuid, text, text, text) TO authenticated;
