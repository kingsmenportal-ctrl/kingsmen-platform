-- CAO child choices attach to the unified candidate_applications parent.
-- Legacy rows remain attached to applications; no records are backfilled or re-parented here.
-- This migration intentionally preserves the service-role-only table RLS policy. Candidate
-- access is mediated by narrowly scoped SECURITY DEFINER RPCs with verified identity checks.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.cao_choice_items
    WHERE application_id IS NOT NULL
    GROUP BY application_id, choice_number
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'CAO_LEGACY_CHOICE_NUMBER_DUPLICATES_REQUIRE_REVIEW';
  END IF;
END;
$$;

-- Reuse existing UNIQUE (id, candidate_id) constraint from the unified application migration.

ALTER TABLE public.cao_choice_items
  ALTER COLUMN application_id DROP NOT NULL;

ALTER TABLE public.cao_choice_items
  ADD COLUMN candidate_application_id uuid;

ALTER TABLE public.cao_choice_items
  ADD CONSTRAINT cao_choice_items_candidate_parent_fk
  FOREIGN KEY (candidate_application_id, candidate_id)
  REFERENCES public.candidate_applications (id, candidate_id)
  ON DELETE CASCADE;

ALTER TABLE public.cao_choice_items
  ADD CONSTRAINT cao_choice_items_exactly_one_parent_check
  CHECK (
    (application_id IS NOT NULL AND candidate_application_id IS NULL)
    OR
    (application_id IS NULL AND candidate_application_id IS NOT NULL)
  );

CREATE UNIQUE INDEX cao_choice_items_legacy_parent_choice_number_uq
  ON public.cao_choice_items (application_id, choice_number)
  WHERE application_id IS NOT NULL;

CREATE UNIQUE INDEX cao_choice_items_candidate_parent_choice_number_uq
  ON public.cao_choice_items (candidate_application_id, choice_number)
  WHERE candidate_application_id IS NOT NULL;

CREATE INDEX cao_choice_items_candidate_parent_idx
  ON public.cao_choice_items (candidate_application_id, candidate_id, choice_number)
  WHERE candidate_application_id IS NOT NULL;

ALTER TABLE public.candidate_application_events
  DROP CONSTRAINT candidate_application_events_event_type_check;

ALTER TABLE public.candidate_application_events
  ADD CONSTRAINT candidate_application_events_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'APPLICATION_CREATED',
    'READINESS_CHECKED',
    'STATUS_CHANGED',
    'EVIDENCE_ATTACHED',
    'MANUAL_PACKAGE_CREATED',
    'MANUAL_ACTION_RECORDED',
    'EVIDENCE_VERIFIED',
    'EVIDENCE_REJECTED',
    'SUBMISSION_AUTHORIZED',
    'SUBMISSION_ATTEMPT_CREATED',
    'SUBMISSION_DISPATCHED',
    'PROVIDER_ACKNOWLEDGED',
    'PROVIDER_STATUS_RECORDED',
    'PROVIDER_OUTCOME_RECORDED',
    'REVIEW_DECISION_RECORDED',
    'OUTCOME_RECORDED',
    'OUTCOME_DISPUTED',
    'OUTCOME_CORRECTION_DECIDED',
    'OUTCOME_SUPERSEDED',
    'CAO_CHOICES_UPDATED'
  ]));

