-- N15 verified-source promotion: an authenticated source reviewer records
-- one evidence-backed provider/programme/deadline/rule decision atomically.
-- This does not create candidate matches or replace candidate-specific review.

begin;

create or replace function public.promote_n15_verified_opportunity_listing(
  p_review_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $function$
declare
  v_reviewer_id uuid;
  v_observation_ref text;
  v_review_reason text;
  v_decision_notes text;
  v_evidence_refs text[];
  v_provider jsonb;
  v_programme jsonb;
  v_deadline jsonb;
  v_rules jsonb;
  v_obs record;
  v_now timestamptz := clock_timestamp();
  v_provider_ref text;
  v_programme_ref text;
  v_provider_sector text;
  v_programme_sector text;
  v_provider_accreditation text;
  v_provider_safe boolean;
  v_provider_confidence_before text := 'LOW';
  v_programme_confidence_before text := 'LOW';
  v_opening_status text;
  v_programme_safe boolean;
  v_deadline_ref text;
  v_deadline_status text;
  v_rule jsonb;
  v_rule_ref text;
  v_rule_refs text[] := array[]::text[];
  v_reviewed_count integer := 0;
begin
  if p_review_payload is null or jsonb_typeof(p_review_payload) <> 'object' then
    raise exception using errcode = '22023', message = 'N15_REVIEW_PAYLOAD_INVALID';
  end if;

  v_reviewer_id := nullif(p_review_payload->>'reviewer_auth_user_id', '')::uuid;
  v_observation_ref := nullif(btrim(p_review_payload->>'observation_ref'), '');
  v_review_reason := nullif(btrim(p_review_payload->>'review_reason'), '');
  v_decision_notes := nullif(btrim(p_review_payload->>'decision_notes'), '');
  v_provider := p_review_payload->'provider';
  v_programme := p_review_payload->'programme';
  v_deadline := p_review_payload->'deadline';
  v_rules := coalesce(p_review_payload->'eligibility_rules', '[]'::jsonb);

  if v_reviewer_id is null or v_observation_ref is null or
     v_review_reason is null or length(v_review_reason) < 10 or
     v_decision_notes is null or length(v_decision_notes) < 10 then
    raise exception using errcode = '22023', message = 'N15_REVIEW_REASON_AND_ACTOR_REQUIRED';
  end if;

  if jsonb_typeof(v_provider) <> 'object' or jsonb_typeof(v_programme) <> 'object' or
     jsonb_typeof(v_rules) <> 'array' or jsonb_array_length(v_rules) > 20 then
    raise exception using errcode = '22023', message = 'N15_PROVIDER_PROGRAMME_OR_RULES_INVALID';
  end if;

  if not exists (
    select 1
    from public.platform_reviewers r
    where r.auth_user_id = v_reviewer_id
      and r.is_active is true
      and r.revoked_at is null
      and r.role_code in ('EVIDENCE_VERIFIER', 'PLATFORM_ADMIN')
  ) then
    raise exception using errcode = '42501', message = 'N15_EVIDENCE_VERIFIER_REQUIRED';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('kingsmen.n15.verified-opportunity-promotion.v1', 0)
  );

  select o.observation_ref, o.authority_ref, o.source_url, o.source_title,
         o.sector, o.source_confidence, o.observation_status,
         o.observed_at, o.last_checked_at, o.stale_after, o.evidence_refs,
         a.base_url, a.active as authority_active
    into v_obs
    from public.external_source_observations o
    join public.opportunity_source_authorities a
      on a.authority_ref = o.authority_ref
   where o.observation_ref = v_observation_ref
   for update of o;

  if not found or v_obs.authority_active is not true then
    raise exception using errcode = 'P0002', message = 'N15_SOURCE_OBSERVATION_OR_AUTHORITY_NOT_FOUND';
  end if;

  if v_obs.observation_status not in ('NEEDS_REVIEW', 'VERIFIED') then
    raise exception using errcode = '55000', message = 'N15_SOURCE_OBSERVATION_NOT_REVIEWABLE';
  end if;

  if v_obs.observed_at is null or v_obs.last_checked_at is null or
     v_obs.last_checked_at > v_now or v_obs.observed_at > v_now or
     v_obs.last_checked_at < v_now - interval '24 hours' or
     v_obs.stale_after is null or v_obs.stale_after <= v_now then
    raise exception using errcode = '55000', message = 'N15_SOURCE_OBSERVATION_STALE_REQUIRES_REINGESTION';
  end if;

  v_evidence_refs := array(
    select distinct btrim(value)
    from jsonb_array_elements_text(coalesce(p_review_payload->'evidence_refs', '[]'::jsonb)) as x(value)
    where length(btrim(value)) between 1 and 500
  );

  if cardinality(v_evidence_refs) < 2 or
     not (v_observation_ref = any(v_evidence_refs)) or
     not exists (
       select 1 from unnest(v_evidence_refs) e
       where e ~ '^sha256:[0-9a-f]{64}$'
     ) then
    raise exception using errcode = '22023', message = 'N15_REVIEW_EVIDENCE_HASH_AND_OBSERVATION_REQUIRED';
  end if;

  v_provider_ref := nullif(btrim(v_provider->>'provider_ref'), '');
  v_programme_ref := nullif(btrim(v_programme->>'programme_ref'), '');
  v_provider_sector := upper(nullif(btrim(v_provider->>'sector'), ''));
  v_programme_sector := upper(nullif(btrim(v_programme->>'sector'), ''));
  v_provider_accreditation := upper(coalesce(nullif(btrim(v_provider->>'accreditation_status'), ''), 'UNKNOWN'));
  v_opening_status := upper(coalesce(nullif(btrim(v_programme->>'opening_status'), ''), 'UNKNOWN'));

  if v_provider_ref is null or length(v_provider_ref) > 120 or
     nullif(btrim(v_provider->>'provider_name'), '') is null or
     nullif(btrim(v_provider->>'provider_type'), '') is null or
     nullif(btrim(v_provider->>'official_url'), '') is null or
     v_programme_ref is null or length(v_programme_ref) > 120 or
     nullif(btrim(v_programme->>'programme_name'), '') is null or
     nullif(btrim(v_programme->>'exact_link'), '') is null then
    raise exception using errcode = '22023', message = 'N15_PROVIDER_AND_PROGRAMME_REQUIRED_FIELDS_MISSING';
  end if;

  if v_provider_sector not in (
    'UNIVERSITY','TVET','SETA','QCTO','LEARNERSHIP','BURSARY',
    'ACCOMMODATION','EMPLOYER','INTERNSHIP','NSFAS','CAO','PRIVATE_COLLEGE'
  ) or v_programme_sector <> v_provider_sector then
    raise exception using errcode = '22023', message = 'N15_PROVIDER_PROGRAMME_SECTOR_MISMATCH';
  end if;

  if v_provider_accreditation not in (
    'UNKNOWN','OFFICIAL_VERIFIED','NEEDS_REVIEW','REJECTED','NOT_APPLICABLE'
  ) then
    raise exception using errcode = '22023', message = 'N15_PROVIDER_ACCREDITATION_STATUS_INVALID';
  end if;

  if (upper(coalesce(v_provider->>'provider_type','')) = 'PRIVATE_COLLEGE' or v_provider_sector = 'PRIVATE_COLLEGE')
     and v_provider_accreditation <> 'OFFICIAL_VERIFIED' then
    raise exception using errcode = '55000', message = 'N15_PRIVATE_PROVIDER_ACCREDITATION_NOT_VERIFIED';
  end if;

  if v_opening_status not in ('OPEN','CLOSED','UPCOMING','UNKNOWN','MANUAL_CHECK_REQUIRED') then
    raise exception using errcode = '22023', message = 'N15_PROGRAMME_OPENING_STATUS_INVALID';
  end if;

  if v_programme->>'exact_link' <> v_obs.source_url then
    raise exception using errcode = '22023', message = 'N15_PROGRAMME_LINK_MUST_MATCH_REVIEWED_OBSERVATION';
  end if;

  select coalesce(source_confidence, 'LOW') into v_provider_confidence_before
    from public.opportunity_providers where provider_ref = v_provider_ref;
  v_provider_confidence_before := coalesce(v_provider_confidence_before, 'LOW');
  select coalesce(source_confidence, 'LOW') into v_programme_confidence_before
    from public.opportunity_programmes where programme_ref = v_programme_ref;
  v_programme_confidence_before := coalesce(v_programme_confidence_before, 'LOW');

  v_provider_safe := v_provider_accreditation in ('OFFICIAL_VERIFIED','NOT_APPLICABLE');

  insert into public.opportunity_providers (
    provider_ref, provider_name, provider_type, sector, province, official_url,
    accreditation_status, source_confidence, safe_to_recommend, evidence_refs,
    updated_at
  ) values (
    v_provider_ref,
    left(btrim(v_provider->>'provider_name'), 180),
    left(btrim(v_provider->>'provider_type'), 80),
    v_provider_sector,
    nullif(left(btrim(coalesce(v_provider->>'province','')), 100), ''),
    v_provider->>'official_url',
    v_provider_accreditation,
    'OFFICIAL_VERIFIED',
    v_provider_safe,
    v_evidence_refs,
    v_now
  )
  on conflict (provider_ref) do update set
    provider_name = excluded.provider_name,
    provider_type = excluded.provider_type,
    sector = excluded.sector,
    province = excluded.province,
    official_url = excluded.official_url,
    accreditation_status = excluded.accreditation_status,
    source_confidence = 'OFFICIAL_VERIFIED',
    safe_to_recommend = excluded.safe_to_recommend,
    evidence_refs = excluded.evidence_refs,
    updated_at = v_now;

  v_programme_safe := v_opening_status = 'OPEN' and v_provider_safe;

  insert into public.opportunity_programmes (
    programme_ref, provider_ref, programme_name, sector, nqf_level,
    delivery_mode, location_text, opening_status, source_confidence,
    candidate_facing_safe, exact_link, evidence_refs, updated_at
  ) values (
    v_programme_ref,
    v_provider_ref,
    left(btrim(v_programme->>'programme_name'), 200),
    v_programme_sector,
    nullif(left(btrim(coalesce(v_programme->>'nqf_level','')), 40), ''),
    nullif(left(btrim(coalesce(v_programme->>'delivery_mode','')), 80), ''),
    nullif(left(btrim(coalesce(v_programme->>'location_text','')), 180), ''),
    v_opening_status,
    'OFFICIAL_VERIFIED',
    v_programme_safe,
    v_obs.source_url,
    v_evidence_refs,
    v_now
  )
  on conflict (programme_ref) do update set
    provider_ref = excluded.provider_ref,
    programme_name = excluded.programme_name,
    sector = excluded.sector,
    nqf_level = excluded.nqf_level,
    delivery_mode = excluded.delivery_mode,
    location_text = excluded.location_text,
    opening_status = excluded.opening_status,
    source_confidence = 'OFFICIAL_VERIFIED',
    candidate_facing_safe = excluded.candidate_facing_safe,
    exact_link = excluded.exact_link,
    evidence_refs = excluded.evidence_refs,
    updated_at = v_now;

  insert into public.opportunity_verification_reviews (
    review_ref, target_type, target_ref, review_status,
    source_confidence_before, source_confidence_after, reviewer_ref,
    review_reason, decision_notes, evidence_refs, reviewed_at
  ) values (
    'n15_review_' || replace(gen_random_uuid()::text, '-', ''),
    'SOURCE', v_observation_ref, 'APPROVED',
    v_obs.source_confidence, 'OFFICIAL_VERIFIED', v_reviewer_id::text,
    v_review_reason, v_decision_notes, v_evidence_refs, v_now
  );
  v_reviewed_count := v_reviewed_count + 1;

  insert into public.opportunity_verification_reviews (
    review_ref, target_type, target_ref, review_status,
    source_confidence_before, source_confidence_after, reviewer_ref,
    review_reason, decision_notes, evidence_refs, reviewed_at
  ) values (
    'n15_review_' || replace(gen_random_uuid()::text, '-', ''),
    'PROVIDER', v_provider_ref, 'APPROVED',
    v_provider_confidence_before, 'OFFICIAL_VERIFIED', v_reviewer_id::text,
    v_review_reason, v_decision_notes, v_evidence_refs, v_now
  );
  v_reviewed_count := v_reviewed_count + 1;

  insert into public.opportunity_verification_reviews (
    review_ref, target_type, target_ref, review_status,
    source_confidence_before, source_confidence_after, reviewer_ref,
    review_reason, decision_notes, evidence_refs, reviewed_at
  ) values (
    'n15_review_' || replace(gen_random_uuid()::text, '-', ''),
    'PROGRAMME', v_programme_ref, 'APPROVED',
    v_programme_confidence_before, 'OFFICIAL_VERIFIED', v_reviewer_id::text,
    v_review_reason, v_decision_notes, v_evidence_refs, v_now
  );
  v_reviewed_count := v_reviewed_count + 1;

  if jsonb_typeof(v_deadline) = 'object' then
    v_deadline_ref := nullif(btrim(v_deadline->>'deadline_ref'), '');
    if v_deadline_ref is null or nullif(btrim(v_deadline->>'closes_at'), '') is null then
      raise exception using errcode = '22023', message = 'N15_DEADLINE_REFERENCE_AND_CLOSE_DATE_REQUIRED';
    end if;

    begin
      if (v_deadline->>'closes_at')::timestamptz > v_now then
        v_deadline_status := 'CONFIRMED';
      else
        v_deadline_status := 'STALE';
      end if;
      if nullif(v_deadline->>'opens_at','') is not null and
         (v_deadline->>'opens_at')::timestamptz > (v_deadline->>'closes_at')::timestamptz then
        raise exception using errcode = '22023', message = 'N15_DEADLINE_WINDOW_INVALID';
      end if;
    exception when invalid_datetime_format or datetime_field_overflow then
      raise exception using errcode = '22023', message = 'N15_DEADLINE_TIMESTAMP_INVALID';
    end;

    insert into public.opportunity_deadlines (
      deadline_ref, programme_ref, provider_ref, deadline_type,
      opens_at, closes_at, deadline_status, source_confidence,
      timezone, evidence_refs
    ) values (
      v_deadline_ref, v_programme_ref, v_provider_ref,
      left(coalesce(nullif(btrim(v_deadline->>'deadline_type'), ''), 'APPLICATION'), 80),
      nullif(v_deadline->>'opens_at','')::timestamptz,
      (v_deadline->>'closes_at')::timestamptz,
      v_deadline_status, 'OFFICIAL_VERIFIED',
      coalesce(nullif(v_deadline->>'timezone',''), 'Africa/Johannesburg'),
      v_evidence_refs
    )
    on conflict (deadline_ref) do update set
      programme_ref = excluded.programme_ref,
      provider_ref = excluded.provider_ref,
      deadline_type = excluded.deadline_type,
      opens_at = excluded.opens_at,
      closes_at = excluded.closes_at,
      deadline_status = excluded.deadline_status,
      source_confidence = 'OFFICIAL_VERIFIED',
      timezone = excluded.timezone,
      evidence_refs = excluded.evidence_refs;

    insert into public.opportunity_verification_reviews (
      review_ref, target_type, target_ref, review_status,
      source_confidence_before, source_confidence_after, reviewer_ref,
      review_reason, decision_notes, evidence_refs, reviewed_at
    ) values (
      'n15_review_' || replace(gen_random_uuid()::text, '-', ''),
      'DEADLINE', v_deadline_ref, 'APPROVED',
      'LOW', 'OFFICIAL_VERIFIED', v_reviewer_id::text,
      v_review_reason,
      case when v_deadline_status = 'STALE'
        then v_decision_notes || ' [Deadline is already past and is retained as STALE.]'
        else v_decision_notes end,
      v_evidence_refs, v_now
    );
    v_reviewed_count := v_reviewed_count + 1;
  elsif v_deadline is not null and jsonb_typeof(v_deadline) <> 'null' then
    raise exception using errcode = '22023', message = 'N15_DEADLINE_PAYLOAD_INVALID';
  end if;

  for v_rule in select value from jsonb_array_elements(v_rules)
  loop
    v_rule_ref := nullif(btrim(v_rule->>'rule_ref'), '');
    if v_rule_ref is null or nullif(btrim(v_rule->>'rule_type'), '') is null or
       nullif(btrim(v_rule->>'rule_text'), '') is null then
      raise exception using errcode = '22023', message = 'N15_ELIGIBILITY_RULE_FIELDS_REQUIRED';
    end if;

    insert into public.opportunity_eligibility_rules (
      rule_ref, programme_ref, provider_ref, rule_type, rule_text,
      source_confidence, evidence_refs, review_required
    ) values (
      v_rule_ref, v_programme_ref, v_provider_ref,
      left(btrim(v_rule->>'rule_type'), 80),
      left(btrim(v_rule->>'rule_text'), 2000),
      'OFFICIAL_VERIFIED', v_evidence_refs, false
    )
    on conflict (rule_ref) do update set
      programme_ref = excluded.programme_ref,
      provider_ref = excluded.provider_ref,
      rule_type = excluded.rule_type,
      rule_text = excluded.rule_text,
      source_confidence = 'OFFICIAL_VERIFIED',
      evidence_refs = excluded.evidence_refs,
      review_required = false;

    v_rule_refs := array_append(v_rule_refs, v_rule_ref);

    insert into public.opportunity_verification_reviews (
      review_ref, target_type, target_ref, review_status,
      source_confidence_before, source_confidence_after, reviewer_ref,
      review_reason, decision_notes, evidence_refs, reviewed_at
    ) values (
      'n15_review_' || replace(gen_random_uuid()::text, '-', ''),
      'ELIGIBILITY', v_rule_ref, 'APPROVED',
      'LOW', 'OFFICIAL_VERIFIED', v_reviewer_id::text,
      v_review_reason, v_decision_notes, v_evidence_refs, v_now
    );
    v_reviewed_count := v_reviewed_count + 1;
  end loop;

  update public.external_source_observations
     set observation_status = 'VERIFIED',
         source_confidence = 'OFFICIAL_VERIFIED',
         last_checked_at = v_now,
         stale_after = v_now + interval '24 hours',
         evidence_refs = (
           select array_agg(distinct item)
           from unnest(coalesce(evidence_refs, array[]::text[]) || v_evidence_refs) as item
         ),
         review_reason = 'HUMAN_VERIFIED_OFFICIAL_SOURCE; ' || left(v_review_reason, 500)
   where observation_ref = v_observation_ref;

  return jsonb_build_object(
    'ok', true,
    'status', 'VERIFIED_SOURCE_PROMOTED',
    'observation_ref', v_observation_ref,
    'provider_ref', v_provider_ref,
    'programme_ref', v_programme_ref,
    'deadline_ref', v_deadline_ref,
    'eligibility_rule_refs', to_jsonb(v_rule_refs),
    'verification_reviews_written', v_reviewed_count,
    'programme_candidate_facing_safe', v_programme_safe,
    'candidate_matches_created', 0,
    'next_gate', 'CANDIDATE_MATCH_GENERATION_AND_HUMAN_REVIEW'
  );
end
$function$;

revoke all on function public.promote_n15_verified_opportunity_listing(jsonb) from public, anon, authenticated;
grant execute on function public.promote_n15_verified_opportunity_listing(jsonb) to service_role;

comment on function public.promote_n15_verified_opportunity_listing(jsonb) is
  'Atomic N15 promotion of an explicitly human-reviewed official source observation into provider/programme/optional deadline and eligibility records. Browser/source discovery cannot call this directly; the authenticated EVIDENCE_VERIFIER edge function is the only intended caller. Candidate matches are intentionally not created here.';

commit;
