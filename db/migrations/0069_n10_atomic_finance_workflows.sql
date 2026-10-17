-- N10 database write-boundary hardening: order, refund request and finance decisions are atomic.
CREATE OR REPLACE FUNCTION public.n10_create_candidate_order(
  p_candidate_id uuid,
  p_actor_auth_user_id uuid,
  p_package_code text,
  p_idempotency_key text
) RETURNS TABLE(id uuid,order_ref text,package_code text,package_name text,currency text,amount_minor integer,status text,created_at timestamptz,reused boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_package public.service_packages%ROWTYPE;
  v_order public.candidate_service_orders%ROWTYPE;
BEGIN
  IF p_candidate_id IS NULL OR p_actor_auth_user_id IS NULL
     OR length(coalesce(p_package_code,''))<2 OR length(coalesce(p_idempotency_key,''))<8 THEN
    RAISE EXCEPTION 'candidate order inputs are invalid';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.candidate_accounts
    WHERE candidate_id=p_candidate_id AND auth_user_id=p_actor_auth_user_id AND email_verified IS TRUE) THEN
    RAISE EXCEPTION 'authenticated user is not linked to this candidate';
  END IF;
  SELECT * INTO v_order FROM public.candidate_service_orders
    WHERE candidate_id=p_candidate_id AND idempotency_key=p_idempotency_key FOR UPDATE;
  IF FOUND THEN
    IF v_order.package_code<>upper(p_package_code) THEN RAISE EXCEPTION 'idempotency key was reused for a different package'; END IF;
    RETURN QUERY SELECT v_order.id,v_order.order_ref,v_order.package_code,v_order.package_name,
      v_order.currency::text,v_order.amount_minor,v_order.status,v_order.created_at,true;
    RETURN;
  END IF;
  SELECT * INTO v_package FROM public.service_packages AS sp
    WHERE sp.package_code=upper(p_package_code) AND sp.active=true;
  IF NOT FOUND THEN RAISE EXCEPTION 'active service package not found'; END IF;

  INSERT INTO public.candidate_service_orders(
    order_ref,candidate_id,package_id,package_code,package_name,currency,amount_minor,
    entitlement_snapshot,status,idempotency_key
  ) VALUES (
    'KMORDER-'||replace(gen_random_uuid()::text,'-',''),p_candidate_id,v_package.id,
    v_package.package_code,v_package.display_name,v_package.currency,v_package.price_minor,
    v_package.entitlement_snapshot,'PENDING_PAYMENT',p_idempotency_key
  ) RETURNING * INTO v_order;

  INSERT INTO public.candidate_payment_events(
    event_ref,order_id,candidate_id,event_type,source,amount_minor,actor_auth_user_id,idempotency_key,metadata
  ) VALUES (
    'KMPAYEVT-'||replace(gen_random_uuid()::text,'-',''),v_order.id,p_candidate_id,
    'ORDER_CREATED','SYSTEM',v_order.amount_minor,p_actor_auth_user_id,'order-created:'||v_order.id::text,
    jsonb_build_object('package_code',v_order.package_code,'currency',v_order.currency)
  );
  INSERT INTO public.finance_audit_events(
    event_ref,actor_auth_user_id,actor_role,action,entity_type,entity_id,after_snapshot
  ) VALUES (
    'KMFINAUDIT-'||replace(gen_random_uuid()::text,'-',''),p_actor_auth_user_id,'CANDIDATE',
    'ORDER_CREATED','ORDER',v_order.id,
    jsonb_build_object('status',v_order.status,'amount_minor',v_order.amount_minor,'currency',v_order.currency,'package_code',v_order.package_code)
  );
  RETURN QUERY SELECT v_order.id,v_order.order_ref,v_order.package_code,v_order.package_name,
    v_order.currency,v_order.amount_minor,v_order.status,v_order.created_at,false;
END;
$$;

