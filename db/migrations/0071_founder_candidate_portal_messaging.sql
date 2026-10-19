-- 0071: two-way candidate portal messaging with founder/operator reply and audit.
CREATE OR REPLACE FUNCTION public.get_founder_candidate_messages(p_limit integer DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_messages jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT kingsmen_security.is_founder_or_operator() THEN
    RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at ASC), '[]'::jsonb)
  INTO v_messages
  FROM (
    SELECT m.id, m.candidate_id, c.public_ref, c.display_name, c.email,
      m.subject, m.body, m.urgency, m.delivery_status, m.correlation_id, m.created_at
    FROM public.candidate_messages m
    JOIN public.candidates c ON c.id = m.candidate_id
    WHERE c.is_active = true AND m.channel = 'PORTAL' AND m.direction = 'OUTBOUND'
      AND m.delivery_status IN ('QUEUED','DELIVERED') AND m.read_at IS NULL
    ORDER BY m.created_at ASC
    LIMIT LEAST(GREATEST(COALESCE(p_limit,100),1),200)
  ) x;
  RETURN jsonb_build_object('ok', true, 'messages', v_messages, 'generatedAt', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.founder_reply_candidate_message(
  p_message_id uuid,
  p_subject text,
  p_body text,
  p_urgency text DEFAULT 'ROUTINE'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_source public.candidate_messages%ROWTYPE;
  v_reply public.candidate_messages%ROWTYPE;
  v_event_id uuid := gen_random_uuid();
  v_correlation uuid := gen_random_uuid();
  v_subject text := left(trim(COALESCE(p_subject,'')),180);
  v_body text := left(trim(COALESCE(p_body,'')),8000);
BEGIN
  IF v_actor IS NULL OR NOT kingsmen_security.is_founder_or_operator() THEN
    RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_message_id IS NULL OR length(v_subject) < 3 OR length(v_body) < 10
    OR p_urgency IS NULL OR p_urgency NOT IN ('ROUTINE','IMPORTANT','URGENT')
  THEN
    RAISE EXCEPTION 'INVALID_FOUNDER_MESSAGE_REPLY' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_source FROM public.candidate_messages
    WHERE id = p_message_id AND channel = 'PORTAL' AND direction = 'OUTBOUND'
      AND delivery_status IN ('QUEUED','DELIVERED') AND read_at IS NULL
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CANDIDATE_MESSAGE_ALREADY_HANDLED_OR_NOT_FOUND' USING ERRCODE = '23514'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.candidates WHERE id = v_source.candidate_id AND is_active = true) THEN
    RAISE EXCEPTION 'CANDIDATE_RECORD_INACTIVE' USING ERRCODE = '23514';
  END IF;

  UPDATE public.candidate_messages SET delivery_status = 'READ', read_at = now()
    WHERE id = p_message_id;

  INSERT INTO public.candidate_messages(
    candidate_id, channel, direction, urgency, subject, body, delivery_status,
    correlation_id, created_at, sent_at
  ) VALUES (
    v_source.candidate_id, 'PORTAL', 'INBOUND', p_urgency, v_subject, v_body,
    'DELIVERED', v_correlation::text, now(), now()
  ) RETURNING * INTO v_reply;

  INSERT INTO public.audit_events(
    event_id, event_type, severity, correlation_id, actor_id, candidate_id, message, metadata
  ) VALUES (
    v_event_id, 'FOUNDER_REPLIED_TO_CANDIDATE_MESSAGE', 'INFO', v_correlation, v_actor,
    v_source.candidate_id, 'Founder/operator replied to a candidate portal message.',
    jsonb_build_object('source_message_id', p_message_id, 'reply_message_id', v_reply.id,
      'source_correlation_id', v_source.correlation_id, 'urgency', p_urgency)
  );

  RETURN jsonb_build_object('ok', true, 'reply', to_jsonb(v_reply), 'auditEventId', v_event_id,
    'message', 'Reply saved to the candidate portal and audited. External email/SMS delivery is not implied.');
END;
$$;

REVOKE ALL ON FUNCTION public.get_founder_candidate_messages(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.founder_reply_candidate_message(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_founder_candidate_messages(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.founder_reply_candidate_message(uuid, text, text, text) TO authenticated;
