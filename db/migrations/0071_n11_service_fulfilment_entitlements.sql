-- N11 Service Fulfilment & Entitlement Management.
-- Ordered after N10 migrations 0067-0070. Do not apply to staging until N10 release gates pass.
CREATE TABLE IF NOT EXISTS public.candidate_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entitlement_ref text NOT NULL UNIQUE,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL UNIQUE REFERENCES public.candidate_service_orders(id) ON DELETE RESTRICT,
  package_code text NOT NULL,
  entitlement_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'ON_HOLD' CHECK (status IN ('ON_HOLD','ACTIVE','REVOKED')),
  financial_event_id uuid REFERENCES public.candidate_payment_events(id) ON DELETE RESTRICT,
  grant_idempotency_key text NOT NULL UNIQUE,
  hold_reason text,
  granted_at timestamptz,
  held_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'ACTIVE' OR (financial_event_id IS NOT NULL AND granted_at IS NOT NULL)),
  CHECK (status <> 'REVOKED' OR revoked_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_n11_entitlements_candidate_status
  ON public.candidate_entitlements(candidate_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n11_entitlements_order_status
  ON public.candidate_entitlements(order_id,status);

CREATE TABLE IF NOT EXISTS public.candidate_entitlement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_ref text NOT NULL UNIQUE,
  entitlement_id uuid NOT NULL REFERENCES public.candidate_entitlements(id) ON DELETE RESTRICT,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL REFERENCES public.candidate_service_orders(id) ON DELETE RESTRICT,
  financial_event_id uuid REFERENCES public.candidate_payment_events(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN ('HOLD_PLACED','GRANTED','HOLD_RELEASED','REVOKED')),
  from_status text CHECK (from_status IS NULL OR from_status IN ('ON_HOLD','ACTIVE','REVOKED')),
  to_status text NOT NULL CHECK (to_status IN ('ON_HOLD','ACTIVE','REVOKED')),
  actor_type text NOT NULL CHECK (actor_type IN ('SYSTEM','FINANCE_REVIEWER','PLATFORM_ADMIN')),
  actor_auth_user_id uuid,
  idempotency_key text NOT NULL UNIQUE,
  reason text NOT NULL CHECK (length(reason) BETWEEN 12 AND 2000),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_n11_entitlement_events_order
  ON public.candidate_entitlement_events(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n11_entitlement_events_candidate
  ON public.candidate_entitlement_events(candidate_id,created_at DESC);

ALTER TABLE public.candidate_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_entitlement_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.candidate_entitlements, public.candidate_entitlement_events
  FROM PUBLIC, anon, authenticated, service_role;
-- All mutations go through the audited SECURITY DEFINER transition functions below.
GRANT SELECT ON TABLE public.candidate_entitlements, public.candidate_entitlement_events TO service_role;

-- Service-role reads are explicit; no direct candidate/anonymous table access is granted.
DROP POLICY IF EXISTS candidate_entitlements_service_role_read ON public.candidate_entitlements;
CREATE POLICY candidate_entitlements_service_role_read
  ON public.candidate_entitlements FOR SELECT TO service_role USING (true);
DROP POLICY IF EXISTS candidate_entitlement_events_service_role_read ON public.candidate_entitlement_events;
CREATE POLICY candidate_entitlement_events_service_role_read
  ON public.candidate_entitlement_events FOR SELECT TO service_role USING (true);

CREATE OR REPLACE FUNCTION public.n11_prevent_entitlement_event_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'entitlement events are immutable';
END;
$$;
DROP TRIGGER IF EXISTS n11_entitlement_events_immutable ON public.candidate_entitlement_events;
CREATE TRIGGER n11_entitlement_events_immutable
BEFORE UPDATE OR DELETE ON public.candidate_entitlement_events
FOR EACH ROW EXECUTE FUNCTION public.n11_prevent_entitlement_event_mutation();
REVOKE ALL ON FUNCTION public.n11_prevent_entitlement_event_mutation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.n11_prevent_entitlement_event_mutation() TO service_role;

-- A hold may be recorded before payment, but it never activates paid service.
CREATE OR REPLACE FUNCTION public.n11_hold_entitlement_for_order(
  p_order_id uuid,
  p_actor_type text,
  p_actor_auth_user_id uuid,
  p_reason text,
  p_idempotency_key text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $
DECLARE
  v_order public.candidate_service_orders%ROWTYPE;
  v_ent public.candidate_entitlements%ROWTYPE;
  v_existing_event uuid;
BEGIN
  IF p_actor_type NOT IN ('SYSTEM','FINANCE_REVIEWER','PLATFORM_ADMIN')
     OR length(coalesce(p_reason,'')) < 12 OR length(p_reason) > 2000
     OR length(coalesce(p_idempotency_key,'')) < 8 THEN
    RAISE EXCEPTION 'invalid hold actor, reason or idempotency key';
  END IF;
  SELECT * INTO v_order FROM public.candidate_service_orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  SELECT id INTO v_existing_event FROM public.candidate_entitlement_events
    WHERE idempotency_key=p_idempotency_key;
  IF FOUND THEN
    SELECT * INTO v_ent FROM public.candidate_entitlements WHERE id=(SELECT entitlement_id FROM public.candidate_entitlement_events WHERE id=v_existing_event);
    IF v_ent.order_id <> p_order_id OR EXISTS (
      SELECT 1 FROM public.candidate_entitlement_events
      WHERE id=v_existing_event AND event_type <> 'HOLD_PLACED'
    ) THEN RAISE EXCEPTION 'hold idempotency key was reused for a different operation'; END IF;
    RETURN v_ent.id;
  END IF;
  SELECT * INTO v_ent FROM public.candidate_entitlements WHERE order_id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.candidate_entitlements(
      entitlement_ref,candidate_id,order_id,package_code,entitlement_snapshot,status,
      grant_idempotency_key,hold_reason,held_at
    ) VALUES (
      'KMENT-'||replace(gen_random_uuid()::text,'-',''),v_order.candidate_id,v_order.id,
      v_order.package_code,v_order.entitlement_snapshot,'ON_HOLD',
      'n11-pending-grant:'||p_order_id::text,p_reason,now()
    ) RETURNING * INTO v_ent;
    INSERT INTO public.candidate_entitlement_events(
      event_ref,entitlement_id,candidate_id,order_id,event_type,from_status,to_status,
      actor_type,actor_auth_user_id,idempotency_key,reason,metadata
    ) VALUES (
      'KMENTEVT-'||replace(gen_random_uuid()::text,'-',''),v_ent.id,v_order.candidate_id,v_order.id,
      'HOLD_PLACED',NULL,'ON_HOLD',p_actor_type,p_actor_auth_user_id,p_idempotency_key,p_reason,
      jsonb_build_object('order_status_at_hold',v_order.status)
    );
    RETURN v_ent.id;
  END IF;
  IF v_ent.status='REVOKED' THEN RAISE EXCEPTION 'revoked entitlement cannot be held or reactivated'; END IF;
  IF v_ent.status='ACTIVE' THEN
    UPDATE public.candidate_entitlements SET status='ON_HOLD',hold_reason=p_reason,held_at=now(),updated_at=now()
      WHERE id=v_ent.id RETURNING * INTO v_ent;
    INSERT INTO public.candidate_entitlement_events(
      event_ref,entitlement_id,candidate_id,order_id,financial_event_id,event_type,from_status,to_status,
      actor_type,actor_auth_user_id,idempotency_key,reason
    ) VALUES (
      'KMENTEVT-'||replace(gen_random_uuid()::text,'-',''),v_ent.id,v_ent.candidate_id,v_ent.order_id,
      v_ent.financial_event_id,'HOLD_PLACED','ACTIVE','ON_HOLD',p_actor_type,p_actor_auth_user_id,p_idempotency_key,p_reason
    );
  ELSE
    INSERT INTO public.candidate_entitlement_events(
      event_ref,entitlement_id,candidate_id,order_id,event_type,from_status,to_status,
      actor_type,actor_auth_user_id,idempotency_key,reason
    ) VALUES (
      'KMENTEVT-'||replace(gen_random_uuid()::text,'-',''),v_ent.id,v_ent.candidate_id,v_ent.order_id,
      'HOLD_PLACED','ON_HOLD','ON_HOLD',p_actor_type,p_actor_auth_user_id,p_idempotency_key,p_reason
    );
  END IF;
  RETURN v_ent.id;
END;
$$;

-- Only a server-verified PayFast event can activate an entitlement.
CREATE OR REPLACE FUNCTION public.n11_grant_entitlement(
  p_order_id uuid,
  p_financial_event_id uuid,
  p_actor_type text,
  p_actor_auth_user_id uuid,
  p_reason text,
  p_idempotency_key text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $
DECLARE
  v_order public.candidate_service_orders%ROWTYPE;
  v_payment public.candidate_payment_events%ROWTYPE;
  v_ent public.candidate_entitlements%ROWTYPE;
  v_existing_event uuid;
  v_from_status text;
BEGIN
  IF p_actor_type NOT IN ('SYSTEM','FINANCE_REVIEWER','PLATFORM_ADMIN')
     OR length(coalesce(p_reason,'')) < 12 OR length(p_reason) > 2000
     OR length(coalesce(p_idempotency_key,'')) < 8 THEN
    RAISE EXCEPTION 'invalid grant actor, reason or idempotency key';
  END IF;
  SELECT * INTO v_order FROM public.candidate_service_orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  SELECT * INTO v_payment FROM public.candidate_payment_events
    WHERE id=p_financial_event_id AND order_id=p_order_id AND candidate_id=v_order.candidate_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'financial event does not belong to this order and candidate'; END IF;
  IF v_order.status <> 'PAID'
     OR v_payment.event_type <> 'PAYMENT_CONFIRMED'
     OR v_payment.source <> 'VERIFIED_PROVIDER_WEBHOOK'
     OR upper(coalesce(v_payment.provider,'')) <> 'PAYFAST'
     OR coalesce(v_payment.provider_reference,'') = ''
     OR v_payment.amount_minor IS DISTINCT FROM v_order.amount_minor
     OR coalesce(v_payment.metadata->>'merchant_reference','') <> v_order.order_ref
     OR coalesce(v_payment.metadata->>'provider_status','') <> 'COMPLETE'
     OR coalesce(v_payment.metadata->>'server_validation','') <> 'VALID' THEN
    RAISE EXCEPTION 'verified PayFast financial event required; order creation or manual evidence cannot grant entitlement';
  END IF;
  SELECT id INTO v_existing_event FROM public.candidate_entitlement_events
    WHERE idempotency_key=p_idempotency_key;
  IF FOUND THEN
    SELECT * INTO v_ent FROM public.candidate_entitlements WHERE id=(SELECT entitlement_id FROM public.candidate_entitlement_events WHERE id=v_existing_event);
    IF v_ent.order_id <> p_order_id OR EXISTS (
      SELECT 1 FROM public.candidate_entitlement_events
      WHERE id=v_existing_event AND (event_type NOT IN ('GRANTED','HOLD_RELEASED') OR financial_event_id IS DISTINCT FROM p_financial_event_id)
    ) THEN RAISE EXCEPTION 'grant idempotency key was reused for a different operation'; END IF;
    RETURN v_ent.id;
  END IF;
  SELECT * INTO v_ent FROM public.candidate_entitlements WHERE order_id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.candidate_entitlements(
      entitlement_ref,candidate_id,order_id,package_code,entitlement_snapshot,status,
      financial_event_id,grant_idempotency_key,granted_at,held_at
    ) VALUES (
      'KMENT-'||replace(gen_random_uuid()::text,'-',''),v_order.candidate_id,v_order.id,
      v_order.package_code,v_order.entitlement_snapshot,'ACTIVE',v_payment.id,
      p_idempotency_key,now(),now()
    ) RETURNING * INTO v_ent;
    INSERT INTO public.candidate_entitlement_events(
      event_ref,entitlement_id,candidate_id,order_id,financial_event_id,event_type,from_status,to_status,
      actor_type,actor_auth_user_id,idempotency_key,reason,metadata
    ) VALUES (
      'KMENTEVT-'||replace(gen_random_uuid()::text,'-',''),v_ent.id,v_ent.candidate_id,v_ent.order_id,
      v_payment.id,'GRANTED',NULL,'ACTIVE',p_actor_type,p_actor_auth_user_id,p_idempotency_key,p_reason,
      jsonb_build_object('provider','PAYFAST','provider_reference',v_payment.provider_reference)
    );
    RETURN v_ent.id;
  END IF;
  IF v_ent.status='REVOKED' THEN RAISE EXCEPTION 'revoked entitlement cannot be reactivated'; END IF;
  IF v_ent.status='ACTIVE' THEN
    RETURN v_ent.id;
  END IF;
  v_from_status := v_ent.status;
  UPDATE public.candidate_entitlements SET status='ACTIVE',financial_event_id=v_payment.id,
    grant_idempotency_key=p_idempotency_key,granted_at=now(),hold_reason=NULL,updated_at=now() WHERE id=v_ent.id RETURNING * INTO v_ent;
  INSERT INTO public.candidate_entitlement_events(
    event_ref,entitlement_id,candidate_id,order_id,financial_event_id,event_type,from_status,to_status,
    actor_type,actor_auth_user_id,idempotency_key,reason,metadata
  ) VALUES (
    'KMENTEVT-'||replace(gen_random_uuid()::text,'-',''),v_ent.id,v_ent.candidate_id,v_ent.order_id,
    v_payment.id,'HOLD_RELEASED',v_from_status,'ACTIVE',p_actor_type,p_actor_auth_user_id,p_idempotency_key,p_reason,
    jsonb_build_object('provider','PAYFAST','provider_reference',v_payment.provider_reference)
  );
  RETURN v_ent.id;
END;
$$;

-- Revocation and hold operations are explicit and audited; ACTIVE can only be entered via verified grant.
CREATE OR REPLACE FUNCTION public.n11_transition_entitlement(
  p_entitlement_id uuid,
  p_target_status text,
  p_actor_type text,
  p_actor_auth_user_id uuid,
  p_reason text,
  p_idempotency_key text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $
DECLARE
  v_ent public.candidate_entitlements%ROWTYPE;
  v_event_id uuid;
  v_from_status text;
  v_event_type text;
BEGIN
  IF p_target_status NOT IN ('ON_HOLD','REVOKED')
     OR p_actor_type NOT IN ('SYSTEM','FINANCE_REVIEWER','PLATFORM_ADMIN')
     OR length(coalesce(p_reason,'')) < 12 OR length(p_reason) > 2000
     OR length(coalesce(p_idempotency_key,'')) < 8 THEN
    RAISE EXCEPTION 'invalid entitlement transition';
  END IF;
  SELECT id INTO v_event_id FROM public.candidate_entitlement_events WHERE idempotency_key=p_idempotency_key;
  IF FOUND THEN
    SELECT * INTO v_ent FROM public.candidate_entitlements WHERE id=(SELECT entitlement_id FROM public.candidate_entitlement_events WHERE id=v_event_id);
    IF v_ent.id <> p_entitlement_id OR EXISTS (
      SELECT 1 FROM public.candidate_entitlement_events
      WHERE id=v_event_id AND to_status <> p_target_status
    ) THEN RAISE EXCEPTION 'transition idempotency key was reused for a different operation'; END IF;
    RETURN v_ent.id;
  END IF;
  SELECT * INTO v_ent FROM public.candidate_entitlements WHERE id=p_entitlement_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'entitlement not found'; END IF;
  IF v_ent.status='REVOKED' THEN RETURN v_ent.id; END IF;
  v_from_status := v_ent.status;
  IF p_target_status='ON_HOLD' THEN
    UPDATE public.candidate_entitlements SET status='ON_HOLD',hold_reason=p_reason,held_at=now(),updated_at=now()
      WHERE id=v_ent.id RETURNING * INTO v_ent;
    v_event_type := 'HOLD_PLACED';
  ELSE
    UPDATE public.candidate_entitlements SET status='REVOKED',revoked_at=now(),revoked_reason=p_reason,updated_at=now()
      WHERE id=v_ent.id RETURNING * INTO v_ent;
    v_event_type := 'REVOKED';
  END IF;
  INSERT INTO public.candidate_entitlement_events(
    event_ref,entitlement_id,candidate_id,order_id,financial_event_id,event_type,from_status,to_status,
    actor_type,actor_auth_user_id,idempotency_key,reason
  ) VALUES (
    'KMENTEVT-'||replace(gen_random_uuid()::text,'-',''),v_ent.id,v_ent.candidate_id,v_ent.order_id,
    v_ent.financial_event_id,v_event_type,v_from_status,p_target_status,p_actor_type,p_actor_auth_user_id,p_idempotency_key,p_reason
  );
  RETURN v_ent.id;
END;
$$;

REVOKE ALL ON FUNCTION public.n11_hold_entitlement_for_order(uuid,text,uuid,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.n11_grant_entitlement(uuid,uuid,text,uuid,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.n11_transition_entitlement(uuid,text,text,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.n11_hold_entitlement_for_order(uuid,text,uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.n11_grant_entitlement(uuid,uuid,text,uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.n11_transition_entitlement(uuid,text,text,uuid,text,text) TO service_role;


-- A fully reconciled refund revokes any active entitlement in the same transaction.
-- Partial refunds do not automatically revoke service; policy/review can place a hold.
CREATE OR REPLACE FUNCTION public.n11_revoke_entitlement_on_full_refund()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $
DECLARE
  v_ent public.candidate_entitlements%ROWTYPE;
BEGIN
  IF NEW.status='REFUNDED' AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT * INTO v_ent FROM public.candidate_entitlements
      WHERE order_id=NEW.id FOR UPDATE;
    IF FOUND AND v_ent.status <> 'REVOKED' THEN
      PERFORM public.n11_transition_entitlement(
        v_ent.id,'REVOKED','SYSTEM',NULL,
        'The complete PayFast refund was reconciled against the provider ledger.',
        'n11-full-refund-revoke:'||NEW.id::text
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.n11_revoke_entitlement_on_full_refund() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS n11_revoke_entitlement_after_full_refund ON public.candidate_service_orders;
CREATE TRIGGER n11_revoke_entitlement_after_full_refund
AFTER UPDATE OF status ON public.candidate_service_orders
FOR EACH ROW EXECUTE FUNCTION public.n11_revoke_entitlement_on_full_refund();
