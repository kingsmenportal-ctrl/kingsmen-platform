-- Candidate-owned follow-up and status read boundary for identity review.
-- All candidate data access remains behind authenticated Edge Functions.
CREATE OR REPLACE FUNCTION public.submit_candidate_identity_review_followup(
  p_request_id uuid,
  p_candidate_auth_user_id uuid,
  p_response text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_request public.candidate_identity_review_requests%ROWTYPE;
  v_response text := trim(coalesce(p_response, ''));
BEGIN
  IF p_request_id IS NULL OR p_candidate_auth_user_id IS NULL
     OR length(v_response) < 3 OR length(v_response) > 1200 THEN
    RAISE EXCEPTION 'A request, authenticated candidate, and response of 3–1200 characters are required'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_request
  FROM public.candidate_identity_review_requests
  WHERE id = p_request_id
    AND supabase_user_id = p_candidate_auth_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Identity review request not found for this account'
      USING ERRCODE = 'P0002';
  END IF;
  IF v_request.request_status <> 'NEEDS_INFORMATION' THEN
    RAISE EXCEPTION 'A candidate response is accepted only when more information was requested'
      USING ERRCODE = '55000';
  END IF;

  UPDATE public.candidate_identity_review_requests
  SET candidate_response = left(
        concat_ws(E'\n\n', nullif(trim(candidate_response), ''),
          '[' || to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') || '] ' || v_response),
        6000
      ),
      request_status = 'PENDING',
      reviewer_note = NULL,
      reviewed_by = NULL,
      reviewed_at = NULL,
      updated_at = now()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  INSERT INTO public.candidate_identity_review_audit (
    request_id, actor_auth_user_id, actor_role, action, candidate_id, note,
    before_status, after_status, created_at
  ) VALUES (
    p_request_id, p_candidate_auth_user_id, 'CANDIDATE', 'CANDIDATE_RESPONSE',
    NULL, v_response, 'NEEDS_INFORMATION', 'PENDING', now()
  );

  RETURN jsonb_build_object(
    'request_id', v_request.id,
    'status', v_request.request_status,
    'updated_at', v_request.updated_at
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_candidate_identity_review_followup(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_candidate_identity_review_followup(uuid, uuid, text)
  TO service_role;
