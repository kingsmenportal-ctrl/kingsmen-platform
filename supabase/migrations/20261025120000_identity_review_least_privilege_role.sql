-- Dedicated least-privilege role for candidate identity decisions.
-- Keep audit actor-role validation aligned with the dedicated role.
ALTER TABLE public.candidate_identity_review_audit
  DROP CONSTRAINT candidate_identity_review_audit_actor_role_check;
ALTER TABLE public.candidate_identity_review_audit
  ADD CONSTRAINT candidate_identity_review_audit_actor_role_check
  CHECK (actor_role = ANY (ARRAY[
    'CANDIDATE'::text,
    'PLATFORM_ADMIN'::text,
    'IDENTITY_REVIEWER'::text
  ]));

-- Extend the registry vocabulary with the dedicated least-privilege identity role.
ALTER TABLE public.platform_reviewers
  DROP CONSTRAINT platform_reviewers_role_code_check;
ALTER TABLE public.platform_reviewers
  ADD CONSTRAINT platform_reviewers_role_code_check
  CHECK (role_code = ANY (ARRAY[
    'APPLICATION_REVIEWER'::text,
    'EVIDENCE_VERIFIER'::text,
    'PROVIDER_OPERATOR'::text,
    'FINANCE_REVIEWER'::text,
    'PLATFORM_ADMIN'::text,
    'IDENTITY_REVIEWER'::text
  ]));

