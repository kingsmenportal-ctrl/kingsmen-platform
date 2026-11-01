-- Enforce candidate-specific eligibility evidence, latest-source freshness and a current
-- confirmed official application window before a unified parent application draft is created.
-- Review-only: do not apply until the backend baseline, identity review, migration provenance
-- and protected backup/restore release gates have passed.

CREATE OR REPLACE FUNCTION public.prepare_candidate_application_from_master_target(p_target_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'kingsmen_security'
AS $function$
declare
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_target record;
  v_match record;
  v_opportunity_id uuid;
  v_application_id uuid;
  v_application_ref text;
  v_match_ref text;
  v_has_active_consent boolean := false;
begin
  if v_auth_user_id is null then
    raise exception 'AUTHENTICATED_CANDIDATE_REQUIRED' using errcode = '42501';
  end if;
  v_candidate_id := kingsmen_security.current_authenticated_candidate_id();
  if v_candidate_id is null then
    raise exception 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED' using errcode = '42501';
  end if;
  if p_target_key is null or length(trim(p_target_key)) not between 1 and 120 then
    raise exception 'VALID_TARGET_KEY_REQUIRED' using errcode = '22023';
  end if;

  select id, candidate_id, target_key, pathway_type, source_reference, application_id
    into v_target
  from public.candidate_master_application_targets
  where candidate_id = v_candidate_id and target_key = trim(p_target_key)
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'TARGET_NOT_FOUND');
  end if;
  if v_target.application_id is not null then
    select application_ref into v_application_ref
      from public.candidate_applications
      where id = v_target.application_id and candidate_id = v_candidate_id;
    return jsonb_build_object(
      'ok', true, 'created', false, 'application_id', v_target.application_id,
      'application_ref', v_application_ref, 'status', 'DRAFT',
      'provider_submission_sent', false, 'code', 'APPLICATION_ALREADY_LINKED'
    );
  end if;

  SELECT EXISTS (
    SELECT 1
    FROM public.candidates c
    JOIN LATERAL (
      SELECT consent_status, revoked_at, consent_text_snapshot, granted_at
      FROM public.privacy_consent_records pc
      WHERE pc.candidate_ref = c.public_ref
        AND pc.consent_type = 'PROFILE_PROCESSING'
      ORDER BY pc.granted_at DESC, pc.id DESC
      LIMIT 1
    ) pc ON true
    WHERE c.id = v_candidate_id
      AND pc.consent_status = 'ACTIVE'
      AND pc.revoked_at IS NULL
      AND nullif(trim(pc.consent_text_snapshot), '') IS NOT NULL
      AND pc.granted_at <= now()
  ) INTO v_has_active_consent;

  IF NOT v_has_active_consent THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'PROFILE_PROCESSING_CONSENT_REQUIRED',
      'message', 'Active profile-processing consent is required before a new parent application draft can be prepared. No new application record was created.'
    );
  END IF;

  v_match_ref := substring(v_target.source_reference from '^N15 match reference: (.+)$');
  if v_match_ref is null then
    return jsonb_build_object('ok', false, 'code', 'VERIFIED_N15_MATCH_REFERENCE_REQUIRED');
  end if;
  if v_target.pathway_type not in ('HIGHER_EDUCATION','TVET','SETA_LEARNERSHIP','INTERNSHIP','APPRENTICESHIP','EMPLOYMENT') then
    return jsonb_build_object('ok', false, 'code', 'PATHWAY_NOT_SUPPORTED_BY_APPLICATION_LIFECYCLE');
  end if;

  select
    m.candidate_match_ref, m.programme_ref, m.provider_ref, m.sector, m.recommendation_summary,
    m.evidence_refs as match_evidence,
    p.programme_name, p.exact_link, p.location_text, p.evidence_refs as programme_evidence,
    v.provider_name, v.evidence_refs as provider_evidence,
    obs.observation_status, obs.source_confidence as observation_source_confidence,
    obs.observed_at, obs.last_checked_at, obs.stale_after, obs.valid_until,
    obs.evidence_refs as observation_evidence,
    deadline.deadline_ref, deadline.deadline_status,
    deadline.source_confidence as deadline_source_confidence,
    deadline.opens_at, deadline.closes_at, deadline.evidence_refs as deadline_evidence
  into v_match
  from public.candidate_opportunity_matches m
  join public.opportunity_programmes p on p.programme_ref = m.programme_ref
  join public.opportunity_providers v on v.provider_ref = m.provider_ref
  join lateral (
    select o.observation_status, o.source_confidence, o.observed_at,
           o.last_checked_at, o.stale_after, o.valid_until, o.evidence_refs
    from public.external_source_observations o
    where o.source_url = p.exact_link
    order by o.observed_at desc, o.id desc
    limit 1
  ) obs on true
  left join lateral (
    select d.deadline_ref, d.deadline_status, d.source_confidence,
           d.opens_at, d.closes_at, d.evidence_refs
    from public.opportunity_deadlines d
    where d.programme_ref = p.programme_ref
      and d.provider_ref = v.provider_ref
    order by d.created_at desc, d.id desc
    limit 1
  ) deadline on true
  where m.candidate_match_ref = v_match_ref
    and m.candidate_ref = v_candidate_id::text
    and m.match_status = 'APPROVED'
    and m.source_confidence = 'OFFICIAL_VERIFIED'
    and m.human_review_required = false
    and m.sealed_exact_target = false
    and p.opening_status = 'OPEN'
    and p.candidate_facing_safe = true
    and p.source_confidence = 'OFFICIAL_VERIFIED'
    and cardinality(coalesce(p.evidence_refs, array[]::text[])) > 0
    and v.source_confidence = 'OFFICIAL_VERIFIED'
    and v.safe_to_recommend = true
    and coalesce(v.accreditation_status, '') <> 'REJECTED'
    and cardinality(coalesce(v.evidence_refs, array[]::text[])) > 0
  limit 1;

  if not found then
    return jsonb_build_object(
      'ok', false, 'code', 'VERIFIED_MATCH_NOT_AVAILABLE',
      'message', 'No current approved human-reviewed N15 match with fresh official-source evidence is available. No application record was created.'
    );
  end if;

  -- Eligibility gate: the N15 match must be candidate-specific, approved, and backed
  -- by evidence. This is an application-pathway qualification check, not an admission guarantee.
  if cardinality(coalesce(v_match.match_evidence, array[]::text[])) = 0 then
    return jsonb_build_object('ok', false, 'code', 'CANDIDATE_MATCH_EVIDENCE_REQUIRED',
      'message', 'The candidate-specific opportunity match has no supporting evidence. No application record was created.');
  end if;

  -- Revalidate the latest source observation, including its state. An older verified
  -- observation must not mask a newer unverified/stale observation for the same URL.
  if v_match.observation_status is distinct from 'VERIFIED'
     or v_match.observation_source_confidence is distinct from 'OFFICIAL_VERIFIED'
     or v_match.observed_at is null
     or v_match.last_checked_at is null
     or v_match.stale_after is null
     or v_match.observed_at > v_match.last_checked_at
     or v_match.last_checked_at > now()
     or v_match.last_checked_at < now() - interval '24 hours'
     or v_match.stale_after <= now()
     or v_match.stale_after <= v_match.last_checked_at
     or (v_match.valid_until is not null and v_match.valid_until <= now())
     or cardinality(coalesce(v_match.observation_evidence, array[]::text[])) = 0 then
    return jsonb_build_object('ok', false, 'code', 'SOURCE_STALE_OR_UNPROVEN',
      'message', 'The latest official-source observation is stale, unverified or missing evidence. Refresh the listing before preparing an application.');
  end if;

  -- A published OPEN flag without a current, confirmed, evidenced application
  -- deadline is not sufficient to create a candidate application.
  if v_match.deadline_ref is null
     or v_match.deadline_status is distinct from 'CONFIRMED'
     or v_match.deadline_source_confidence is distinct from 'OFFICIAL_VERIFIED'
     or v_match.closes_at is null
     or v_match.closes_at <= now()
     or (v_match.opens_at is not null and v_match.opens_at > now())
     or (v_match.opens_at is not null and v_match.closes_at <= v_match.opens_at)
     or cardinality(coalesce(v_match.deadline_evidence, array[]::text[])) = 0 then
    return jsonb_build_object('ok', false, 'code', 'CONFIRMED_OPEN_DEADLINE_REQUIRED',
      'message', 'A current official application window with a confirmed opening/closing period and evidence is required. The opportunity remains saved, but no application draft was created.');
  end if;

  if not (
    (v_match.sector in ('UNIVERSITY','CAO') and v_target.pathway_type = 'HIGHER_EDUCATION')
    or (v_match.sector = 'TVET' and v_target.pathway_type = 'TVET')
    or (v_match.sector = 'SETA' and v_target.pathway_type in ('SETA_LEARNERSHIP','APPRENTICESHIP'))
    or (v_match.sector = 'LEARNERSHIP' and v_target.pathway_type = 'SETA_LEARNERSHIP')
    or (v_match.sector = 'INTERNSHIP' and v_target.pathway_type = 'INTERNSHIP')
    or (v_match.sector = 'APPRENTICESHIP' and v_target.pathway_type = 'APPRENTICESHIP')
    or (v_match.sector = 'EMPLOYER' and v_target.pathway_type = 'EMPLOYMENT')
    or (v_match.sector = 'BURSARY' and v_target.pathway_type in ('HIGHER_EDUCATION','TVET','SETA_LEARNERSHIP','INTERNSHIP','APPRENTICESHIP'))
    or (v_match.sector = 'NSFAS' and v_target.pathway_type in ('HIGHER_EDUCATION','TVET'))
    or (v_match.sector = 'QCTO' and v_target.pathway_type in ('SETA_LEARNERSHIP','APPRENTICESHIP'))
    or (v_match.sector = 'ACCOMMODATION' and v_target.pathway_type in ('HIGHER_EDUCATION','TVET','SETA_LEARNERSHIP','INTERNSHIP','APPRENTICESHIP','EMPLOYMENT'))
    or (v_match.sector = 'PRIVATE_COLLEGE' and v_target.pathway_type in ('HIGHER_EDUCATION','TVET','SETA_LEARNERSHIP'))
  ) then
    return jsonb_build_object('ok', false, 'code', 'MATCH_PATHWAY_MISMATCH',
      'message', 'The selected application pathway does not match the approved opportunity classification. No application record was created.');
  end if;

  if v_match.exact_link is null or v_match.exact_link !~ '^https://' then
    return jsonb_build_object('ok', false, 'code', 'OFFICIAL_HTTPS_SOURCE_REQUIRED');
  end if;

  insert into public.candidate_opportunities (
    opportunity_ref, title, provider_name, pathway_type, description, location_text,
    source_url, application_url, application_method, opens_at, closes_at,
    source_checked_at, source_status, is_published, updated_at
  ) values (
    'n15:' || v_match.programme_ref,
    left(v_match.programme_name, 240),
    left(v_match.provider_name, 240),
    v_target.pathway_type,
    left(coalesce(v_match.recommendation_summary, 'Official-source opportunity. Candidate-specific eligibility still requires review.'), 4000),
    left(v_match.location_text, 240),
    v_match.exact_link,
    null,
    'EXTERNAL_PORTAL',
    v_match.opens_at,
    v_match.closes_at,
    v_match.last_checked_at,
    'VERIFIED',
    true,
    now()
  )
  on conflict (opportunity_ref) do update set
    title = excluded.title,
    provider_name = excluded.provider_name,
    pathway_type = excluded.pathway_type,
    description = excluded.description,
    location_text = excluded.location_text,
    source_url = excluded.source_url,
    opens_at = excluded.opens_at,
    closes_at = excluded.closes_at,
    source_checked_at = excluded.source_checked_at,
    source_status = 'VERIFIED',
    is_published = true,
    updated_at = now()
  returning id into v_opportunity_id;

  v_application_ref := 'KM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  insert into public.candidate_applications (
    application_ref, candidate_id, opportunity_id, pathway_type, status,
    readiness_status, readiness_snapshot, last_status_reason
  ) values (
    v_application_ref, v_candidate_id, v_opportunity_id, v_target.pathway_type, 'DRAFT',
    'NOT_CHECKED',
    jsonb_build_object(
      'origin', 'UNIFIED_MASTER_APPLICATION',
      'source_confidence', 'OFFICIAL_VERIFIED',
      'source_checked_at', v_match.last_checked_at,
      'provider_submission_state', 'NOT_SUBMITTED',
      'candidate_match_status', 'APPROVED',
      'candidate_match_evidence_refs', v_match.match_evidence,
      'opportunity_eligibility_gate', 'CANDIDATE_SPECIFIC_MATCH_APPROVED',
      'deadline_gate_status', 'CONFIRMED_OPEN_WINDOW',
      'deadline_ref', v_match.deadline_ref,
      'deadline_opens_at', v_match.opens_at,
      'deadline_closes_at', v_match.closes_at,
      'deadline_evidence_refs', v_match.deadline_evidence,
      'programme_evidence_refs', v_match.programme_evidence,
      'provider_evidence_refs', v_match.provider_evidence,
      'source_observation_evidence_refs', v_match.observation_evidence,
      'source_observed_at', v_match.observed_at,
      'source_checked_at', v_match.last_checked_at,
      'source_stale_after', v_match.stale_after
    ),
    'Draft created from a current approved N15 match. Provider submission has not occurred.'
  )
  on conflict (candidate_id, opportunity_id) do nothing;

  select id, application_ref into v_application_id, v_application_ref
  from public.candidate_applications
  where candidate_id = v_candidate_id and opportunity_id = v_opportunity_id;

  insert into public.candidate_application_events (
    event_ref, application_id, candidate_id, actor_auth_user_id, event_type,
    to_status, reason_code, details
  ) values (
    'master-target-application-created:' || v_target.id::text,
    v_application_id, v_candidate_id, v_auth_user_id, 'APPLICATION_CREATED',
    'DRAFT', 'UNIFIED_MASTER_APPLICATION',
    jsonb_build_object('target_key', v_target.target_key, 'n15_match_ref', v_match_ref,
      'source_checked_at', v_match.last_checked_at, 'provider_submission_sent', false)
  ) on conflict (event_ref) do nothing;

  update public.candidate_master_application_targets
  set application_id = v_application_id, planning_status = 'PREPARING', updated_at = now()
  where id = v_target.id and candidate_id = v_candidate_id;

  return jsonb_build_object(
    'ok', true, 'created', true, 'application_id', v_application_id,
    'application_ref', v_application_ref, 'status', 'DRAFT',
    'readiness_status', 'NOT_CHECKED', 'provider_submission_sent', false,
    'submission_boundary', 'EXTERNAL_PORTAL_OR_VERIFIED_ADAPTER_REQUIRED'
  );
end;
$function$;

revoke all on function public.prepare_candidate_application_from_master_target(text) from public, anon;
grant execute on function public.prepare_candidate_application_from_master_target(text) to authenticated;
comment on function public.prepare_candidate_application_from_master_target(text) is
  'Creates a DRAFT only from a candidate-specific approved N15 match with supporting match evidence, latest verified fresh official-source observation, and a current official CONFIRMED application deadline. Does not guarantee provider eligibility or submit to a provider.';
