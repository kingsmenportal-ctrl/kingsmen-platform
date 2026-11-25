-- Kingsmen candidate application identity alignment.
-- STATE: REVIEW PATCH PROPOSAL ONLY - NOT A SUPABASE MIGRATION.
-- DO NOT APPLY DIRECTLY TO STAGING OR PRODUCTION.
--
-- Why this proposal exists:
-- The deployed candidate onboarding Edge Function resolves verified candidate
-- identity through public.candidate_auth_identity_links. Five authenticated
-- candidate application RPCs still depended on the legacy
-- kingsmen_security.current_authenticated_candidate_id() helper, which reads
-- public.candidate_accounts. Staging has zero candidate_accounts rows and no
-- deployed binding writer or trigger was found in the Edge Function/API source
-- inventory. This is a split identity model.
--
-- Proposed alignment:
-- Each RPC resolves the candidate directly from candidate_auth_identity_links
-- for auth.uid(), requiring VERIFIED, verified_at <= now(), and verified_by.
-- All other business rules below are preserved from the live
-- pg_get_functiondef output captured on 25 November 2026.
--
-- Safety:
-- - SECURITY DEFINER and the fixed search_path are preserved.
-- - No GRANT, REVOKE, ALTER ROLE, RLS or Auth settings are included.
-- - Candidate ownership predicates, row locks, consent, source evidence,
--   review gates, idempotency and provider-submission boundaries are retained.
-- - CREATE OR REPLACE is DDL. Any official deployment requires a separately
--   generated and reviewed forward-only Supabase migration after provenance,
--   restore rehearsal, disposable-Postgres verification, security review and
--   explicit change-control approval.
--
-- The Supabase CLI was not available in this authoring environment. This file
-- is intentionally outside db/migrations, database/migrations and
-- supabase/migrations. Generate any future official migration with the
-- Supabase CLI after review. This proposal is not deployable.

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
  SELECT l.candidate_id INTO v_candidate_id
  FROM public.candidate_auth_identity_links l
  WHERE l.supabase_user_id = v_auth_user_id
    AND l.link_status = 'VERIFIED'
    AND l.verified_at IS NOT NULL
    AND l.verified_at <= now()
    AND l.verified_by IS NOT NULL
  LIMIT 1;
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
    p.programme_name, p.exact_link, p.location_text, p.evidence_refs as programme_evidence,
    v.provider_name, v.evidence_refs as provider_evidence,
    obs.last_checked_at, obs.evidence_refs as observation_evidence,
    deadline.opens_at, deadline.closes_at
  into v_match
  from public.candidate_opportunity_matches m
  join public.opportunity_programmes p on p.programme_ref = m.programme_ref
  join public.opportunity_providers v on v.provider_ref = m.provider_ref
  join lateral (
    select o.last_checked_at, o.evidence_refs
    from public.external_source_observations o
    where o.observation_status = 'VERIFIED'
      and o.source_confidence = 'OFFICIAL_VERIFIED'
      and o.source_url = p.exact_link
      and o.last_checked_at >= now() - interval '24 hours'
      and o.stale_after > now()
      and cardinality(coalesce(o.evidence_refs, array[]::text[])) > 0
    order by o.last_checked_at desc
    limit 1
  ) obs on true
  left join lateral (
    select d.opens_at, d.closes_at
    from public.opportunity_deadlines d
    where d.programme_ref = p.programme_ref
      and d.provider_ref = v.provider_ref
      and d.deadline_status = 'CONFIRMED'
      and d.source_confidence = 'OFFICIAL_VERIFIED'
      and cardinality(coalesce(d.evidence_refs, array[]::text[])) > 0
    order by d.created_at desc
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
      'programme_evidence_refs', v_match.programme_evidence,
      'provider_evidence_refs', v_match.provider_evidence,
      'source_observation_evidence_refs', v_match.observation_evidence
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
$function$


CREATE OR REPLACE FUNCTION public.prepare_candidate_manual_portal_submission(p_application_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'kingsmen_security'
AS $function$
declare
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_app record;
  v_job record;
  v_submission_ref text;
  v_url text;
begin
  if v_auth_user_id is null then raise exception 'AUTHENTICATED_CANDIDATE_REQUIRED' using errcode = '42501'; end if;
  SELECT l.candidate_id INTO v_candidate_id
  FROM public.candidate_auth_identity_links l
  WHERE l.supabase_user_id = v_auth_user_id
    AND l.link_status = 'VERIFIED'
    AND l.verified_at IS NOT NULL
    AND l.verified_at <= now()
    AND l.verified_by IS NOT NULL
  LIMIT 1;
  if v_candidate_id is null then raise exception 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED' using errcode = '42501'; end if;
  if p_application_id is null then raise exception 'APPLICATION_ID_REQUIRED' using errcode = '22023'; end if;

  select a.id,a.application_ref,a.candidate_id,a.opportunity_id,a.status,a.readiness_status,
         o.title,o.provider_name,o.source_url,o.application_url,o.application_method,o.source_status,o.is_published,o.source_checked_at
    into v_app
  from public.candidate_applications a
  join public.candidate_opportunities o on o.id=a.opportunity_id
  where a.id=p_application_id and a.candidate_id=v_candidate_id
  for update of a;

  if not found then return jsonb_build_object('ok',false,'code','APPLICATION_NOT_FOUND'); end if;
  if v_app.source_status <> 'VERIFIED' or v_app.is_published <> true
    or v_app.source_checked_at is null or v_app.source_checked_at < now()-interval '24 hours' then
    return jsonb_build_object('ok',false,'code','OFFICIAL_SOURCE_REFRESH_REQUIRED',
      'message','The opportunity source is not currently verified and fresh. Refresh official evidence before preparing a portal handoff.');
  end if;
  v_url := coalesce(nullif(v_app.application_url,''),nullif(v_app.source_url,''));
  if v_url is null or v_url !~ '^https://' then
    return jsonb_build_object('ok',false,'code','OFFICIAL_HTTPS_URL_REQUIRED');
  end if;
  if v_app.status not in ('DRAFT','READINESS_BLOCKED','READY_FOR_REVIEW','READY_TO_SUBMIT','MANUAL_ACTION_REQUIRED') then
    return jsonb_build_object('ok',false,'code','APPLICATION_ALREADY_SUBMITTED_OR_TRACKED',
      'message','This application has moved beyond the manual preparation stage. Use the existing evidence-backed tracking workflow.');
  end if;
  if v_app.application_method not in ('EXTERNAL_PORTAL','MANUAL_ONLY') then
    return jsonb_build_object('ok',false,'code','MANUAL_PORTAL_NOT_APPLICABLE',
      'message','This opportunity is not configured for an external-portal handoff.');
  end if;

  select id,submission_ref,job_status into v_job
  from public.candidate_application_submission_jobs
  where application_id=p_application_id and candidate_id=v_candidate_id
    and idempotency_key='manual-portal:'||p_application_id::text
  limit 1;

  if not found then
    v_submission_ref := 'KM-SUB-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
    insert into public.candidate_application_submission_jobs(
      submission_ref,application_id,candidate_id,opportunity_id,requested_by_auth_user_id,
      delivery_mode,job_status,adapter_key,idempotency_key
    ) values (
      v_submission_ref,p_application_id,v_candidate_id,v_app.opportunity_id,v_auth_user_id,
      'EXTERNAL_PORTAL','MANUAL_REQUIRED','NONE_CONFIGURED','manual-portal:'||p_application_id::text
    )
    on conflict (idempotency_key) do nothing;
    select id,submission_ref,job_status into v_job
    from public.candidate_application_submission_jobs
    where application_id=p_application_id and candidate_id=v_candidate_id
      and idempotency_key='manual-portal:'||p_application_id::text
    limit 1;
    if not found then raise exception 'MANUAL_PORTAL_JOB_NOT_PERSISTED' using errcode = '55000'; end if;
  end if;

  update public.candidate_applications
  set status='MANUAL_ACTION_REQUIRED',
      last_status_reason='External portal handoff prepared. Candidate must complete provider steps and attach receipt evidence; no submission was sent by Kingsmen.',
      updated_at=now()
  where id=p_application_id and candidate_id=v_candidate_id;

  insert into public.candidate_application_events(
    event_ref,application_id,candidate_id,actor_auth_user_id,event_type,from_status,to_status,
    reason_code,details
  ) values (
    'manual-portal-prepared:'||p_application_id::text,p_application_id,v_candidate_id,v_auth_user_id,
    'MANUAL_PACKAGE_CREATED',v_app.status,'MANUAL_ACTION_REQUIRED','EXTERNAL_PORTAL_HANDOFF',
    jsonb_build_object('submission_ref',v_job.submission_ref,'delivery_mode','EXTERNAL_PORTAL',
      'adapter_key','NONE_CONFIGURED','official_url',v_url,'provider_submission_sent',false)
  ) on conflict (event_ref) do nothing;

  return jsonb_build_object(
    'ok',true,'application_id',p_application_id,'application_ref',v_app.application_ref,
    'submission_ref',v_job.submission_ref,'job_status',v_job.job_status,
    'delivery_mode','EXTERNAL_PORTAL','provider_name',v_app.provider_name,'official_url',v_url,
    'provider_submission_sent',false,
    'next_steps',jsonb_build_array('Review the official provider requirements','Complete the provider portal yourself or with authorised Kingsmen support','Upload the provider receipt to the private document vault linked to this application','Wait for independent review before treating receipt or outcome as verified')
  );
end;
$function$


CREATE OR REPLACE FUNCTION public.get_candidate_cao_choices(p_application_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'kingsmen_security'
AS $function$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_exists boolean;
  v_choices jsonb;
BEGIN
  IF v_auth_user_id IS NULL OR p_application_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATED_CANDIDATE_AND_PARENT_REQUIRED' USING errcode = '42501';
  END IF;

  SELECT l.candidate_id INTO v_candidate_id
  FROM public.candidate_auth_identity_links l
  WHERE l.supabase_user_id = v_auth_user_id
    AND l.link_status = 'VERIFIED'
    AND l.verified_at IS NOT NULL
    AND l.verified_at <= now()
    AND l.verified_by IS NOT NULL
  LIMIT 1;

  IF v_candidate_id IS NULL THEN
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
$function$


CREATE OR REPLACE FUNCTION public.list_candidate_cao_parents()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'kingsmen_security'
AS $function$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_parents jsonb;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATED_CANDIDATE_REQUIRED' USING errcode = '42501';
  END IF;

  SELECT l.candidate_id INTO v_candidate_id
  FROM public.candidate_auth_identity_links l
  WHERE l.supabase_user_id = v_auth_user_id
    AND l.link_status = 'VERIFIED'
    AND l.verified_at IS NOT NULL
    AND l.verified_at <= now()
    AND l.verified_by IS NOT NULL
  LIMIT 1;

  IF v_candidate_id IS NULL THEN
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
$function$


CREATE OR REPLACE FUNCTION public.save_candidate_cao_choices(p_application_id uuid, p_choices jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'kingsmen_security'
AS $function$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_has_active_consent boolean := false;
  v_parent record;
  v_choice jsonb;
  v_choice_count integer := 0;
  v_min_choice_number integer;
  v_max_choice_number integer;
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

  SELECT l.candidate_id INTO v_candidate_id
  FROM public.candidate_auth_identity_links l
  WHERE l.supabase_user_id = v_auth_user_id
    AND l.link_status = 'VERIFIED'
    AND l.verified_at IS NOT NULL
    AND l.verified_at <= now()
    AND l.verified_by IS NOT NULL
  LIMIT 1;

  IF v_candidate_id IS NULL THEN
    RAISE EXCEPTION 'VERIFIED_CANDIDATE_IDENTITY_REQUIRED' USING errcode = '42501';
  END IF;

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
    RAISE EXCEPTION 'CAO_PROFILE_PROCESSING_CONSENT_REQUIRED' USING errcode = '42501';
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

  IF jsonb_array_length(p_choices) > 0 THEN
    SELECT min((value->>'choice_number')::integer), max((value->>'choice_number')::integer)
      INTO v_min_choice_number, v_max_choice_number
    FROM jsonb_array_elements(p_choices) x(value);
    IF v_min_choice_number <> 1 OR v_max_choice_number <> jsonb_array_length(p_choices) THEN
      RAISE EXCEPTION 'CAO_CHOICE_NUMBERS_MUST_BE_CONTIGUOUS_FROM_ONE' USING errcode = '22023';
    END IF;
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

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CAO_PARENT_MUST_BE_AN_OWNED_DRAFT' USING errcode = '42501';
  END IF;
  IF v_parent.status <> 'DRAFT' THEN
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
$function$

