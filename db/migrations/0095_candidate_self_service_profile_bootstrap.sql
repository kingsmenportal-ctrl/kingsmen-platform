-- Candidate self-service profile bootstrap.
-- A new Auth user may create only a new candidate record, never auto-link an existing one by email.
-- The resulting Auth link remains PENDING; private documents/opportunity matching stay locked until review.
begin;

create or replace function public.bootstrap_candidate_self_profile(
  p_supabase_user_id uuid,
  p_email text,
  p_profile jsonb,
  p_pathway_preferences jsonb,
  p_consent_version text,
  p_consent_text text,
  p_consent_accepted boolean
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_display_name text := btrim(coalesce(p_profile->>'displayName', ''));
  v_candidate_id uuid;
  v_public_ref text;
  v_now timestamptz := pg_catalog.now();
  v_consent_ref text;
  v_pathway text;
begin
  if p_supabase_user_id is null
     or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or length(v_email) > 320 then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'PROFILE_BOOTSTRAP_INPUT_INVALID');
  end if;
  if p_consent_accepted is distinct from true
     or p_consent_version is null or length(btrim(p_consent_version)) < 1 or length(p_consent_version) > 80
     or p_consent_text is null or length(btrim(p_consent_text)) < 20 or length(p_consent_text) > 2000 then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'CONSENT_REQUIRED');
  end if;
  if pg_catalog.jsonb_typeof(p_profile) <> 'object'
     or pg_catalog.jsonb_typeof(p_pathway_preferences) <> 'array'
     or length(v_display_name) < 2 or length(v_display_name) > 120 then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'PROFILE_FIELDS_INVALID');
  end if;
  if coalesce(pg_catalog.jsonb_array_length(p_pathway_preferences), 99) > 6 then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'PATHWAYS_INVALID');
  end if;
  for v_pathway in select pg_catalog.jsonb_array_elements_text(p_pathway_preferences)
  loop
    if v_pathway not in ('higher_education','tvet','seta_learnership','internship','apprenticeship','employment') then
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'PATHWAYS_INVALID');
    end if;
  end loop;

  -- Serialize requests for the same normalized email to avoid racing duplicate candidate records.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_email, 1));

  if exists (
    select 1 from public.candidate_auth_identity_links l
    where l.supabase_user_id = p_supabase_user_id
  ) then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'AUTH_IDENTITY_ALREADY_LINKED');
  end if;

  -- Email is a duplicate guard only. It is never used to select or link an existing candidate.
  if exists (
    select 1 from public.candidates c
    where pg_catalog.lower(pg_catalog.btrim(c.email)) = v_email
  ) then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'MANUAL_IDENTITY_REVIEW_REQUIRED');
  end if;

  begin
    v_candidate_id := pg_catalog.gen_random_uuid();
    v_public_ref := 'KNG-' || pg_catalog.upper(pg_catalog.substr(pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 12));
    v_consent_ref := 'PROFILE-' || v_public_ref || '-' || pg_catalog.gen_random_uuid()::text;

    insert into public.candidates (
      id, public_ref, email, phone, display_name, current_state, active_package_code, is_active, created_at, updated_at
    ) values (
      v_candidate_id, v_public_ref, v_email, nullif(btrim(coalesce(p_profile->>'phone', '')), ''),
      v_display_name, 'NEW', null, true, v_now, v_now
    );

    insert into public.candidate_auth_identity_links (
      supabase_user_id, candidate_id, link_status, verified_at, verified_by, created_at, updated_at
    ) values (
      p_supabase_user_id, v_candidate_id, 'PENDING', null, null, v_now, v_now
    );

    insert into public.candidate_master_profiles (
      candidate_id, profile_data, pathway_preferences, consent_version, consent_at,
      last_saved_by_auth_user_id, created_at, updated_at
    ) values (
      v_candidate_id, p_profile, p_pathway_preferences, p_consent_version, v_now,
      p_supabase_user_id, v_now, v_now
    );

    insert into public.privacy_consent_records (
      consent_ref, candidate_ref, consent_type, lawful_basis, consent_status,
      consent_text_snapshot, evidence_refs, granted_at
    ) values (
      v_consent_ref, v_public_ref, 'PROFILE_PROCESSING', 'CONSENT', 'ACTIVE',
      p_consent_text, array['candidate-profile-consent-v1','self-service-profile-bootstrap'], v_now
    );

    insert into public.candidate_master_application_events (
      candidate_id, actor_auth_user_id, event_type, idempotency_key, details, created_at
    ) values (
      v_candidate_id, p_supabase_user_id, 'PROFILE_SAVED',
      'SELF_SERVICE_PROFILE_BOOTSTRAP:' || p_supabase_user_id::text,
      pg_catalog.jsonb_build_object(
        'self_service_bootstrap', true,
        'bootstrap_owner_user_id', p_supabase_user_id::text,
        'identity_link_status', 'PENDING',
        'consent_version', p_consent_version,
        'provider_submission_sent', false
      ), v_now
    );

    return pg_catalog.jsonb_build_object(
      'ok', true,
      'candidate_id', v_candidate_id,
      'candidate_reference', v_public_ref,
      'identity_status', 'PENDING_REVIEW',
      'profile_data', p_profile,
      'pathway_preferences', p_pathway_preferences,
      'consent_version', p_consent_version,
      'consent_at', v_now,
      'saved_at', v_now
    );
  exception
    when unique_violation then
      -- Roll back all writes in the subtransaction; do not reveal the matching record.
      return pg_catalog.jsonb_build_object('ok', false, 'code', 'MANUAL_IDENTITY_REVIEW_REQUIRED');
  end;
end;
$function$;

revoke all on function public.bootstrap_candidate_self_profile(uuid, text, jsonb, jsonb, text, text, boolean) from public;
revoke all on function public.bootstrap_candidate_self_profile(uuid, text, jsonb, jsonb, text, text, boolean) from anon, authenticated;
grant execute on function public.bootstrap_candidate_self_profile(uuid, text, jsonb, jsonb, text, text, boolean) to service_role;

commit;
