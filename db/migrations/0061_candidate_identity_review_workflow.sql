-- 0061: authorised candidate identity-link review queue and atomic linking.
ALTER TABLE public.candidate_identity_link_requests
  ADD COLUMN IF NOT EXISTS review_evidence_urls text[] NOT NULL DEFAULT ARRAY[]::text[];

CREATE OR REPLACE FUNCTION public.get_candidate_identity_link_queue(p_limit integer DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT kingsmen_security.is_founder_or_operator() THEN
    RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'verifiedEmail', r.verified_email,
    'candidateReference', r.candidate_reference,
    'status', r.status,
    'requestedAt', r.requested_at,
    'correlationId', r.correlation_id
  ) ORDER BY r.requested_at ASC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT id, verified_email, candidate_reference, status, requested_at, correlation_id
    FROM public.candidate_identity_link_requests
    WHERE status = 'PENDING'
    ORDER BY requested_at ASC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 200)
  ) r;
  RETURN jsonb_build_object('ok', true, 'requests', v_result);
END;
$$;

CREATE OR REPLACE FUNCTION public.review_candidate_identity_link(
  p_request_id uuid,
  p_decision text,
  p_candidate_id uuid DEFAULT NULL,
  p_evidence_urls text[] DEFAULT ARRAY[]::text[],
  p_notes text DEFAULT ''
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_request public.candidate_identity_link_requests%ROWTYPE;
  v_account public.candidate_accounts%ROWTYPE;
  v_link public.candidate_auth_identity_links%ROWTYPE;
  v_event_id uuid := gen_random_uuid();
  v_correlation uuid := gen_random_uuid();
  v_evidence text[] := COALESCE(p_evidence_urls, ARRAY[]::text[]);
  v_notes text := left(COALESCE(p_notes, ''), 2000);
BEGIN
  IF v_actor IS NULL OR NOT kingsmen_security.is_founder_or_operator() THEN
    RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_request_id IS NULL OR p_decision NOT IN ('APPROVE','REJECT') THEN
    RAISE EXCEPTION 'INVALID_IDENTITY_REVIEW_ACTION' USING ERRCODE = '22023';
  END IF;
  IF cardinality(v_evidence) > 10 THEN
    RAISE EXCEPTION 'TOO_MANY_IDENTITY_EVIDENCE_URLS' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(v_evidence) AS u(value)
    WHERE length(value) > 2048
       OR value !~* '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
       OR lower(substring(value from '^https://([^/:?#]+)')) IN ('localhost')
       OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.localhost'
       OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.local'
       OR lower(substring(value from '^https://([^/:?#]+)')) LIKE '%.internal'
  ) THEN
    RAISE EXCEPTION 'INVALID_IDENTITY_EVIDENCE_URL' USING ERRCODE = '22023';
  END IF;
  IF p_decision = 'APPROVE' AND (p_candidate_id IS NULL OR cardinality(v_evidence) = 0) THEN
    RAISE EXCEPTION 'CANDIDATE_AND_INDEPENDENT_EVIDENCE_REQUIRED' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_request
    FROM public.candidate_identity_link_requests
    WHERE id = p_request_id
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'IDENTITY_LINK_REQUEST_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF v_request.status <> 'PENDING' THEN
    RAISE EXCEPTION 'IDENTITY_LINK_REQUEST_ALREADY_REVIEWED' USING ERRCODE = '23514';
  END IF;

  IF p_decision = 'APPROVE' THEN
    SELECT * INTO v_account FROM public.candidate_accounts
      WHERE candidate_id = p_candidate_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'CANDIDATE_ACCOUNT_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
    IF v_account.auth_status NOT IN ('PENDING','ACTIVE') OR v_account.account_recovery_required THEN
      RAISE EXCEPTION 'CANDIDATE_ACCOUNT_RESTRICTED' USING ERRCODE = '42501';
    END IF;
    IF v_account.auth_user_id IS NOT NULL AND v_account.auth_user_id <> v_request.auth_user_id THEN
      RAISE EXCEPTION 'CANDIDATE_ALREADY_BOUND_TO_ANOTHER_AUTH_USER' USING ERRCODE = '23505';
    END IF;
    SELECT * INTO v_link FROM public.candidate_auth_identity_links
      WHERE candidate_id = p_candidate_id OR supabase_user_id = v_request.auth_user_id
      FOR UPDATE;
    IF FOUND THEN
      IF v_link.candidate_id <> p_candidate_id OR v_link.supabase_user_id <> v_request.auth_user_id OR v_link.link_status <> 'VERIFIED' THEN
        RAISE EXCEPTION 'IDENTITY_LINK_CONFLICT' USING ERRCODE = '23505';
      END IF;
    ELSE
      INSERT INTO public.candidate_auth_identity_links(
        supabase_user_id, candidate_id, link_status, verified_at, verified_by, created_at, updated_at
      ) VALUES (
        v_request.auth_user_id, p_candidate_id, 'VERIFIED', now(), v_actor, now(), now()
      );
    END IF;
    UPDATE public.candidate_accounts
      SET auth_user_id = v_request.auth_user_id,
          email_verified = true,
          auth_status = 'ACTIVE',
          account_recovery_required = false,
          updated_at = now()
      WHERE candidate_id = p_candidate_id;
  END IF;

  UPDATE public.candidate_identity_link_requests
    SET status = CASE WHEN p_decision = 'APPROVE' THEN 'APPROVED' ELSE 'REJECTED' END,
        reviewed_at = now(),
        reviewed_by = v_actor,
        decision_notes = v_notes,
        review_evidence_urls = v_evidence
    WHERE id = p_request_id;

  INSERT INTO public.audit_events(
    event_id, event_type, severity, correlation_id, actor_id, candidate_id, message, metadata
  ) VALUES (
    v_event_id,
    CASE WHEN p_decision = 'APPROVE' THEN 'CANDIDATE_IDENTITY_LINK_VERIFIED' ELSE 'CANDIDATE_IDENTITY_LINK_REJECTED' END,
    'INFO', v_correlation, v_actor, p_candidate_id,
    CASE WHEN p_decision = 'APPROVE' THEN 'Authorised operator verified candidate identity link with independent evidence.' ELSE 'Authorised operator rejected candidate identity-link request.' END,
    jsonb_build_object(
      'request_id', p_request_id,
      'auth_user_id', v_request.auth_user_id,
      'decision', p_decision,
      'evidence_urls', v_evidence,
      'notes', v_notes
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'requestId', p_request_id,
    'decision', p_decision,
    'candidateId', p_candidate_id,
    'auditEventId', v_event_id,
    'correlationId', v_correlation
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_candidate_identity_link_queue(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_candidate_identity_link(uuid, text, uuid, text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_candidate_identity_link_queue(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_candidate_identity_link(uuid, text, uuid, text[], text) TO authenticated;
