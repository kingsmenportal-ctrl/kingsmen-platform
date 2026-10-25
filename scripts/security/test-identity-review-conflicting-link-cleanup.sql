-- Cleanup-only staging integration probe: conflicting account/candidate links
-- must fail closed without creating a second link or deciding the request.
-- This is database integration evidence, not authenticated HTTP/browser E2E.
DO $test$
DECLARE
  v_candidate public.candidates%ROWTYPE;
  v_owner uuid;
  v_other uuid;
  v_reviewer uuid := 'd0f4dee2-b7d8-481a-adfc-5099630f4ebf'::uuid;
  v_request uuid;
  v_code text;
  v_status text;
  v_owner_link_count integer;
  v_conflict_preserved boolean;
BEGIN
  SELECT * INTO v_candidate FROM public.candidates c
  WHERE c.is_active = true
    AND NOT EXISTS (SELECT 1 FROM public.candidate_auth_identity_links l WHERE l.candidate_id=c.id)
  ORDER BY c.created_at LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'TEST BLOCKED: no unlinked active candidate available'; END IF;
  SELECT id INTO v_owner FROM auth.users WHERE id <> v_reviewer
    AND NOT EXISTS (SELECT 1 FROM public.candidate_auth_identity_links l WHERE l.supabase_user_id=auth.users.id)
    ORDER BY created_at LIMIT 1;
  SELECT id INTO v_other FROM auth.users WHERE id <> v_reviewer AND id <> v_owner
    AND NOT EXISTS (SELECT 1 FROM public.candidate_auth_identity_links l WHERE l.supabase_user_id=auth.users.id)
    ORDER BY created_at LIMIT 1;
  IF v_owner IS NULL OR v_other IS NULL THEN RAISE EXCEPTION 'TEST BLOCKED: two unlinked non-reviewer Auth accounts required'; END IF;

  INSERT INTO public.candidate_auth_identity_links (supabase_user_id,candidate_id,link_status,created_at,updated_at)
  VALUES (v_other,v_candidate.id,'PENDING',now(),now());
  INSERT INTO public.candidate_identity_review_requests (supabase_user_id,candidate_reference,claimant_name,claimant_message,candidate_response,request_status,created_at,updated_at)
  VALUES (v_owner,v_candidate.public_ref,'Conflict test claimant','Cleanup-only conflicting identity claim test','','PENDING',now(),now())
  RETURNING id INTO v_request;

  BEGIN
    PERFORM public.decide_candidate_identity_review(v_request,v_reviewer,'APPROVED',v_candidate.public_ref,'Cleanup-only conflicting link test');
    RAISE EXCEPTION 'SECURITY TEST FAILED: conflicting candidate/account link was approved' USING ERRCODE='P0001';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_code = RETURNED_SQLSTATE;
    IF v_code='P0001' THEN RAISE; END IF;
    IF v_code<>'23505' THEN RAISE EXCEPTION 'SECURITY TEST FAILED: expected 23505 conflict denial, received %',v_code; END IF;
  END;

  SELECT request_status INTO v_status FROM public.candidate_identity_review_requests WHERE id=v_request;
  SELECT count(*) INTO v_owner_link_count FROM public.candidate_auth_identity_links WHERE supabase_user_id=v_owner;
  SELECT EXISTS (SELECT 1 FROM public.candidate_auth_identity_links WHERE supabase_user_id=v_other AND candidate_id=v_candidate.id AND link_status='PENDING') INTO v_conflict_preserved;
  IF v_status<>'PENDING' OR v_owner_link_count<>0 OR NOT v_conflict_preserved THEN
    RAISE EXCEPTION 'TEST FAILED: conflict handling changed request or identity links unexpectedly';
  END IF;
  DELETE FROM public.candidate_identity_review_audit WHERE request_id=v_request;
  DELETE FROM public.candidate_identity_review_requests WHERE id=v_request;
  DELETE FROM public.candidate_auth_identity_links WHERE supabase_user_id=v_other AND candidate_id=v_candidate.id AND link_status='PENDING';
END;
$test$;
SELECT true AS conflicting_identity_link_fails_closed,
       (SELECT count(*)=0 FROM public.candidate_identity_review_requests) AS requests_clean_after_test,
       (SELECT count(*)=0 FROM public.candidate_identity_review_audit) AS audit_clean_after_test,
       (SELECT count(*)=0 FROM public.candidate_auth_identity_links) AS links_clean_after_test;
