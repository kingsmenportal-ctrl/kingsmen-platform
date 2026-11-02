-- Single Kingsmen Application Engine: one candidate-owned master application with
-- ordered pathway/opportunity targets beneath it. This does not submit to any provider.
-- REVIEW-ONLY: do not apply until migration provenance, protected backup/restore,
-- A/B candidate isolation, and formal change-control gates are approved.

CREATE TABLE IF NOT EXISTS public.candidate_master_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  master_application_ref text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT','READY_FOR_REVIEW','IN_PROGRESS','COMPLETED','WITHDRAWN')),
  form_version integer NOT NULL DEFAULT 1 CHECK (form_version > 0),
  created_by_auth_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (id, candidate_id)
);

CREATE TABLE IF NOT EXISTS public.candidate_master_application_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_application_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  target_key text NOT NULL CHECK (length(trim(target_key)) BETWEEN 1 AND 120),
  pathway_type text NOT NULL CHECK (pathway_type IN (
    'HIGHER_EDUCATION','TVET','SETA_LEARNERSHIP','INTERNSHIP','APPRENTICESHIP','EMPLOYMENT'
  )),
  display_order integer NOT NULL CHECK (display_order BETWEEN 1 AND 100),
  item_status text NOT NULL DEFAULT 'SELECTED'
    CHECK (item_status IN ('SELECTED','PREPARING','READY_FOR_REVIEW','BLOCKED','WITHDRAWN')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT candidate_master_application_items_parent_owner_fk
    FOREIGN KEY (master_application_id, candidate_id)
    REFERENCES public.candidate_master_applications(id, candidate_id) ON DELETE CASCADE,
  CONSTRAINT candidate_master_application_items_target_owner_fk
    FOREIGN KEY (candidate_id, target_key)
    REFERENCES public.candidate_master_application_targets(candidate_id, target_key) ON DELETE RESTRICT,
  CONSTRAINT candidate_master_application_items_unique_target
    UNIQUE (master_application_id, target_key),
  CONSTRAINT candidate_master_application_items_unique_order
    UNIQUE (master_application_id, display_order)
);

