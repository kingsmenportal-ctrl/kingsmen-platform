-- Cleanup-only staging integration probe for candidate follow-up ownership,
-- request status transition, and audit persistence. Run with an operator SQL session.
-- This is database integration evidence, not authenticated HTTP/browser E2E.
DO $test$
DECLARE
  v_owner uuid;
  v_other uuid;
  v_request uuid;
  v_status text;
  v_response text;
  v_audit boolean;
  v_code text;
BEGIN
  SELECT id INTO v_owner FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_other FROM auth.users WHERE id <> v_owner ORDER BY created_at LIMIT 1;
  IF v_owner IS NULL OR v_other IS NULL THEN
    RAISE EXCEPTION 'TEST BLOCKED: two Auth users are required';
  END IF;

  INSERT INTO public.candidate_identity_review_requests (
    supabase_user_id, candidate_reference, claimant_name, claimant_message,
    candidate_response, request_status, created_at, updated_at
  ) VALUES (
    v_owner, 'TEST-FOLLOWUP-OWNER-BOUNDARY', 'Cleanup-only test claimant',
    'Cleanup-only test request for candidate follow-up ownership',
    '', 'NEEDS_INFORMATION', now(), now()
  ) RETURNING id INTO v_request;

  BEGIN
    PERFORM public.submit_candidate_identity_review_followup(
      v_request, v_other, 'Must not read or mutate another account request'
    );
    RAISE EXCEPTION 'SECURITY TEST FAILED: non-owner candidate response was accepted'
      USING ERRCODE = 'P0001';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_code = RETURNED_SQLSTATE;
    IF v_code = 'P0001' THEN RAISE; END IF;
    IF v_code <> 'P0002' THEN
      RAISE EXCEPTION 'SECURITY TEST FAILED: expected owner-boundary P0002, received %', v_code;
    END IF;
  END;

  PERFORM public.submit_candidate_identity_review_followup(
    v_request, v_owner, 'Cleanup-only valid candidate response'
  );

  SELECT request_status, candidate_response
    INTO v_status, v_response
  FROM public.candidate_identity_review_requests WHERE id = v_request;

  SELECT EXISTS (
    SELECT 1 FROM public.candidate_identity_review_audit
    WHERE request_id = v_request
      AND actor_auth_user_id = v_owner
      AND actor_role = 'CANDIDATE'
      AND action = 'CANDIDATE_RESPONSE'
      AND before_status = 'NEEDS_INFORMATION'
      AND after_status = 'PENDING'
      AND note = 'Cleanup-only valid candidate response'
  ) INTO v_audit;

  IF v_status <> 'PENDING'
     OR position('Cleanup-only valid candidate response' in v_response) = 0
     OR NOT v_audit THEN
    RAISE EXCEPTION 'TEST FAILED: follow-up status, response, or audit event was not persisted';
  END IF;

  DELETE FROM public.candidate_identity_review_audit WHERE request_id = v_request;
  DELETE FROM public.candidate_identity_review_requests WHERE id = v_request;
END;
$test$;

SELECT true AS candidate_followup_owner_boundary_and_audit_test_passed,
       (SELECT count(*) = 0 FROM public.candidate_identity_review_requests) AS review_queue_clean_after_test,
       (SELECT count(*) = 0 FROM public.candidate_identity_review_audit) AS audit_clean_after_test;
