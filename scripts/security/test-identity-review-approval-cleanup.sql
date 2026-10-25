-- Cleanup-only positive integration test of the live identity decision RPC.
-- Uses an existing active candidate and an unlinked Auth account, then removes
-- all request/audit/link fixture rows before the statement completes.
-- This proves the database decision transaction, not authenticated browser E2E.
DO $test$
DECLARE
  v_candidate public.candidates%ROWTYPE;
  v_candidate_user uuid;
  v_request_id uuid;
  v_decision jsonb;
  v_link_ok boolean;
  v_audit_ok boolean;
BEGIN
  SELECT * INTO v_candidate
  FROM public.candidates
  WHERE is_active = true
  ORDER BY created_at
  LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'POSITIVE TEST BLOCKED: no active candidate exists';
  END IF;

  SELECT u.id INTO v_candidate_user
  FROM auth.users u
  WHERE u.id <> 'd0f4dee2-b7d8-481a-adfc-5099630f4ebf'::uuid
    AND NOT EXISTS (
      SELECT 1 FROM public.candidate_auth_identity_links l
      WHERE l.supabase_user_id = u.id OR l.candidate_id = v_candidate.id
    )
  LIMIT 1;
  IF v_candidate_user IS NULL THEN
    RAISE EXCEPTION 'POSITIVE TEST BLOCKED: no unlinked Auth user exists apart from the reviewer';
  END IF;

  INSERT INTO public.candidate_identity_review_requests (
    supabase_user_id, candidate_reference, claimant_name, claimant_message,
    candidate_response, request_status, created_at, updated_at
  ) VALUES (
    v_candidate_user, v_candidate.public_ref, 'Rollback test claimant',
    'Cleanup-only identity review authorization integration test',
    '', 'PENDING', now(), now()
  ) RETURNING id INTO v_request_id;

  INSERT INTO public.candidate_identity_review_audit (
    request_id, actor_auth_user_id, actor_role, action, candidate_id, note,
    before_status, after_status
  ) VALUES (
    v_request_id, v_candidate_user, 'CANDIDATE', 'SUBMITTED', NULL,
    'Cleanup-only integration fixture', 'NONE', 'PENDING'
  );

  v_decision := public.decide_candidate_identity_review(
    v_request_id,
    'd0f4dee2-b7d8-481a-adfc-5099630f4ebf'::uuid,
    'APPROVED',
    v_candidate.public_ref,
    'Cleanup-only positive authorization integration test'
  );

  SELECT EXISTS (
    SELECT 1 FROM public.candidate_auth_identity_links l
    WHERE l.supabase_user_id = v_candidate_user
      AND l.candidate_id = v_candidate.id
      AND l.link_status = 'VERIFIED'
      AND l.verified_at IS NOT NULL
      AND l.verified_by = 'd0f4dee2-b7d8-481a-adfc-5099630f4ebf'
  ) INTO v_link_ok;

  SELECT EXISTS (
    SELECT 1 FROM public.candidate_identity_review_audit a
    WHERE a.request_id = v_request_id
      AND a.actor_auth_user_id = 'd0f4dee2-b7d8-481a-adfc-5099630f4ebf'::uuid
      AND a.actor_role = 'IDENTITY_REVIEWER'
      AND a.action = 'APPROVED'
      AND a.candidate_id = v_candidate.id
      AND a.before_status = 'PENDING'
      AND a.after_status = 'APPROVED'
  ) INTO v_audit_ok;

  IF NOT v_link_ok OR NOT v_audit_ok
     OR v_decision->>'status' <> 'APPROVED'
     OR NOT EXISTS (
       SELECT 1 FROM public.candidate_identity_review_requests r
       WHERE r.id = v_request_id AND r.request_status = 'APPROVED'
         AND r.reviewed_by = 'd0f4dee2-b7d8-481a-adfc-5099630f4ebf'::uuid
     ) THEN
    RAISE EXCEPTION 'POSITIVE TEST FAILED: decision, verified link, or audit evidence missing';
  END IF;

  DELETE FROM public.candidate_auth_identity_links
  WHERE supabase_user_id = v_candidate_user AND candidate_id = v_candidate.id;
  DELETE FROM public.candidate_identity_review_audit WHERE request_id = v_request_id;
  DELETE FROM public.candidate_identity_review_requests WHERE id = v_request_id;
END;
$test$;

SELECT true AS cleanup_only_approval_and_audit_test_passed,
       (SELECT count(*) = 0 FROM public.candidate_identity_review_requests) AS review_queue_still_empty,
       (SELECT count(*) = 0 FROM public.candidate_auth_identity_links) AS identity_links_still_empty;
