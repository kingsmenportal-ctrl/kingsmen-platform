-- Kingsmen application capacity entitlements v1.
-- Review-only migration: do not apply until independent security review, migration provenance,
-- encrypted backup/restore and approved staging change control are complete.

ALTER TABLE public.finance_orders
  ADD COLUMN IF NOT EXISTS priority_application_count integer,
  ADD COLUMN IF NOT EXISTS accommodation_support_available boolean,
  ADD COLUMN IF NOT EXISTS entitlement_policy_version text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid='public.finance_orders'::regclass
      AND conname='finance_orders_priority_application_count_chk') THEN
    ALTER TABLE public.finance_orders ADD CONSTRAINT finance_orders_priority_application_count_chk
      CHECK (priority_application_count IS NULL OR priority_application_count >= 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.capture_finance_order_capacity_terms()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','pg_temp'
AS $function$
DECLARE v_plan public.finance_plan_catalog%ROWTYPE;
BEGIN
  IF TG_OP='INSERT' THEN
    SELECT * INTO v_plan FROM public.finance_plan_catalog p
     WHERE p.plan_code=NEW.plan_code AND p.active IS TRUE FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'ACTIVE_PLAN_REQUIRED_FOR_ORDER_ENTITLEMENTS' USING ERRCODE='23514';
    END IF;
    NEW.priority_application_count:=coalesce(v_plan.priority_application_count,0);
    NEW.accommodation_support_available:=v_plan.accommodation_support_available;
    NEW.entitlement_policy_version:='KINGSMEN_CAPACITY_2026_11_01_V1';
    RETURN NEW;
  END IF;

  IF ROW(NEW.plan_code,NEW.amount_cents,NEW.currency,NEW.service_term_days,
         NEW.managed_application_count,NEW.accommodation_route_count,NEW.cv_versions,
         NEW.motivation_letters,NEW.upgrade_bonus_routes,NEW.priority_application_count,
         NEW.accommodation_support_available,NEW.entitlement_policy_version)
     IS DISTINCT FROM
     ROW(OLD.plan_code,OLD.amount_cents,OLD.currency,OLD.service_term_days,
         OLD.managed_application_count,OLD.accommodation_route_count,OLD.cv_versions,
         OLD.motivation_letters,OLD.upgrade_bonus_routes,OLD.priority_application_count,
         OLD.accommodation_support_available,OLD.entitlement_policy_version) THEN
    RAISE EXCEPTION 'FINANCE_ORDER_CAPACITY_TERMS_ARE_IMMUTABLE' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS finance_orders_capture_capacity_terms ON public.finance_orders;
CREATE TRIGGER finance_orders_capture_capacity_terms
BEFORE INSERT OR UPDATE ON public.finance_orders
FOR EACH ROW EXECUTE FUNCTION public.capture_finance_order_capacity_terms();

CREATE TABLE IF NOT EXISTS public.candidate_application_capacity_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  application_id uuid NOT NULL,
  usage_type text NOT NULL CHECK (usage_type IN ('PRIORITY_APPLICATION','MANAGED_ROUTE')),
  entitlement_order_ref text NOT NULL REFERENCES public.finance_orders(order_ref) ON DELETE RESTRICT,
  reservation_status text NOT NULL DEFAULT 'RESERVED' CHECK (reservation_status IN ('RESERVED','RELEASED')),
  idempotency_key text NOT NULL,
  period_started_at timestamptz NOT NULL,
  period_expires_at timestamptz NOT NULL,
  created_by_auth_user_id uuid NOT NULL,
  reserved_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  released_at timestamptz,
  release_reason text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT candidate_capacity_application_owner_fk
    FOREIGN KEY (application_id,candidate_id)
    REFERENCES public.candidate_applications(id,candidate_id) ON DELETE RESTRICT,
  CONSTRAINT candidate_capacity_period_chk CHECK (period_expires_at>period_started_at),
  CONSTRAINT candidate_capacity_release_state_chk CHECK (
    (reservation_status='RESERVED' AND released_at IS NULL)
    OR (reservation_status='RELEASED' AND released_at IS NOT NULL)),
  CONSTRAINT candidate_capacity_candidate_idempotency_uq UNIQUE (candidate_id,idempotency_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS candidate_capacity_one_active_use_per_application_uq
  ON public.candidate_application_capacity_reservations(candidate_id,application_id,usage_type)
  WHERE reservation_status='RESERVED';
CREATE INDEX IF NOT EXISTS candidate_capacity_candidate_period_idx
  ON public.candidate_application_capacity_reservations(candidate_id,entitlement_order_ref,usage_type,period_expires_at)
  WHERE reservation_status='RESERVED';

CREATE TABLE IF NOT EXISTS public.candidate_application_capacity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_ref text NOT NULL UNIQUE,
  reservation_id uuid NOT NULL REFERENCES public.candidate_application_capacity_reservations(id) ON DELETE RESTRICT,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  application_id uuid NOT NULL,
  actor_auth_user_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('CAPACITY_RESERVED','CAPACITY_RELEASED')),
  idempotency_key text NOT NULL UNIQUE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details)='object'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT candidate_capacity_event_application_owner_fk
    FOREIGN KEY (application_id,candidate_id)
    REFERENCES public.candidate_applications(id,candidate_id) ON DELETE RESTRICT
);

