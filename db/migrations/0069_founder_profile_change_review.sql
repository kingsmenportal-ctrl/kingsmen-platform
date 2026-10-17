-- 0069: founder review for candidate profile correction requests.
CREATE OR REPLACE FUNCTION public.get_founder_profile_change_queue(p_limit integer DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_requests jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT kingsmen_security.is_founder_or_operator() THEN
    RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.requested_at ASC), '[]'::jsonb)
  INTO v_requests
  FROM (
    SELECT r.id, r.candidate_id, c.public_ref, c.display_name, c.email,
      r.field_name, r.old_value, r.requested_value, r.reason, r.sensitivity,
      r.status, r.requested_at, r.source_evidence_ref
    FROM public.candidate_profile_change_requests r
    JOIN public.candidates c ON c.id = r.candidate_id
    WHERE r.status = 'PENDING'
    ORDER BY r.requested_at ASC
    LIMIT LEAST(GREATEST(COALESCE(p_limit,100),1),200)
  ) x;
  RETURN jsonb_build_object('ok', true, 'requests', v_requests, 'generatedAt', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.review_candidate_profile_change(
  p_request_id uuid,
  p_decision text,
  p_notes text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_request public.candidate_profile_change_requests%ROWTYPE;
  v_candidate public.candidates%ROWTYPE;
  v_profile public.candidate_profiles%ROWTYPE;
  v_current_value text;
  v_event_id uuid := gen_random_uuid();
  v_correlation uuid := gen_random_uuid();
  v_notes text := left(trim(COALESCE(p_notes,'')), 2000);
BEGIN
  IF v_actor IS NULL OR NOT kingsmen_security.is_founder_or_operator() THEN
    RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_request_id IS NULL OR p_decision IS NULL OR p_decision NOT IN ('APPROVED','REJECTED') OR length(v_notes) < 8 THEN
    RAISE EXCEPTION 'PROFILE_REVIEW_DECISION_AND_REASON_REQUIRED' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_request FROM public.candidate_profile_change_requests
    WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PROFILE_CHANGE_REQUEST_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF v_request.status <> 'PENDING' THEN RAISE EXCEPTION 'PROFILE_CHANGE_ALREADY_REVIEWED' USING ERRCODE = '23514'; END IF;
  SELECT * INTO v_candidate FROM public.candidates WHERE id = v_request.candidate_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CANDIDATE_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;

  IF p_decision = 'APPROVED' THEN
    SELECT * INTO v_profile FROM public.candidate_profiles WHERE candidate_id = v_request.candidate_id FOR UPDATE;
    CASE v_request.field_name
      WHEN 'display_name' THEN v_current_value := v_candidate.display_name;
      WHEN 'phone' THEN v_current_value := v_candidate.phone;
      WHEN 'city' THEN v_current_value := v_profile.city;
      WHEN 'province' THEN v_current_value := v_profile.province;
      WHEN 'highest_grade' THEN v_current_value := v_profile.highest_grade;
      ELSE RAISE EXCEPTION 'PROFILE_FIELD_NOT_APPROVABLE' USING ERRCODE = '22023';
    END CASE;
    IF v_current_value IS DISTINCT FROM v_request.old_value THEN
      RAISE EXCEPTION 'PROFILE_CHANGED_SINCE_REQUEST' USING ERRCODE = '23514';
    END IF;

    CASE v_request.field_name
      WHEN 'display_name' THEN
        UPDATE public.candidates SET display_name = v_request.requested_value, updated_at = now()
          WHERE id = v_request.candidate_id;
      WHEN 'phone' THEN
        UPDATE public.candidates SET phone = v_request.requested_value, updated_at = now()
          WHERE id = v_request.candidate_id;
      WHEN 'city' THEN
        INSERT INTO public.candidate_profiles(candidate_id, city, reviewed_by_operator, reviewed_at, updated_at)
          VALUES (v_request.candidate_id, v_request.requested_value, true, now(), now())
          ON CONFLICT (candidate_id) DO UPDATE SET city = EXCLUDED.city, reviewed_by_operator = true, reviewed_at = now(), updated_at = now();
      WHEN 'province' THEN
        INSERT INTO public.candidate_profiles(candidate_id, province, reviewed_by_operator, reviewed_at, updated_at)
          VALUES (v_request.candidate_id, v_request.requested_value, true, now(), now())
          ON CONFLICT (candidate_id) DO UPDATE SET province = EXCLUDED.province, reviewed_by_operator = true, reviewed_at = now(), updated_at = now();
      WHEN 'highest_grade' THEN
        INSERT INTO public.candidate_profiles(candidate_id, highest_grade, reviewed_by_operator, reviewed_at, updated_at)
          VALUES (v_request.candidate_id, v_request.requested_value, true, now(), now())
          ON CONFLICT (candidate_id) DO UPDATE SET highest_grade = EXCLUDED.highest_grade, reviewed_by_operator = true, reviewed_at = now(), updated_at = now();
    END CASE;
  END IF;

  UPDATE public.candidate_profile_change_requests
    SET status = p_decision, decided_by = v_actor::text, decided_at = now(), decision_notes = v_notes
    WHERE id = p_request_id;

  INSERT INTO public.audit_events(
    event_id, event_type, severity, correlation_id, actor_id, candidate_id, message, metadata
  ) VALUES (
    v_event_id,
    CASE WHEN p_decision = 'APPROVED' THEN 'CANDIDATE_PROFILE_CHANGE_APPROVED' ELSE 'CANDIDATE_PROFILE_CHANGE_REJECTED' END,
    'INFO', v_correlation, v_actor, v_request.candidate_id,
    CASE WHEN p_decision = 'APPROVED' THEN 'Founder/operator approved and applied a candidate profile correction.'
         ELSE 'Founder/operator rejected a candidate profile correction.' END,
    jsonb_build_object('request_id', p_request_id, 'field_name', v_request.field_name,
      'old_value', v_request.old_value, 'requested_value', v_request.requested_value,
      'decision', p_decision, 'notes', v_notes)
  );

  RETURN jsonb_build_object('ok', true, 'requestId', p_request_id, 'decision', p_decision,
    'auditEventId', v_event_id, 'message', CASE WHEN p_decision = 'APPROVED'
      THEN 'Profile correction applied and audited.' ELSE 'Profile correction rejected and audited.' END);
END;
$$;

REVOKE ALL ON FUNCTION public.get_founder_profile_change_queue(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_candidate_profile_change(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_founder_profile_change_queue(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_candidate_profile_change(uuid, text, text) TO authenticated;
