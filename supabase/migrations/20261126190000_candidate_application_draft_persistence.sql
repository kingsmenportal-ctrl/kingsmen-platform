-- Candidate application draft persistence.
-- Apply only after the approved backup/restore and migration-provenance gates pass.
-- No application migrations are replayed by this file.

begin;

-- PostgreSQL requires a unique key matching the composite ownership foreign key.
create unique index if not exists candidate_applications_id_candidate_id_uidx
  on public.candidate_applications (id, candidate_id);

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
revoke all on public.candidate_application_draft_answers from anon, authenticated;
grant select, insert, update, delete on public.candidate_application_draft_answers to service_role;

create or replace function public.get_candidate_application_draft(p_application_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, kingsmen_security, auth
as $function$
declare
  v_candidate_id uuid;
  v_application public.candidate_applications%rowtype;
  v_opportunity public.candidate_opportunities%rowtype;
  v_draft public.candidate_application_draft_answers%rowtype;
  v_has_draft boolean := false;
  v_profile_updated_at timestamptz;
begin
  if auth.uid() is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  v_candidate_id := kingsmen_security.current_authenticated_candidate_id();
  if v_candidate_id is null then
    raise insufficient_privilege using message = 'Verified candidate identity required';
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
        else 'Draft'
      end,
      'readiness_status', v_application.readiness_status,
      'readiness_snapshot', v_application.readiness_snapshot,
      'title', v_opportunity.title,
      'provider_name', v_opportunity.provider_name,
      'source_url', v_opportunity.source_url,
      'closes_at', v_opportunity.closes_at,
      'created_at', v_application.created_at,
      'updated_at', v_application.updated_at
    ),
    'draft', case when v_has_draft then v_draft.answer_data else '{}'::jsonb end,
    'draft_version', case when v_has_draft then v_draft.draft_version else 0 end,
    'draft_updated_at', case when v_has_draft then v_draft.updated_at else null end,
    'shared_profile_available', v_profile_updated_at is not null,
    'shared_profile_updated_at', v_profile_updated_at,
    'is_editable', v_application.status in ('DRAFT','READINESS_BLOCKED','READY_FOR_REVIEW','READY_TO_SUBMIT')
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
  v_candidate_id uuid;
  v_application public.candidate_applications%rowtype;
  v_existing public.candidate_application_draft_answers%rowtype;
  v_saved public.candidate_application_draft_answers%rowtype;
  v_has_existing boolean := false;
begin
  if auth.uid() is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  if p_application_id is null
     or p_expected_version is null or p_expected_version < 0
     or p_idempotency_key is null or p_idempotency_key !~ '^[A-Za-z0-9._:-]{8,160}$'
     or p_answer_data is null or jsonb_typeof(p_answer_data) <> 'object'
     or octet_length(p_answer_data::text) > 65536 then
    return jsonb_build_object('ok', false, 'code', 'APPLICATION_DRAFT_INPUT_INVALID');
  end if;

  v_candidate_id := kingsmen_security.current_authenticated_candidate_id();
  if v_candidate_id is null then
    raise insufficient_privilege using message = 'Verified candidate identity required';
  end if;

  select * into v_application
  from public.candidate_applications
  where id = p_application_id and candidate_id = v_candidate_id
  for update;

  if not found then
    raise insufficient_privilege using message = 'Application not found for this candidate';
  end if;

  if v_application.status not in ('DRAFT','READINESS_BLOCKED','READY_FOR_REVIEW','READY_TO_SUBMIT') then
    return jsonb_build_object('ok', false, 'code', 'APPLICATION_NOT_EDITABLE');
  end if;

  select * into v_existing
  from public.candidate_application_draft_answers
  where application_id = p_application_id and candidate_id = v_candidate_id
  for update;
  v_has_existing := found;

  if v_has_existing and v_existing.idempotency_key = p_idempotency_key then
    return jsonb_build_object(
      'ok', true, 'reused', true,
      'draft_version', v_existing.draft_version,
      'updated_at', v_existing.updated_at,
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

  insert into public.candidate_application_draft_answers (
    application_id, candidate_id, answer_data, draft_version,
    idempotency_key, saved_by_auth_user_id, created_at, updated_at
  ) values (
    p_application_id, v_candidate_id, p_answer_data, 1,
    p_idempotency_key, auth.uid(), now(), now()
  )
  on conflict (application_id) do update set
    answer_data = excluded.answer_data,
    draft_version = public.candidate_application_draft_answers.draft_version + 1,
    idempotency_key = excluded.idempotency_key,
    saved_by_auth_user_id = excluded.saved_by_auth_user_id,
    updated_at = now()
  returning * into v_saved;

  update public.candidate_applications
  set readiness_status = 'NOT_CHECKED',
      readiness_snapshot = '{}'::jsonb,
      updated_at = now()
  where id = p_application_id and candidate_id = v_candidate_id;

  return jsonb_build_object(
    'ok', true,
    'reused', false,
    'draft_version', v_saved.draft_version,
    'updated_at', v_saved.updated_at,
    'readiness_recheck_required', true,
    'message', 'Application draft saved. It has not been submitted to the provider.'
  );
end;
$function$;

revoke all on function public.get_candidate_application_draft(uuid) from public, anon;
revoke all on function public.save_candidate_application_draft(uuid, jsonb, integer, text) from public, anon;
grant execute on function public.get_candidate_application_draft(uuid) to authenticated;
grant execute on function public.save_candidate_application_draft(uuid, jsonb, integer, text) to authenticated;

comment on table public.candidate_application_draft_answers is
  'Candidate-owned application-specific draft answers. Access through authenticated ownership-checking RPCs; not directly exposed to anon/authenticated roles.';
comment on function public.get_candidate_application_draft(uuid) is
  'Returns an authenticated candidate-owned application and persisted draft; never exposes another candidate application.';
comment on function public.save_candidate_application_draft(uuid, jsonb, integer, text) is
  'Persists an owned candidate application draft with optimistic versioning and idempotent retry support. Does not submit to a provider.';

commit;
