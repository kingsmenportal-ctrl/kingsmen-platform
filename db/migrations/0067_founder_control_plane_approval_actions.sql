-- 0067: audited decisions for control-plane approvals and policy exceptions.
ALTER TABLE public.policy_exception_register
  ADD COLUMN IF NOT EXISTS review_notes text;

CREATE OR REPLACE FUNCTION public.founder_review_control_plane_approval(
  p_approval_id uuid,
  p_decision text,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_approval public.control_plane_approval_queue%ROWTYPE;
  v_audit_ref text := 'FO-APPROVAL-' || gen_random_uuid()::text;
  v_reason text := left(trim(COALESCE(p_reason,'')), 2000);
BEGIN
  IF v_actor IS NULL OR NOT kingsmen_security.is_founder_or_operator() THEN
    RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_approval_id IS NULL OR p_decision IS NULL OR p_decision NOT IN ('APPROVED','REJECTED') OR length(v_reason) < 8 THEN
    RAISE EXCEPTION 'APPROVAL_DECISION_AND_REASON_REQUIRED' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_approval FROM public.control_plane_approval_queue
    WHERE id = p_approval_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'APPROVAL_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF v_approval.decision <> 'PENDING' THEN RAISE EXCEPTION 'APPROVAL_ALREADY_DECIDED' USING ERRCODE = '23514'; END IF;
  IF p_decision = 'APPROVED' AND v_approval.risk_level IN ('HIGH','CRITICAL')
    AND COALESCE(cardinality(v_approval.evidence_refs), 0) = 0 THEN
    RAISE EXCEPTION 'HIGH_RISK_APPROVAL_EVIDENCE_REQUIRED' USING ERRCODE = '23514';
  END IF;

  UPDATE public.control_plane_approval_queue
    SET decision = p_decision, decision_reason = v_reason,
        reviewed_by_operator_ref = v_actor::text, decided_at = now()
    WHERE id = p_approval_id;

  INSERT INTO public.founder_ops_audit_events(
    audit_ref, actor_ref, action_key, command_ref, target_ref, severity, audit_message, audit_payload, evidence_refs
  ) VALUES (
    v_audit_ref, v_actor::text, 'CONTROL_PLANE_APPROVAL_' || p_decision,
    v_approval.command_ref, v_approval.target_ref,
    CASE WHEN v_approval.risk_level IN ('HIGH','CRITICAL') THEN 'WARNING' ELSE 'INFO' END,
    'Founder/operator recorded a control-plane approval decision. This decision does not itself execute the command.',
    jsonb_build_object('approval_id', p_approval_id, 'approval_ref', v_approval.approval_ref,
      'command_ref', v_approval.command_ref, 'risk_level', v_approval.risk_level,
      'decision', p_decision, 'reason', v_reason),
    v_approval.evidence_refs
  );
  RETURN jsonb_build_object('ok', true, 'approvalId', p_approval_id, 'decision', p_decision,
    'auditRef', v_audit_ref, 'message', 'Approval decision recorded. Command execution remains a separate authorised operation.');
END;
$$;

CREATE OR REPLACE FUNCTION public.founder_review_policy_exception(
  p_exception_id uuid,
  p_decision text,
  p_notes text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_exception public.policy_exception_register%ROWTYPE;
  v_audit_ref text := 'FO-POLICY-EXCEPTION-' || gen_random_uuid()::text;
  v_notes text := left(trim(COALESCE(p_notes,'')), 2000);
BEGIN
  IF v_actor IS NULL OR NOT kingsmen_security.is_founder_or_operator() THEN
    RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_exception_id IS NULL OR p_decision IS NULL OR p_decision NOT IN ('APPROVED','REJECTED') OR length(v_notes) < 8 THEN
    RAISE EXCEPTION 'POLICY_EXCEPTION_DECISION_AND_REASON_REQUIRED' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_exception FROM public.policy_exception_register
    WHERE id = p_exception_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'POLICY_EXCEPTION_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF v_exception.exception_status <> 'PENDING_REVIEW' THEN RAISE EXCEPTION 'POLICY_EXCEPTION_ALREADY_REVIEWED' USING ERRCODE = '23514'; END IF;
  IF p_decision = 'APPROVED' AND (v_exception.expiry_at IS NULL OR v_exception.expiry_at <= now() OR COALESCE(cardinality(v_exception.evidence_refs), 0) = 0) THEN
    RAISE EXCEPTION 'POLICY_EXCEPTION_NEEDS_FUTURE_EXPIRY_AND_EVIDENCE' USING ERRCODE = '23514';
  END IF;

  UPDATE public.policy_exception_register
    SET exception_status = p_decision, reviewed_by = v_actor::text,
        reviewed_at = now(), review_notes = v_notes
    WHERE id = p_exception_id;

  INSERT INTO public.founder_ops_audit_events(
    audit_ref, actor_ref, action_key, target_ref, severity, audit_message, audit_payload, evidence_refs
  ) VALUES (
    v_audit_ref, v_actor::text, 'POLICY_EXCEPTION_' || p_decision,
    v_exception.exception_ref, CASE WHEN p_decision = 'APPROVED' THEN 'WARNING' ELSE 'INFO' END,
    'Founder/operator reviewed a policy exception request.',
    jsonb_build_object('exception_id', p_exception_id, 'exception_ref', v_exception.exception_ref,
      'policy_ref', v_exception.policy_ref, 'decision', p_decision, 'notes', v_notes,
      'expiry_at', v_exception.expiry_at),
    v_exception.evidence_refs
  );
  RETURN jsonb_build_object('ok', true, 'exceptionId', p_exception_id, 'decision', p_decision, 'auditRef', v_audit_ref);
END;
$$;

REVOKE ALL ON FUNCTION public.founder_review_control_plane_approval(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.founder_review_policy_exception(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.founder_review_control_plane_approval(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.founder_review_policy_exception(uuid, text, text) TO authenticated;
