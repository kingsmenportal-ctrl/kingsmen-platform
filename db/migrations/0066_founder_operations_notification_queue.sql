-- 0066: founder operations queues and audited notification/dead-letter controls.
CREATE OR REPLACE FUNCTION public.get_founder_ops_queue(p_limit integer DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 200);
  v_notifications jsonb;
  v_attempts jsonb;
  v_dead_letters jsonb;
  v_integration_dead_letters jsonb;
  v_approvals jsonb;
  v_policy_exceptions jsonb;
  v_recent_audit jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT kingsmen_security.is_founder_or_operator() THEN
    RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at ASC), '[]'::jsonb) INTO v_notifications
  FROM (
    SELECT id, notification_ref, candidate_ref, application_ref, template_key, channel, subject,
      purpose, urgency, status, idempotency_key, scheduled_for, sent_at, failed_at, last_error, created_at
    FROM public.notification_outbox
    WHERE status IN ('QUEUED','FAILED') OR (status = 'SENDING' AND locked_at < now() - interval '15 minutes')
    ORDER BY CASE WHEN status = 'FAILED' THEN 0 WHEN status = 'SENDING' THEN 1 ELSE 2 END, created_at ASC
    LIMIT v_limit
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.attempted_at DESC), '[]'::jsonb) INTO v_attempts
  FROM (
    SELECT a.id, a.attempt_ref, a.notification_ref, a.channel, a.provider,
      a.provider_message_id, a.status, a.response_code, a.response_body, a.attempted_at, a.evidence_ref
    FROM public.notification_delivery_attempts a
    ORDER BY a.attempted_at DESC LIMIT v_limit
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at ASC), '[]'::jsonb) INTO v_dead_letters
  FROM (
    SELECT id, source, correlation_id, idempotency_key, candidate_id, application_id,
      error_code, error_message, retry_count, status, created_at, resolved_at
    FROM public.dead_letter_queue
    WHERE status IN ('OPEN','RETRYING')
    ORDER BY created_at ASC LIMIT v_limit
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at ASC), '[]'::jsonb) INTO v_integration_dead_letters
  FROM (
    SELECT id, dlq_ref, source_ref, source_type, connector_key, severity, status,
      cause, reason, fix_path, evidence_refs, created_at
    FROM public.integration_dead_letter_queue
    WHERE status NOT IN ('RESOLVED','IGNORED')
    ORDER BY created_at ASC LIMIT v_limit
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at ASC), '[]'::jsonb) INTO v_approvals
  FROM (
    SELECT id, approval_ref, command_ref, approval_type, risk_level, target_type,
      target_ref, summary, evidence_refs, requested_by_operator_ref, reviewed_by_operator_ref,
      decision, decision_reason, created_at, decided_at
    FROM public.control_plane_approval_queue
    WHERE decision = 'PENDING'
    ORDER BY created_at ASC LIMIT v_limit
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at ASC), '[]'::jsonb) INTO v_policy_exceptions
  FROM (
    SELECT id, exception_ref, policy_ref, exception_status, exception_reason,
      expiry_at, evidence_refs, created_by, reviewed_by, created_at, reviewed_at
    FROM public.policy_exception_register
    WHERE exception_status = 'PENDING_REVIEW'
    ORDER BY created_at ASC LIMIT v_limit
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC), '[]'::jsonb) INTO v_recent_audit
  FROM (
    SELECT id, audit_ref, actor_ref, action_key, target_ref, severity, audit_message, created_at
    FROM public.founder_ops_audit_events
    ORDER BY created_at DESC LIMIT 50
  ) x;

  RETURN jsonb_build_object(
    'ok', true,
    'notifications', v_notifications,
    'deliveryAttempts', v_attempts,
    'deadLetters', v_dead_letters,
    'integrationDeadLetters', v_integration_dead_letters,
    'pendingApprovals', v_approvals,
    'pendingPolicyExceptions', v_policy_exceptions,
    'recentAudit', v_recent_audit,
    'generatedAt', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.founder_requeue_notification(
  p_notification_id uuid,
  p_notes text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_notification public.notification_outbox%ROWTYPE;
  v_audit_ref text := 'FO-NOTIFY-' || gen_random_uuid()::text;
  v_notes text := left(trim(COALESCE(p_notes,'')), 2000);
BEGIN
  IF v_actor IS NULL OR NOT kingsmen_security.is_founder_or_operator() THEN
    RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_notification_id IS NULL OR length(v_notes) < 8 THEN
    RAISE EXCEPTION 'NOTIFICATION_RETRY_REASON_REQUIRED' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_notification FROM public.notification_outbox
    WHERE id = p_notification_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOTIFICATION_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF v_notification.status NOT IN ('FAILED','QUEUED') OR v_notification.sent_at IS NOT NULL THEN
    RAISE EXCEPTION 'NOTIFICATION_NOT_RETRYABLE' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.notification_delivery_attempts
    WHERE notification_ref = v_notification.notification_ref AND status IN ('SENT','DELIVERED','SUCCESS','ACCEPTED')
  ) THEN
    RAISE EXCEPTION 'NOTIFICATION_ALREADY_DELIVERED' USING ERRCODE = '23514';
  END IF;
  UPDATE public.notification_outbox
    SET status = 'QUEUED', scheduled_for = now(), locked_at = NULL,
        failed_at = NULL, last_error = NULL
    WHERE id = p_notification_id;

  INSERT INTO public.founder_ops_audit_events(
    audit_ref, actor_ref, action_key, target_ref, severity, audit_message, audit_payload, evidence_refs
  ) VALUES (
    v_audit_ref, v_actor::text, 'NOTIFICATION_REQUEUED', v_notification.notification_ref,
    'WATCH', 'Founder/operator requeued a failed or queued notification; downstream provider idempotency remains required.',
    jsonb_build_object('notification_id', p_notification_id, 'channel', v_notification.channel,
      'idempotency_key', v_notification.idempotency_key, 'notes', v_notes),
    ARRAY[]::text[]
  );

  RETURN jsonb_build_object('ok', true, 'notificationRef', v_notification.notification_ref,
    'status', 'QUEUED', 'auditRef', v_audit_ref,
    'message', 'Notification requeued and audited. Provider delivery is not claimed until a delivery attempt confirms it.');
END;
$$;

CREATE OR REPLACE FUNCTION public.founder_resolve_dead_letter(
  p_dead_letter_id uuid,
  p_decision text,
  p_notes text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_dead public.dead_letter_queue%ROWTYPE;
  v_audit_ref text := 'FO-DLQ-' || gen_random_uuid()::text;
  v_notes text := left(trim(COALESCE(p_notes,'')), 2000);
BEGIN
  IF v_actor IS NULL OR NOT kingsmen_security.is_founder_or_operator() THEN
    RAISE EXCEPTION 'FOUNDER_OR_OPERATOR_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_dead_letter_id IS NULL OR p_decision IS NULL OR p_decision NOT IN ('RESOLVED','IGNORED') OR length(v_notes) < 8 THEN
    RAISE EXCEPTION 'DEAD_LETTER_DECISION_AND_REASON_REQUIRED' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_dead FROM public.dead_letter_queue WHERE id = p_dead_letter_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'DEAD_LETTER_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF v_dead.status NOT IN ('OPEN','RETRYING') THEN RAISE EXCEPTION 'DEAD_LETTER_ALREADY_CLOSED' USING ERRCODE = '23514'; END IF;
  UPDATE public.dead_letter_queue SET status = p_decision, resolved_at = now() WHERE id = p_dead_letter_id;
  INSERT INTO public.founder_ops_audit_events(
    audit_ref, actor_ref, action_key, target_ref, severity, audit_message, audit_payload, evidence_refs
  ) VALUES (
    v_audit_ref, v_actor::text, 'DEAD_LETTER_' || p_decision, v_dead.correlation_id::text,
    CASE WHEN p_decision = 'IGNORED' THEN 'WARNING' ELSE 'INFO' END,
    'Founder/operator closed a dead-letter item after recording the reason.',
    jsonb_build_object('dead_letter_id', p_dead_letter_id, 'source', v_dead.source,
      'error_code', v_dead.error_code, 'notes', v_notes),
    ARRAY[]::text[]
  );
  RETURN jsonb_build_object('ok', true, 'deadLetterId', p_dead_letter_id, 'status', p_decision, 'auditRef', v_audit_ref);
END;
$$;

REVOKE ALL ON FUNCTION public.get_founder_ops_queue(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.founder_requeue_notification(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.founder_resolve_dead_letter(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_founder_ops_queue(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.founder_requeue_notification(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.founder_resolve_dead_letter(uuid, text, text) TO authenticated;
