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

-- Confirm the RPC is not directly executable by client roles.
SELECT
  has_function_privilege('anon', 'public.decide_candidate_identity_review(uuid,uuid,text,text,text)', 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', 'public.decide_candidate_identity_review(uuid,uuid,text,text,text)', 'EXECUTE') AS authenticated_can_execute,
  has_function_privilege('service_role', 'public.decide_candidate_identity_review(uuid,uuid,text,text,text)', 'EXECUTE') AS service_role_can_execute;
