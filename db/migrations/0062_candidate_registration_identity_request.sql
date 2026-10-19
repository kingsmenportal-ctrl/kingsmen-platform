-- 0062: candidate registration creates only a new, pending record or a manual link request.
-- Existing candidate rows are never claimed by email. A verified identity link is still operator-controlled.
CREATE OR REPLACE FUNCTION public.request_candidate_identity_link(
  p_candidate_reference text DEFAULT NULL,
  p_display_name text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_user auth.users%ROWTYPE;
  v_existing_link public.candidate_auth_identity_links%ROWTYPE;
  v_pending public.candidate_identity_link_requests%ROWTYPE;
  v_candidate_id uuid;
  v_public_ref text;
  v_display_name text;
  v_created_candidate boolean := false;
  v_request_id uuid := gen_random_uuid();
  v_event_id uuid := gen_random_uuid();
  v_correlation uuid := gen_random_uuid();
  v_reference text := left(trim(COALESCE(p_candidate_reference, '')), 100);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATED_USER_REQUIRED' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_auth_user FROM auth.users WHERE id = auth.uid();
  IF NOT FOUND OR v_auth_user.email IS NULL OR v_auth_user.email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'CONFIRMED_EMAIL_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF length(v_reference) = 0 THEN v_reference := NULL; END IF;

  SELECT * INTO v_existing_link FROM public.candidate_auth_identity_links
    WHERE supabase_user_id = auth.uid() AND link_status = 'VERIFIED'
      AND verified_at IS NOT NULL AND verified_by IS NOT NULL;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'linked', true, 'status', 'VERIFIED', 'message', 'Your candidate identity link is already verified.');
  END IF;

  SELECT * INTO v_pending FROM public.candidate_identity_link_requests
    WHERE auth_user_id = auth.uid() AND status = 'PENDING'
    ORDER BY requested_at DESC LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    IF v_pending.candidate_reference IS NULL AND v_reference IS NOT NULL THEN
      UPDATE public.candidate_identity_link_requests
        SET candidate_reference = v_reference
        WHERE id = v_pending.id;
    END IF;
    RETURN jsonb_build_object('ok', true, 'linked', false, 'status', 'PENDING_REVIEW', 'requestId', v_pending.id, 'message', 'Your candidate identity request is awaiting authorised review. No candidate record was claimed.');
  END IF;

  -- Never create a second candidate if a candidate or account already uses this email.
  -- This check prevents duplicates; it does not establish ownership or link the user to that record.
  IF NOT EXISTS (
    SELECT 1 FROM public.candidates WHERE lower(email) = lower(v_auth_user.email)
  ) AND NOT EXISTS (
    SELECT 1 FROM public.candidate_accounts WHERE lower(email) = lower(v_auth_user.email)
  ) THEN
    v_display_name := trim(COALESCE(NULLIF(p_display_name, ''), v_auth_user.raw_user_meta_data->>'display_name', split_part(v_auth_user.email, '@', 1)));
    IF length(v_display_name) < 2 THEN v_display_name := 'New candidate'; END IF;
    v_display_name := left(v_display_name, 180);
    v_public_ref := 'KM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
    INSERT INTO public.candidates(public_ref, email, display_name, current_state, is_active)
      VALUES (v_public_ref, lower(v_auth_user.email), v_display_name, 'NEW', true)
      RETURNING id INTO v_candidate_id;
    INSERT INTO public.candidate_accounts(
      candidate_id, email, auth_status, email_verified, auth_user_id,
      account_recovery_required, device_trust_required, created_at, updated_at
    ) VALUES (
      v_candidate_id, lower(v_auth_user.email), 'PENDING', true, NULL,
      false, true, now(), now()
    );
    v_created_candidate := true;
    v_reference := v_public_ref;
  END IF;

  INSERT INTO public.candidate_identity_link_requests(
    id, auth_user_id, verified_email, candidate_reference, status, correlation_id
  ) VALUES (
    v_request_id, auth.uid(), lower(v_auth_user.email), v_reference, 'PENDING', v_correlation
  );

  INSERT INTO public.audit_events(
    event_id, event_type, severity, correlation_id, actor_id, candidate_id, message, metadata
  ) VALUES (
    v_event_id, 'CANDIDATE_IDENTITY_LINK_REQUESTED', 'INFO', v_correlation,
    auth.uid(), v_candidate_id,
    CASE WHEN v_created_candidate THEN 'Candidate registration created a pending account awaiting operator identity verification.'
         ELSE 'Candidate requested identity linking for an existing or unresolved record; no existing record was claimed.' END,
    jsonb_build_object('request_id', v_request_id, 'created_candidate', v_created_candidate, 'candidate_reference', v_reference)
  );

  RETURN jsonb_build_object(
    'ok', true, 'linked', false, 'status', 'PENDING_REVIEW',
    'requestId', v_request_id, 'candidateReference', v_reference,
    'createdCandidate', v_created_candidate,
    'message', CASE WHEN v_created_candidate
      THEN 'A new candidate record was created in pending status. An authorised operator must verify the identity before private records are accessible.'
      ELSE 'Your identity request is pending authorised review. No existing candidate record was claimed.' END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.request_candidate_identity_link(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_candidate_identity_link(text, text) TO authenticated;
