-- REVIEW-ONLY: atomic source-observation review decision for the N15 catalogue.
-- Do not apply to staging until migration provenance 0096-0098 and the staged 0107-0109 chain are reviewed and approved.
-- A verified source observation is NOT a programme OPEN decision, deadline verification, eligibility approval, or publication.

CREATE OR REPLACE FUNCTION public.record_n15_source_review_decision(
  p_observation_ref text,
  p_decision text,
  p_reviewer_ref text,
  p_review_reason text,
  p_decision_notes text,
  p_evidence_refs text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_observation public.external_source_observations%ROWTYPE;
  v_authority public.opportunity_source_authorities%ROWTYPE;
  v_review_ref text;
  v_before text;
  v_after text;
  v_observation_status text;
  v_now timestamptz := clock_timestamp();
  v_authority_host text;
  v_source_host text;
  v_has_authority_evidence boolean := false;
  v_refs text[];
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'N15_SOURCE_REVIEW_SERVICE_ROLE_REQUIRED' USING ERRCODE = '42501';
  END IF;

  IF p_observation_ref IS NULL OR length(btrim(p_observation_ref)) < 1 OR length(p_observation_ref) > 120 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'OBSERVATION_REF_INVALID');
  END IF;
  IF p_decision IS NULL OR p_decision NOT IN ('APPROVE_OFFICIAL_SOURCE', 'REJECT_SOURCE', 'MARK_SOURCE_STALE') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'SOURCE_DECISION_INVALID');
  END IF;
  IF p_reviewer_ref IS NULL OR length(btrim(p_reviewer_ref)) < 1 OR length(p_reviewer_ref) > 128 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'REVIEWER_REF_REQUIRED');
  END IF;
  IF p_review_reason IS NULL OR length(btrim(p_review_reason)) < 5 OR length(p_review_reason) > 1200 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'REVIEW_REASON_INVALID');
  END IF;
  IF p_decision_notes IS NOT NULL AND length(p_decision_notes) > 2000 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'DECISION_NOTES_TOO_LONG');
  END IF;
  IF coalesce(cardinality(p_evidence_refs), 0) < 1 OR cardinality(p_evidence_refs) > 12 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'EVIDENCE_REFS_COUNT_INVALID');
  END IF;
  IF EXISTS (
    SELECT 1
    FROM unnest(p_evidence_refs) AS item(value)
    WHERE item.value IS NULL
       OR length(btrim(item.value)) < 9
       OR length(item.value) > 2048
       OR lower(left(btrim(item.value), 8)) <> 'https://'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'EVIDENCE_REF_INVALID');
  END IF;

  SELECT *
    INTO v_observation
    FROM public.external_source_observations
   WHERE observation_ref = btrim(p_observation_ref)
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'SOURCE_OBSERVATION_NOT_FOUND');
  END IF;
  IF v_observation.observation_status NOT IN ('NEEDS_REVIEW', 'STALE') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'SOURCE_OBSERVATION_ALREADY_DECIDED');
  END IF;

  v_before := v_observation.source_confidence;
  v_refs := ARRAY(
    SELECT DISTINCT btrim(item.value)
      FROM unnest(coalesce(v_observation.evidence_refs, ARRAY[]::text[]) || p_evidence_refs) AS item(value)
     WHERE btrim(item.value) <> ''
  );

  IF p_decision = 'APPROVE_OFFICIAL_SOURCE' THEN
    IF v_observation.authority_ref IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'code', 'SOURCE_AUTHORITY_REQUIRED');
    END IF;
    SELECT *
      INTO v_authority
      FROM public.opportunity_source_authorities
     WHERE authority_ref = v_observation.authority_ref
     FOR SHARE;
    IF NOT FOUND OR v_authority.active IS NOT TRUE OR v_authority.confidence_band NOT IN ('HIGH', 'OFFICIAL_VERIFIED') THEN
      RETURN jsonb_build_object('ok', false, 'code', 'SOURCE_AUTHORITY_NOT_VERIFIED');
    END IF;

    v_authority_host := lower(substring(btrim(v_authority.base_url) from '^https://([^/:?#]+)'));
    v_source_host := lower(substring(btrim(v_observation.source_url) from '^https://([^/:?#]+)'));
    IF v_authority_host IS NULL OR v_source_host IS NULL OR
       NOT (v_source_host = v_authority_host OR right(v_source_host, length(v_authority_host) + 1) = '.' || v_authority_host) THEN
      RETURN jsonb_build_object('ok', false, 'code', 'SOURCE_URL_OUTSIDE_AUTHORITY');
    END IF;

    SELECT EXISTS (
      SELECT 1
        FROM unnest(v_refs) AS evidence(value)
       WHERE lower(substring(btrim(evidence.value) from '^https://([^/:?#]+)')) IS NOT NULL
         AND (
           lower(substring(btrim(evidence.value) from '^https://([^/:?#]+)')) = v_authority_host
           OR right(
                lower(substring(btrim(evidence.value) from '^https://([^/:?#]+)')),
                length(v_authority_host) + 1
              ) = '.' || v_authority_host
         )
    )
    INTO v_has_authority_evidence;
    IF NOT v_has_authority_evidence THEN
      RETURN jsonb_build_object('ok', false, 'code', 'OFFICIAL_AUTHORITY_EVIDENCE_REQUIRED');
    END IF;

    v_after := 'OFFICIAL_VERIFIED';
    v_observation_status := 'VERIFIED';
  ELSIF p_decision = 'REJECT_SOURCE' THEN
    v_after := 'LOW';
    v_observation_status := 'REJECTED';
  ELSE
    v_after := v_before;
    v_observation_status := 'STALE';
  END IF;

  UPDATE public.external_source_observations
     SET observation_status = v_observation_status,
         source_confidence = v_after,
         evidence_refs = v_refs,
         review_reason = btrim(p_review_reason),
         last_checked_at = v_now,
         stale_after = CASE
           WHEN p_decision = 'APPROVE_OFFICIAL_SOURCE' THEN v_now + interval '14 days'
           ELSE v_now
         END
   WHERE id = v_observation.id;

  v_review_ref := 'n15_source_review_' || replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public.opportunity_verification_reviews (
    review_ref, target_type, target_ref, review_status,
    source_confidence_before, source_confidence_after, reviewer_ref,
    review_reason, decision_notes, evidence_refs, created_at, reviewed_at
  ) VALUES (
    v_review_ref, 'SOURCE', v_observation.observation_ref,
    CASE p_decision
      WHEN 'APPROVE_OFFICIAL_SOURCE' THEN 'APPROVED'
      WHEN 'REJECT_SOURCE' THEN 'REJECTED'
      ELSE 'STALE'
    END,
    v_before, v_after, btrim(p_reviewer_ref),
    btrim(p_review_reason), nullif(btrim(coalesce(p_decision_notes, '')), ''),
    v_refs, v_now, v_now
  );

  RETURN jsonb_build_object(
    'ok', true,
    'review_ref', v_review_ref,
    'observation_ref', v_observation.observation_ref,
    'observation_status', v_observation_status,
    'source_confidence', v_after,
    'published_opportunities_created', false,
    'programme_opening_status_changed', false,
    'deadline_status_changed', false,
    'eligibility_rules_changed', false
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.record_n15_source_review_decision(text, text, text, text, text, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_n15_source_review_decision(text, text, text, text, text, text[]) TO service_role;

COMMENT ON FUNCTION public.record_n15_source_review_decision(text, text, text, text, text, text[])
IS 'Atomically records a human N15 source-observation review. Verifying the authenticity of a source does not approve an opportunity, deadline, eligibility, fee, or candidate-facing publication.';
