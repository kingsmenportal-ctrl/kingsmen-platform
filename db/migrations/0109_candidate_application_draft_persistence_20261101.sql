-- Persist application-specific answers separately from the reusable candidate profile.
-- One row belongs to one Kingsmen parent application; CAO programme choices remain child rows.
-- Review-only until the 0096-0098 provenance, 0107-0108 migrations, identity isolation,
-- encrypted backup/restore and branch-protection release gates are approved.

CREATE TABLE IF NOT EXISTS public.candidate_application_draft_answers (
  application_id uuid PRIMARY KEY,
  candidate_id uuid NOT NULL,
  draft_version integer NOT NULL DEFAULT 1 CHECK (draft_version >= 1),
  answer_data jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(answer_data) = 'object'),
  last_idempotency_key text NOT NULL,
  saved_by_auth_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT candidate_application_draft_answers_application_owner_fk
    FOREIGN KEY (application_id, candidate_id)
    REFERENCES public.candidate_applications(id, candidate_id)
    ON DELETE RESTRICT,
  CONSTRAINT candidate_application_draft_answers_idempotency_chk
    CHECK (last_idempotency_key ~ '^[A-Za-z0-9._:-]{8,160}$')
);

CREATE INDEX IF NOT EXISTS candidate_application_draft_answers_candidate_updated_idx
  ON public.candidate_application_draft_answers(candidate_id, updated_at DESC);

ALTER TABLE public.candidate_application_draft_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS candidate_application_draft_answers_service_role
  ON public.candidate_application_draft_answers;
CREATE POLICY candidate_application_draft_answers_service_role
  ON public.candidate_application_draft_answers
  FOR ALL TO service_role USING (true) WITH CHECK (true);
REVOKE ALL ON TABLE public.candidate_application_draft_answers
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.candidate_application_draft_answers TO service_role;

CREATE OR REPLACE FUNCTION kingsmen_security.current_verified_application_candidate_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_link_count bigint;
  v_candidate_id uuid;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT count(*), (array_agg(l.candidate_id ORDER BY l.id))[1]
    INTO v_link_count, v_candidate_id
  FROM public.candidate_auth_identity_links l
  WHERE l.supabase_user_id = v_auth_user_id
    AND l.link_status = 'VERIFIED'
    AND l.verified_at IS NOT NULL
    AND l.verified_at <= statement_timestamp()
    AND l.verified_by IS NOT NULL;

  IF v_link_count <> 1 THEN
    RETURN NULL;
  END IF;

  RETURN v_candidate_id;
END;
$function$;