CREATE OR REPLACE FUNCTION public.list_candidate_cao_parents()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'kingsmen_security'
AS $function$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_link_candidate_id uuid;
  v_parents jsonb;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATED_CANDIDATE_REQUIRED' USING errcode = '42501';
  END IF;

  v_candidate_id := kingsmen_security.current_authenticated_candidate_id();
  SELECT l.candidate_id INTO v_link_candidate_id
  FROM public.candidate_auth_identity_links l
  WHERE l.supabase_user_id = v_auth_user_id
    AND l.link_status = 'VERIFIED'
    AND l.verified_at IS NOT NULL
    AND l.verified_at <= now()
    AND l.verified_by IS NOT NULL
  LIMIT 1;

  IF v_candidate_id IS NULL OR v_link_candidate_id IS DISTINCT FROM v_candidate_id THEN
    RAISE EXCEPTION 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED' USING errcode = '42501';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'application_id', p.id,
    'application_ref', p.application_ref,
    'status', p.status,
    'pathway_type', p.pathway_type,
    'opportunity_title', p.opportunity_title,
    'provider_name', p.provider_name,
    'updated_at', p.updated_at
  ) ORDER BY p.updated_at DESC), '[]'::jsonb)
  INTO v_parents
  FROM (
    SELECT DISTINCT ca.id, ca.application_ref, ca.status, ca.pathway_type,
      o.title AS opportunity_title, o.provider_name, ca.updated_at
    FROM public.candidate_applications ca
    JOIN public.candidate_opportunities o ON o.id = ca.opportunity_id
    JOIN public.candidate_master_application_targets t
      ON t.application_id = ca.id AND t.candidate_id = ca.candidate_id
    JOIN public.candidate_opportunity_matches m
      ON m.candidate_match_ref = substring(t.source_reference from '^N15 match reference: (.+)$')
    WHERE ca.candidate_id = v_candidate_id
      AND ca.pathway_type = 'HIGHER_EDUCATION'
      AND m.candidate_ref = v_candidate_id::text
      AND m.sector = 'CAO'
      AND m.match_status = 'APPROVED'
      AND m.source_confidence = 'OFFICIAL_VERIFIED'
      AND m.human_review_required = false
      AND m.sealed_exact_target = false
  ) p;

  RETURN jsonb_build_object('ok', true, 'parents', v_parents);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_candidate_cao_choices(p_application_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'kingsmen_security'
AS $function$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_link_candidate_id uuid;
  v_exists boolean;
  v_choices jsonb;
BEGIN
  IF v_auth_user_id IS NULL OR p_application_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATED_CANDIDATE_AND_PARENT_REQUIRED' USING errcode = '42501';
  END IF;

  v_candidate_id := kingsmen_security.current_authenticated_candidate_id();
  SELECT l.candidate_id INTO v_link_candidate_id
  FROM public.candidate_auth_identity_links l
  WHERE l.supabase_user_id = v_auth_user_id
    AND l.link_status = 'VERIFIED'
    AND l.verified_at IS NOT NULL
    AND l.verified_at <= now()
    AND l.verified_by IS NOT NULL
  LIMIT 1;

  IF v_candidate_id IS NULL OR v_link_candidate_id IS DISTINCT FROM v_candidate_id THEN
    RAISE EXCEPTION 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED' USING errcode = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.candidate_applications ca
    JOIN public.candidate_master_application_targets t
      ON t.application_id = ca.id AND t.candidate_id = ca.candidate_id
    JOIN public.candidate_opportunity_matches m
      ON m.candidate_match_ref = substring(t.source_reference from '^N15 match reference: (.+)$')
    WHERE ca.id = p_application_id
      AND ca.candidate_id = v_candidate_id
      AND ca.pathway_type = 'HIGHER_EDUCATION'
      AND m.candidate_ref = v_candidate_id::text
      AND m.sector = 'CAO'
      AND m.match_status = 'APPROVED'
      AND m.source_confidence = 'OFFICIAL_VERIFIED'
      AND m.human_review_required = false
      AND m.sealed_exact_target = false
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'CAO_PARENT_NOT_AVAILABLE' USING errcode = '42501';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'cao_choice_ref', c.cao_choice_ref,
    'choice_number', c.choice_number,
    'institution_name', c.institution_name,
    'programme_name', c.programme_name,
    'cao_programme_code', c.cao_programme_code,
    'source_url', c.source_url,
    'source_confidence_band', c.source_confidence_band,
    'choice_status', c.choice_status
  ) ORDER BY c.choice_number), '[]'::jsonb)
  INTO v_choices
  FROM public.cao_choice_items c
  WHERE c.candidate_application_id = p_application_id
    AND c.candidate_id = v_candidate_id;

  RETURN jsonb_build_object('ok', true, 'application_id', p_application_id, 'choices', v_choices);
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_candidate_cao_choices(
  p_application_id uuid,
  p_choices jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'kingsmen_security'
AS $function$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_link_candidate_id uuid;
  v_parent record;
  v_choice jsonb;
  v_choice_count integer := 0;
  v_previous jsonb;
  v_next jsonb;
  v_event_ref text;
BEGIN
  IF v_auth_user_id IS NULL OR p_application_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATED_CANDIDATE_AND_PARENT_REQUIRED' USING errcode = '42501';
  END IF;

  IF p_choices IS NULL OR jsonb_typeof(p_choices) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'CAO_CHOICES_MUST_BE_AN_ARRAY_OF_AT_MOST_SIX' USING errcode = '22023';
  END IF;
  IF jsonb_array_length(p_choices) > 6 THEN
    RAISE EXCEPTION 'CAO_CHOICES_MUST_BE_AN_ARRAY_OF_AT_MOST_SIX' USING errcode = '22023';
  END IF;

  v_candidate_id := kingsmen_security.current_authenticated_candidate_id();
  SELECT l.candidate_id INTO v_link_candidate_id
  FROM public.candidate_auth_identity_links l
  WHERE l.supabase_user_id = v_auth_user_id
    AND l.link_status = 'VERIFIED'
    AND l.verified_at IS NOT NULL
    AND l.verified_at <= now()
    AND l.verified_by IS NOT NULL
  LIMIT 1;

  IF v_candidate_id IS NULL OR v_link_candidate_id IS DISTINCT FROM v_candidate_id THEN
    RAISE EXCEPTION 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED' USING errcode = '42501';
  END IF;

  FOR v_choice IN SELECT value FROM jsonb_array_elements(p_choices)
  LOOP
    IF jsonb_typeof(v_choice) <> 'object'
      OR coalesce(v_choice->>'choice_number', '') !~ '^[1-6]$'
      OR nullif(trim(v_choice->>'institution_name'), '') IS NULL
      OR length(trim(v_choice->>'institution_name')) > 180
      OR nullif(trim(v_choice->>'programme_name'), '') IS NULL
      OR length(trim(v_choice->>'programme_name')) > 240
      OR length(coalesce(v_choice->>'cao_programme_code', '')) > 80
      OR length(coalesce(v_choice->>'source_url', '')) > 1000
      OR (nullif(trim(v_choice->>'source_url'), '') IS NOT NULL
          AND v_choice->>'source_url' !~ '^https://[^/@[:space:]]+')
    THEN
      RAISE EXCEPTION 'CAO_CHOICE_INPUT_INVALID' USING errcode = '22023';
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_choices) x(value)
    GROUP BY (value->>'choice_number')
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'CAO_CHOICE_NUMBERS_MUST_BE_UNIQUE' USING errcode = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_choices) x(value)
    GROUP BY lower(trim(value->>'institution_name')), lower(trim(value->>'programme_name'))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'CAO_PROGRAMME_CHOICES_MUST_BE_UNIQUE' USING errcode = '22023';
  END IF;

  SELECT ca.id, ca.candidate_id, ca.status, ca.pathway_type, ca.application_ref
    INTO v_parent
  FROM public.candidate_applications ca
  WHERE ca.id = p_application_id
    AND ca.candidate_id = v_candidate_id
    AND ca.pathway_type = 'HIGHER_EDUCATION'
  FOR UPDATE;

  IF NOT FOUND OR v_parent.status <> 'DRAFT' THEN
    RAISE EXCEPTION 'CAO_PARENT_MUST_BE_AN_OWNED_DRAFT' USING errcode = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.candidate_master_application_targets t
    JOIN public.candidate_opportunity_matches m
      ON m.candidate_match_ref = substring(t.source_reference from '^N15 match reference: (.+)$')
    WHERE t.application_id = p_application_id
      AND t.candidate_id = v_candidate_id
      AND m.candidate_ref = v_candidate_id::text
      AND m.sector = 'CAO'
      AND m.match_status = 'APPROVED'
      AND m.source_confidence = 'OFFICIAL_VERIFIED'
      AND m.human_review_required = false
      AND m.sealed_exact_target = false
  ) THEN
    RAISE EXCEPTION 'CAO_PARENT_NOT_AVAILABLE' USING errcode = '42501';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'choice_number', c.choice_number,
    'institution_name', c.institution_name,
    'programme_name', c.programme_name,
    'cao_programme_code', c.cao_programme_code,
    'source_url', c.source_url,
    'source_confidence_band', c.source_confidence_band,
    'choice_status', c.choice_status
  ) ORDER BY c.choice_number), '[]'::jsonb)
  INTO v_previous
  FROM public.cao_choice_items c
  WHERE c.candidate_application_id = p_application_id
    AND c.candidate_id = v_candidate_id;

  DELETE FROM public.cao_choice_items
  WHERE candidate_application_id = p_application_id
    AND candidate_id = v_candidate_id;

  FOR v_choice IN SELECT value FROM jsonb_array_elements(p_choices) ORDER BY (value->>'choice_number')::integer
  LOOP
    INSERT INTO public.cao_choice_items (
      application_id, candidate_application_id, candidate_id, cao_choice_ref,
      choice_number, institution_name, programme_name, cao_programme_code,
      source_url, source_confidence_band, choice_status, updated_at
    ) VALUES (
      NULL, p_application_id, v_candidate_id, gen_random_uuid()::text,
      (v_choice->>'choice_number')::integer,
      left(trim(v_choice->>'institution_name'), 180),
      left(trim(v_choice->>'programme_name'), 240),
      nullif(trim(v_choice->>'cao_programme_code'), ''),
      nullif(trim(v_choice->>'source_url'), ''),
      'D', 'DRAFT', now()
    );
    v_choice_count := v_choice_count + 1;
  END LOOP;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'choice_number', c.choice_number,
    'institution_name', c.institution_name,
    'programme_name', c.programme_name,
    'cao_programme_code', c.cao_programme_code,
    'source_url', c.source_url,
    'source_confidence_band', c.source_confidence_band,
    'choice_status', c.choice_status
  ) ORDER BY c.choice_number), '[]'::jsonb)
  INTO v_next
  FROM public.cao_choice_items c
  WHERE c.candidate_application_id = p_application_id
    AND c.candidate_id = v_candidate_id;

  v_event_ref := 'cao-choices-updated:' || gen_random_uuid()::text;
  INSERT INTO public.candidate_application_events (
    event_ref, application_id, candidate_id, actor_auth_user_id,
    event_type, to_status, reason_code, details
  ) VALUES (
    v_event_ref, p_application_id, v_candidate_id, v_auth_user_id,
    'CAO_CHOICES_UPDATED', v_parent.status, 'CANDIDATE_CAO_CHOICES_UPDATED',
    jsonb_build_object(
      'choice_count', v_choice_count,
      'previous_choices', coalesce(v_previous, '[]'::jsonb),
      'saved_choices', coalesce(v_next, '[]'::jsonb),
      'source_confidence_band', 'D',
      'provider_submission_sent', false
    )
  );

  UPDATE public.candidate_applications
  SET updated_at = now()
  WHERE id = p_application_id
    AND candidate_id = v_candidate_id;

  RETURN jsonb_build_object(
    'ok', true,
    'application_id', p_application_id,
    'application_ref', v_parent.application_ref,
    'status', v_parent.status,
    'choices_saved', v_choice_count,
    'choices', coalesce(v_next, '[]'::jsonb),
    'source_confidence_band', 'D',
    'provider_submission_sent', false,
    'message', 'CAO programme choices saved to the Kingsmen parent application as draft data. No CAO/provider submission occurred.'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.list_candidate_cao_parents() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_candidate_cao_choices(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_candidate_cao_choices(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_candidate_cao_parents() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_candidate_cao_choices(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_candidate_cao_choices(uuid, jsonb) TO authenticated;

COMMENT ON FUNCTION public.list_candidate_cao_parents() IS
  'Returns only CAO parent applications owned by the authenticated, identity-verified candidate.';
COMMENT ON FUNCTION public.get_candidate_cao_choices(uuid) IS
  'Reads CAO child choices only for an owned, identity-verified unified parent application.';
COMMENT ON FUNCTION public.save_candidate_cao_choices(uuid, jsonb) IS
  'Atomically replaces up to six ordered CAO child choices on an owned draft parent; never submits externally.';