CREATE OR REPLACE FUNCTION public.n10_request_candidate_refund(
  p_candidate_id uuid,
  p_actor_auth_user_id uuid,
  p_order_id uuid,
  p_reason text,
  p_idempotency_key text
) RETURNS TABLE(id uuid,refund_ref text,order_id uuid,amount_minor integer,reason text,status text,created_at timestamptz,reused boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_order public.candidate_service_orders%ROWTYPE;
  v_refund public.candidate_refund_requests%ROWTYPE;
BEGIN
  IF p_candidate_id IS NULL OR p_actor_auth_user_id IS NULL OR length(coalesce(p_reason,''))<20
     OR length(p_reason)>3000 OR length(coalesce(p_idempotency_key,''))<8 THEN
    RAISE EXCEPTION 'refund request inputs are invalid';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.candidate_accounts
    WHERE candidate_id=p_candidate_id AND auth_user_id=p_actor_auth_user_id AND email_verified IS TRUE) THEN
    RAISE EXCEPTION 'authenticated user is not linked to this candidate';
  END IF;
  SELECT * INTO v_refund FROM public.candidate_refund_requests
    WHERE candidate_id=p_candidate_id AND candidate_idempotency_key=p_idempotency_key FOR UPDATE;
  IF FOUND THEN
    IF v_refund.order_id<>p_order_id THEN RAISE EXCEPTION 'refund idempotency key was reused for a different order'; END IF;
    RETURN QUERY SELECT v_refund.id,v_refund.refund_ref,v_refund.order_id,v_refund.amount_minor,
      v_refund.reason,v_refund.status,v_refund.created_at,true;
    RETURN;
  END IF;
  SELECT * INTO v_order FROM public.candidate_service_orders AS o
    WHERE o.id=p_order_id AND o.candidate_id=p_candidate_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found for candidate'; END IF;
  IF v_order.status<>'PAID' THEN RAISE EXCEPTION 'only a paid order can enter refund review'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.candidate_payment_events
    WHERE order_id=v_order.id AND candidate_id=p_candidate_id
      AND event_type='PAYMENT_CONFIRMED' AND source='VERIFIED_PROVIDER_WEBHOOK'
      AND provider='PAYFAST' AND amount_minor=v_order.amount_minor) THEN
    RAISE EXCEPTION 'verified PayFast payment required for automated refund workflow';
  END IF;

  INSERT INTO public.candidate_refund_requests(
    refund_ref,order_id,candidate_id,amount_minor,reason,status,candidate_idempotency_key
  ) VALUES (
    'KMREFUND-'||replace(gen_random_uuid()::text,'-',''),v_order.id,p_candidate_id,
    v_order.amount_minor,p_reason,'REQUESTED',p_idempotency_key
  ) RETURNING * INTO v_refund;

  UPDATE public.candidate_service_orders SET status='REFUND_REQUESTED',updated_at=now() WHERE id=v_order.id;
  INSERT INTO public.candidate_payment_events(
    event_ref,order_id,candidate_id,event_type,source,amount_minor,actor_auth_user_id,idempotency_key,metadata
  ) VALUES (
    'KMPAYEVT-'||replace(gen_random_uuid()::text,'-',''),v_order.id,p_candidate_id,
    'REFUND_REQUESTED','CANDIDATE',v_refund.amount_minor,p_actor_auth_user_id,'refund-requested:'||v_refund.id::text,
    jsonb_build_object('refund_ref',v_refund.refund_ref)
  );
  INSERT INTO public.finance_audit_events(
    event_ref,actor_auth_user_id,actor_role,action,entity_type,entity_id,reason,after_snapshot
  ) VALUES (
    'KMFINAUDIT-'||replace(gen_random_uuid()::text,'-',''),p_actor_auth_user_id,'CANDIDATE',
    'REFUND_REQUESTED','REFUND',v_refund.id,p_reason,
    jsonb_build_object('status',v_refund.status,'amount_minor',v_refund.amount_minor,'order_id',v_order.id)
  );
  RETURN QUERY SELECT v_refund.id,v_refund.refund_ref,v_refund.order_id,v_refund.amount_minor,
    v_refund.reason,v_refund.status,v_refund.created_at,false;
END;
$$;