CREATE INDEX IF NOT EXISTS candidate_master_applications_candidate_updated_idx
  ON public.candidate_master_applications(candidate_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS candidate_master_application_items_candidate_idx
  ON public.candidate_master_application_items(candidate_id, master_application_id, display_order);

ALTER TABLE public.candidate_master_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_master_application_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS candidate_master_applications_service_role
  ON public.candidate_master_applications;
CREATE POLICY candidate_master_applications_service_role
  ON public.candidate_master_applications FOR ALL TO service_role
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS candidate_master_application_items_service_role
  ON public.candidate_master_application_items;
CREATE POLICY candidate_master_application_items_service_role
  ON public.candidate_master_application_items FOR ALL TO service_role
  USING (true) WITH CHECK (true);
REVOKE ALL ON TABLE public.candidate_master_applications, public.candidate_master_application_items
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.candidate_master_applications, public.candidate_master_application_items
  TO service_role;

CREATE OR REPLACE FUNCTION public.save_candidate_master_application(
  p_master_application_id uuid,
  p_target_keys text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'kingsmen_security', 'auth'
AS $function$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_master_id uuid;
  v_target_count integer;
  v_distinct_count integer;
  v_now timestamptz := clock_timestamp();
  v_targets jsonb;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATED_CANDIDATE_REQUIRED' USING ERRCODE = '42501';
  END IF;
  v_candidate_id := kingsmen_security.current_authenticated_candidate_id();
  IF v_candidate_id IS NULL THEN
    RAISE EXCEPTION 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_target_keys IS NULL OR cardinality(p_target_keys) < 1 OR cardinality(p_target_keys) > 100
     OR EXISTS (SELECT 1 FROM unnest(p_target_keys) k WHERE k IS NULL OR length(trim(k)) NOT BETWEEN 1 AND 120) THEN
    RAISE EXCEPTION 'MASTER_APPLICATION_TARGETS_INVALID' USING ERRCODE = '22023';
  END IF;
  SELECT count(*), count(DISTINCT trim(k))
    INTO v_target_count, v_distinct_count
  FROM unnest(p_target_keys) AS k;
  IF v_target_count <> v_distinct_count THEN
    RAISE EXCEPTION 'MASTER_APPLICATION_TARGETS_DUPLICATED' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.candidates c
    WHERE c.id = v_candidate_id AND c.is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.candidate_master_profiles mp
    WHERE mp.candidate_id = v_candidate_id
  ) THEN
    RAISE EXCEPTION 'CANDIDATE_REUSABLE_PROFILE_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.candidates c
    JOIN public.privacy_consent_records pc ON pc.candidate_ref = c.public_ref
    WHERE c.id = v_candidate_id
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
    RAISE EXCEPTION 'PROFILE_PROCESSING_CONSENT_REQUIRED' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1 FROM unnest(p_target_keys) requested(target_key)
    LEFT JOIN public.candidate_master_application_targets t
      ON t.candidate_id = v_candidate_id AND t.target_key = trim(requested.target_key)
    WHERE t.id IS NULL
       OR t.pathway_type NOT IN ('HIGHER_EDUCATION','TVET','SETA_LEARNERSHIP','INTERNSHIP','APPRENTICESHIP','EMPLOYMENT')
  ) THEN
    RAISE EXCEPTION 'TARGET_NOT_FOUND_OR_PATHWAY_UNSUPPORTED' USING ERRCODE = '22023';
  END IF;

  IF p_master_application_id IS NULL THEN
    INSERT INTO public.candidate_master_applications
      (candidate_id, master_application_ref, status, form_version, created_by_auth_user_id, created_at, updated_at)
    VALUES
      (v_candidate_id, 'KMA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
       'DRAFT', 1, v_auth_user_id, v_now, v_now)
    RETURNING id INTO v_master_id;
  ELSE
    SELECT id INTO v_master_id
    FROM public.candidate_master_applications
    WHERE id = p_master_application_id AND candidate_id = v_candidate_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'OWNED_MASTER_APPLICATION_NOT_FOUND' USING ERRCODE = '42501';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.candidate_master_application_items i
      WHERE i.master_application_id = v_master_id
        AND i.item_status IN ('PREPARING','READY_FOR_REVIEW')
        AND NOT (i.target_key = ANY (SELECT trim(k) FROM unnest(p_target_keys) AS k))
    ) THEN
      RAISE EXCEPTION 'ACTIVE_TARGET_REMOVAL_REQUIRES_REVIEW' USING ERRCODE = '55000';
    END IF;
    DELETE FROM public.candidate_master_application_items
    WHERE master_application_id = v_master_id AND candidate_id = v_candidate_id;
    UPDATE public.candidate_master_applications
    SET form_version = form_version + 1, status = 'DRAFT', updated_at = v_now
    WHERE id = v_master_id AND candidate_id = v_candidate_id;
  END IF;

  INSERT INTO public.candidate_master_application_items
    (master_application_id, candidate_id, target_key, pathway_type, display_order, item_status, created_at, updated_at)
  SELECT v_master_id, v_candidate_id, t.target_key, t.pathway_type,
         requested.ordinality::integer, 'SELECTED', v_now, v_now
  FROM unnest(p_target_keys) WITH ORDINALITY AS requested(target_key, ordinality)
  JOIN public.candidate_master_application_targets t
    ON t.candidate_id = v_candidate_id AND t.target_key = trim(requested.target_key);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'target_key', i.target_key, 'pathway_type', i.pathway_type,
    'display_order', i.display_order, 'item_status', i.item_status
  ) ORDER BY i.display_order), '[]'::jsonb)
  INTO v_targets
  FROM public.candidate_master_application_items i
  WHERE i.master_application_id = v_master_id AND i.candidate_id = v_candidate_id;

  RETURN jsonb_build_object(
    'ok', true, 'master_application_id', v_master_id,
    'status', 'DRAFT', 'form_version',
      (SELECT form_version FROM public.candidate_master_applications WHERE id = v_master_id),
    'targets', v_targets,
    'provider_submission_sent', false,
    'message', 'Kingsmen master application draft saved. Target-specific readiness checks remain separate; no provider submission has occurred.'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.save_candidate_master_application(uuid, text[])
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_candidate_master_application(uuid, text[])
  TO authenticated;

COMMENT ON TABLE public.candidate_master_applications IS
  'Single candidate-owned Kingsmen master application spanning the six supported pathways.';
COMMENT ON TABLE public.candidate_master_application_items IS
  'Ordered pathway-specific child targets belonging to one master application; does not replace target-specific application records or provider evidence.';
COMMENT ON FUNCTION public.save_candidate_master_application(uuid, text[]) IS
  'Saves a candidate-owned master application and its ordered targets atomically after active identity, profile and latest consent checks. Never submits to providers.';
