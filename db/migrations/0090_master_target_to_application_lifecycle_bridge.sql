-- Bridge an authorised, fresh N15 match into the existing application lifecycle.
-- Candidate-supplied target details alone can never mint a verified opportunity/application.
alter table public.candidate_master_application_targets
  add column if not exists application_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'candidate_master_target_application_owner_fk'
      and conrelid = 'public.candidate_master_application_targets'::regclass
  ) then
    alter table public.candidate_master_application_targets
      add constraint candidate_master_target_application_owner_fk
      foreign key (application_id, candidate_id)
      references public.candidate_applications(id, candidate_id)
      on delete restrict;
  end if;
end $$;

create index if not exists candidate_master_targets_application_idx
  on public.candidate_master_application_targets(application_id)
  where application_id is not null;

create or replace function public.prepare_candidate_application_from_master_target(p_target_key text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, kingsmen_security
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_target record;
  v_match record;
  v_opportunity_id uuid;
  v_application_id uuid;
  v_application_ref text;
  v_match_ref text;
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
$$;

revoke all on function public.prepare_candidate_application_from_master_target(text) from public, anon;
grant execute on function public.prepare_candidate_application_from_master_target(text) to authenticated;
comment on function public.prepare_candidate_application_from_master_target(text) is
  'Creates an application-specific DRAFT only from a candidate-owned, approved, fresh N15 match with official evidence. Never submits to a provider.';
