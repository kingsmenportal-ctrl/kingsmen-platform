-- Candidate application draft persistence and official-portal handoff.
-- Apply only after the verified backup/restore and migration-provenance gates pass.
-- This migration does not submit applications to providers or replay application migrations.

begin;

create unique index if not exists candidate_applications_id_candidate_id_uidx
  on public.candidate_applications (id, candidate_id);

-- Preserve the existing append-only application event allowlist and add only the
-- draft audit event. Unknown constraint shapes stop the migration instead of
-- silently replacing an event policy we have not inspected.
do $migration$
declare
  v_definition text;
  v_updated_definition text;
begin
  select pg_get_constraintdef(c.oid)
    into v_definition
  from pg_constraint c
  where c.conrelid = 'public.candidate_application_events'::regclass
    and c.conname = 'candidate_application_events_event_type_check'
    and c.contype = 'c';

  if v_definition is null then
    raise exception 'APPLICATION_EVENT_TYPE_CONSTRAINT_REQUIRED';
  end if;

  if position('APPLICATION_DRAFT_SAVED' in v_definition) > 0 then
    return;
  end if;

  v_updated_definition := regexp_replace(
    v_definition,
    '::text\]\)\)\)$',
    '::text, ''APPLICATION_DRAFT_SAVED''::text])))'
  );

  if v_updated_definition = v_definition
     or position('APPLICATION_DRAFT_SAVED' in v_updated_definition) = 0 then
    raise exception 'APPLICATION_EVENT_TYPE_CONSTRAINT_SHAPE_UNRECOGNIZED: %', v_definition;
  end if;

  alter table public.candidate_application_events
    drop constraint candidate_application_events_event_type_check;
  execute format(
    'alter table public.candidate_application_events add constraint candidate_application_events_event_type_check %s',
    v_updated_definition
  );
end
$migration$;

