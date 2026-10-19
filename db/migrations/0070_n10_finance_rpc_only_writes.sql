-- N10 final write boundary: all finance mutations use SECURITY DEFINER RPCs.
CREATE OR REPLACE FUNCTION public.n10_record_payfast_intent(
  p_order_id uuid,
  p_candidate_id uuid,
  p_idempotency_key text
) RETURNS TABLE(payment_event_id uuid,reused boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_order public.candidate_service_orders%ROWTYPE;
  v_event public.candidate_payment_events%ROWTYPE;
BEGIN
  IF p_order_id IS NULL OR p_candidate_id IS NULL OR length(coalesce(p_idempotency_key,''))<8 THEN
    RAISE EXCEPTION 'PayFast intent inputs are invalid';
  END IF;
  SELECT * INTO v_order FROM public.candidate_service_orders AS o
    WHERE o.id=p_order_id AND o.candidate_id=p_candidate_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order does not belong to candidate'; END IF;
  IF v_order.status NOT IN ('PENDING_PAYMENT','PAYMENT_FAILED') OR v_order.currency<>'ZAR' OR v_order.amount_minor<500 THEN
    RAISE EXCEPTION 'order state or amount does not permit PayFast checkout';
  END IF;
  SELECT * INTO v_event FROM public.candidate_payment_events AS e
    WHERE e.idempotency_key=p_idempotency_key FOR UPDATE;
  IF FOUND THEN
    IF v_event.order_id<>v_order.id OR v_event.candidate_id<>v_order.candidate_id
       OR v_event.event_type<>'PAYMENT_INITIATION_REQUESTED' THEN
      RAISE EXCEPTION 'PayFast intent idempotency key belongs to a different operation';
    END IF;
    RETURN QUERY SELECT v_event.id,true;
    RETURN;
  END IF;
  INSERT INTO public.candidate_payment_events(
    event_ref,order_id,candidate_id,event_type,source,amount_minor,provider,
    provider_reference,actor_auth_user_id,idempotency_key,metadata
  ) VALUES (
    'KMPAYEVT-'||replace(gen_random_uuid()::text,'-',''),v_order.id,v_order.candidate_id,
    'PAYMENT_INITIATION_REQUESTED','SYSTEM',v_order.amount_minor,'PAYFAST',v_order.order_ref,
    NULL,p_idempotency_key,jsonb_build_object('environment','configured-server-runtime','currency','ZAR')
  ) RETURNING * INTO v_event;
  RETURN QUERY SELECT v_event.id,false;
END;
$$;
REVOKE ALL ON FUNCTION public.n10_record_payfast_intent(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.n10_record_payfast_intent(uuid,uuid,text) TO service_role;

-- Keep read access for server-rendered queues; direct writes are permitted only inside trusted RPCs.
REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.service_packages,
  public.candidate_service_orders,
  public.candidate_payment_events,
  public.candidate_refund_requests,
  public.finance_audit_events
FROM service_role;
GRANT SELECT ON TABLE
  public.service_packages,
  public.candidate_service_orders,
  public.candidate_payment_events,
  public.candidate_refund_requests,
  public.finance_audit_events
TO service_role;
