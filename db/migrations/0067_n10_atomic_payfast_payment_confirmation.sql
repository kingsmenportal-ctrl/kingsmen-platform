-- N10: atomic, idempotent persistence for a server-verified PayFast ITN.
-- This function does not validate a request itself. The caller must first validate signature,
-- trusted source IP, exact order/amount/currency, and PayFast's /eng/query/validate response.
CREATE UNIQUE INDEX IF NOT EXISTS idx_n10_payfast_provider_event_unique
  ON public.candidate_payment_events(provider,provider_event_id)
  WHERE provider='PAYFAST' AND provider_event_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.n10_record_verified_payfast_payment(
  p_order_id uuid,
  p_merchant_reference text,
  p_provider_payment_id text,
  p_amount_minor integer,
  p_payload_sha256 text,
  p_idempotency_key text,
  p_server_validation text
) RETURNS TABLE(payment_event_id uuid, order_status text, reused boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_order public.candidate_service_orders%ROWTYPE;
  v_event public.candidate_payment_events%ROWTYPE;
BEGIN
  IF p_server_validation IS DISTINCT FROM 'VALID'
     OR p_amount_minor IS NULL OR p_amount_minor < 1
     OR coalesce(p_provider_payment_id,'') = ''
     OR coalesce(p_idempotency_key,'') = ''
     OR coalesce(p_payload_sha256,'') !~ '^[a-fA-F0-9]{64}$' THEN
    RAISE EXCEPTION 'verified PayFast fields are invalid';
  END IF;

  SELECT * INTO v_order FROM public.candidate_service_orders
    WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF v_order.order_ref IS DISTINCT FROM p_merchant_reference
     OR v_order.currency <> 'ZAR'
     OR v_order.amount_minor IS DISTINCT FROM p_amount_minor THEN
    RAISE EXCEPTION 'PayFast merchant reference, currency or amount does not match the order';
  END IF;

  SELECT * INTO v_event FROM public.candidate_payment_events
    WHERE idempotency_key=p_idempotency_key FOR UPDATE;
  IF NOT FOUND THEN
    SELECT * INTO v_event FROM public.candidate_payment_events
      WHERE provider='PAYFAST' AND provider_event_id=p_provider_payment_id FOR UPDATE;
  END IF;
  IF FOUND THEN
    IF v_event.order_id IS DISTINCT FROM v_order.id
       OR v_event.candidate_id IS DISTINCT FROM v_order.candidate_id
       OR v_event.event_type <> 'PAYMENT_CONFIRMED'
       OR v_event.source <> 'VERIFIED_PROVIDER_WEBHOOK'
       OR v_event.amount_minor IS DISTINCT FROM p_amount_minor THEN
      RAISE EXCEPTION 'PayFast event identifier was already used for a different payment';
    END IF;
    IF v_order.status <> 'PAID' THEN
      UPDATE public.candidate_service_orders SET status='PAID',paid_at=coalesce(paid_at,now()),updated_at=now()
        WHERE id=v_order.id;
    END IF;
    RETURN QUERY SELECT v_event.id,'PAID'::text,true;
    RETURN;
  END IF;

  IF v_order.status NOT IN ('PENDING_PAYMENT','PAYMENT_FAILED') THEN
    RAISE EXCEPTION 'order state does not permit first-time PayFast confirmation';
  END IF;

  INSERT INTO public.candidate_payment_events(
    event_ref,order_id,candidate_id,event_type,source,amount_minor,provider,
    provider_event_id,provider_reference,idempotency_key,metadata
  ) VALUES (
    'KMPAYEVT-'||replace(gen_random_uuid()::text,'-',''),v_order.id,v_order.candidate_id,
    'PAYMENT_CONFIRMED','VERIFIED_PROVIDER_WEBHOOK',p_amount_minor,'PAYFAST',
    p_provider_payment_id,p_provider_payment_id,p_idempotency_key,
    jsonb_build_object(
      'merchant_reference',p_merchant_reference,
      'provider_status','COMPLETE',
      'server_validation','VALID',
      'currency','ZAR',
      'payload_sha256',lower(p_payload_sha256)
    )
  ) RETURNING * INTO v_event;

  UPDATE public.candidate_service_orders SET status='PAID',paid_at=coalesce(paid_at,now()),updated_at=now()
    WHERE id=v_order.id;

  RETURN QUERY SELECT v_event.id,'PAID'::text,false;
END;
$$;

REVOKE ALL ON FUNCTION public.n10_record_verified_payfast_payment(uuid,text,text,integer,text,text,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.n10_record_verified_payfast_payment(uuid,text,text,integer,text,text,text)
  TO service_role;
