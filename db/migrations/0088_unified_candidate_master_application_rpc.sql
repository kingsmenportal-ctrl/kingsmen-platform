-- Atomic, idempotent save boundary for the unified master application.
-- SECURITY INVOKER is deliberate: all table writes remain subject to RLS.
create or replace function public.save_candidate_master_application(
  p_profile_data jsonb,
  p_pathway_preferences jsonb,
  p_consent_version text,
  p_idempotency_key text,
  p_targets jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public, kingsmen_security
as $$
declare
  v_candidate_id uuid;
  v_user_id uuid;
  v_target jsonb;
  v_target_count integer := 0;
  v_inserted integer := 0;
begin
  v_user_id := auth.uid();
  v_candidate_id := kingsmen_security.current_authenticated_candidate_id();

  if v_user_id is null or v_candidate_id is null then
    raise exception 'AUTHENTICATED_CANDIDATE_IDENTITY_REQUIRED' using errcode = '42501';
  end if;
  if jsonb_typeof(p_profile_data) <> 'object' or pg_column_size(p_profile_data) > 50000 then
    raise exception 'INVALID_PROFILE_DATA' using errcode = '22023';
  end if;
  if jsonb_typeof(p_pathway_preferences) <> 'array' or jsonb_array_length(p_pathway_preferences) > 9 then
    raise exception 'INVALID_PATHWAY_PREFERENCES' using errcode = '22023';
  end if;
  if p_consent_version is null or length(trim(p_consent_version)) not between 1 and 80 then
    raise exception 'VALID_CONSENT_REQUIRED' using errcode = '22023';
  end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) not between 16 and 120 then
    raise exception 'VALID_IDEMPOTENCY_KEY_REQUIRED' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_targets, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_targets, '[]'::jsonb)) > 25 then
    raise exception 'INVALID_TARGETS' using errcode = '22023';
  end if;

  insert into public.candidate_master_profiles
    (candidate_id, profile_data, pathway_preferences, consent_version, consent_at, last_saved_by_auth_user_id)
  values
    (v_candidate_id, p_profile_data, p_pathway_preferences, p_consent_version, now(), v_user_id)
  on conflict (candidate_id) do update set
    profile_data = excluded.profile_data,
    pathway_preferences = excluded.pathway_preferences,
    consent_version = excluded.consent_version,
    consent_at = excluded.consent_at,
    last_saved_by_auth_user_id = excluded.last_saved_by_auth_user_id,
    updated_at = now();

  insert into public.candidate_master_application_events
    (candidate_id, actor_auth_user_id, event_type, idempotency_key, details)
  values
    (v_candidate_id, v_user_id, 'PROFILE_SAVED', p_idempotency_key,
     jsonb_build_object('consent_version', p_consent_version, 'profile_field_count', (select count(*) from jsonb_object_keys(p_profile_data))))
  on conflict (candidate_id, event_type, idempotency_key) do nothing;

  for v_target in select value from jsonb_array_elements(coalesce(p_targets, '[]'::jsonb))
  loop
    if nullif(trim(v_target->>'target_key'), '') is null
      or nullif(trim(v_target->>'provider_name'), '') is null
      or nullif(trim(v_target->>'programme_or_role'), '') is null
      or (v_target ? 'provider_application_url' and nullif(trim(v_target->>'provider_application_url'), '') is not null
          and (v_target->>'provider_application_url') !~ '^https://') then
      raise exception 'INVALID_APPLICATION_TARGET' using errcode = '22023';
    end if;

    insert into public.candidate_master_application_targets
      (candidate_id, target_key, pathway_type, provider_name, programme_or_role,
       provider_application_url, source_reference, source_confidence, planning_status,
       idempotency_key, created_by_auth_user_id)
    values
      (v_candidate_id, left(trim(v_target->>'target_key'), 120),
       v_target->>'pathway_type', left(trim(v_target->>'provider_name'), 180),
       left(trim(v_target->>'programme_or_role'), 240),
       nullif(trim(v_target->>'provider_application_url'), ''),
       nullif(trim(v_target->>'source_reference'), ''),
       'UNVERIFIED', 'PLANNING', p_idempotency_key, v_user_id)
    on conflict (candidate_id, idempotency_key, target_key) do nothing;
    get diagnostics v_inserted = row_count;
    v_target_count := v_target_count + v_inserted;
  end loop;

  if jsonb_array_length(coalesce(p_targets, '[]'::jsonb)) > 0 then
    insert into public.candidate_master_application_events
      (candidate_id, actor_auth_user_id, event_type, idempotency_key, details)
    values
      (v_candidate_id, v_user_id, 'TARGETS_PLANNED', p_idempotency_key,
       jsonb_build_object('requested_targets', jsonb_array_length(p_targets), 'new_targets', v_target_count))
    on conflict (candidate_id, event_type, idempotency_key) do nothing;
  end if;

  return jsonb_build_object(
    'ok', true,
    'profile_saved', true,
    'new_targets_saved', v_target_count,
    'targets_requested', jsonb_array_length(coalesce(p_targets, '[]'::jsonb)),
    'provider_submissions_sent', 0,
    'provider_outcomes_verified', 0,
    'submission_boundary', 'PLANNING_ONLY_PROVIDER_INTEGRATION_REQUIRED'
  );
end;
$$;

revoke all on function public.save_candidate_master_application(jsonb,jsonb,text,text,jsonb) from public, anon;
grant execute on function public.save_candidate_master_application(jsonb,jsonb,text,text,jsonb) to authenticated;