create table if not exists public.candidate_application_draft_answers (
  application_id uuid primary key references public.candidate_applications(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete restrict,
  answer_data jsonb not null default '{}'::jsonb,
  draft_version integer not null default 0 check (draft_version >= 0),
  idempotency_key text,
  saved_by_auth_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidate_application_draft_answers_object check (jsonb_typeof(answer_data) = 'object'),
  constraint candidate_application_draft_answers_size check (octet_length(answer_data::text) <= 65536),
  constraint candidate_application_draft_answers_idempotency_key check (
    idempotency_key is null or idempotency_key ~ '^[A-Za-z0-9._:-]{8,160}$'
  ),
  constraint candidate_application_draft_answers_application_owner_fk
    foreign key (application_id, candidate_id)
    references public.candidate_applications(id, candidate_id)
    on delete cascade
);

alter table public.candidate_application_draft_answers enable row level security;
alter table public.candidate_application_draft_answers force row level security;
revoke all on public.candidate_application_draft_answers from public, anon, authenticated;
grant select, insert, update, delete on public.candidate_application_draft_answers to service_role;

create or replace function public.get_candidate_application_draft(p_application_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, kingsmen_security, auth
as $function$
declare
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_application public.candidate_applications%rowtype;
  v_opportunity public.candidate_opportunities%rowtype;
  v_draft public.candidate_application_draft_answers%rowtype;
  v_has_draft boolean := false;
  v_profile_updated_at timestamptz;
  v_handoff record;
begin
  if v_auth_user_id is null or p_application_id is null then
    raise insufficient_privilege using message = 'Authentication and application are required';
  end if;

  v_candidate_id := private.current_verified_candidate_id();

  if v_candidate_id is null or not exists (
    select 1
    from public.candidate_auth_identity_links l
    join public.candidates c on c.id = l.candidate_id and c.is_active is true
    where l.supabase_user_id = v_auth_user_id
      and l.candidate_id = v_candidate_id
      and l.link_status = 'VERIFIED'
      and l.verified_at is not null
      and l.verified_at <= statement_timestamp()
      and l.verified_by is not null
      and length(btrim(l.verified_by)) between 1 and 200
  ) then
    raise insufficient_privilege using message = 'Verified active candidate identity required';
  end if;

  select * into v_application
  from public.candidate_applications
  where id = p_application_id and candidate_id = v_candidate_id;

  if not found then
    raise insufficient_privilege using message = 'Application not found for this candidate';
  end if;

  select * into v_opportunity
  from public.candidate_opportunities
  where id = v_application.opportunity_id;

  select * into v_draft
  from public.candidate_application_draft_answers
  where application_id = p_application_id and candidate_id = v_candidate_id;
  v_has_draft := found;

  select updated_at into v_profile_updated_at
  from public.candidate_master_profiles
  where candidate_id = v_candidate_id;

  select j.submission_ref, j.job_status, j.delivery_mode, j.adapter_key
    into v_handoff
  from public.candidate_application_submission_jobs j
  where j.application_id = p_application_id
    and j.candidate_id = v_candidate_id
    and j.idempotency_key = 'manual-portal:' || p_application_id::text
  limit 1;

  return jsonb_build_object(
    'ok', true,
    'application', jsonb_build_object(
      'id', v_application.id,
      'application_ref', v_application.application_ref,
      'pathway_type', v_application.pathway_type,
      'status', v_application.status,
      'kingsmen_status', case v_application.status
        when 'DRAFT' then 'Draft'
        when 'READINESS_BLOCKED' then 'Action required'
        when 'READY_FOR_REVIEW' then 'Draft'
        when 'READY_TO_SUBMIT' then 'Draft'
        when 'SUBMISSION_PENDING' then 'Submitted to Kingsmen'
        when 'SUBMITTED_CONFIRMED' then 'Provider receipt confirmed'
        when 'PROVIDER_REVIEW' then 'Under review'
        when 'MANUAL_ACTION_REQUIRED' then 'Action required'
        when 'SHORTLISTED' then 'Decision recorded'
        when 'INTERVIEW' then 'Decision recorded'
        when 'OFFERED' then 'Decision recorded'
        when 'ACCEPTED' then 'Decision recorded'
        when 'REJECTED' then 'Decision recorded'
        when 'WITHDRAWN' then 'Decision recorded'
        when 'CANCELLED' then 'Decision recorded'
        when 'EXPIRED' then 'Action required'
        else 'Status not available'
      end,
      'readiness_status', v_application.readiness_status,
      'readiness_snapshot', v_application.readiness_snapshot,
      'title', v_opportunity.title,
      'provider_name', v_opportunity.provider_name,
      'source_url', v_opportunity.source_url,
      'application_url', v_opportunity.application_url,
      'application_method', v_opportunity.application_method,
      'source_status', v_opportunity.source_status,
      'source_checked_at', v_opportunity.source_checked_at,
      'closes_at', v_opportunity.closes_at,
      'created_at', v_application.created_at,
      'updated_at', v_application.updated_at
    ),
    'draft', case when v_has_draft then v_draft.answer_data else '{}'::jsonb end,
    'draft_version', case when v_has_draft then v_draft.draft_version else 0 end,
    'draft_updated_at', case when v_has_draft then v_draft.updated_at else null end,
    'shared_profile_available', v_profile_updated_at is not null,
    'shared_profile_updated_at', v_profile_updated_at,
    'is_editable', v_application.status in ('DRAFT','READINESS_BLOCKED','READY_FOR_REVIEW','READY_TO_SUBMIT'),
    'handoff', case when v_handoff.submission_ref is null then null else jsonb_build_object(
      'submission_ref', v_handoff.submission_ref,
      'job_status', v_handoff.job_status,
      'delivery_mode', v_handoff.delivery_mode,
      'adapter_key', v_handoff.adapter_key,
      'official_url', coalesce(nullif(v_opportunity.application_url, ''), v_opportunity.source_url),
      'provider_submission_sent', false
    ) end,
    'provider_submission_sent', false
  );
end;
$function$;

create or replace function public.save_candidate_application_draft(
  p_application_id uuid,
  p_answer_data jsonb,
  p_expected_version integer,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, kingsmen_security, auth
as $function$
declare
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_public_ref text;
  v_application public.candidate_applications%rowtype;
  v_existing public.candidate_application_draft_answers%rowtype;
  v_saved public.candidate_application_draft_answers%rowtype;
  v_has_existing boolean := false;
  v_has_active_consent boolean := false;
  v_answer jsonb;
  v_answer_keys jsonb;
  v_idempotency text;
  v_now timestamptz := clock_timestamp();
begin
  if v_auth_user_id is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  if p_application_id is null
     or p_expected_version is null or p_expected_version < 0
     or p_idempotency_key is null or p_idempotency_key !~ '^[A-Za-z0-9._:-]{8,160}$'
     or p_answer_data is null or jsonb_typeof(p_answer_data) is distinct from 'object'
     or octet_length(p_answer_data::text) > 65536
     or p_answer_data - array[
       'motivation_statement','relevant_experience','qualifications_summary',
       'availability_date','preferred_campus','additional_answers'
     ]::text[] <> '{}'::jsonb then
    return jsonb_build_object('ok', false, 'code', 'APPLICATION_DRAFT_INPUT_INVALID');
  end if;

  if (p_answer_data ? 'motivation_statement' and
      (jsonb_typeof(p_answer_data->'motivation_statement') is distinct from 'string'
       or length(p_answer_data->>'motivation_statement') > 5000))
     or (p_answer_data ? 'relevant_experience' and
      (jsonb_typeof(p_answer_data->'relevant_experience') is distinct from 'string'
       or length(p_answer_data->>'relevant_experience') > 4000))
     or (p_answer_data ? 'qualifications_summary' and
      (jsonb_typeof(p_answer_data->'qualifications_summary') is distinct from 'string'
       or length(p_answer_data->>'qualifications_summary') > 3000))
     or (p_answer_data ? 'preferred_campus' and
      (jsonb_typeof(p_answer_data->'preferred_campus') is distinct from 'string'
       or length(p_answer_data->>'preferred_campus') > 180))
     or (p_answer_data ? 'availability_date' and
      (jsonb_typeof(p_answer_data->'availability_date') is distinct from 'string'
       or (nullif(p_answer_data->>'availability_date', '') is not null and
         ((p_answer_data->>'availability_date') !~ '^\d{4}-\d{2}-\d{2}
     or (p_answer_data ? 'additional_answers' and
      (jsonb_typeof(p_answer_data->'additional_answers') is distinct from 'array'
       or jsonb_array_length(p_answer_data->'additional_answers') > 20)) then
    return jsonb_build_object('ok', false, 'code', 'APPLICATION_DRAFT_ANSWERS_INVALID');
  end if;

  for v_answer in
    select value from jsonb_array_elements(coalesce(p_answer_data->'additional_answers', '[]'::jsonb))
  loop
    if jsonb_typeof(v_answer) is distinct from 'object'
       or v_answer - array['question_key','answer']::text[] <> '{}'::jsonb
       or coalesce(v_answer->>'question_key', '') !~ '^[A-Za-z0-9._:-]{1,80}$'
       or jsonb_typeof(v_answer->'answer') is distinct from 'string'
       or length(v_answer->>'answer') > 2000 then
      return jsonb_build_object('ok', false, 'code', 'APPLICATION_ADDITIONAL_ANSWER_INVALID');
    end if;
  end loop;

  -- Lock the reviewer-verified identity link and active candidate before using it.
  v_candidate_id := private.current_verified_candidate_id();
  select c.public_ref into v_public_ref
  from public.candidate_auth_identity_links l
  join public.candidates c on c.id = l.candidate_id and c.is_active is true
  where l.supabase_user_id = v_auth_user_id
    and l.candidate_id = v_candidate_id
    and l.link_status = 'VERIFIED'
    and l.verified_at is not null
    and l.verified_at <= v_now
    and pg_input_is_valid(l.verified_by, 'uuid')
  for share of l, c;

  if v_candidate_id is null or v_public_ref is null then
    raise insufficient_privilege using message = 'Verified active candidate identity required';
  end if;

  if not exists (
    select 1 from public.candidate_master_profiles mp
    where mp.candidate_id = v_candidate_id
  ) then
    raise insufficient_privilege using message = 'CANDIDATE_REUSABLE_PROFILE_REQUIRED';
  end if;

  select exists (
    select 1
    from public.privacy_consent_records pc
    where pc.candidate_ref = v_public_ref
      and pc.consent_type = 'PROFILE_PROCESSING'
      and pc.consent_status = 'ACTIVE'
      and pc.revoked_at is null
      and nullif(trim(pc.consent_text_snapshot), '') is not null
      and pc.granted_at <= v_now
      and not exists (
        select 1
        from public.privacy_consent_records newer
        where newer.candidate_ref = pc.candidate_ref
          and newer.consent_type = pc.consent_type
          and (newer.granted_at, newer.id) > (pc.granted_at, pc.id)
      )
  ) into v_has_active_consent;

  if not v_has_active_consent then
    raise insufficient_privilege using message = 'PROFILE_PROCESSING_CONSENT_REQUIRED';
  end if;

  select * into v_application
  from public.candidate_applications
  where id = p_application_id and candidate_id = v_candidate_id
  for update;

  if not found then
    raise insufficient_privilege using message = 'OWNED_APPLICATION_NOT_FOUND';
  end if;

  if v_application.status not in ('DRAFT','READINESS_BLOCKED','READY_FOR_REVIEW','READY_TO_SUBMIT') then
    return jsonb_build_object('ok', false, 'code', 'APPLICATION_DRAFT_IS_LOCKED');
  end if;

  select * into v_existing
  from public.candidate_application_draft_answers
  where application_id = p_application_id and candidate_id = v_candidate_id
  for update;
  v_has_existing := found;

  if v_has_existing and v_existing.idempotency_key = p_idempotency_key then
    if v_existing.answer_data is distinct from p_answer_data then
      return jsonb_build_object(
        'ok', false,
        'code', 'APPLICATION_DRAFT_IDEMPOTENCY_CONFLICT',
        'message', 'This idempotency key was already used with different draft content.'
      );
    end if;
    return jsonb_build_object(
      'ok', true, 'reused', true,
      'draft_version', v_existing.draft_version,
      'updated_at', v_existing.updated_at,
      'readiness_recheck_required', false,
      'provider_submission_sent', false,
      'message', 'Application draft saved. It has not been submitted to the provider.'
    );
  end if;

  if (v_has_existing and v_existing.draft_version <> p_expected_version)
     or (not v_has_existing and p_expected_version <> 0) then
    return jsonb_build_object(
      'ok', false,
      'code', 'APPLICATION_DRAFT_VERSION_CONFLICT',
      'current_version', case when v_has_existing then v_existing.draft_version else 0 end
    );
  end if;

  v_idempotency := p_idempotency_key;
  insert into public.candidate_application_draft_answers (
    application_id, candidate_id, answer_data, draft_version,
    idempotency_key, saved_by_auth_user_id, created_at, updated_at
  ) values (
    p_application_id, v_candidate_id, p_answer_data, 1,
    v_idempotency, v_auth_user_id, v_now, v_now
  )
  on conflict (application_id) do update set
    answer_data = excluded.answer_data,
    draft_version = public.candidate_application_draft_answers.draft_version + 1,
    idempotency_key = excluded.idempotency_key,
    saved_by_auth_user_id = excluded.saved_by_auth_user_id,
    updated_at = excluded.updated_at
  returning * into v_saved;

  -- Draft edits invalidate readiness but do not rewrite the application lifecycle state.
  update public.candidate_applications
  set readiness_status = 'NOT_CHECKED',
      readiness_snapshot = jsonb_build_object('readiness_recheck_required', true),
      last_status_reason = 'Application answers changed. Readiness must be checked again.',
      updated_at = v_now
  where id = p_application_id and candidate_id = v_candidate_id;

  select coalesce(jsonb_agg(answer_key order by answer_key), '[]'::jsonb)
    into v_answer_keys
  from jsonb_object_keys(p_answer_data) as fields(answer_key);

  insert into public.candidate_application_events (
    event_ref, application_id, candidate_id, actor_auth_user_id,
    event_type, from_status, to_status, reason_code, details, created_at
  ) values (
    'application-draft-saved:' || p_application_id::text || ':' || p_idempotency_key,
    p_application_id, v_candidate_id, v_auth_user_id,
    'APPLICATION_DRAFT_SAVED', v_application.status, v_application.status,
    'CANDIDATE_APPLICATION_ANSWERS_UPDATED',
    jsonb_build_object(
      'draft_version', v_saved.draft_version,
      'answer_keys', v_answer_keys,
      'provider_submission_sent', false
    ),
    v_now
  ) on conflict (event_ref) do nothing;

  return jsonb_build_object(
    'ok', true,
    'reused', false,
    'draft_version', v_saved.draft_version,
    'updated_at', v_saved.updated_at,
    'readiness_recheck_required', true,
    'provider_submission_sent', false,
    'message', 'Application draft saved. It has not been submitted to the provider.'
  );
end;
$function$;

-- Candidate-triggered handoff only records a manual portal task. No provider
-- adapter is configured and no outbound application request is sent.
create or replace function public.prepare_candidate_manual_portal_submission(p_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, kingsmen_security, auth
as $function$
declare
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_app record;
  v_job record;
  v_submission_ref text;
  v_url text;
begin
  if v_auth_user_id is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  v_candidate_id := private.current_verified_candidate_id();
  perform 1
  from public.candidate_auth_identity_links l
  join public.candidates c on c.id = l.candidate_id and c.is_active is true
  where l.supabase_user_id = v_auth_user_id
    and l.candidate_id = v_candidate_id
    and l.link_status = 'VERIFIED'
    and l.verified_at is not null
    and l.verified_at <= statement_timestamp()
    and pg_input_is_valid(l.verified_by, 'uuid')
  for share of l, c;
  if v_candidate_id is null or not found then
    raise insufficient_privilege using message = 'Verified active candidate identity required';
  end if;
  if p_application_id is null then
    raise exception 'APPLICATION_ID_REQUIRED' using errcode = '22023';
  end if;

  select a.id,a.application_ref,a.candidate_id,a.opportunity_id,a.status,
         o.title,o.provider_name,o.source_url,o.application_url,o.application_method,
         o.source_status,o.is_published,o.source_checked_at
    into v_app
  from public.candidate_applications a
  join public.candidate_opportunities o on o.id = a.opportunity_id
  where a.id = p_application_id and a.candidate_id = v_candidate_id
  for update of a;

  if not found then
    return jsonb_build_object('ok',false,'code','APPLICATION_NOT_FOUND');
  end if;

  if not exists (
    select 1 from public.candidate_application_draft_answers d
    where d.application_id = p_application_id
      and d.candidate_id = v_candidate_id
      and d.draft_version >= 1
  ) then
    return jsonb_build_object(
      'ok',false,'code','APPLICATION_DRAFT_REQUIRED',
      'message','Save your application answers before preparing the official provider portal handoff.'
    );
  end if;

  if v_app.source_status is distinct from 'VERIFIED'
     or v_app.is_published is distinct from true
     or v_app.source_checked_at is null
     or v_app.source_checked_at < now() - interval '24 hours' then
    return jsonb_build_object('ok',false,'code','OFFICIAL_SOURCE_REFRESH_REQUIRED',
      'message','The opportunity source is not currently verified and fresh. Refresh official evidence before preparing a portal handoff.');
  end if;

  v_url := coalesce(nullif(v_app.application_url,''), nullif(v_app.source_url,''));
  if v_url is null or v_url !~ '^https://' then
    return jsonb_build_object('ok',false,'code','OFFICIAL_HTTPS_URL_REQUIRED');
  end if;

  if v_app.application_method is null
     or v_app.application_method not in ('EXTERNAL_PORTAL','MANUAL_ONLY') then
    return jsonb_build_object('ok',false,'code','MANUAL_PORTAL_NOT_APPLICABLE',
      'message','This opportunity is not configured for an external-portal handoff.');
  end if;

  if v_app.status not in ('DRAFT','READINESS_BLOCKED','READY_FOR_REVIEW','READY_TO_SUBMIT','MANUAL_ACTION_REQUIRED') then
    return jsonb_build_object('ok',false,'code','APPLICATION_ALREADY_SUBMITTED_OR_TRACKED',
      'message','This application has moved beyond the manual preparation stage. Use the existing evidence-backed tracking workflow.');
  end if;

  select id,submission_ref,job_status into v_job
  from public.candidate_application_submission_jobs
  where application_id = p_application_id and candidate_id = v_candidate_id
    and idempotency_key = 'manual-portal:' || p_application_id::text
  limit 1;

  if not found then
    v_submission_ref := 'KM-SUB-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
    insert into public.candidate_application_submission_jobs(
      submission_ref,application_id,candidate_id,opportunity_id,requested_by_auth_user_id,
      delivery_mode,job_status,adapter_key,idempotency_key
    ) values (
      v_submission_ref,p_application_id,v_candidate_id,v_app.opportunity_id,v_auth_user_id,
      'EXTERNAL_PORTAL','MANUAL_REQUIRED','NONE_CONFIGURED','manual-portal:' || p_application_id::text
    ) on conflict (idempotency_key) do nothing;

    select id,submission_ref,job_status into v_job
    from public.candidate_application_submission_jobs
    where application_id = p_application_id and candidate_id = v_candidate_id
      and idempotency_key = 'manual-portal:' || p_application_id::text
    limit 1;

    if not found then
      raise exception 'MANUAL_PORTAL_JOB_NOT_PERSISTED' using errcode = '55000';
    end if;
  end if;

  update public.candidate_applications
  set status = 'MANUAL_ACTION_REQUIRED',
      last_status_reason = 'Official portal handoff prepared. Candidate must complete provider steps and attach receipt evidence; Kingsmen did not submit the application.',
      updated_at = now()
  where id = p_application_id and candidate_id = v_candidate_id;

  insert into public.candidate_application_events(
    event_ref,application_id,candidate_id,actor_auth_user_id,event_type,
    from_status,to_status,reason_code,details
  ) values (
    'manual-portal-prepared:' || p_application_id::text,
    p_application_id,v_candidate_id,v_auth_user_id,'MANUAL_PACKAGE_CREATED',
    v_app.status,'MANUAL_ACTION_REQUIRED','EXTERNAL_PORTAL_HANDOFF',
    jsonb_build_object(
      'submission_ref',v_job.submission_ref,
      'delivery_mode','EXTERNAL_PORTAL',
      'adapter_key','NONE_CONFIGURED',
      'official_url',v_url,
      'provider_submission_sent',false
    )
  ) on conflict (event_ref) do nothing;

  return jsonb_build_object(
    'ok',true,
    'application_id',p_application_id,
    'application_ref',v_app.application_ref,
    'submission_ref',v_job.submission_ref,
    'job_status',v_job.job_status,
    'delivery_mode','EXTERNAL_PORTAL',
    'provider_name',v_app.provider_name,
    'official_url',v_url,
    'provider_submission_sent',false,
    'next_steps',jsonb_build_array(
      'Review the official provider requirements',
      'Complete the provider portal yourself or with authorised Kingsmen support',
      'Upload the provider receipt to the private document vault linked to this application',
      'Wait for independent review before treating receipt or outcome as verified'
    )
  );
end;
$function$;

revoke all on function public.get_candidate_application_draft(uuid) from public, anon;
revoke all on function public.save_candidate_application_draft(uuid, jsonb, integer, text) from public, anon;
revoke all on function public.prepare_candidate_manual_portal_submission(uuid) from public, anon;
grant execute on function public.get_candidate_application_draft(uuid) to authenticated;
grant execute on function public.save_candidate_application_draft(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.prepare_candidate_manual_portal_submission(uuid) to authenticated;

comment on table public.candidate_application_draft_answers is
  'Candidate-owned application-specific draft answers. Access through authenticated ownership-checking RPCs; not directly exposed to anon/authenticated roles.';
comment on function public.get_candidate_application_draft(uuid) is
  'Returns the authenticated candidate-owned parent application, persisted answers and any manual portal handoff.';
comment on function public.save_candidate_application_draft(uuid, jsonb, integer, text) is
  'Persists bounded answers for an owned candidate application, requires current reusable profile consent, and invalidates prior readiness. Does not submit to a provider.';
comment on function public.prepare_candidate_manual_portal_submission(uuid) is
  'Creates an idempotent manual portal handoff only after draft save and current official-source checks. Never submits to an external provider.';

commit;

          or not pg_input_is_valid(p_answer_data->>'availability_date', 'date')))))
     or (p_answer_data ? 'additional_answers' and
      (jsonb_typeof(p_answer_data->'additional_answers') is distinct from 'array'
       or jsonb_array_length(p_answer_data->'additional_answers') > 20)) then
    return jsonb_build_object('ok', false, 'code', 'APPLICATION_DRAFT_ANSWERS_INVALID');
  end if;

  for v_answer in
    select value from jsonb_array_elements(coalesce(p_answer_data->'additional_answers', '[]'::jsonb))
  loop
    if jsonb_typeof(v_answer) is distinct from 'object'
       or v_answer - array['question_key','answer']::text[] <> '{}'::jsonb
       or coalesce(v_answer->>'question_key', '') !~ '^[A-Za-z0-9._:-]{1,80}$'
       or jsonb_typeof(v_answer->'answer') is distinct from 'string'
       or length(v_answer->>'answer') > 2000 then
      return jsonb_build_object('ok', false, 'code', 'APPLICATION_ADDITIONAL_ANSWER_INVALID');
    end if;
  end loop;

  -- Lock the reviewer-verified identity link and active candidate before using it.
  v_candidate_id := private.current_verified_candidate_id();
  select c.public_ref into v_public_ref
  from public.candidate_auth_identity_links l
  join public.candidates c on c.id = l.candidate_id and c.is_active is true
  where l.supabase_user_id = v_auth_user_id
    and l.candidate_id = v_candidate_id
    and l.link_status = 'VERIFIED'
    and l.verified_at is not null
    and l.verified_at <= v_now
    and pg_input_is_valid(l.verified_by, 'uuid')
  for share of l, c;

  if v_candidate_id is null or v_public_ref is null then
    raise insufficient_privilege using message = 'Verified active candidate identity required';
  end if;

  if not exists (
    select 1 from public.candidate_master_profiles mp
    where mp.candidate_id = v_candidate_id
  ) then
    raise insufficient_privilege using message = 'CANDIDATE_REUSABLE_PROFILE_REQUIRED';
  end if;

  select exists (
    select 1
    from public.privacy_consent_records pc
    where pc.candidate_ref = v_public_ref
      and pc.consent_type = 'PROFILE_PROCESSING'
      and pc.consent_status = 'ACTIVE'
      and pc.revoked_at is null
      and nullif(trim(pc.consent_text_snapshot), '') is not null
      and pc.granted_at <= v_now
      and not exists (
        select 1
        from public.privacy_consent_records newer
        where newer.candidate_ref = pc.candidate_ref
          and newer.consent_type = pc.consent_type
          and (newer.granted_at, newer.id) > (pc.granted_at, pc.id)
      )
  ) into v_has_active_consent;

  if not v_has_active_consent then
    raise insufficient_privilege using message = 'PROFILE_PROCESSING_CONSENT_REQUIRED';
  end if;

  select * into v_application
  from public.candidate_applications
  where id = p_application_id and candidate_id = v_candidate_id
  for update;

  if not found then
    raise insufficient_privilege using message = 'OWNED_APPLICATION_NOT_FOUND';
  end if;

  if v_application.status not in ('DRAFT','READINESS_BLOCKED','READY_FOR_REVIEW','READY_TO_SUBMIT') then
    return jsonb_build_object('ok', false, 'code', 'APPLICATION_DRAFT_IS_LOCKED');
  end if;

  select * into v_existing
  from public.candidate_application_draft_answers
  where application_id = p_application_id and candidate_id = v_candidate_id
  for update;
  v_has_existing := found;

  if v_has_existing and v_existing.idempotency_key = p_idempotency_key then
    if v_existing.answer_data is distinct from p_answer_data then
      return jsonb_build_object(
        'ok', false,
        'code', 'APPLICATION_DRAFT_IDEMPOTENCY_CONFLICT',
        'message', 'This idempotency key was already used with different draft content.'
      );
    end if;
    return jsonb_build_object(
      'ok', true, 'reused', true,
      'draft_version', v_existing.draft_version,
      'updated_at', v_existing.updated_at,
      'readiness_recheck_required', false,
      'provider_submission_sent', false,
      'message', 'Application draft saved. It has not been submitted to the provider.'
    );
  end if;

  if (v_has_existing and v_existing.draft_version <> p_expected_version)
     or (not v_has_existing and p_expected_version <> 0) then
    return jsonb_build_object(
      'ok', false,
      'code', 'APPLICATION_DRAFT_VERSION_CONFLICT',
      'current_version', case when v_has_existing then v_existing.draft_version else 0 end
    );
  end if;

  v_idempotency := p_idempotency_key;
  insert into public.candidate_application_draft_answers (
    application_id, candidate_id, answer_data, draft_version,
    idempotency_key, saved_by_auth_user_id, created_at, updated_at
  ) values (
    p_application_id, v_candidate_id, p_answer_data, 1,
    v_idempotency, v_auth_user_id, v_now, v_now
  )
  on conflict (application_id) do update set
    answer_data = excluded.answer_data,
    draft_version = public.candidate_application_draft_answers.draft_version + 1,
    idempotency_key = excluded.idempotency_key,
    saved_by_auth_user_id = excluded.saved_by_auth_user_id,
    updated_at = excluded.updated_at
  returning * into v_saved;

  -- Draft edits invalidate readiness but do not rewrite the application lifecycle state.
  update public.candidate_applications
  set readiness_status = 'NOT_CHECKED',
      readiness_snapshot = jsonb_build_object('readiness_recheck_required', true),
      last_status_reason = 'Application answers changed. Readiness must be checked again.',
      updated_at = v_now
  where id = p_application_id and candidate_id = v_candidate_id;

  select coalesce(jsonb_agg(answer_key order by answer_key), '[]'::jsonb)
    into v_answer_keys
  from jsonb_object_keys(p_answer_data) as fields(answer_key);

  insert into public.candidate_application_events (
    event_ref, application_id, candidate_id, actor_auth_user_id,
    event_type, from_status, to_status, reason_code, details, created_at
  ) values (
    'application-draft-saved:' || p_application_id::text || ':' || p_idempotency_key,
    p_application_id, v_candidate_id, v_auth_user_id,
    'APPLICATION_DRAFT_SAVED', v_application.status, v_application.status,
    'CANDIDATE_APPLICATION_ANSWERS_UPDATED',
    jsonb_build_object(
      'draft_version', v_saved.draft_version,
      'answer_keys', v_answer_keys,
      'provider_submission_sent', false
    ),
    v_now
  ) on conflict (event_ref) do nothing;

  return jsonb_build_object(
    'ok', true,
    'reused', false,
    'draft_version', v_saved.draft_version,
    'updated_at', v_saved.updated_at,
    'readiness_recheck_required', true,
    'provider_submission_sent', false,
    'message', 'Application draft saved. It has not been submitted to the provider.'
  );
end;
$function$;

-- Candidate-triggered handoff only records a manual portal task. No provider
-- adapter is configured and no outbound application request is sent.
create or replace function public.prepare_candidate_manual_portal_submission(p_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, kingsmen_security, auth
as $function$
declare
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_app record;
  v_job record;
  v_submission_ref text;
  v_url text;
begin
  if v_auth_user_id is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  v_candidate_id := private.current_verified_candidate_id();
  perform 1
  from public.candidate_auth_identity_links l
  join public.candidates c on c.id = l.candidate_id and c.is_active is true
  where l.supabase_user_id = v_auth_user_id
    and l.candidate_id = v_candidate_id
    and l.link_status = 'VERIFIED'
    and l.verified_at is not null
    and l.verified_at <= statement_timestamp()
    and pg_input_is_valid(l.verified_by, 'uuid')
  for share of l, c;
  if v_candidate_id is null or not found then
    raise insufficient_privilege using message = 'Verified active candidate identity required';
  end if;
  if p_application_id is null then
    raise exception 'APPLICATION_ID_REQUIRED' using errcode = '22023';
  end if;

  select a.id,a.application_ref,a.candidate_id,a.opportunity_id,a.status,
         o.title,o.provider_name,o.source_url,o.application_url,o.application_method,
         o.source_status,o.is_published,o.source_checked_at
    into v_app
  from public.candidate_applications a
  join public.candidate_opportunities o on o.id = a.opportunity_id
  where a.id = p_application_id and a.candidate_id = v_candidate_id
  for update of a;

  if not found then
    return jsonb_build_object('ok',false,'code','APPLICATION_NOT_FOUND');
  end if;

  if not exists (
    select 1 from public.candidate_application_draft_answers d
    where d.application_id = p_application_id
      and d.candidate_id = v_candidate_id
      and d.draft_version >= 1
  ) then
    return jsonb_build_object(
      'ok',false,'code','APPLICATION_DRAFT_REQUIRED',
      'message','Save your application answers before preparing the official provider portal handoff.'
    );
  end if;

  if v_app.source_status is distinct from 'VERIFIED'
     or v_app.is_published is distinct from true
     or v_app.source_checked_at is null
     or v_app.source_checked_at < now() - interval '24 hours' then
    return jsonb_build_object('ok',false,'code','OFFICIAL_SOURCE_REFRESH_REQUIRED',
      'message','The opportunity source is not currently verified and fresh. Refresh official evidence before preparing a portal handoff.');
  end if;

  v_url := coalesce(nullif(v_app.application_url,''), nullif(v_app.source_url,''));
  if v_url is null or v_url !~ '^https://' then
    return jsonb_build_object('ok',false,'code','OFFICIAL_HTTPS_URL_REQUIRED');
  end if;

  if v_app.application_method is null
     or v_app.application_method not in ('EXTERNAL_PORTAL','MANUAL_ONLY') then
    return jsonb_build_object('ok',false,'code','MANUAL_PORTAL_NOT_APPLICABLE',
      'message','This opportunity is not configured for an external-portal handoff.');
  end if;

  if v_app.status not in ('DRAFT','READINESS_BLOCKED','READY_FOR_REVIEW','READY_TO_SUBMIT','MANUAL_ACTION_REQUIRED') then
    return jsonb_build_object('ok',false,'code','APPLICATION_ALREADY_SUBMITTED_OR_TRACKED',
      'message','This application has moved beyond the manual preparation stage. Use the existing evidence-backed tracking workflow.');
  end if;

  select id,submission_ref,job_status into v_job
  from public.candidate_application_submission_jobs
  where application_id = p_application_id and candidate_id = v_candidate_id
    and idempotency_key = 'manual-portal:' || p_application_id::text
  limit 1;

  if not found then
    v_submission_ref := 'KM-SUB-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
    insert into public.candidate_application_submission_jobs(
      submission_ref,application_id,candidate_id,opportunity_id,requested_by_auth_user_id,
      delivery_mode,job_status,adapter_key,idempotency_key
    ) values (
      v_submission_ref,p_application_id,v_candidate_id,v_app.opportunity_id,v_auth_user_id,
      'EXTERNAL_PORTAL','MANUAL_REQUIRED','NONE_CONFIGURED','manual-portal:' || p_application_id::text
    ) on conflict (idempotency_key) do nothing;

    select id,submission_ref,job_status into v_job
    from public.candidate_application_submission_jobs
    where application_id = p_application_id and candidate_id = v_candidate_id
      and idempotency_key = 'manual-portal:' || p_application_id::text
    limit 1;

    if not found then
      raise exception 'MANUAL_PORTAL_JOB_NOT_PERSISTED' using errcode = '55000';
    end if;
  end if;

  update public.candidate_applications
  set status = 'MANUAL_ACTION_REQUIRED',
      last_status_reason = 'Official portal handoff prepared. Candidate must complete provider steps and attach receipt evidence; Kingsmen did not submit the application.',
      updated_at = now()
  where id = p_application_id and candidate_id = v_candidate_id;

  insert into public.candidate_application_events(
    event_ref,application_id,candidate_id,actor_auth_user_id,event_type,
    from_status,to_status,reason_code,details
  ) values (
    'manual-portal-prepared:' || p_application_id::text,
    p_application_id,v_candidate_id,v_auth_user_id,'MANUAL_PACKAGE_CREATED',
    v_app.status,'MANUAL_ACTION_REQUIRED','EXTERNAL_PORTAL_HANDOFF',
    jsonb_build_object(
      'submission_ref',v_job.submission_ref,
      'delivery_mode','EXTERNAL_PORTAL',
      'adapter_key','NONE_CONFIGURED',
      'official_url',v_url,
      'provider_submission_sent',false
    )
  ) on conflict (event_ref) do nothing;

  return jsonb_build_object(
    'ok',true,
    'application_id',p_application_id,
    'application_ref',v_app.application_ref,
    'submission_ref',v_job.submission_ref,
    'job_status',v_job.job_status,
    'delivery_mode','EXTERNAL_PORTAL',
    'provider_name',v_app.provider_name,
    'official_url',v_url,
    'provider_submission_sent',false,
    'next_steps',jsonb_build_array(
      'Review the official provider requirements',
      'Complete the provider portal yourself or with authorised Kingsmen support',
      'Upload the provider receipt to the private document vault linked to this application',
      'Wait for independent review before treating receipt or outcome as verified'
    )
  );
end;
$function$;

revoke all on function public.get_candidate_application_draft(uuid) from public, anon;
revoke all on function public.save_candidate_application_draft(uuid, jsonb, integer, text) from public, anon;
revoke all on function public.prepare_candidate_manual_portal_submission(uuid) from public, anon;
grant execute on function public.get_candidate_application_draft(uuid) to authenticated;
grant execute on function public.save_candidate_application_draft(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.prepare_candidate_manual_portal_submission(uuid) to authenticated;

comment on table public.candidate_application_draft_answers is
  'Candidate-owned application-specific draft answers. Access through authenticated ownership-checking RPCs; not directly exposed to anon/authenticated roles.';
comment on function public.get_candidate_application_draft(uuid) is
  'Returns the authenticated candidate-owned parent application, persisted answers and any manual portal handoff.';
comment on function public.save_candidate_application_draft(uuid, jsonb, integer, text) is
  'Persists bounded answers for an owned candidate application, requires current reusable profile consent, and invalidates prior readiness. Does not submit to a provider.';
comment on function public.prepare_candidate_manual_portal_submission(uuid) is
  'Creates an idempotent manual portal handoff only after draft save and current official-source checks. Never submits to an external provider.';

commit;
