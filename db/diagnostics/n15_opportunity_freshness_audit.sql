-- READ-ONLY N15 / route-universe opportunity freshness audit.
-- Safe for Supabase SQL Editor: SELECT statements only; no schema or data mutation.
WITH findings AS (
  SELECT 'route_programme'::text AS entity_type, rp.programme_key AS entity_ref,
    jsonb_build_object(
      'programme_name', rp.programme_name,
      'availability_status', rp.availability_status,
      'route_status', rp.route_status,
      'source_confidence_band', rp.source_confidence_band,
      'source_url', rp.source_url,
      'finding_codes', array_remove(ARRAY[
        CASE WHEN rp.availability_status = 'OPEN' AND rp.route_status <> 'VERIFIED' THEN 'OPEN_WITH_UNVERIFIED_ROUTE' END,
        CASE WHEN rp.availability_status = 'OPEN' AND coalesce(rp.source_url, '') !~ '^https://' THEN 'OPEN_WITHOUT_HTTPS_SOURCE' END,
        CASE WHEN rp.availability_status = 'OPEN' AND coalesce(rp.source_confidence_band, '') NOT IN ('A','OFFICIAL_VERIFIED') THEN 'OPEN_WITHOUT_ACCEPTABLE_SOURCE_CONFIDENCE' END,
        CASE WHEN rp.availability_status = 'OPEN'
          AND (rp.metadata->>'closing_date') ~ '^\d{4}-\d{2}-\d{2}$'
          AND (rp.metadata->>'closing_date') < (now() AT TIME ZONE 'Africa/Johannesburg')::date::text
          THEN 'EXPIRED_DEADLINE_NOT_CLOSED' END,
        CASE WHEN rp.availability_status = 'MANUAL_CHECK_REQUIRED' THEN 'ROUTE_ANCHOR_NOT_CURRENT_OPPORTUNITY' END
      ], NULL)
    ) AS detail
  FROM public.route_programmes rp
  WHERE rp.availability_status = 'OPEN'
     OR rp.availability_status = 'MANUAL_CHECK_REQUIRED'
     OR ((rp.metadata->>'closing_date') ~ '^\d{4}-\d{2}-\d{2}$'
         AND (rp.metadata->>'closing_date') < (now() AT TIME ZONE 'Africa/Johannesburg')::date::text
         AND rp.availability_status NOT IN ('CLOSED','EXPIRED'))

  UNION ALL

  SELECT 'opportunity_provider', p.provider_ref,
    jsonb_build_object(
      'provider_name', p.provider_name, 'source_confidence', p.source_confidence,
      'safe_to_recommend', p.safe_to_recommend, 'accreditation_status', p.accreditation_status,
      'official_url', p.official_url,
      'finding_codes', array_remove(ARRAY[
        CASE WHEN p.safe_to_recommend IS TRUE AND p.source_confidence <> 'OFFICIAL_VERIFIED' THEN 'RECOMMENDABLE_WITHOUT_OFFICIAL_VERIFICATION' END,
        CASE WHEN p.safe_to_recommend IS TRUE AND coalesce(cardinality(p.evidence_refs),0)=0 THEN 'RECOMMENDABLE_WITHOUT_EVIDENCE' END,
        CASE WHEN p.safe_to_recommend IS TRUE AND coalesce(p.official_url,'') !~ '^https://' THEN 'RECOMMENDABLE_WITHOUT_HTTPS_URL' END,
        CASE WHEN p.safe_to_recommend IS TRUE AND p.accreditation_status = 'REJECTED' THEN 'RECOMMENDABLE_BUT_ACCREDITATION_REJECTED' END
      ], NULL)
    )
  FROM public.opportunity_providers p
  WHERE p.safe_to_recommend IS TRUE
    AND (p.source_confidence <> 'OFFICIAL_VERIFIED'
      OR coalesce(cardinality(p.evidence_refs),0)=0
      OR coalesce(p.official_url,'') !~ '^https://'
      OR p.accreditation_status = 'REJECTED')

  UNION ALL

  SELECT 'opportunity_programme', p.programme_ref,
    jsonb_build_object(
      'programme_name', p.programme_name, 'opening_status', p.opening_status,
      'candidate_facing_safe', p.candidate_facing_safe, 'source_confidence', p.source_confidence,
      'exact_link', p.exact_link, 'evidence_count', coalesce(cardinality(p.evidence_refs),0),
      'finding_codes', array_remove(ARRAY[
        CASE WHEN p.opening_status = 'OPEN' AND p.candidate_facing_safe IS DISTINCT FROM TRUE THEN 'OPEN_NOT_CANDIDATE_SAFE' END,
        CASE WHEN p.opening_status = 'OPEN' AND p.source_confidence <> 'OFFICIAL_VERIFIED' THEN 'OPEN_WITHOUT_OFFICIAL_VERIFICATION' END,
        CASE WHEN p.opening_status = 'OPEN' AND coalesce(cardinality(p.evidence_refs),0)=0 THEN 'OPEN_WITHOUT_EVIDENCE' END,
        CASE WHEN p.opening_status = 'OPEN' AND coalesce(p.exact_link,'') !~ '^https://' THEN 'OPEN_WITHOUT_HTTPS_EXACT_LINK' END
      ], NULL)
    )
  FROM public.opportunity_programmes p
  WHERE p.opening_status = 'OPEN'
    AND (p.candidate_facing_safe IS DISTINCT FROM TRUE
      OR p.source_confidence <> 'OFFICIAL_VERIFIED'
      OR coalesce(cardinality(p.evidence_refs),0)=0
      OR coalesce(p.exact_link,'') !~ '^https://')

  UNION ALL

  SELECT 'source_observation', o.observation_ref,
    jsonb_build_object(
      'source_url', o.source_url, 'observation_status', o.observation_status,
      'source_confidence', o.source_confidence, 'observed_at', o.observed_at,
      'last_checked_at', o.last_checked_at, 'stale_after', o.stale_after,
      'valid_until', o.valid_until, 'evidence_count', coalesce(cardinality(o.evidence_refs),0),
      'finding_codes', array_remove(ARRAY[
        CASE WHEN o.observation_status = 'VERIFIED' AND o.source_confidence <> 'OFFICIAL_VERIFIED' THEN 'VERIFIED_WITHOUT_OFFICIAL_CONFIDENCE' END,
        CASE WHEN o.observation_status = 'VERIFIED' AND coalesce(cardinality(o.evidence_refs),0)=0 THEN 'VERIFIED_WITHOUT_EVIDENCE' END,
        CASE WHEN o.observation_status = 'VERIFIED' AND coalesce(o.source_url,'') !~ '^https://' THEN 'VERIFIED_WITHOUT_HTTPS_SOURCE' END,
        CASE WHEN o.observation_status = 'VERIFIED' AND o.stale_after <= now() THEN 'VERIFIED_BUT_STALE' END,
        CASE WHEN o.observation_status = 'VERIFIED' AND o.valid_until IS NOT NULL AND o.valid_until <= now() THEN 'VERIFIED_BUT_EXPIRED' END,
        CASE WHEN o.observation_status = 'VERIFIED' AND (o.observed_at > now() OR o.last_checked_at > now()) THEN 'VERIFIED_WITH_FUTURE_TIMESTAMP' END,
        CASE WHEN o.observation_status = 'VERIFIED' AND o.observed_at > o.last_checked_at THEN 'OBSERVATION_AFTER_CHECK_TIMESTAMP' END
      ], NULL)
    )
  FROM public.external_source_observations o
  WHERE o.observation_status = 'VERIFIED'
    AND (o.source_confidence <> 'OFFICIAL_VERIFIED'
      OR coalesce(cardinality(o.evidence_refs),0)=0
      OR coalesce(o.source_url,'') !~ '^https://'
      OR o.stale_after <= now()
      OR (o.valid_until IS NOT NULL AND o.valid_until <= now())
      OR o.observed_at > now()
      OR o.last_checked_at > now()
      OR o.observed_at > o.last_checked_at)

  UNION ALL

  SELECT 'candidate_match', m.candidate_match_ref,
    jsonb_build_object(
      'candidate_ref', m.candidate_ref, 'programme_ref', m.programme_ref,
      'provider_ref', m.provider_ref, 'match_status', m.match_status,
      'source_confidence', m.source_confidence, 'human_review_required', m.human_review_required,
      'finding_codes', array_remove(ARRAY[
        CASE WHEN m.match_status = 'APPROVED' AND m.source_confidence <> 'OFFICIAL_VERIFIED' THEN 'APPROVED_MATCH_WITHOUT_OFFICIAL_SOURCE' END,
        CASE WHEN m.match_status = 'APPROVED' AND m.human_review_required IS DISTINCT FROM FALSE THEN 'APPROVED_MATCH_WITH_REVIEW_PENDING' END,
        CASE WHEN m.match_status = 'APPROVED' AND coalesce(cardinality(m.evidence_refs),0)=0 THEN 'APPROVED_MATCH_WITHOUT_EVIDENCE' END,
        CASE WHEN m.match_status = 'APPROVED' AND m.sealed_exact_target IS TRUE THEN 'SEALED_TARGET_IN_APPROVED_MATCH' END
      ], NULL)
    )
  FROM public.candidate_opportunity_matches m
  WHERE m.match_status = 'APPROVED'
    AND (m.source_confidence <> 'OFFICIAL_VERIFIED'
      OR m.human_review_required IS DISTINCT FROM FALSE
      OR coalesce(cardinality(m.evidence_refs),0)=0
      OR m.sealed_exact_target IS TRUE)
),
summary AS (
  SELECT jsonb_build_object(
    'route_providers', (SELECT count(*) FROM public.route_providers),
    'route_programmes', (SELECT count(*) FROM public.route_programmes),
    'route_programmes_open', (SELECT count(*) FROM public.route_programmes WHERE availability_status='OPEN'),
    'route_programmes_closed', (SELECT count(*) FROM public.route_programmes WHERE availability_status='CLOSED'),
    'route_programmes_manual_check', (SELECT count(*) FROM public.route_programmes WHERE availability_status='MANUAL_CHECK_REQUIRED'),
    'opportunity_providers', (SELECT count(*) FROM public.opportunity_providers),
    'opportunity_programmes', (SELECT count(*) FROM public.opportunity_programmes),
    'verified_source_observations', (SELECT count(*) FROM public.external_source_observations WHERE observation_status='VERIFIED'),
    'candidate_matches', (SELECT count(*) FROM public.candidate_opportunity_matches),
    'opportunity_deadlines', (SELECT count(*) FROM public.opportunity_deadlines),
    'confirmed_future_deadlines_with_evidence', (SELECT count(*) FROM public.opportunity_deadlines WHERE deadline_status='CONFIRMED' AND closes_at>now() AND coalesce(cardinality(evidence_refs),0)>0)
  ) AS detail
)
SELECT 'SUMMARY'::text AS row_type, NULL::text AS entity_type, NULL::text AS entity_ref, detail FROM summary
UNION ALL
SELECT 'FINDING'::text, entity_type, entity_ref, detail FROM findings
ORDER BY row_type, entity_type NULLS FIRST, entity_ref NULLS FIRST;