REVOKE ALL ON FUNCTION kingsmen_security.current_verified_application_candidate_id()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_candidate_application_draft(p_application_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'kingsmen_security', 'auth'
AS $function$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_application record;
  v_draft record;
  v_candidate_is_active boolean := false;
  v_profile_updated_at timestamptz;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF v_auth_user_id IS NULL OR p_application_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATED_APPLICATION_REQUIRED'
      USING ERRCODE = '42501';
  END IF;

  v_candidate_id := kingsmen_security.current_verified_application_candidate_id();
  IF v_candidate_id IS NULL THEN
    RAISE EXCEPTION 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED'
      USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = v_candidate_id AND c.is_active IS TRUE)
    INTO v_candidate_is_active;
  IF NOT v_candidate_is_active THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE = '42501';
  END IF;

  SELECT
    a.id, a.application_ref, a.pathway_type,
    a.readiness_status, a.readiness_snapshot, a.created_at, a.updated_at,
    o.title, o.provider_name, o.source_url, o.closes_at
  INTO v_application
  FROM public.candidate_applications a
  JOIN public.candidate_opportunities o ON o.id = a.opportunity_id
  WHERE a.id = p_application_id
    AND a.candidate_id = v_candidate_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'OWNED_APPLICATION_NOT_FOUND'
      USING ERRCODE = '42501';
  END IF;

  SELECT d.draft_version, d.answer_data, d.updated_at,
         d.saved_by_auth_user_id
  INTO v_draft
  FROM public.candidate_application_draft_answers d
  WHERE d.application_id = p_application_id
    AND d.candidate_id = v_candidate_id;

  SELECT mp.updated_at INTO v_profile_updated_at
  FROM public.candidate_master_profiles mp
  WHERE mp.candidate_id = v_candidate_id;

  RETURN jsonb_build_object(
    'ok', true,
    'application', jsonb_build_object(
      'id', v_application.id,
      'application_ref', v_application.application_ref,
      'pathway_type', v_application.pathway_type,
      'status', v_application.status,
      'readiness_status', v_application.readiness_status,
      'readiness_snapshot', v_application.readiness_snapshot,
      'title', v_application.title,
      'provider_name', v_application.provider_name,
      'source_url', v_application.source_url,
      'closes_at', v_application.closes_at,
      'created_at', v_application.created_at,
      'updated_at', v_application.updated_at
    ),
    'draft', coalesce(v_draft.answer_data, '{}'::jsonb),
    'draft_version', coalesce(v_draft.draft_version, 0),
    'draft_updated_at', v_draft.updated_at,
    'draft_saved_by_current_candidate', coalesce(v_draft.saved_by_auth_user_id = v_auth_user_id, false),
    'shared_profile_available', v_profile_updated_at IS NOT NULL,
    'shared_profile_updated_at', v_profile_updated_at,
    'is_editable', v_application.status IN (
      'DRAFT', 'READINESS_BLOCKED', 'READY_FOR_REVIEW', 'READY_TO_SUBMIT'
    ),
    'read_at', v_now,
    'provider_submission_sent', false
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_candidate_application_draft(
  p_application_id uuid,
  p_answer_data jsonb,
  p_expected_version integer,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'kingsmen_security', 'auth'
AS $function$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_public_ref text;
  v_application record;
  v_existing public.candidate_application_draft_answers%ROWTYPE;
  v_answer jsonb;
  v_new_version integer;
  v_now timestamptz := clock_timestamp();
  v_allowed_keys text[] := ARRAY[
    'motivation_statement',
    'relevant_experience',
    'qualifications_summary',
    'availability_date',
    'preferred_campus',
    'additional_answers'
  ]::text[];
BEGIN
  IF v_auth_user_id IS NULL OR p_application_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATED_APPLICATION_REQUIRED'
      USING ERRCODE = '42501';
  END IF;

  v_candidate_id := kingsmen_security.current_verified_application_candidate_id();
  IF v_candidate_id IS NULL THEN
    RAISE EXCEPTION 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED'
      USING ERRCODE = '42501';
  END IF;

  SELECT c.public_ref::text INTO v_public_ref
  FROM public.candidates c
  WHERE c.id = v_candidate_id AND c.is_active IS TRUE
  FOR SHARE;
  IF v_public_ref IS NULL THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.privacy_consent_records pc
    WHERE pc.candidate_ref = v_public_ref
      AND pc.consent_type = 'PROFILE_PROCESSING'
      AND pc.consent_status = 'ACTIVE'
      AND pc.revoked_at IS NULL
      AND nullif(trim(pc.consent_text_snapshot), '') IS NOT NULL
      AND pc.granted_at <= v_now
      AND NOT EXISTS (
        SELECT 1 FROM public.privacy_consent_records newer
        WHERE newer.candidate_ref = pc.candidate_ref
          AND newer.consent_type = pc.consent_type
          AND (newer.granted_at, newer.id) > (pc.granted_at, pc.id)
      )
  ) THEN
    RAISE EXCEPTION 'PROFILE_PROCESSING_CONSENT_REQUIRED'
      USING ERRCODE = '42501';
  END IF;

  IF p_expected_version IS NULL OR p_expected_version < 0
     OR coalesce(p_idempotency_key, '') !~ '^[A-Za-z0-9._:-]{8,160}$'
     OR p_answer_data IS NULL
     OR jsonb_typeof(p_answer_data) IS DISTINCT FROM 'object'
     OR pg_column_size(p_answer_data) > 65536
     OR (p_answer_data - v_allowed_keys) <> '{}'::jsonb THEN
    RAISE EXCEPTION 'APPLICATION_DRAFT_INPUT_INVALID'
      USING ERRCODE = '22023';
  END IF;

  IF (p_answer_data ? 'motivation_statement'
      AND (jsonb_typeof(p_answer_data->'motivation_statement') IS DISTINCT FROM 'string'
           OR length(p_answer_data->>'motivation_statement') > 5000))
     OR (p_answer_data ? 'relevant_experience'
      AND (jsonb_typeof(p_answer_data->'relevant_experience') IS DISTINCT FROM 'string'
           OR length(p_answer_data->>'relevant_experience') > 4000))
     OR (p_answer_data ? 'qualifications_summary'
      AND (jsonb_typeof(p_answer_data->'qualifications_summary') IS DISTINCT FROM 'string'
           OR length(p_answer_data->>'qualifications_summary') > 3000))
     OR (p_answer_data ? 'preferred_campus'
      AND (jsonb_typeof(p_answer_data->'preferred_campus') IS DISTINCT FROM 'string'
           OR length(p_answer_data->>'preferred_campus') > 180))
     OR (p_answer_data ? 'availability_date'
      AND (jsonb_typeof(p_answer_data->'availability_date') IS DISTINCT FROM 'string'
           OR (p_answer_data->>'availability_date') !~ '^\d{4}-\d{2}-\d{2}$'
           OR NOT pg_input_is_valid(p_answer_data->>'availability_date', 'date')))
     OR (p_answer_data ? 'additional_answers'
      AND (jsonb_typeof(p_answer_data->'additional_answers') IS DISTINCT FROM 'array'
           OR jsonb_array_length(p_answer_data->'additional_answers') > 20)) THEN
    RAISE EXCEPTION 'APPLICATION_DRAFT_FIELD_VALIDATION_FAILED'
      USING ERRCODE = '22023';
  END IF;

  FOR v_answer IN
    SELECT value FROM jsonb_array_elements(
      coalesce(p_answer_data->'additional_answers', '[]'::jsonb)
    )
  LOOP
    IF jsonb_typeof(v_answer) IS DISTINCT FROM 'object'
       OR (v_answer - ARRAY['question_key', 'answer']::text[]) <> '{}'::jsonb
       OR coalesce(v_answer->>'question_key', '') !~ '^[A-Za-z0-9._:-]{1,80}$'
       OR jsonb_typeof(v_answer->'answer') IS DISTINCT FROM 'string'
       OR length(v_answer->>'answer') > 2000 THEN
      RAISE EXCEPTION 'APPLICATION_ADDITIONAL_ANSWER_INVALID'
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- Lock the owned parent application before checking the optimistic version.
  -- This serializes simultaneous saves for the same candidate/application.
  SELECT a.id, a.status
    INTO v_application
  FROM public.candidate_applications a
  WHERE a.id = p_application_id
    AND a.candidate_id = v_candidate_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'OWNED_APPLICATION_NOT_FOUND'
      USING ERRCODE = '42501';
  END IF;

  IF v_application.status NOT IN (
    'DRAFT', 'READINESS_BLOCKED', 'READY_FOR_REVIEW', 'READY_TO_SUBMIT'
  ) THEN
    RAISE EXCEPTION 'APPLICATION_DRAFT_IS_LOCKED'
      USING ERRCODE = '55000';
  END IF;

  SELECT * INTO v_existing
  FROM public.candidate_application_draft_answers d
  WHERE d.application_id = p_application_id
    AND d.candidate_id = v_candidate_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.last_idempotency_key = p_idempotency_key THEN
      IF v_existing.answer_data IS DISTINCT FROM p_answer_data THEN
        RAISE EXCEPTION 'APPLICATION_DRAFT_IDEMPOTENCY_CONFLICT'
          USING ERRCODE = '23505';
      END IF;
      RETURN jsonb_build_object(
        'ok', true, 'reused', true,
        'application_id', p_application_id,
        'draft_version', v_existing.draft_version,
        'updated_at', v_existing.updated_at,
        'provider_submission_sent', false
      );
    END IF;

    IF p_expected_version <> v_existing.draft_version THEN
      RETURN jsonb_build_object(
        'ok', false, 'code', 'APPLICATION_DRAFT_VERSION_CONFLICT',
        'current_version', v_existing.draft_version,
        'message', 'This draft changed in another session. Reload the latest version before saving again.'
      );
    END IF;

    v_new_version := v_existing.draft_version + 1;
    UPDATE public.candidate_application_draft_answers
    SET draft_version = v_new_version,
        answer_data = p_answer_data,
        last_idempotency_key = p_idempotency_key,
        saved_by_auth_user_id = v_auth_user_id,
        updated_at = v_now
    WHERE application_id = p_application_id
      AND candidate_id = v_candidate_id;
  ELSE
    IF p_expected_version <> 0 THEN
      RETURN jsonb_build_object(
        'ok', false, 'code', 'APPLICATION_DRAFT_VERSION_CONFLICT',
        'current_version', 0,
        'message', 'No saved application draft exists at the version held by this session. Reload before saving.'
      );
    END IF;

    v_new_version := 1;
    INSERT INTO public.candidate_application_draft_answers (
      application_id, candidate_id, draft_version, answer_data,
      last_idempotency_key, saved_by_auth_user_id, created_at, updated_at
    ) VALUES (
      p_application_id, v_candidate_id, v_new_version, p_answer_data,
      p_idempotency_key, v_auth_user_id, v_now, v_now
    );
  END IF;

  -- Any answer change invalidates a prior readiness result. It does not submit
  -- anything to a provider and never asserts a successful application outcome.
  UPDATE public.candidate_applications
  SET status = 'DRAFT',
      readiness_status = 'NOT_CHECKED',
      readiness_snapshot = coalesce(readiness_snapshot, '{}'::jsonb)
        || jsonb_build_object(
          'draft_answers_version', v_new_version,
          'readiness_recheck_required', true,
          'draft_answers_saved_at', v_now
        ),
      last_status_reason = 'Candidate application answers changed; readiness must be rechecked before review or submission.',
      updated_at = v_now
  WHERE id = p_application_id
    AND candidate_id = v_candidate_id;

  INSERT INTO public.candidate_application_events (
    event_ref, application_id, candidate_id, actor_auth_user_id,
    event_type, from_status, to_status, reason_code, details
  ) VALUES (
    'application-draft-saved:' || p_application_id::text || ':' || v_new_version::text,
    p_application_id, v_candidate_id, v_auth_user_id,
    'APPLICATION_DRAFT_SAVED', v_application.status, 'DRAFT',
    'CANDIDATE_ANSWER_SAVE',
    jsonb_build_object(
      'draft_version', v_new_version,
      'answer_keys', ARRAY(SELECT jsonb_object_keys(p_answer_data)),
      'provider_submission_sent', false,
      'profile_is_shared', true
    )
  ) ON CONFLICT (event_ref) DO NOTHING;

  RETURN jsonb_build_object(
    'ok', true, 'reused', false,
    'application_id', p_application_id,
    'draft_version', v_new_version,
    'updated_at', v_now,
    'readiness_recheck_required', true,
    'provider_submission_sent', false,
    'message', 'Application draft saved. Reload or resume it at any time; provider submission has not occurred.'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_candidate_application_draft(uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_candidate_application_draft(uuid, jsonb, integer, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_candidate_application_draft(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_candidate_application_draft(uuid, jsonb, integer, text)
  TO authenticated;

COMMENT ON TABLE public.candidate_application_draft_answers IS
  'Candidate-owned answer payloads for one unified parent application. Reusable profile remains canonical in candidate_master_profiles; CAO selections remain child records.';
COMMENT ON FUNCTION public.save_candidate_application_draft(uuid, jsonb, integer, text) IS
  'Optimistic-versioned, idempotent save of a candidate-owned parent application draft. Locks the parent, invalidates prior readiness, records an immutable audit event and never submits externally.';