CREATE OR REPLACE FUNCTION public.n10_confirm_manual_payment(
  p_order_id uuid,
  p_actor_auth_user_id uuid,
  p_payment_reference text,
  p_evidence_locator text,
  p_evidence_sha256 text,
  p_reason text
) RETURNS TABLE(id uuid,order_ref text,status text,amount_minor integer,currency text,reused boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_order public.candidate_service_orders%ROWTYPE;
  v_event public.candidate_payment_events%ROWTYPE;
  v_old_status text;
BEGIN
  IF p_actor_auth_user_id IS NULL OR length(coalesce(p_payment_reference,''))<1
     OR length(coalesce(p_evidence_locator,''))<1
     OR coalesce(p_evidence_sha256,'') !~ '^[a-fA-F0-9]{64}$'
     OR length(coalesce(p_reason,''))<12 THEN RAISE EXCEPTION 'manual payment evidence is incomplete'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.platform_reviewers
    WHERE auth_user_id=p_actor_auth_user_id AND is_active=true AND revoked_at IS NULL
      AND role_code IN ('FINANCE_REVIEWER','PLATFORM_ADMIN')) THEN
    RAISE EXCEPTION 'active finance reviewer role required';
  END IF;
  SELECT * INTO v_order FROM public.candidate_service_orders AS o WHERE o.id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  SELECT * INTO v_event FROM public.candidate_payment_events
    WHERE idempotency_key='manual-payment:'||v_order.id::text FOR UPDATE;
  IF FOUND THEN RETURN QUERY SELECT v_order.id,v_order.order_ref,v_order.status,v_order.amount_minor,v_order.currency,true; RETURN; END IF;
  IF v_order.status NOT IN ('PENDING_PAYMENT','PAYMENT_FAILED') THEN RAISE EXCEPTION 'order state does not permit manual review'; END IF;

  v_old_status := v_order.status;
  INSERT INTO public.candidate_payment_events(
    event_ref,order_id,candidate_id,event_type,source,amount_minor,provider_reference,
    evidence_locator,evidence_sha256,note,actor_auth_user_id,idempotency_key,metadata
  ) VALUES (
    'KMPAYEVT-'||replace(gen_random_uuid()::text,'-',''),v_order.id,v_order.candidate_id,
    'PAYMENT_CONFIRMED','FINANCE_MANUAL_REVIEW',v_order.amount_minor,p_payment_reference,
    p_evidence_locator,lower(p_evidence_sha256),p_reason,p_actor_auth_user_id,
    'manual-payment:'||v_order.id::text,jsonb_build_object('manual_review_only',true)
  );
  UPDATE public.candidate_service_orders SET status='PAID',paid_at=now(),updated_at=now()
    WHERE id=v_order.id RETURNING * INTO v_order;
  INSERT INTO public.finance_audit_events(
    event_ref,actor_auth_user_id,actor_role,action,entity_type,entity_id,before_snapshot,after_snapshot,reason
  ) VALUES (
    'KMFINAUDIT-'||replace(gen_random_uuid()::text,'-',''),p_actor_auth_user_id,
    CASE WHEN EXISTS(SELECT 1 FROM public.platform_reviewers WHERE auth_user_id=p_actor_auth_user_id AND role_code='PLATFORM_ADMIN' AND is_active=true AND revoked_at IS NULL) THEN 'PLATFORM_ADMIN' ELSE 'FINANCE_REVIEWER' END,
    'MANUAL_PAYMENT_CONFIRMED','ORDER',v_order.id,
    jsonb_build_object('status',v_old_status),
    jsonb_build_object('status','PAID','payment_reference',p_payment_reference,'evidence_sha256',lower(p_evidence_sha256)),p_reason
  );
  RETURN QUERY SELECT v_order.id,v_order.order_ref,v_order.status,v_order.amount_minor,v_order.currency,false;
END;
$$;