CREATE OR REPLACE FUNCTION public.prevent_candidate_capacity_event_mutation()
RETURNS trigger LANGUAGE plpgsql SET search_path TO ''
AS $function$
BEGIN
  RAISE EXCEPTION 'candidate application capacity events are immutable';
END;
$function$;

DROP TRIGGER IF EXISTS candidate_capacity_events_immutable ON public.candidate_application_capacity_events;
CREATE TRIGGER candidate_capacity_events_immutable
BEFORE UPDATE OR DELETE ON public.candidate_application_capacity_events
FOR EACH ROW EXECUTE FUNCTION public.prevent_candidate_capacity_event_mutation();

ALTER TABLE public.candidate_application_capacity_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_application_capacity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS candidate_capacity_reservations_service_role ON public.candidate_application_capacity_reservations;
CREATE POLICY candidate_capacity_reservations_service_role
 ON public.candidate_application_capacity_reservations FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS candidate_capacity_events_service_role ON public.candidate_application_capacity_events;
CREATE POLICY candidate_capacity_events_service_role
 ON public.candidate_application_capacity_events FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON TABLE public.candidate_application_capacity_reservations FROM PUBLIC,anon,authenticated;
REVOKE ALL ON TABLE public.candidate_application_capacity_events FROM PUBLIC,anon,authenticated;
GRANT ALL ON TABLE public.candidate_application_capacity_reservations TO service_role;
GRANT ALL ON TABLE public.candidate_application_capacity_events TO service_role;

CREATE OR REPLACE FUNCTION kingsmen_security.current_verified_capacity_candidate_id()
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public','auth'
AS $function$
DECLARE v_uid uuid:=auth.uid(); v_count bigint; v_candidate uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;
  SELECT count(*),(array_agg(l.candidate_id ORDER BY l.id))[1]
    INTO v_count,v_candidate
  FROM public.candidate_auth_identity_links l
  WHERE l.supabase_user_id=v_uid AND l.link_status='VERIFIED'
    AND l.verified_at IS NOT NULL AND l.verified_at<=statement_timestamp()
    AND l.verified_by IS NOT NULL;
  IF v_count<>1 THEN RETURN NULL; END IF;
  RETURN v_candidate;
END;
$function$;
REVOKE ALL ON FUNCTION kingsmen_security.current_verified_capacity_candidate_id()
 FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.get_candidate_application_capacity()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','kingsmen_security','auth'
