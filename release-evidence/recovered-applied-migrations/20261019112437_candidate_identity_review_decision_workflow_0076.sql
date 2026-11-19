-- Atomic reviewer decisions for candidate identity requests.
-- Reviewer authorization is checked against the existing platform_reviewers registry.
-- Approval creates a verified link only after exact candidate public_ref resolution and
-- only when neither the account nor candidate is already linked elsewhere.
ALTER TABLE public.candidate_identity_review_requests
  ADD COLUMN IF NOT EXISTS candidate_response text NOT NULL DEFAULT '' CHECK (length(candidate_response) <= 1200);

CREATE TABLE IF NOT EXISTS public.candidate_identity_review_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL, -- Retain the audit trail even if a claimant account/request is later deleted.
  actor_auth_user_id uuid NOT NULL, -- Immutable actor reference retained for audit even after account deletion.
  actor_role text NOT NULL CHECK (actor_role IN ('CANDIDATE','PLATFORM_ADMIN')),
  action text NOT NULL CHECK (action IN ('APPROVED','REJECTED','NEEDS_INFORMATION','CANDIDATE_RESPONSE')),
  candidate_id uuid REFERENCES public.candidates(id),
  note text NOT NULL CHECK (length(trim(note)) BETWEEN 3 AND 1200),
  before_status text NOT NULL,
  after_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS candidate_identity_review_audit_request_idx
  ON public.candidate_identity_review_audit(request_id, created_at DESC);
ALTER TABLE public.candidate_identity_review_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.candidate_identity_review_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.candidate_identity_review_audit TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.candidate_identity_review_requests TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.candidate_auth_identity_links TO service_role;