CREATE OR REPLACE FUNCTION public.n10_review_refund_request(
  p_refund_id uuid,
  p_actor_auth_user_id uuid,
  p_decision text,
  p_reason text
) RETURNS TABLE(id uuid,refund_ref text,order_id uuid,status text,reused boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_refund public.candidate_refund_requests%ROWTYPE;
  v_order public.candidate_service_orders%ROWTYPE;
  v_status text;
  v_event_type text;
  v_actor_role text;
  v_old_status text;
BEGIN
  IF p_decision NOT IN ('APPROVE','REJECT') OR length(coalesce(p_reason,''))<12 OR length(p_reason)>2000 THEN
    RAISE EXCEPTION 'refund decision or reason is invalid';
  END IF;
  SELECT role_code INTO v_actor_role FROM public.platform_reviewers
    WHERE auth_user_id=p_actor_auth_user_id AND is_active=true AND revoked_at IS NULL
      AND role_code IN ('FINANCE_REVIEWER','PLATFORM_ADMIN') LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'active finance reviewer role required'; END IF;
  SELECT * INTO v_refund FROM public.candidate_refund_requests AS r WHERE r.id=p_refund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'refund request not found'; END IF;
  SELECT * INTO v_order FROM public.candidate_service_orders AS o WHERE o.id=v_refund.order_id FOR UPDATE;
  IF v_refund.status IN ('APPROVED','REJECTED') THEN
    IF (p_decision='APPROVE' AND v_refund.status='APPROVED') OR (p_decision='REJECT' AND v_refund.status='REJECTED') THEN
      RETURN QUERY SELECT v_refund.id,v_refund.refund_ref,v_refund.order_id,v_refund.status,true;
      RETURN;
    END IF;
    RAISE EXCEPTION 'refund decision conflicts with current state';
  END IF;
  IF v_refund.status NOT IN ('REQUESTED','UNDER_REVIEW') THEN RAISE EXCEPTION 'refund state does not permit review'; END IF;
  v_old_status := v_refund.status;
  v_status := CASE WHEN p_decision='APPROVE' THEN 'APPROVED' ELSE 'REJECTED' END;
  v_event_type := CASE WHEN p_decision='APPROVE' THEN 'REFUND_APPROVED' ELSE 'REFUND_REJECTED' END;
  UPDATE public.candidate_refund_requests SET status=v_status,reviewer_auth_user_id=p_actor_auth_user_id,
    reviewer_note=p_reason,reviewed_at=now(),updated_at=now() WHERE id=v_refund.id RETURNING * INTO v_refund;
  IF p_decision='REJECT' THEN
    UPDATE public.candidate_service_orders SET status='PAID',updated_at=now() WHERE id=v_order.id;
  END IF;
  INSERT INTO public.candidate_payment_events(
    event_ref,order_id,candidate_id,event_type,source,amount_minor,actor_auth_user_id,note,idempotency_key,metadata
  ) VALUES (
    'KMPAYEVT-'||replace(gen_random_uuid()::text,'-',''),v_order.id,v_order.candidate_id,
    v_event_type,'FINANCE_MANUAL_REVIEW',v_refund.amount_minor,p_actor_auth_user_id,p_reason,
    'refund-review:'||v_refund.id::text||':'||lower(p_decision),jsonb_build_object('refund_ref',v_refund.refund_ref)
  );
  INSERT INTO public.finance_audit_events(
    event_ref,actor_auth_user_id,actor_role,action,entity_type,entity_id,before_snapshot,after_snapshot,reason
  ) VALUES (
    'KMFINAUDIT-'||replace(gen_random_uuid()::text,'-',''),p_actor_auth_user_id,v_actor_role,
    'REFUND_'||v_status,'REFUND',v_refund.id,jsonb_build_object('status',v_old_status),
    jsonb_build_object('status',v_status),p_reason
  );
  RETURN QUERY SELECT v_refund.id,v_refund.refund_ref,v_refund.order_id,v_refund.status,false;
END;
$$;

REVOKE ALL ON FUNCTION public.n10_create_candidate_order(uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.n10_request_candidate_refund(uuid,uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.n10_confirm_manual_payment(uuid,uuid,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.n10_review_refund_request(uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.n10_create_candidate_order(uuid,uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.n10_request_candidate_refund(uuid,uuid,uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.n10_confirm_manual_payment(uuid,uuid,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.n10_review_refund_request(uuid,uuid,text,text) TO service_role;