AS $function$
DECLARE
  v_uid uuid:=auth.uid(); v_candidate uuid; v_public_ref text; v_candidate_ref text; v_now timestamptz:=clock_timestamp();
  v_order record; v_priority_used integer:=0; v_managed_used integer:=0;
  v_priority_limit integer:=0; v_managed_limit integer:=0; v_cv_owned boolean:=false;
  v_reservations jsonb:='[]'::jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTHENTICATED_CANDIDATE_REQUIRED' USING ERRCODE='42501'; END IF;
  v_candidate:=kingsmen_security.current_verified_capacity_candidate_id();
  IF v_candidate IS NULL THEN RAISE EXCEPTION 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED' USING ERRCODE='42501'; END IF;
  v_candidate_ref:=v_candidate::text;
  SELECT c.public_ref::text INTO v_public_ref FROM public.candidates c
    WHERE c.id=v_candidate AND c.is_active IS TRUE;
  IF v_public_ref IS NULL THEN RAISE EXCEPTION 'ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE='42501'; END IF;

  SELECT fo.order_ref,fo.plan_code,fo.amount_cents,fo.currency,fo.priority_application_count,
         fo.managed_application_count,fo.service_term_days,fo.accommodation_route_count,
         fo.accommodation_support_available,fo.upgrade_bonus_routes,fp.payment_ref,fp.verified_at,
         fp.verified_at+make_interval(days=>fo.service_term_days) AS period_expires_at
    INTO v_order
  FROM public.finance_orders fo
  JOIN LATERAL (
    SELECT p.payment_ref,p.verified_at,p.payment_status,p.verified,p.amount_gross_cents,p.currency
    FROM public.finance_payments p WHERE p.order_ref=fo.order_ref AND p.candidate_ref=fo.candidate_ref AND p.provider='PAYFAST'
    ORDER BY p.created_at DESC,p.payment_ref DESC LIMIT 1
  ) fp ON true
  WHERE fo.candidate_ref=v_candidate_ref AND fo.order_status='PAID' AND fo.currency='ZAR'
    AND fo.priority_application_count IS NOT NULL
    AND fo.entitlement_policy_version='KINGSMEN_CAPACITY_2026_11_01_V1'
    AND fo.service_term_days>0 AND fp.payment_status='COMPLETE' AND fp.verified IS TRUE
    AND fp.amount_gross_cents=fo.amount_cents AND fp.currency='ZAR'
    AND fp.verified_at IS NOT NULL AND fp.verified_at<=v_now
    AND fp.verified_at+make_interval(days=>fo.service_term_days)>v_now
    AND fo.plan_code<>'CV_REVAMP_R49_99'
  ORDER BY fp.verified_at DESC,fp.payment_ref DESC LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok',true,'has_active_plan',false,'plan_code',NULL,'order_ref',NULL,
      'verified_payment_ref',NULL,'verified_at',NULL,'expires_at',NULL,
      'priority_application_limit',0,'priority_application_used',0,'priority_application_remaining',0,
      'managed_route_limit',0,'managed_route_used',0,'managed_route_remaining',0,
      'accommodation_support_available',false,'accommodation_route_count',0,
      'cv_revamp_owned',false,'cv_revamp_bonus_applied',0,'reservations',v_reservations,
      'catalogue_access','ALL_SIX_PATHWAYS',
      'message','All six pathways remain discoverable. A verified active paid plan is required only for priority or managed-route capacity.'
    );
  END IF;

  v_priority_limit:=greatest(coalesce(v_order.priority_application_count,0),0);
  v_managed_limit:=greatest(coalesce(v_order.managed_application_count,0),0);

  SELECT EXISTS (
    SELECT 1 FROM public.finance_orders cv
    JOIN LATERAL (
      SELECT p.payment_status,p.verified,p.amount_gross_cents,p.currency,p.verified_at
      FROM public.finance_payments p WHERE p.order_ref=cv.order_ref AND p.candidate_ref=cv.candidate_ref AND p.provider='PAYFAST'
      ORDER BY p.created_at DESC,p.payment_ref DESC LIMIT 1
    ) cvp ON true
    WHERE cv.candidate_ref=v_candidate_ref AND cv.plan_code='CV_REVAMP_R49_99'
      AND cv.order_status='PAID' AND cvp.payment_status='COMPLETE' AND cvp.verified IS TRUE
      AND cvp.amount_gross_cents=cv.amount_cents AND cvp.currency='ZAR'
      AND cvp.verified_at IS NOT NULL AND cvp.verified_at<=v_order.verified_at
  ) INTO v_cv_owned;
  IF v_cv_owned AND coalesce(v_order.upgrade_bonus_routes,0)>0 THEN
    v_managed_limit:=v_managed_limit+v_order.upgrade_bonus_routes;
  END IF;

  SELECT count(*) FILTER (WHERE r.usage_type='PRIORITY_APPLICATION')::integer,
         count(*) FILTER (WHERE r.usage_type='MANAGED_ROUTE')::integer
    INTO v_priority_used,v_managed_used
  FROM public.candidate_application_capacity_reservations r
  WHERE r.candidate_id=v_candidate AND r.entitlement_order_ref=v_order.order_ref
    AND r.reservation_status='RESERVED' AND r.period_expires_at>v_now;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'reservation_id',r.id,'application_id',r.application_id,'usage_type',r.usage_type,
    'order_ref',r.entitlement_order_ref,'reserved_at',r.reserved_at,
    'expires_at',r.period_expires_at,'status',r.reservation_status
  ) ORDER BY r.reserved_at DESC),'[]'::jsonb)
  INTO v_reservations
  FROM public.candidate_application_capacity_reservations r
  WHERE r.candidate_id=v_candidate AND r.entitlement_order_ref=v_order.order_ref
    AND r.reservation_status='RESERVED' AND r.period_expires_at>v_now;

  RETURN jsonb_build_object(
    'ok',true,'has_active_plan',true,'plan_code',v_order.plan_code,
    'order_ref',v_order.order_ref,'verified_payment_ref',v_order.payment_ref,
    'verified_at',v_order.verified_at,'expires_at',v_order.period_expires_at,
    'priority_application_limit',v_priority_limit,'priority_application_used',coalesce(v_priority_used,0),
    'priority_application_remaining',greatest(v_priority_limit-coalesce(v_priority_used,0),0),
    'managed_route_limit',v_managed_limit,'managed_route_used',coalesce(v_managed_used,0),
    'managed_route_remaining',greatest(v_managed_limit-coalesce(v_managed_used,0),0),
    'accommodation_support_available',coalesce(v_order.accommodation_support_available,false),
    'accommodation_route_count',coalesce(v_order.accommodation_route_count,0),
    'cv_revamp_owned',v_cv_owned,
    'cv_revamp_bonus_applied',CASE WHEN v_cv_owned THEN greatest(coalesce(v_order.upgrade_bonus_routes,0),0) ELSE 0 END,
    'reservations',v_reservations,'catalogue_access','ALL_SIX_PATHWAYS',
    'message','Capacity is derived from normalized order-time entitlements and a matching PAID order plus COMPLETE verified ZAR payment.'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.reserve_candidate_application_capacity(
  p_application_id uuid,p_usage_type text,p_idempotency_key text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','kingsmen_security','auth'
AS $function$
DECLARE
  v_uid uuid:=auth.uid(); v_candidate uuid; v_public_ref text; v_now timestamptz:=clock_timestamp();
  v_status text; v_summary jsonb; v_order_ref text; v_period_start timestamptz; v_period_end timestamptz;
  v_limit integer; v_used integer; v_existing public.candidate_application_capacity_reservations%ROWTYPE;
  v_payment_ref text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTHENTICATED_CANDIDATE_REQUIRED' USING ERRCODE='42501'; END IF;
  IF p_application_id IS NULL OR p_usage_type IS NULL
    OR p_usage_type NOT IN ('PRIORITY_APPLICATION','MANAGED_ROUTE')
    OR coalesce(p_idempotency_key,'') !~ '^[A-Za-z0-9._:-]{8,160}$' THEN
    RAISE EXCEPTION 'CAPACITY_RESERVATION_INPUT_INVALID' USING ERRCODE='22023';
  END IF;

  v_candidate:=kingsmen_security.current_verified_capacity_candidate_id();
  IF v_candidate IS NULL THEN RAISE EXCEPTION 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED' USING ERRCODE='42501'; END IF;
  PERFORM l.id FROM public.candidate_auth_identity_links l
   WHERE l.supabase_user_id=v_uid AND l.candidate_id=v_candidate
     AND l.link_status='VERIFIED' AND l.verified_at IS NOT NULL
     AND l.verified_at<=v_now AND l.verified_by IS NOT NULL
   FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED' USING ERRCODE='42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('candidate-application-capacity:'||v_candidate::text,0));

  SELECT c.public_ref::text INTO v_public_ref FROM public.candidates c
   WHERE c.id=v_candidate AND c.is_active IS TRUE FOR UPDATE;
  IF v_public_ref IS NULL THEN RAISE EXCEPTION 'ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE='42501'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.privacy_consent_records pc
    WHERE pc.candidate_ref=v_public_ref AND pc.consent_type='PROFILE_PROCESSING'
      AND pc.consent_status='ACTIVE' AND pc.revoked_at IS NULL
      AND nullif(trim(pc.consent_text_snapshot),'') IS NOT NULL AND pc.granted_at<=v_now
      AND NOT EXISTS (
        SELECT 1 FROM public.privacy_consent_records newer
        WHERE newer.candidate_ref=pc.candidate_ref AND newer.consent_type=pc.consent_type
          AND (newer.granted_at,newer.id)>(pc.granted_at,pc.id)
      )
  ) THEN RAISE EXCEPTION 'PROFILE_PROCESSING_CONSENT_REQUIRED' USING ERRCODE='42501'; END IF;

  SELECT ca.status INTO v_status FROM public.candidate_applications ca
  WHERE ca.id=p_application_id AND ca.candidate_id=v_candidate
    AND ca.status IN ('DRAFT','READINESS_BLOCKED','READY_FOR_REVIEW','READY_TO_SUBMIT')
  FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'OWNED_EDITABLE_APPLICATION_REQUIRED' USING ERRCODE='42501'; END IF;

  SELECT * INTO v_existing FROM public.candidate_application_capacity_reservations r
   WHERE r.candidate_id=v_candidate AND r.idempotency_key=p_idempotency_key FOR UPDATE;
  IF FOUND THEN
    IF v_existing.application_id<>p_application_id OR v_existing.usage_type<>p_usage_type THEN
      RAISE EXCEPTION 'CAPACITY_IDEMPOTENCY_KEY_CONFLICT' USING ERRCODE='23505';
    END IF;
    RETURN jsonb_build_object('ok',true,'reused',true,'reservation_id',v_existing.id,
      'reservation_status',v_existing.reservation_status,'usage_type',v_existing.usage_type,
      'message','The original capacity reservation was reused.');
  END IF;

  SELECT * INTO v_existing FROM public.candidate_application_capacity_reservations r
   WHERE r.candidate_id=v_candidate AND r.application_id=p_application_id
     AND r.usage_type=p_usage_type AND r.reservation_status='RESERVED' FOR UPDATE;
  IF FOUND THEN
    RETURN jsonb_build_object('ok',false,'code','APPLICATION_CAPACITY_ALREADY_RESERVED',
      'reservation_id',v_existing.id,'message','This application already holds an active reservation of this type.');
  END IF;

  v_summary:=public.get_candidate_application_capacity();
  IF coalesce((v_summary->>'has_active_plan')::boolean,false) IS NOT TRUE THEN
    RETURN jsonb_build_object('ok',false,'code','VERIFIED_PAID_PLAN_REQUIRED',
      'message','A verified active paid plan is required for priority or managed-route capacity. The catalogue remains available.');
  END IF;
  v_order_ref:=v_summary->>'order_ref';
  v_payment_ref:=v_summary->>'verified_payment_ref';
  v_period_start:=(v_summary->>'verified_at')::timestamptz;
  v_period_end:=(v_summary->>'expires_at')::timestamptz;

  -- Hold the verified order and latest PayFast payment state stable until this
  -- reservation commits. A concurrent refund/dispute cannot race capacity allocation.
  PERFORM fo.order_ref FROM public.finance_orders fo
   WHERE fo.order_ref=v_order_ref AND fo.candidate_ref=v_candidate::text
     AND fo.order_status='PAID' AND fo.entitlement_policy_version='KINGSMEN_CAPACITY_2026_11_01_V1'
   FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'VERIFIED_PAID_PLAN_REQUIRED' USING ERRCODE='42501';
  END IF;
  PERFORM fp.payment_ref FROM public.finance_payments fp
   WHERE fp.payment_ref=v_payment_ref AND fp.order_ref=v_order_ref
     AND fp.candidate_ref=v_candidate::text AND fp.provider='PAYFAST'
     AND fp.payment_status='COMPLETE' AND fp.verified IS TRUE
     AND fp.currency='ZAR'
     AND fp.amount_gross_cents=(
       SELECT fo.amount_cents FROM public.finance_orders fo
       WHERE fo.order_ref=v_order_ref AND fo.candidate_ref=v_candidate::text
     )
     AND fp.verified_at=v_period_start AND fp.verified_at<=clock_timestamp()
   FOR SHARE;
  IF NOT FOUND OR v_period_end<=clock_timestamp() THEN
    RAISE EXCEPTION 'VERIFIED_PAID_PLAN_EXPIRED_OR_REVOKED' USING ERRCODE='42501';
  END IF;

  IF p_usage_type='PRIORITY_APPLICATION' THEN
    v_limit:=coalesce((v_summary->>'priority_application_limit')::integer,0);
    v_used:=coalesce((v_summary->>'priority_application_used')::integer,0);
  ELSE
    v_limit:=coalesce((v_summary->>'managed_route_limit')::integer,0);
    v_used:=coalesce((v_summary->>'managed_route_used')::integer,0);
  END IF;

  IF v_limit<=v_used THEN
    RETURN jsonb_build_object('ok',false,'code','APPLICATION_CAPACITY_EXHAUSTED',
      'usage_type',p_usage_type,'limit',v_limit,'used',v_used,
      'remaining',greatest(v_limit-v_used,0),
      'message','The available plan capacity has been used. Upgrade or wait for the service period to renew.');
  END IF;

  INSERT INTO public.candidate_application_capacity_reservations(
    candidate_id,application_id,usage_type,entitlement_order_ref,reservation_status,
    idempotency_key,period_started_at,period_expires_at,created_by_auth_user_id
  ) VALUES(v_candidate,p_application_id,p_usage_type,v_order_ref,'RESERVED',
    p_idempotency_key,v_period_start,v_period_end,v_uid)
  RETURNING * INTO v_existing;

  INSERT INTO public.candidate_application_capacity_events(
    event_ref,reservation_id,candidate_id,application_id,actor_auth_user_id,event_type,idempotency_key,details
  ) VALUES(
    'KMCAPEVT-'||replace(gen_random_uuid()::text,'-',''),v_existing.id,v_candidate,p_application_id,
    v_uid,'CAPACITY_RESERVED','reserve:'||v_existing.id::text,
    jsonb_build_object('usage_type',p_usage_type,'order_ref',v_order_ref,
      'period_started_at',v_period_start,'period_expires_at',v_period_end,
      'limit_before_reservation',v_limit,'used_before_reservation',v_used,
      'remaining_after_reservation',greatest(v_limit-v_used-1,0),'provider_submission_sent',false)
  );

  RETURN jsonb_build_object('ok',true,'reused',false,'reservation_id',v_existing.id,
    'reservation_status',v_existing.reservation_status,'usage_type',p_usage_type,
    'order_ref',v_order_ref,'remaining_after_reservation',greatest(v_limit-v_used-1,0),
    'message','Capacity reserved for this Kingsmen application record. No provider submission occurred.');