CREATE OR REPLACE FUNCTION public.decide_candidate_identity_review(
  p_request_id uuid,
  p_reviewer_auth_user_id uuid,
  p_decision text,
  p_candidate_reference text DEFAULT NULL,
  p_note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
  IF p_decision IS NULL OR p_decision NOT IN ('APPROVED','REJECTED','NEEDS_INFORMATION') THEN
    RAISE EXCEPTION 'Unsupported identity review decision' USING ERRCODE = '22023';
  END IF;
  IF length(v_note) < 3 OR length(v_note) > 1200 THEN
    RAISE EXCEPTION 'A review note of 3 to 1200 characters is required' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_reviewers r
    WHERE r.auth_user_id = p_reviewer_auth_user_id
      AND r.is_active = true AND r.revoked_at IS NULL
      AND r.role_code = 'PLATFORM_ADMIN'
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
  IF v_request.request_status NOT IN ('PENDING','NEEDS_INFORMATION') THEN
    RAISE EXCEPTION 'Identity review request is no longer open' USING ERRCODE = '55000';
  END IF;

  IF p_decision = 'APPROVED' THEN
    IF p_candidate_reference IS NULL OR length(trim(p_candidate_reference)) < 2 OR length(trim(p_candidate_reference)) > 120 THEN
      RAISE EXCEPTION 'Exact candidate reference is required for approval' USING ERRCODE = '22023';
    END IF;
    SELECT * INTO v_candidate FROM public.candidates
    WHERE public_ref = trim(p_candidate_reference) AND is_active = true
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Candidate reference did not resolve to one active candidate' USING ERRCODE = 'P0002';
    END IF;

    SELECT count(*) INTO v_link_count FROM public.candidate_auth_identity_links
    WHERE supabase_user_id = v_request.supabase_user_id OR candidate_id = v_candidate.id;
    IF v_link_count > 1 THEN
      RAISE EXCEPTION 'Account and candidate are linked to conflicting records; manual conflict resolution is required' USING ERRCODE = '23505';
    END IF;
    SELECT * INTO v_existing FROM public.candidate_auth_identity_links
    WHERE supabase_user_id = v_request.supabase_user_id OR candidate_id = v_candidate.id
    FOR UPDATE;
    IF FOUND THEN
      IF v_existing.supabase_user_id <> v_request.supabase_user_id OR v_existing.candidate_id <> v_candidate.id THEN
        RAISE EXCEPTION 'Account or candidate is already linked; manual conflict resolution is required' USING ERRCODE = '23505';
      END IF;
      IF v_existing.link_status = 'REVOKED' THEN
        RAISE EXCEPTION 'A revoked identity link requires separate manual recovery' USING ERRCODE = '55000';
      END IF;
      IF v_existing.link_status = 'VERIFIED' THEN
        RAISE EXCEPTION 'This account is already verified against the candidate' USING ERRCODE = '55000';
      END IF;
      UPDATE public.candidate_auth_identity_links
      SET link_status = 'VERIFIED', verified_at = now(),
          verified_by = p_reviewer_auth_user_id::text, revocation_reason = NULL, updated_at = now()
      WHERE id = v_existing.id;
    ELSE
      INSERT INTO public.candidate_auth_identity_links
        (supabase_user_id, candidate_id, link_status, verified_at, verified_by, created_at, updated_at)
      VALUES
        (v_request.supabase_user_id, v_candidate.id, 'VERIFIED', now(),
         p_reviewer_auth_user_id::text, now(), now());
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
      reviewed_by = CASE WHEN v_status IN ('APPROVED','REJECTED') THEN p_reviewer_auth_user_id ELSE NULL END,
      reviewed_at = CASE WHEN v_status IN ('APPROVED','REJECTED') THEN now() ELSE NULL END,
      updated_at = now()
  WHERE id = v_request.id;

  INSERT INTO public.candidate_identity_review_audit
    (request_id, actor_auth_user_id, actor_role, action, candidate_id, note, before_status, after_status)
  VALUES
    (v_request.id, p_reviewer_auth_user_id, 'PLATFORM_ADMIN', p_decision,
     CASE WHEN p_decision = 'APPROVED' THEN v_candidate.id ELSE NULL END,
     v_note, v_request.request_status, v_status);

  RETURN jsonb_build_object(
    'request_id', v_request.id,
    'status', v_status,
    'candidate_id', CASE WHEN p_decision = 'APPROVED' THEN v_candidate.id ELSE NULL END,
    'reviewed_by', p_reviewer_auth_user_id,
    'reviewed_at', now()
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.decide_candidate_identity_review(uuid,uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decide_candidate_identity_review(uuid,uuid,text,text,text) TO service_role;


CREATE OR REPLACE FUNCTION public.respond_candidate_identity_review(
  p_request_id uuid,
  p_candidate_auth_user_id uuid,
  p_message text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_request public.candidate_identity_review_requests%ROWTYPE;
  v_message text := trim(coalesce(p_message, ''));
BEGIN
  IF p_request_id IS NULL OR p_candidate_auth_user_id IS NULL
     OR length(v_message) < 3 OR length(v_message) > 1200 THEN
    RAISE EXCEPTION 'A request, authenticated candidate and 3–1200 character response are required' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_request
    FROM public.candidate_identity_review_requests
    WHERE id = p_request_id AND supabase_user_id = p_candidate_auth_user_id
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Identity review request not found for this account' USING ERRCODE = 'P0002'; END IF;
  IF v_request.request_status <> 'NEEDS_INFORMATION' THEN
    RAISE EXCEPTION 'This request is not awaiting candidate information' USING ERRCODE = '55000';
  END IF;
  UPDATE public.candidate_identity_review_requests
    SET candidate_response = v_message, request_status = 'PENDING',
        reviewer_note = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = now()
    WHERE id = v_request.id;
  INSERT INTO public.candidate_identity_review_audit
    (request_id, actor_auth_user_id, actor_role, action, candidate_id, note, before_status, after_status)
  VALUES
    (v_request.id, p_candidate_auth_user_id, 'CANDIDATE', 'CANDIDATE_RESPONSE',
     NULL, v_message, v_request.request_status, 'PENDING');
  RETURN jsonb_build_object('request_id', v_request.id, 'status', 'PENDING');
END;
$function$;
REVOKE ALL ON FUNCTION public.respond_candidate_identity_review(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_candidate_identity_review(uuid,uuid,text) TO service_role;
