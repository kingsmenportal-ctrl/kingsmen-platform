-- 0068: candidate portal messages are persisted and audited with candidate ownership checks.
CREATE OR REPLACE FUNCTION public.create_candidate_portal_message(
  p_auth_user_id uuid,
  p_candidate_id uuid,
  p_subject text,
  p_body text,
  p_urgency text DEFAULT 'ROUTINE',
  p_correlation_id text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_message public.candidate_messages%ROWTYPE;
  v_event_id uuid := gen_random_uuid();
  v_correlation text := COALESCE(NULLIF(p_correlation_id,''), gen_random_uuid()::text);
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'SERVER_SIDE_MESSAGE_PROCESSOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_auth_user_id IS NULL OR p_candidate_id IS NULL
    OR length(trim(COALESCE(p_subject,''))) < 3 OR length(p_subject) > 180
    OR length(trim(COALESCE(p_body,''))) < 10 OR length(p_body) > 8000
    OR p_urgency NOT IN ('ROUTINE','IMPORTANT','URGENT')
  THEN
    RAISE EXCEPTION 'INVALID_CANDIDATE_MESSAGE' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.candidates c
    JOIN public.candidate_accounts ca ON ca.candidate_id = c.id
    JOIN public.candidate_auth_identity_links l ON l.candidate_id = c.id
    WHERE c.id = p_candidate_id AND c.is_active = true
      AND ca.auth_user_id = p_auth_user_id AND ca.auth_status = 'ACTIVE'
      AND ca.email_verified = true AND ca.account_recovery_required = false
      AND l.supabase_user_id = p_auth_user_id AND l.link_status = 'VERIFIED'
      AND l.verified_at IS NOT NULL AND l.verified_by IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'VERIFIED_ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.candidate_messages(
    candidate_id, channel, direction, urgency, subject, body,
    delivery_status, correlation_id, created_at
  ) VALUES (
    p_candidate_id, 'PORTAL', 'INBOUND', p_urgency, trim(p_subject), trim(p_body),
    'QUEUED', v_correlation, now()
  ) RETURNING * INTO v_message;

  INSERT INTO public.audit_events(
    event_id, event_type, severity, correlation_id, actor_id, candidate_id, message, metadata
  ) VALUES (
    v_event_id, 'CANDIDATE_MESSAGE_CREATED', 'INFO', v_correlation, p_auth_user_id, p_candidate_id,
    'Candidate submitted a portal message for authorised operator review.',
    jsonb_build_object('message_id', v_message.id, 'channel', 'PORTAL', 'urgency', p_urgency)
  );

  RETURN jsonb_build_object('ok', true, 'message', to_jsonb(v_message), 'auditEventId', v_event_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_candidate_portal_message_read(
  p_auth_user_id uuid,
  p_candidate_id uuid,
  p_message_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_message public.candidate_messages%ROWTYPE;
  v_event_id uuid := gen_random_uuid();
  v_correlation text := gen_random_uuid()::text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'SERVER_SIDE_MESSAGE_PROCESSOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.candidates c
    JOIN public.candidate_accounts ca ON ca.candidate_id = c.id
    JOIN public.candidate_auth_identity_links l ON l.candidate_id = c.id
    WHERE c.id = p_candidate_id AND c.is_active = true
      AND ca.auth_user_id = p_auth_user_id AND ca.auth_status = 'ACTIVE'
      AND ca.email_verified = true AND ca.account_recovery_required = false
      AND l.supabase_user_id = p_auth_user_id AND l.link_status = 'VERIFIED'
      AND l.verified_at IS NOT NULL AND l.verified_by IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'VERIFIED_ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE = '42501';
  END IF;
  UPDATE public.candidate_messages
    SET delivery_status = 'READ', read_at = COALESCE(read_at, now())
    WHERE id = p_message_id AND candidate_id = p_candidate_id
      AND direction IN ('OUTBOUND','SYSTEM')
    RETURNING * INTO v_message;
  IF NOT FOUND THEN RAISE EXCEPTION 'CANDIDATE_MESSAGE_NOT_FOUND_OR_NOT_READABLE' USING ERRCODE = 'P0002'; END IF;

  INSERT INTO public.audit_events(
    event_id, event_type, severity, correlation_id, actor_id, candidate_id, message, metadata
  ) VALUES (
    v_event_id, 'CANDIDATE_MESSAGE_READ', 'INFO', v_correlation, p_auth_user_id, p_candidate_id,
    'Candidate marked a portal message as read.',
    jsonb_build_object('message_id', v_message.id)
  );
  RETURN jsonb_build_object('ok', true, 'messageId', v_message.id, 'readAt', v_message.read_at, 'auditEventId', v_event_id);
END;
$$;

REVOKE ALL ON FUNCTION public.create_candidate_portal_message(uuid, uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_candidate_portal_message_read(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_candidate_portal_message(uuid, uuid, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_candidate_portal_message_read(uuid, uuid, uuid) TO service_role;
