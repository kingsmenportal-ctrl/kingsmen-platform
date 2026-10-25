-- Runtime negative tests for the identity decision RPC.
-- Run after migration 20261025120000_identity_review_least_privilege_role.sql
-- with an operator SQL session. Each call must fail at the role gate before
-- request lookup; no fixture rows are inserted or changed.
DO $test$
DECLARE
  v_decision text;
  v_error_state text;
BEGIN
  FOREACH v_decision IN ARRAY ARRAY['APPROVED', 'REJECTED', 'NEEDS_INFORMATION']
  LOOP
    BEGIN
      PERFORM public.decide_candidate_identity_review(
        '00000000-0000-0000-0000-000000000001'::uuid,
        '00000000-0000-0000-0000-000000000002'::uuid,
        v_decision,
        CASE WHEN v_decision = 'APPROVED' THEN 'NONEXISTENT-TEST-REF' ELSE NULL END,
        'negative authorization test'
      );
      RAISE EXCEPTION 'SECURITY TEST FAILED: unauthorised reviewer was allowed for %', v_decision;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_state = RETURNED_SQLSTATE;
      IF v_error_state = 'P0001' THEN
        RAISE; -- preserve our own explicit failure above
      END IF;
      IF v_error_state <> '42501' THEN
        RAISE EXCEPTION 'SECURITY TEST FAILED: expected 42501 for %, received %', v_decision, v_error_state;
      END IF;
    END;
  END LOOP;
END;
$test$;


-- Test that the legacy broad PLATFORM_ADMIN role is not sufficient. The
-- temporary grant is created and removed inside one DO statement; no grant
-- remains after the statement completes. It uses an existing non-reviewer
-- Auth UUID but does not expose it in the result.
DO $test$
DECLARE
  v_test_user uuid;
  v_error_state text;
BEGIN
  SELECT u.id INTO v_test_user
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.platform_reviewers r
    WHERE r.auth_user_id = u.id
  )
  LIMIT 1;
  IF v_test_user IS NULL THEN
    RAISE EXCEPTION 'SECURITY TEST BLOCKED: no unassigned Auth user available for the temporary role probe';
  END IF;

  INSERT INTO public.platform_reviewers (
    auth_user_id, role_code, is_active, granted_by_auth_user_id, granted_at
  ) VALUES (v_test_user, 'PLATFORM_ADMIN', true, NULL, now());

  BEGIN
    PERFORM public.decide_candidate_identity_review(
      '00000000-0000-0000-0000-000000000001'::uuid,
      v_test_user,
      'REJECTED',
      NULL,
      'legacy role denial test'
    );
    RAISE EXCEPTION 'SECURITY TEST FAILED: PLATFORM_ADMIN bypassed the dedicated identity role gate';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error_state = RETURNED_SQLSTATE;
    IF v_error_state = 'P0001' THEN
      RAISE;
    END IF;
    IF v_error_state <> '42501' THEN
      RAISE EXCEPTION 'SECURITY TEST FAILED: expected 42501 for PLATFORM_ADMIN, received %', v_error_state;
    END IF;
  END;

  DELETE FROM public.platform_reviewers
  WHERE auth_user_id = v_test_user AND role_code = 'PLATFORM_ADMIN';
END;
$test$;

-- Confirm the RPC is not directly executable by client roles.
SELECT
  has_function_privilege('anon', 'public.decide_candidate_identity_review(uuid,uuid,text,text,text)', 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', 'public.decide_candidate_identity_review(uuid,uuid,text,text,text)', 'EXECUTE') AS authenticated_can_execute,
  has_function_privilege('service_role', 'public.decide_candidate_identity_review(uuid,uuid,text,text,text)', 'EXECUTE') AS service_role_can_execute;
