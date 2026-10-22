-- Let an authenticated candidate request identity review without granting direct
-- access to the backend-only queue or audit tables. The caller identity is derived
-- exclusively from auth.uid(); callers cannot submit on behalf of another account.
CREATE OR REPLACE FUNCTION public.submit_candidate_identity_review(
  p_candidate_reference text,
  p_claimant_name text,
  p_claimant_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_reference text := trim(coalesce(p_candidate_reference, ''));
  v_name text := trim(coalesce(p_claimant_name, ''));
  v_message text := trim(coalesce(p_claimant_message, ''));
  v_request_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required' USING ERRCODE = '42501';
  END IF;
  IF length(v_reference) < 2 OR length(v_reference) > 120 THEN
    RAISE EXCEPTION 'Candidate reference must be 2 to 120 characters' USING ERRCODE = '22023';
  END IF;
  IF length(v_name) < 2 OR length(v_name) > 160 THEN
    RAISE EXCEPTION 'Claimant name must be 2 to 160 characters' USING ERRCODE = '22023';
  END IF;
  IF length(v_message) < 3 OR length(v_message) > 1200 THEN
    RAISE EXCEPTION 'A message of 3 to 1200 characters is required' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.candidate_identity_review_requests r
    WHERE r.supabase_user_id = v_user_id
      AND r.request_status IN ('PENDING', 'NEEDS_INFORMATION')
  ) THEN
    RAISE EXCEPTION 'This account already has an open identity review request'
      USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.candidate_identity_review_requests (
    supabase_user_id, candidate_reference, claimant_name, claimant_message,
    request_status, created_at, updated_at
  ) VALUES (
    v_user_id, v_reference, v_name, v_message, 'PENDING', now(), now()
  )
  RETURNING id INTO v_request_id;

  INSERT INTO public.candidate_identity_review_audit (
    request_id, actor_auth_user_id, actor_role, action, candidate_id, note,
    before_status, after_status
  ) VALUES (
    v_request_id, v_user_id, 'CANDIDATE', 'SUBMITTED', NULL, v_message,
    NULL, 'PENDING'
  );

  RETURN jsonb_build_object('request_id', v_request_id, 'status', 'PENDING');
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_candidate_identity_review(text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_candidate_identity_review(text, text, text)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.submit_candidate_identity_review(text, text, text) IS
  'Creates an identity-review request for auth.uid() only and appends the initial audit event atomically. Does not verify identity or grant candidate access.';
