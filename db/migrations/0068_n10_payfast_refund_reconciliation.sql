-- N10: durable, atomic refund execution claim and provider-ledger reconciliation.
ALTER TABLE public.candidate_refund_requests DROP CONSTRAINT IF EXISTS candidate_refund_requests_status_check;
ALTER TABLE public.candidate_refund_requests ADD CONSTRAINT candidate_refund_requests_status_check
  CHECK(status IN ('REQUESTED','UNDER_REVIEW','APPROVED','PROCESSING','REJECTED','COMPLETED'));

CREATE OR REPLACE FUNCTION public.n10_claim_payfast_refund(
  p_refund_id uuid,
  p_actor_auth_user_id uuid,
  p_idempotency_key text
) RETURNS TABLE(refund_id uuid, refund_status text, claimed boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_refund public.candidate_refund_requests%ROWTYPE;
  v_order public.candidate_service_orders%ROWTYPE;
  v_payment public.candidate_payment_events%ROWTYPE;
  v_event public.candidate_payment_events%ROWTYPE;
BEGIN
  SELECT * INTO v_refund FROM public.candidate_refund_requests WHERE id=p_refund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'refund request not found'; END IF;
  SELECT * INTO v_order FROM public.candidate_service_orders WHERE id=v_refund.order_id FOR UPDATE;
  SELECT * INTO v_payment FROM public.candidate_payment_events
    WHERE order_id=v_order.id AND event_type='PAYMENT_CONFIRMED'
      AND source='VERIFIED_PROVIDER_WEBHOOK' AND provider='PAYFAST'
    ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND OR coalesce(v_payment.provider_reference,'')='' THEN
    RAISE EXCEPTION 'verified PayFast payment event required before refund execution';
  END IF;

  SELECT * INTO v_event FROM public.candidate_payment_events WHERE idempotency_key=p_idempotency_key;
  IF FOUND THEN
    RETURN QUERY SELECT v_refund.id,v_refund.status,false;
    RETURN;
  END IF;
  IF v_refund.status <> 'APPROVED' THEN
    RAISE EXCEPTION 'refund must be approved and not previously claimed';
  END IF;
  IF v_refund.amount_minor <= 0 OR v_refund.amount_minor > v_order.amount_minor THEN
    RAISE EXCEPTION 'refund amount is outside the order value';
  END IF;

  UPDATE public.candidate_refund_requests SET status='PROCESSING',
    reviewer_auth_user_id=p_actor_auth_user_id,reviewed_at=coalesce(reviewed_at,now()),updated_at=now()
    WHERE id=v_refund.id RETURNING * INTO v_refund;
  INSERT INTO public.candidate_payment_events(
    event_ref,order_id,candidate_id,event_type,source,amount_minor,provider,
    provider_reference,evidence_locator,note,actor_auth_user_id,idempotency_key,metadata
  ) VALUES (
    'KMPAYEVT-'||replace(gen_random_uuid()::text,'-',''),v_order.id,v_order.candidate_id,
    'REFUND_APPROVED','FINANCE_MANUAL_REVIEW',v_refund.amount_minor,'PAYFAST',
    v_payment.provider_reference,'payfast-api:/refunds/query/'||v_payment.provider_reference,
    'Refund execution claimed once after human approval.',p_actor_auth_user_id,p_idempotency_key,
    jsonb_build_object('refund_ref',v_refund.refund_ref,'execution_claimed',true)
  );
  RETURN QUERY SELECT v_refund.id,'PROCESSING'::text,true;
END;
$$;

CREATE OR REPLACE FUNCTION public.n10_record_payfast_refund_reconciliation(
  p_refund_id uuid,
  p_actor_auth_user_id uuid,
  p_provider_payment_id text,
  p_reconciled_total_minor integer,
  p_evidence_sha256 text,
  p_idempotency_key text
) RETURNS TABLE(refund_id uuid, refund_status text, order_status text, reused boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_refund public.candidate_refund_requests%ROWTYPE;
  v_order public.candidate_service_orders%ROWTYPE;
  v_payment public.candidate_payment_events%ROWTYPE;
  v_existing public.candidate_payment_events%ROWTYPE;
  v_previously_refunded integer;
  v_new_status text;
BEGIN
  IF coalesce(p_provider_payment_id,'')='' OR p_reconciled_total_minor IS NULL OR p_reconciled_total_minor<0
     OR coalesce(p_evidence_sha256,'') !~ '^[a-fA-F0-9]{64}$'
     OR coalesce(p_idempotency_key,'')='' THEN
    RAISE EXCEPTION 'provider refund reconciliation evidence is invalid';
  END IF;
  SELECT * INTO v_refund FROM public.candidate_refund_requests WHERE id=p_refund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'refund request not found'; END IF;
  SELECT * INTO v_order FROM public.candidate_service_orders WHERE id=v_refund.order_id FOR UPDATE;
  SELECT * INTO v_payment FROM public.candidate_payment_events
    WHERE order_id=v_order.id AND event_type='PAYMENT_CONFIRMED'
      AND source='VERIFIED_PROVIDER_WEBHOOK' AND provider='PAYFAST'
      AND provider_reference=p_provider_payment_id
    ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'matching verified PayFast payment event not found'; END IF;

  SELECT * INTO v_existing FROM public.candidate_payment_events WHERE idempotency_key=p_idempotency_key;
  IF FOUND THEN
    RETURN QUERY SELECT v_refund.id,v_refund.status,v_order.status,true;
    RETURN;
  END IF;
  IF v_refund.status <> 'PROCESSING' THEN
    IF v_refund.status='COMPLETED' THEN
      RETURN QUERY SELECT v_refund.id,v_refund.status,v_order.status,true;
      RETURN;
    END IF;
    RAISE EXCEPTION 'refund must be claimed for execution before reconciliation';
  END IF;
  IF v_refund.amount_minor > v_order.amount_minor THEN RAISE EXCEPTION 'refund amount exceeds order amount'; END IF;
  SELECT coalesce(sum(amount_minor),0)::integer INTO v_previously_refunded
    FROM public.candidate_payment_events
    WHERE order_id=v_order.id AND event_type='REFUND_COMPLETED'
      AND source='VERIFIED_PROVIDER_WEBHOOK' AND provider='PAYFAST';
  IF p_reconciled_total_minor < v_previously_refunded + v_refund.amount_minor
     OR p_reconciled_total_minor > v_order.amount_minor THEN
    RAISE EXCEPTION 'provider refund ledger does not reconcile to expected cumulative total';
  END IF;

  INSERT INTO public.candidate_payment_events(
    event_ref,order_id,candidate_id,event_type,source,amount_minor,provider,
    provider_event_id,provider_reference,evidence_locator,evidence_sha256,note,
    actor_auth_user_id,idempotency_key,metadata
  ) VALUES (
    'KMPAYEVT-'||replace(gen_random_uuid()::text,'-',''),v_order.id,v_order.candidate_id,
    'REFUND_COMPLETED','VERIFIED_PROVIDER_WEBHOOK',v_refund.amount_minor,'PAYFAST',
    'refund:'||p_provider_payment_id||':'||v_refund.refund_ref,p_provider_payment_id,
    'payfast-api:/refunds/'||p_provider_payment_id,lower(p_evidence_sha256),
    'PayFast refund ledger verified after provider execution.',p_actor_auth_user_id,p_idempotency_key,
    jsonb_build_object('refund_ref',v_refund.refund_ref,'reconciled_total_minor',p_reconciled_total_minor,'currency','ZAR')
  );

  UPDATE public.candidate_refund_requests SET status='COMPLETED',completed_at=now(),updated_at=now()
    WHERE id=v_refund.id;
  IF p_reconciled_total_minor >= v_order.amount_minor THEN
    v_new_status := 'REFUNDED';
  ELSE
    v_new_status := 'PARTIALLY_REFUNDED';
  END IF;
  UPDATE public.candidate_service_orders SET status=v_new_status,updated_at=now()
    WHERE id=v_order.id;
  INSERT INTO public.finance_audit_events(
    event_ref,actor_auth_user_id,actor_role,action,entity_type,entity_id,
    before_snapshot,after_snapshot,reason
  ) VALUES (
    'KMFINAUDIT-'||replace(gen_random_uuid()::text,'-',''),p_actor_auth_user_id,'FINANCE_REVIEWER',
    'PAYFAST_REFUND_RECONCILED','REFUND',v_refund.id,
    jsonb_build_object('refund_status',v_refund.status,'order_status',v_order.status),
    jsonb_build_object('refund_status','COMPLETED','order_status',v_new_status,'reconciled_total_minor',p_reconciled_total_minor),
    'PayFast refund provider ledger was checked and reconciled.'
  );
  RETURN QUERY SELECT v_refund.id,'COMPLETED'::text,v_new_status,false;
END;
$$;

REVOKE ALL ON FUNCTION public.n10_claim_payfast_refund(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.n10_record_payfast_refund_reconciliation(uuid,uuid,text,integer,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.n10_claim_payfast_refund(uuid,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.n10_record_payfast_refund_reconciliation(uuid,uuid,text,integer,text,text) TO service_role;