-- Identity reviewers can approve/reject identity claims only through the
-- service-role-only decision RPC. This role is not PLATFORM_ADMIN and does not
-- grant direct access to candidate/reviewer tables.
CREATE OR REPLACE FUNCTION public.decide_candidate_identity_review(
  p_request_id uuid,
  p_reviewer_auth_user_id uuid,
  p_decision text,
  p_candidate_reference text DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_request public.candidate_identity_review_requests%ROWTYPE;
  v_candidate public.candidates%ROWTYPE;
  v_existing public.candidate_auth_identity_links%ROWTYPE;
  v_status text;
  v_link_count integer := 0;
  v_note text := trim(coalesce(p_note, ''));
BEGIN
  IF p_request_id IS NULL OR p_reviewer_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Request and reviewer are required' USING ERRCODE = '22023';
  END IF;
  IF p_decision IS NULL OR p_decision NOT IN ('APPROVED', 'REJECTED', 'NEEDS_INFORMATION') THEN
    RAISE EXCEPTION 'Unsupported identity review decision' USING ERRCODE = '22023';
  END IF;
  IF length(v_note) < 3 OR length(v_note) > 1200 THEN
    RAISE EXCEPTION 'A review note of 3 to 1200 characters is required' USING ERRCODE = '22023';
  END IF;

  -- Dedicated identity-review capability. General application reviewers,
  -- evidence verifiers, and platform admins do not implicitly receive it.
  IF NOT EXISTS (
    SELECT 1
    FROM public.platform_reviewers r
    WHERE r.auth_user_id = p_reviewer_auth_user_id
      AND r.is_active = true
      AND r.revoked_at IS NULL
      AND r.role_code = 'IDENTITY_REVIEWER'
  ) THEN
    RAISE EXCEPTION 'Reviewer is not authorised for identity decisions' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_request
  FROM public.candidate_identity_review_requests
  WHERE id = p_request_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Identity review request not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_request.request_status NOT IN ('PENDING', 'NEEDS_INFORMATION') THEN
    RAISE EXCEPTION 'Identity review request is no longer open' USING ERRCODE = '55000';
  END IF;

  IF p_decision = 'APPROVED' THEN
    IF p_candidate_reference IS NULL
       OR length(trim(p_candidate_reference)) < 2
       OR length(trim(p_candidate_reference)) > 120 THEN
      RAISE EXCEPTION 'Exact candidate reference is required for approval' USING ERRCODE = '22023';
    END IF;

    -- Exact public reference match; no fuzzy matching or email-based linking.
    SELECT * INTO v_candidate
    FROM public.candidates
    WHERE public_ref = trim(p_candidate_reference)
      AND is_active = true
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Candidate reference did not resolve to one active candidate' USING ERRCODE = 'P0002';
    END IF;

    SELECT count(*) INTO v_link_count
    FROM public.candidate_auth_identity_links
    WHERE supabase_user_id = v_request.supabase_user_id
       OR candidate_id = v_candidate.id;
    IF v_link_count > 1 THEN
      RAISE EXCEPTION 'Account and candidate are linked to conflicting records; manual conflict resolution is required' USING ERRCODE = '23505';
    END IF;

    SELECT * INTO v_existing
    FROM public.candidate_auth_identity_links
    WHERE supabase_user_id = v_request.supabase_user_id
       OR candidate_id = v_candidate.id
    FOR UPDATE;
    IF FOUND THEN
      IF v_existing.supabase_user_id <> v_request.supabase_user_id
         OR v_existing.candidate_id <> v_candidate.id THEN
        RAISE EXCEPTION 'Account or candidate is already linked; manual conflict resolution is required' USING ERRCODE = '23505';
      END IF;
      IF v_existing.link_status = 'REVOKED' THEN
        RAISE EXCEPTION 'A revoked identity link requires separate manual recovery' USING ERRCODE = '55000';
      END IF;
      IF v_existing.link_status = 'VERIFIED' THEN
        RAISE EXCEPTION 'This account is already verified against the candidate' USING ERRCODE = '55000';
      END IF;
      UPDATE public.candidate_auth_identity_links
      SET link_status = 'VERIFIED',
          verified_at = now(),
          verified_by = p_reviewer_auth_user_id::text,
          revocation_reason = NULL,
          updated_at = now()
      WHERE id = v_existing.id;
    ELSE
      INSERT INTO public.candidate_auth_identity_links (
        supabase_user_id, candidate_id, link_status, verified_at,
        verified_by, created_at, updated_at
      ) VALUES (
        v_request.supabase_user_id, v_candidate.id, 'VERIFIED', now(),
        p_reviewer_auth_user_id::text, now(), now()
      );
    END IF;
    v_status := 'APPROVED';
  ELSIF p_decision = 'REJECTED' THEN
    v_status := 'REJECTED';
  ELSE
    v_status := 'NEEDS_INFORMATION';
  END IF;

  UPDATE public.candidate_identity_review_requests
  SET request_status = v_status,
      reviewer_note = v_note,
      reviewed_by = CASE WHEN v_status IN ('APPROVED', 'REJECTED') THEN p_reviewer_auth_user_id ELSE NULL END,
      reviewed_at = CASE WHEN v_status IN ('APPROVED', 'REJECTED') THEN now() ELSE NULL END,
      updated_at = now()
  WHERE id = v_request.id;

  INSERT INTO public.candidate_identity_review_audit (
    request_id, actor_auth_user_id, actor_role, action, candidate_id,
    note, before_status, after_status
  ) VALUES (
    v_request.id, p_reviewer_auth_user_id, 'IDENTITY_REVIEWER', p_decision,
    CASE WHEN p_decision = 'APPROVED' THEN v_candidate.id ELSE NULL END,
    v_note, v_request.request_status, v_status
  );

  RETURN jsonb_build_object(
    'request_id', v_request.id,
    'status', v_status,
    'candidate_id', CASE WHEN p_decision = 'APPROVED' THEN v_candidate.id ELSE NULL END,
    'reviewed_by', p_reviewer_auth_user_id,
    'reviewed_at', now()
  );
END;
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION public.decide_candidate_identity_review(uuid, uuid, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decide_candidate_identity_review(uuid, uuid, text, text, text)
  TO service_role;

COMMENT ON FUNCTION public.decide_candidate_identity_review(uuid, uuid, text, text, text) IS
  'Service-role-only transactional identity decision. Requires an active IDENTITY_REVIEWER grant; matches exact active candidate public_ref; rejects account/candidate conflicts; creates or verifies an identity link only on approval; writes an audit row for each decision.';
