-- Explicit external-portal fallback. This prepares a manual action; it never submits anything.
create or replace function public.prepare_candidate_manual_portal_submission(p_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, kingsmen_security
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_candidate_id uuid;
  v_app record;
  v_job record;
  v_submission_ref text;
  v_url text;
begin
  if v_auth_user_id is null then raise exception 'AUTHENTICATED_CANDIDATE_REQUIRED' using errcode = '42501'; end if;
  v_candidate_id := kingsmen_security.current_authenticated_candidate_id();
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

  if v_app.status in ('DRAFT','READINESS_BLOCKED','READY_FOR_REVIEW','READY_TO_SUBMIT','MANUAL_ACTION_REQUIRED') then
    update public.candidate_applications
    set status='MANUAL_ACTION_REQUIRED',
        last_status_reason='External portal handoff prepared. Candidate must complete provider steps and attach receipt evidence; no submission was sent by Kingsmen.',
        updated_at=now()
    where id=p_application_id and candidate_id=v_candidate_id;
  elsif v_app.status not in ('SUBMISSION_PENDING','SUBMITTED_CONFIRMED','PROVIDER_REVIEW','SHORTLISTED','INTERVIEW','OFFERED','ACCEPTED','REJECTED','WITHDRAWN','CANCELLED','EXPIRED') then
    return jsonb_build_object('ok',false,'code','APPLICATION_STATUS_NOT_ELIGIBLE');
  end if;

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
$$;
revoke all on function public.prepare_candidate_manual_portal_submission(uuid) from public, anon;
grant execute on function public.prepare_candidate_manual_portal_submission(uuid) to authenticated;
comment on function public.prepare_candidate_manual_portal_submission(uuid) is
  'Creates an idempotent external-portal manual action with audit evidence. It never sends a provider submission.';
