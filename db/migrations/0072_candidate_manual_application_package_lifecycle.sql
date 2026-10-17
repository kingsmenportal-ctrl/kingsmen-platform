-- 0072: durable Manual Application Package (MAP) lifecycle.
-- Candidate creation is always DRAFT. An authorised founder/operator reviews the evidence
-- before a package becomes READY and available in the candidate portal.
CREATE TABLE IF NOT EXISTS public.candidate_manual_application_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_ref text NOT NULL UNIQUE,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE RESTRICT,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reason_code text NOT NULL CHECK (reason_code IN ('OTP_REQUIRED','CAPTCHA_BLOCKED','PORTAL_DOWN','MANUAL_ONLY','SOURCE_REVIEW_REQUIRED','OTHER')),
  reason_summary text NOT NULL CHECK (length(trim(reason_summary)) BETWEEN 5 AND 2000),
  source_links jsonb NOT NULL CHECK (jsonb_typeof(source_links) = 'array' AND jsonb_array_length(source_links) BETWEEN 1 AND 10),
  required_documents jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(required_documents) = 'array' AND jsonb_array_length(required_documents) <= 50),
  manual_steps jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(manual_steps) = 'array'),
  review_evidence_urls text[] NOT NULL DEFAULT ARRAY[]::text[],
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','READY','DELIVERED','IN_PROGRESS','COMPLETED','REJECTED','CANCELLED')),
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  review_notes text,
  reviewed_at timestamptz,
  delivered_at timestamptz,
  delivery_confirmed_at timestamptz,
  completion_evidence_ref text,
  completion_verified_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  completion_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status NOT IN ('READY','DELIVERED','IN_PROGRESS','COMPLETED') OR (reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL)),
  CHECK (status <> 'COMPLETED' OR (completion_evidence_ref IS NOT NULL AND length(trim(completion_evidence_ref)) >= 3 AND completion_verified_by IS NOT NULL AND completion_verified_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS candidate_map_candidate_updated_idx
  ON public.candidate_manual_application_packages(candidate_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS candidate_map_review_queue_idx
  ON public.candidate_manual_application_packages(status, created_at)
  WHERE status = 'DRAFT';

ALTER TABLE public.candidate_manual_application_packages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.candidate_manual_application_packages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.candidate_manual_application_packages TO service_role;
GRANT INSERT, UPDATE, SELECT ON public.candidate_manual_application_packages TO service_role;

CREATE OR REPLACE FUNCTION public.create_candidate_manual_application_package(
  p_application_id uuid,
  p_reason_code text,
  p_reason_summary text,
  p_source_links jsonb,
  p_required_documents jsonb DEFAULT '[]'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_candidate_id uuid;
  v_package public.candidate_manual_application_packages%ROWTYPE;
  v_event_id uuid := gen_random_uuid();
  v_correlation uuid := gen_random_uuid();
  v_ref text := 'map_' || gen_random_uuid()::text;
  v_steps jsonb := jsonb_build_array(
    'Open the official source and confirm the programme and submission channel.',
    'Re-check current deadlines, fees and requirements before acting.',
    'Prepare only the documents confirmed by the official source.',
    'Submit through the provider’s official manual channel; do not bypass OTP or CAPTCHA.',
    'Keep the provider receipt or other verifiable evidence and update the tracker.'
  );
BEGIN
  IF v_actor IS NULL OR p_application_id IS NULL
     OR p_reason_code NOT IN ('OTP_REQUIRED','CAPTCHA_BLOCKED','PORTAL_DOWN','MANUAL_ONLY','SOURCE_REVIEW_REQUIRED','OTHER')
     OR length(trim(COALESCE(p_reason_summary,''))) NOT BETWEEN 5 AND 2000
     OR jsonb_typeof(p_source_links) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_source_links) NOT BETWEEN 1 AND 10
     OR jsonb_typeof(COALESCE(p_required_documents,'[]'::jsonb)) IS DISTINCT FROM 'array'
     OR jsonb_array_length(COALESCE(p_required_documents,'[]'::jsonb)) > 50
  THEN RAISE EXCEPTION 'INVALID_MAP_PACKAGE_INPUT' USING ERRCODE = '22023'; END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(p_source_links) s(value)
    WHERE length(value) > 2048
      OR value !~* '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
      OR lower(substring(value from '^https://([^/:?#]+)')) IN ('localhost')
      OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.localhost'
      OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.local'
      OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.internal'
  ) THEN RAISE EXCEPTION 'INVALID_MAP_SOURCE_URL' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_required_documents) d(value)
             WHERE jsonb_typeof(value) <> 'string' OR length(trim(value #>> '{}')) = 0)
  THEN RAISE EXCEPTION 'INVALID_MAP_DOCUMENT_LABEL' USING ERRCODE = '22023'; END IF;

  SELECT l.candidate_id INTO v_candidate_id
  FROM public.candidate_auth_identity_links l
  JOIN public.candidate_accounts ca ON ca.candidate_id = l.candidate_id
  JOIN public.candidates c ON c.id = l.candidate_id
  WHERE l.supabase_user_id = v_actor AND l.link_status = 'VERIFIED'
    AND l.verified_at IS NOT NULL AND l.verified_by IS NOT NULL
    AND ca.auth_user_id = v_actor AND ca.auth_status = 'ACTIVE'
    AND ca.email_verified = true AND ca.account_recovery_required = false
    AND c.is_active = true;
  IF v_candidate_id IS NULL THEN RAISE EXCEPTION 'VERIFIED_ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.applications a WHERE a.id = p_application_id AND a.candidate_id = v_candidate_id)
  THEN RAISE EXCEPTION 'APPLICATION_NOT_OWNED_BY_CANDIDATE' USING ERRCODE = '42501'; END IF;

  INSERT INTO public.candidate_manual_application_packages(
    map_ref, application_id, candidate_id, created_by, reason_code, reason_summary,
    source_links, required_documents, manual_steps, status
  ) VALUES (
    v_ref, p_application_id, v_candidate_id, v_actor, p_reason_code, trim(p_reason_summary),
    p_source_links, COALESCE(p_required_documents,'[]'::jsonb), v_steps, 'DRAFT'
  ) RETURNING * INTO v_package;

  INSERT INTO public.audit_events(event_id,event_type,severity,correlation_id,actor_id,candidate_id,application_id,message,metadata)
  VALUES (v_event_id,'CANDIDATE_MAP_PACKAGE_CREATED','INFO',v_correlation,v_actor,v_candidate_id,p_application_id,
    'Candidate created a draft Manual Application Package; it has not been reviewed or delivered.',
    jsonb_build_object('map_id',v_package.id,'map_ref',v_ref,'status','DRAFT'));
  RETURN jsonb_build_object('ok',true,'package',to_jsonb(v_package),'auditEventId',v_event_id,
    'message','Draft saved. It is not yet verified, approved, or delivered.');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_founder_map_package_queue(p_limit integer DEFAULT 100)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_packages jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT kingsmen_security.is_founder_or_operator()
  THEN RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501'; END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at ASC),'[]'::jsonb) INTO v_packages
  FROM (
    SELECT m.*, c.public_ref, c.display_name, a.route_name, a.institution_or_provider
    FROM public.candidate_manual_application_packages m
    JOIN public.candidates c ON c.id=m.candidate_id
    JOIN public.applications a ON a.id=m.application_id
    WHERE m.status IN ('DRAFT','READY','DELIVERED','IN_PROGRESS')
    ORDER BY m.created_at ASC
    LIMIT LEAST(GREATEST(COALESCE(p_limit,100),1),200)
  ) x;
  RETURN jsonb_build_object('ok',true,'packages',v_packages);
END;
$$;

CREATE OR REPLACE FUNCTION public.review_candidate_manual_application_package(
  p_package_id uuid,
  p_decision text,
  p_evidence_urls text[] DEFAULT ARRAY[]::text[],
  p_notes text DEFAULT '',
  p_completion_evidence_ref text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_package public.candidate_manual_application_packages%ROWTYPE;
  v_event_id uuid := gen_random_uuid();
  v_correlation uuid := gen_random_uuid();
  v_notes text := left(trim(COALESCE(p_notes,'')),2000);
  v_evidence text[] := COALESCE(p_evidence_urls,ARRAY[]::text[]);
BEGIN
  IF v_actor IS NULL OR NOT kingsmen_security.is_founder_or_operator()
  THEN RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501'; END IF;
  IF p_package_id IS NULL OR p_decision IS NULL OR p_decision NOT IN ('APPROVE','REJECT','VERIFY_COMPLETION')
     OR length(v_notes) < 8 OR cardinality(v_evidence) > 10
  THEN RAISE EXCEPTION 'INVALID_MAP_REVIEW' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(v_evidence) u(value)
    WHERE length(value)>2048 OR value !~* '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
       OR lower(substring(value from '^https://([^/:?#]+)')) IN ('localhost')
       OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.localhost'
       OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.local'
       OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.internal')

  SELECT * INTO v_package FROM public.candidate_manual_application_packages WHERE id=p_package_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MAP_PACKAGE_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF p_decision='APPROVE' THEN
    IF v_package.status <> 'DRAFT' OR cardinality(v_evidence)=0
    THEN RAISE EXCEPTION 'MAP_APPROVAL_REQUIRES_DRAFT_AND_EVIDENCE' USING ERRCODE = '23514'; END IF;
    UPDATE public.candidate_manual_application_packages SET status='READY',reviewer_id=v_actor,
      reviewed_at=now(),review_notes=v_notes,review_evidence_urls=v_evidence,updated_at=now()
      WHERE id=p_package_id RETURNING * INTO v_package;
  ELSIF p_decision='REJECT' THEN
    IF v_package.status <> 'DRAFT' THEN RAISE EXCEPTION 'MAP_PACKAGE_NOT_REVIEWABLE' USING ERRCODE = '23514'; END IF;
    UPDATE public.candidate_manual_application_packages SET status='REJECTED',reviewer_id=v_actor,
      reviewed_at=now(),review_notes=v_notes,review_evidence_urls=v_evidence,updated_at=now()
      WHERE id=p_package_id RETURNING * INTO v_package;
  ELSE
    IF v_package.status NOT IN ('DELIVERED','IN_PROGRESS') OR cardinality(v_evidence)=0
       OR length(trim(COALESCE(p_completion_evidence_ref,''))) < 3
    THEN RAISE EXCEPTION 'MAP_COMPLETION_REQUIRES_DELIVERY_AND_EVIDENCE' USING ERRCODE = '23514'; END IF;
    UPDATE public.candidate_manual_application_packages SET status='COMPLETED',
      completion_verified_by=v_actor,completion_verified_at=now(),review_notes=v_notes,review_evidence_urls=v_evidence,
      completion_evidence_ref=trim(p_completion_evidence_ref),updated_at=now()
      WHERE id=p_package_id RETURNING * INTO v_package;
  END IF;
  INSERT INTO public.audit_events(event_id,event_type,severity,correlation_id,actor_id,candidate_id,application_id,message,metadata)
  VALUES(v_event_id,'MAP_PACKAGE_REVIEWED','INFO',v_correlation,v_actor,v_package.candidate_id,v_package.application_id,
    'Authorised operator reviewed a Manual Application Package and recorded an evidence-backed decision.',
    jsonb_build_object('map_id',v_package.id,'decision',p_decision,'status',v_package.status,'evidence_urls',v_evidence,'notes',v_notes));
  RETURN jsonb_build_object('ok',true,'package',to_jsonb(v_package),'auditEventId',v_event_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_candidate_map_package_delivery(p_package_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_candidate_id uuid;
  v_package public.candidate_manual_application_packages%ROWTYPE;
  v_event_id uuid := gen_random_uuid();
  v_correlation uuid := gen_random_uuid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED' USING ERRCODE='42501'; END IF;
  SELECT l.candidate_id INTO v_candidate_id
  FROM public.candidate_auth_identity_links l
  JOIN public.candidate_accounts ca ON ca.candidate_id=l.candidate_id
  JOIN public.candidates c ON c.id=l.candidate_id
  WHERE l.supabase_user_id=v_actor AND l.link_status='VERIFIED' AND l.verified_at IS NOT NULL AND l.verified_by IS NOT NULL
    AND ca.auth_user_id=v_actor AND ca.auth_status='ACTIVE' AND ca.email_verified=true
    AND ca.account_recovery_required=false AND c.is_active=true;
  IF v_candidate_id IS NULL THEN RAISE EXCEPTION 'VERIFIED_ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_package FROM public.candidate_manual_application_packages
    WHERE id=p_package_id AND candidate_id=v_candidate_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MAP_PACKAGE_NOT_FOUND_OR_NOT_OWNED' USING ERRCODE='P0002'; END IF;
  IF v_package.status='READY' THEN
    UPDATE public.candidate_manual_application_packages SET status='DELIVERED',delivered_at=now(),
      delivery_confirmed_at=now(),updated_at=now() WHERE id=p_package_id RETURNING * INTO v_package;
  ELSIF v_package.status='DELIVERED' THEN
    RETURN jsonb_build_object('ok',true,'package',to_jsonb(v_package),'alreadyConfirmed',true);
  ELSE RAISE EXCEPTION 'MAP_PACKAGE_NOT_READY_FOR_DELIVERY' USING ERRCODE='23514'; END IF;
  INSERT INTO public.audit_events(event_id,event_type,severity,correlation_id,actor_id,candidate_id,application_id,message,metadata)
  VALUES(v_event_id,'CANDIDATE_MAP_PACKAGE_DELIVERY_CONFIRMED','INFO',v_correlation,v_actor,v_candidate_id,v_package.application_id,
    'Candidate confirmed receipt of an authorised Manual Application Package in the portal.',
    jsonb_build_object('map_id',v_package.id,'map_ref',v_package.map_ref,'status',v_package.status));
  RETURN jsonb_build_object('ok',true,'package',to_jsonb(v_package),'auditEventId',v_event_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_candidate_map_package_progress(p_package_id uuid,p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_candidate_id uuid;
  v_package public.candidate_manual_application_packages%ROWTYPE;
  v_event_id uuid := gen_random_uuid();
  v_correlation uuid := gen_random_uuid();
BEGIN
  IF v_actor IS NULL OR p_status <> 'IN_PROGRESS' THEN RAISE EXCEPTION 'INVALID_MAP_PROGRESS_ACTION' USING ERRCODE='22023'; END IF;
  SELECT l.candidate_id INTO v_candidate_id FROM public.candidate_auth_identity_links l
  JOIN public.candidate_accounts ca ON ca.candidate_id=l.candidate_id JOIN public.candidates c ON c.id=l.candidate_id
  WHERE l.supabase_user_id=v_actor AND l.link_status='VERIFIED' AND l.verified_at IS NOT NULL AND l.verified_by IS NOT NULL
    AND ca.auth_user_id=v_actor AND ca.auth_status='ACTIVE' AND ca.email_verified=true
    AND ca.account_recovery_required=false AND c.is_active=true;
  IF v_candidate_id IS NULL THEN RAISE EXCEPTION 'VERIFIED_ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE='42501'; END IF;
  UPDATE public.candidate_manual_application_packages SET status='IN_PROGRESS',updated_at=now()
    WHERE id=p_package_id AND candidate_id=v_candidate_id AND status='DELIVERED' RETURNING * INTO v_package;
  IF NOT FOUND THEN RAISE EXCEPTION 'MAP_PACKAGE_NOT_DELIVERED_OR_NOT_OWNED' USING ERRCODE='23514'; END IF;
  INSERT INTO public.audit_events(event_id,event_type,severity,correlation_id,actor_id,candidate_id,application_id,message,metadata)
  VALUES(v_event_id,'CANDIDATE_MAP_PACKAGE_PROGRESS_UPDATED','INFO',v_correlation,v_actor,v_candidate_id,v_package.application_id,
    'Candidate marked a delivered Manual Application Package as in progress.',
    jsonb_build_object('map_id',v_package.id,'status',v_package.status));
  RETURN jsonb_build_object('ok',true,'package',to_jsonb(v_package),'auditEventId',v_event_id);
END;
$$;

REVOKE ALL ON FUNCTION public.create_candidate_manual_application_package(uuid,text,text,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.get_founder_map_package_queue(integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.review_candidate_manual_application_package(uuid,text,text[],text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.confirm_candidate_map_package_delivery(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.update_candidate_map_package_progress(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_candidate_manual_application_package(uuid,text,text,jsonb,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_founder_map_package_queue(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_candidate_manual_application_package(uuid,text,text[],text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_candidate_map_package_delivery(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_candidate_map_package_progress(uuid,text) TO authenticated;

       OR lower(substring(value from '^https://([^/:?#]+)')) IN ('localhost')
       OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.localhost'
       OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.local'
       OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.internal')
  THEN RAISE EXCEPTION 'INVALID_MAP_REVIEW_EVIDENCE_URL' USING ERRCODE = '22023'; END IF;

  SELECT * INTO v_package FROM public.candidate_manual_application_packages WHERE id=p_package_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MAP_PACKAGE_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF p_decision='APPROVE' THEN
    IF v_package.status <> 'DRAFT' OR cardinality(v_evidence)=0
    THEN RAISE EXCEPTION 'MAP_APPROVAL_REQUIRES_DRAFT_AND_EVIDENCE' USING ERRCODE = '23514'; END IF;
    UPDATE public.candidate_manual_application_packages SET status='READY',reviewer_id=v_actor,
      reviewed_at=now(),review_notes=v_notes,review_evidence_urls=v_evidence,updated_at=now()
      WHERE id=p_package_id RETURNING * INTO v_package;
  ELSIF p_decision='REJECT' THEN
    IF v_package.status <> 'DRAFT' THEN RAISE EXCEPTION 'MAP_PACKAGE_NOT_REVIEWABLE' USING ERRCODE = '23514'; END IF;
    UPDATE public.candidate_manual_application_packages SET status='REJECTED',reviewer_id=v_actor,
      reviewed_at=now(),review_notes=v_notes,review_evidence_urls=v_evidence,updated_at=now()
      WHERE id=p_package_id RETURNING * INTO v_package;
  ELSE
    IF v_package.status NOT IN ('DELIVERED','IN_PROGRESS') OR cardinality(v_evidence)=0
       OR length(trim(COALESCE(p_completion_evidence_ref,''))) < 3
    THEN RAISE EXCEPTION 'MAP_COMPLETION_REQUIRES_DELIVERY_AND_EVIDENCE' USING ERRCODE = '23514'; END IF;
    UPDATE public.candidate_manual_application_packages SET status='COMPLETED',
      completion_verified_by=v_actor,completion_verified_at=now(),review_notes=v_notes,review_evidence_urls=v_evidence,
      completion_evidence_ref=trim(p_completion_evidence_ref),updated_at=now()
      WHERE id=p_package_id RETURNING * INTO v_package;
  END IF;
  INSERT INTO public.audit_events(event_id,event_type,severity,correlation_id,actor_id,candidate_id,application_id,message,metadata)
  VALUES(v_event_id,'MAP_PACKAGE_REVIEWED','INFO',v_correlation,v_actor,v_package.candidate_id,v_package.application_id,
    'Authorised operator reviewed a Manual Application Package and recorded an evidence-backed decision.',
    jsonb_build_object('map_id',v_package.id,'decision',p_decision,'status',v_package.status,'evidence_urls',v_evidence,'notes',v_notes));
  RETURN jsonb_build_object('ok',true,'package',to_jsonb(v_package),'auditEventId',v_event_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_candidate_map_package_delivery(p_package_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_candidate_id uuid;
  v_package public.candidate_manual_application_packages%ROWTYPE;
  v_event_id uuid := gen_random_uuid();
  v_correlation uuid := gen_random_uuid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED' USING ERRCODE='42501'; END IF;
  SELECT l.candidate_id INTO v_candidate_id
  FROM public.candidate_auth_identity_links l
  JOIN public.candidate_accounts ca ON ca.candidate_id=l.candidate_id
  JOIN public.candidates c ON c.id=l.candidate_id
  WHERE l.supabase_user_id=v_actor AND l.link_status='VERIFIED' AND l.verified_at IS NOT NULL AND l.verified_by IS NOT NULL
    AND ca.auth_user_id=v_actor AND ca.auth_status='ACTIVE' AND ca.email_verified=true
    AND ca.account_recovery_required=false AND c.is_active=true;
  IF v_candidate_id IS NULL THEN RAISE EXCEPTION 'VERIFIED_ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_package FROM public.candidate_manual_application_packages
    WHERE id=p_package_id AND candidate_id=v_candidate_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MAP_PACKAGE_NOT_FOUND_OR_NOT_OWNED' USING ERRCODE='P0002'; END IF;
  IF v_package.status='READY' THEN
    UPDATE public.candidate_manual_application_packages SET status='DELIVERED',delivered_at=now(),
      delivery_confirmed_at=now(),updated_at=now() WHERE id=p_package_id RETURNING * INTO v_package;
  ELSIF v_package.status='DELIVERED' THEN
    RETURN jsonb_build_object('ok',true,'package',to_jsonb(v_package),'alreadyConfirmed',true);
  ELSE RAISE EXCEPTION 'MAP_PACKAGE_NOT_READY_FOR_DELIVERY' USING ERRCODE='23514'; END IF;
  INSERT INTO public.audit_events(event_id,event_type,severity,correlation_id,actor_id,candidate_id,application_id,message,metadata)
  VALUES(v_event_id,'CANDIDATE_MAP_PACKAGE_DELIVERY_CONFIRMED','INFO',v_correlation,v_actor,v_candidate_id,v_package.application_id,
    'Candidate confirmed receipt of an authorised Manual Application Package in the portal.',
    jsonb_build_object('map_id',v_package.id,'map_ref',v_package.map_ref,'status',v_package.status));
  RETURN jsonb_build_object('ok',true,'package',to_jsonb(v_package),'auditEventId',v_event_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_candidate_map_package_progress(p_package_id uuid,p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_candidate_id uuid;
  v_package public.candidate_manual_application_packages%ROWTYPE;
  v_event_id uuid := gen_random_uuid();
  v_correlation uuid := gen_random_uuid();
BEGIN
  IF v_actor IS NULL OR p_status <> 'IN_PROGRESS' THEN RAISE EXCEPTION 'INVALID_MAP_PROGRESS_ACTION' USING ERRCODE='22023'; END IF;
  SELECT l.candidate_id INTO v_candidate_id FROM public.candidate_auth_identity_links l
  JOIN public.candidate_accounts ca ON ca.candidate_id=l.candidate_id JOIN public.candidates c ON c.id=l.candidate_id
  WHERE l.supabase_user_id=v_actor AND l.link_status='VERIFIED' AND l.verified_at IS NOT NULL AND l.verified_by IS NOT NULL
    AND ca.auth_user_id=v_actor AND ca.auth_status='ACTIVE' AND ca.email_verified=true
    AND ca.account_recovery_required=false AND c.is_active=true;
  IF v_candidate_id IS NULL THEN RAISE EXCEPTION 'VERIFIED_ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE='42501'; END IF;
  UPDATE public.candidate_manual_application_packages SET status='IN_PROGRESS',updated_at=now()
    WHERE id=p_package_id AND candidate_id=v_candidate_id AND status='DELIVERED' RETURNING * INTO v_package;
  IF NOT FOUND THEN RAISE EXCEPTION 'MAP_PACKAGE_NOT_DELIVERED_OR_NOT_OWNED' USING ERRCODE='23514'; END IF;
  INSERT INTO public.audit_events(event_id,event_type,severity,correlation_id,actor_id,candidate_id,application_id,message,metadata)
  VALUES(v_event_id,'CANDIDATE_MAP_PACKAGE_PROGRESS_UPDATED','INFO',v_correlation,v_actor,v_candidate_id,v_package.application_id,
    'Candidate marked a delivered Manual Application Package as in progress.',
    jsonb_build_object('map_id',v_package.id,'status',v_package.status));
  RETURN jsonb_build_object('ok',true,'package',to_jsonb(v_package),'auditEventId',v_event_id);
END;
$$;

REVOKE ALL ON FUNCTION public.create_candidate_manual_application_package(uuid,text,text,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.get_founder_map_package_queue(integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.review_candidate_manual_application_package(uuid,text,text[],text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.confirm_candidate_map_package_delivery(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.update_candidate_map_package_progress(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_candidate_manual_application_package(uuid,text,text,jsonb,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_founder_map_package_queue(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_candidate_manual_application_package(uuid,text,text[],text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_candidate_map_package_delivery(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_candidate_map_package_progress(uuid,text) TO authenticated;