END;
$function$;

CREATE OR REPLACE FUNCTION public.release_candidate_application_capacity(
  p_reservation_id uuid,p_reason text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','kingsmen_security','auth'
AS $function$
DECLARE
  v_uid uuid:=auth.uid(); v_candidate uuid; v_reservation public.candidate_application_capacity_reservations%ROWTYPE;
  v_status text; v_reason text:=trim(coalesce(p_reason,'')); v_now timestamptz:=clock_timestamp();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTHENTICATED_CANDIDATE_REQUIRED' USING ERRCODE='42501'; END IF;
  IF p_reservation_id IS NULL OR length(v_reason) NOT BETWEEN 5 AND 500 THEN
    RAISE EXCEPTION 'CAPACITY_RELEASE_INPUT_INVALID' USING ERRCODE='22023';
  END IF;
  v_candidate:=kingsmen_security.current_verified_capacity_candidate_id();
  IF v_candidate IS NULL THEN RAISE EXCEPTION 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED' USING ERRCODE='42501'; END IF;
  PERFORM l.id FROM public.candidate_auth_identity_links l
   WHERE l.supabase_user_id=v_uid AND l.candidate_id=v_candidate
     AND l.link_status='VERIFIED' AND l.verified_at IS NOT NULL
     AND l.verified_at<=v_now AND l.verified_by IS NOT NULL
   FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED' USING ERRCODE='42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('candidate-application-capacity:'||v_candidate::text,0));

  SELECT * INTO v_reservation FROM public.candidate_application_capacity_reservations r
   WHERE r.id=p_reservation_id AND r.candidate_id=v_candidate FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'OWNED_CAPACITY_RESERVATION_REQUIRED' USING ERRCODE='42501'; END IF;
  IF v_reservation.reservation_status='RELEASED' THEN
    RETURN jsonb_build_object('ok',true,'reused',true,'reservation_id',v_reservation.id,
      'reservation_status','RELEASED','message','This capacity reservation was already released.');
  END IF;

  SELECT ca.status INTO v_status FROM public.candidate_applications ca
   WHERE ca.id=v_reservation.application_id AND ca.candidate_id=v_candidate FOR SHARE;
  IF NOT FOUND OR v_status NOT IN ('DRAFT','READINESS_BLOCKED','READY_FOR_REVIEW','READY_TO_SUBMIT') THEN
    RETURN jsonb_build_object('ok',false,'code','CAPACITY_RELEASE_NOT_ALLOWED',
      'message','Capacity cannot be released after provider submission or outcome processing has started.');
  END IF;

  UPDATE public.candidate_application_capacity_reservations
   SET reservation_status='RELEASED',released_at=clock_timestamp(),release_reason=v_reason,updated_at=clock_timestamp()
   WHERE id=v_reservation.id RETURNING * INTO v_reservation;

  INSERT INTO public.candidate_application_capacity_events(
    event_ref,reservation_id,candidate_id,application_id,actor_auth_user_id,event_type,idempotency_key,details
  ) VALUES(
    'KMCAPEVT-'||replace(gen_random_uuid()::text,'-',''),v_reservation.id,v_candidate,
    v_reservation.application_id,v_uid,'CAPACITY_RELEASED','release:'||v_reservation.id::text,
    jsonb_build_object('usage_type',v_reservation.usage_type,'order_ref',v_reservation.entitlement_order_ref,
      'reason',v_reason,'provider_submission_sent',false)
  );

  RETURN jsonb_build_object('ok',true,'reused',false,'reservation_id',v_reservation.id,
    'reservation_status',v_reservation.reservation_status,'message','Capacity was released and an immutable audit event was written.');
END;
$function$;

REVOKE ALL ON FUNCTION public.get_candidate_application_capacity() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.reserve_candidate_application_capacity(uuid,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.release_candidate_application_capacity(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_candidate_application_capacity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_candidate_application_capacity(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_candidate_application_capacity(uuid,text) TO authenticated;

COMMENT ON COLUMN public.finance_orders.priority_application_count IS
 'Order-time priority application capacity captured from finance_plan_catalog. Null on legacy orders pending finance reconciliation.';
COMMENT ON COLUMN public.finance_orders.entitlement_policy_version IS
 'Identifies the normalized order-time capacity policy used to qualify a paid order.';
COMMENT ON TABLE public.candidate_application_capacity_reservations IS
 'Atomic candidate-owned priority-application and managed-route reservations backed by verified paid finance orders.';
COMMENT ON TABLE public.candidate_application_capacity_events IS
 'Append-only audit log for candidate application capacity reservations and releases.';
