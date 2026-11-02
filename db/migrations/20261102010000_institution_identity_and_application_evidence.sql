-- Institution identity evidence and application decision/handoff boundaries.
-- This migration is a proposal only until reviewed backup/restore and change-control gates pass.
begin;

create table public.route_provider_aliases (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.route_providers(id) on delete restrict,
  alias_name text not null check (length(btrim(alias_name)) between 2 and 240),
  normalized_alias text generated always as (lower(regexp_replace(btrim(alias_name), '[[:space:][:punct:]]+', '', 'g'))) stored,
  alias_type text not null default 'COMMON_NAME'
    check (alias_type in ('FORMER_NAME','LEGAL_NAME','COMMON_NAME','ACRONYM','BRAND','TRANSLITERATION','OTHER')),
  source_url text not null check (source_url ~ '^https://'),
  source_snapshot_date date,
  source_checked_at timestamptz not null default now(),
  evidence_status text not null default 'NEEDS_REVIEW'
    check (evidence_status in ('NEEDS_REVIEW','SUPPORTED','CONFLICTED','REJECTED','STALE')),
  notes text,
  created_at timestamptz not null default now(),
  unique(provider_id, normalized_alias)
);
create index route_provider_aliases_normalized_idx on public.route_provider_aliases(normalized_alias);
alter table public.route_provider_aliases enable row level security;
revoke all on public.route_provider_aliases from public, anon, authenticated;
grant select, insert, update, delete on public.route_provider_aliases to service_role;

create table public.route_provider_campuses (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.route_providers(id) on delete restrict,
  campus_key text not null check (campus_key ~ '^[a-z0-9][a-z0-9_-]{1,119}$'),
  campus_name text not null check (length(btrim(campus_name)) between 2 and 240),
  campus_type text not null default 'CAMPUS'
    check (campus_type in ('MAIN_CAMPUS','CAMPUS','SATELLITE','DELIVERY_SITE','COMMUNITY_LEARNING_CENTRE','ADMIN_OFFICE','OTHER')),
  province text check (province is null or province in ('Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','Northern Cape','North West','Western Cape')),
  municipality text,
  locality text,
  address_text text,
  official_url text check (official_url is null or official_url ~ '^https://'),
  source_url text not null check (source_url ~ '^https://'),
  source_snapshot_date date,
  source_checked_at timestamptz not null default now(),
  operational_status text not null default 'UNKNOWN'
    check (operational_status in ('ACTIVE','INACTIVE','UNKNOWN','CLOSED','MERGED')),
  verification_status text not null default 'NEEDS_REVIEW'
    check (verification_status in ('NEEDS_REVIEW','VERIFIED','CONFLICTED','REJECTED','STALE')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider_id, campus_key)
);
create index route_provider_campuses_provider_idx on public.route_provider_campuses(provider_id, verification_status);
create index route_provider_campuses_location_idx on public.route_provider_campuses(province, municipality);
alter table public.route_provider_campuses enable row level security;
revoke all on public.route_provider_campuses from public, anon, authenticated;
grant select, insert, update, delete on public.route_provider_campuses to service_role;

create table public.institution_register_observations (
  id uuid primary key default gen_random_uuid(),
  register_kind text not null check (register_kind in ('PRIVATE_HIGHER_EDUCATION','PRIVATE_COLLEGE','PUBLIC_INSTITUTION','CET','TVET')),
  institution_name text not null check (length(btrim(institution_name)) between 2 and 300),
  registration_number text,
  observed_status text not null
    check (observed_status in ('REGISTERED','PROVISIONAL','CANCELLED','LAPSED','WITHDRAWN','NOT_LISTED','UNRESOLVED','OTHER')),
  source_url text not null check (source_url ~ '^https://'),
  source_snapshot_date date not null,
  source_retrieved_at timestamptz not null default now(),
  source_locator text,
  matched_provider_id uuid references public.route_providers(id) on delete restrict,
  reconciliation_status text not null default 'UNRESOLVED'
    check (reconciliation_status in ('UNRESOLVED','MATCHED','DUPLICATE','CONFLICTED','REJECTED')),
  record_evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(record_evidence) = 'object'),
  created_at timestamptz not null default now(),
  unique(register_kind, source_snapshot_date, registration_number, institution_name)
);
create index institution_register_observations_status_idx on public.institution_register_observations(register_kind, observed_status, reconciliation_status);
create index institution_register_observations_provider_idx on public.institution_register_observations(matched_provider_id);
alter table public.institution_register_observations enable row level security;
revoke all on public.institution_register_observations from public, anon, authenticated;
grant select, insert, update, delete on public.institution_register_observations to service_role;

create table public.candidate_application_eligibility_decisions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete restrict,
  opportunity_id uuid not null references public.candidate_opportunities(id) on delete restrict,
  decision text not null check (decision in ('ELIGIBLE','INELIGIBLE','REVIEW_REQUIRED','INSUFFICIENT_EVIDENCE')),
  evaluator_version text not null check (length(btrim(evaluator_version)) between 1 and 100),
  rules_snapshot jsonb not null check (jsonb_typeof(rules_snapshot) = 'object'),
  reason_codes text[] not null default '{}',
  evidence_refs text[] not null default '{}',
  source_checked_at timestamptz,
  decided_at timestamptz not null default now(),
  supersedes_decision_id uuid references public.candidate_application_eligibility_decisions(id) on delete restrict,
  created_by text not null default 'SYSTEM'
    check (created_by in ('SYSTEM','REVIEWER','CANDIDATE_REQUESTED_RECHECK')),
  idempotency_key text not null check (length(btrim(idempotency_key)) between 16 and 160),
  created_at timestamptz not null default now(),
  unique(candidate_id, opportunity_id, idempotency_key)
);
create index candidate_eligibility_candidate_opportunity_idx on public.candidate_application_eligibility_decisions(candidate_id, opportunity_id, decided_at desc);
alter table public.candidate_application_eligibility_decisions enable row level security;
revoke all on public.candidate_application_eligibility_decisions from public, anon, authenticated;
grant select, insert on public.candidate_application_eligibility_decisions to service_role;

create table public.candidate_application_handoff_events (
  id uuid primary key default gen_random_uuid(),
  submission_job_id uuid not null references public.candidate_application_submission_jobs(id) on delete restrict,
  candidate_id uuid not null references public.candidates(id) on delete restrict,
  event_type text not null
    check (event_type in ('HANDOFF_PREPARED','EXTERNAL_PORTAL_OPENED','CANDIDATE_REPORTED_SUBMITTED','PROVIDER_RECEIPT_CONFIRMED','PROVIDER_DECISION_RECEIVED','HANDOFF_FAILED','HANDOFF_CANCELLED')),
  evidence_origin text not null
    check (evidence_origin in ('KNGSMEN_SYSTEM','CANDIDATE_REPORT','PROVIDER_ORIGIN','REVIEWER_VERIFIED')),
  external_reference text,
  evidence_url text check (evidence_url is null or evidence_url ~ '^https://'),
  evidence_sha256 text check (evidence_sha256 is null or evidence_sha256 ~ '^[0-9a-f]{64}$'),
  provider_event_at timestamptz,
  verified_by_auth_user_id uuid,
  verification_notes text,
  event_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(event_payload) = 'object'),
  idempotency_key text not null check (length(btrim(idempotency_key)) between 16 and 160),
  created_at timestamptz not null default now(),
  check (
    event_type <> 'PROVIDER_RECEIPT_CONFIRMED'
    or (evidence_origin in ('PROVIDER_ORIGIN','REVIEWER_VERIFIED') and verified_by_auth_user_id is not null
        and (external_reference is not null or evidence_url is not null or evidence_sha256 is not null))
  ),
  unique(submission_job_id, idempotency_key),
  check (
    event_type <> 'PROVIDER_DECISION_RECEIVED'
    or (evidence_origin in ('PROVIDER_ORIGIN','REVIEWER_VERIFIED') and verified_by_auth_user_id is not null
        and (external_reference is not null or evidence_url is not null or evidence_sha256 is not null))
  )
);
create index candidate_handoff_events_job_idx on public.candidate_application_handoff_events(submission_job_id, created_at);
create index candidate_handoff_events_candidate_idx on public.candidate_application_handoff_events(candidate_id, created_at desc);
alter table public.candidate_application_handoff_events enable row level security;
revoke all on public.candidate_application_handoff_events from public, anon, authenticated;
grant select, insert on public.candidate_application_handoff_events to service_role;

-- Server-only, idempotent decision/event write boundaries. These are SECURITY INVOKER.
create or replace function public.record_candidate_application_eligibility_decision(
  p_candidate_id uuid,
  p_opportunity_id uuid,
  p_decision text,
  p_evaluator_version text,
  p_rules_snapshot jsonb,
  p_reason_codes text[],
  p_evidence_refs text[],
  p_source_checked_at timestamptz,
  p_supersedes_decision_id uuid,
  p_idempotency_key text
) returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_id uuid;
  v_existing public.candidate_application_eligibility_decisions%rowtype;
  v_opportunity public.candidate_opportunities%rowtype;
begin
  if p_candidate_id is null or p_opportunity_id is null
     or p_decision not in ('ELIGIBLE','INELIGIBLE','REVIEW_REQUIRED','INSUFFICIENT_EVIDENCE')
     or p_evaluator_version is null or length(btrim(p_evaluator_version)) not between 1 and 100
     or pg_catalog.jsonb_typeof(p_rules_snapshot) <> 'object'
     or p_idempotency_key is null or length(btrim(p_idempotency_key)) not between 16 and 160 then
    raise exception 'ELIGIBILITY_DECISION_INPUT_INVALID' using errcode = '22023';
  end if;

  select * into v_opportunity
  from public.candidate_opportunities
  where id = p_opportunity_id;
  if not found then
    raise exception 'OPPORTUNITY_NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_decision = 'ELIGIBLE' and (
    v_opportunity.source_status <> 'VERIFIED'
    or v_opportunity.is_published is distinct from true
    or v_opportunity.source_checked_at is null
    or v_opportunity.source_checked_at < pg_catalog.now() - interval '24 hours'
    or v_opportunity.closes_at is null
    or v_opportunity.closes_at <= pg_catalog.now()
  ) then
    raise exception 'ELIGIBILITY_REQUIRES_CURRENT_VERIFIED_OPENING' using errcode = '22023';
  end if;

  select * into v_existing
  from public.candidate_application_eligibility_decisions
  where candidate_id = p_candidate_id
    and opportunity_id = p_opportunity_id
    and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.decision is distinct from p_decision
       or v_existing.evaluator_version is distinct from p_evaluator_version
       or v_existing.rules_snapshot is distinct from p_rules_snapshot then
      raise exception 'ELIGIBILITY_IDEMPOTENCY_CONFLICT' using errcode = '23505';
    end if;
    return v_existing.id;
  end if;

  insert into public.candidate_application_eligibility_decisions(
    candidate_id, opportunity_id, decision, evaluator_version, rules_snapshot,
    reason_codes, evidence_refs, source_checked_at, supersedes_decision_id, idempotency_key
  ) values (
    p_candidate_id, p_opportunity_id, p_decision, p_evaluator_version, p_rules_snapshot,
    coalesce(p_reason_codes, '{}'), coalesce(p_evidence_refs, '{}'), p_source_checked_at,
    p_supersedes_decision_id, p_idempotency_key
  ) returning id into v_id;
  return v_id;
end;
$function$;

revoke all on function public.record_candidate_application_eligibility_decision(uuid,uuid,text,text,jsonb,text[],text[],timestamptz,uuid,text) from public, anon, authenticated;
grant execute on function public.record_candidate_application_eligibility_decision(uuid,uuid,text,text,jsonb,text[],text[],timestamptz,uuid,text) to service_role;

create or replace function public.append_candidate_application_handoff_event(
  p_submission_job_id uuid,
  p_event_type text,
  p_evidence_origin text,
  p_external_reference text,
  p_evidence_url text,
  p_evidence_sha256 text,
  p_provider_event_at timestamptz,
  p_verified_by_auth_user_id uuid,
  p_verification_notes text,
  p_event_payload jsonb,
  p_idempotency_key text
) returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_id uuid;
  v_job public.candidate_application_submission_jobs%rowtype;
  v_existing public.candidate_application_handoff_events%rowtype;
begin
  if p_submission_job_id is null
     or p_event_type not in ('HANDOFF_PREPARED','EXTERNAL_PORTAL_OPENED','CANDIDATE_REPORTED_SUBMITTED','PROVIDER_RECEIPT_CONFIRMED','PROVIDER_DECISION_RECEIVED','HANDOFF_FAILED','HANDOFF_CANCELLED')
     or p_evidence_origin not in ('KNGSMEN_SYSTEM','CANDIDATE_REPORT','PROVIDER_ORIGIN','REVIEWER_VERIFIED')
     or pg_catalog.jsonb_typeof(coalesce(p_event_payload, '{}'::jsonb)) <> 'object'
     or p_idempotency_key is null or length(btrim(p_idempotency_key)) not between 16 and 160 then
    raise exception 'HANDOFF_EVENT_INPUT_INVALID' using errcode = '22023';
  end if;

  select * into v_job from public.candidate_application_submission_jobs where id = p_submission_job_id;
  if not found then raise exception 'SUBMISSION_JOB_NOT_FOUND' using errcode = 'P0002'; end if;

  if p_event_type in ('PROVIDER_RECEIPT_CONFIRMED','PROVIDER_DECISION_RECEIVED')
     and (p_evidence_origin not in ('PROVIDER_ORIGIN','REVIEWER_VERIFIED')
          or p_verified_by_auth_user_id is null
          or (nullif(btrim(p_external_reference),'') is null
              and nullif(btrim(p_evidence_url),'') is null
              and nullif(btrim(p_evidence_sha256),'') is null)) then
    raise exception 'PROVIDER_EVIDENCE_REQUIRED' using errcode = '22023';
  end if;

  select * into v_existing from public.candidate_application_handoff_events
  where submission_job_id = p_submission_job_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.event_type is distinct from p_event_type
       or v_existing.evidence_origin is distinct from p_evidence_origin
       or v_existing.external_reference is distinct from p_external_reference then
      raise exception 'HANDOFF_EVENT_IDEMPOTENCY_CONFLICT' using errcode = '23505';
    end if;
    return v_existing.id;
  end if;

  insert into public.candidate_application_handoff_events(
    submission_job_id, candidate_id, event_type, evidence_origin, external_reference,
    evidence_url, evidence_sha256, provider_event_at, verified_by_auth_user_id,
    verification_notes, event_payload, idempotency_key
  ) values (
    p_submission_job_id, v_job.candidate_id, p_event_type, p_evidence_origin,
    p_external_reference, p_evidence_url, p_evidence_sha256, p_provider_event_at,
    p_verified_by_auth_user_id, p_verification_notes, coalesce(p_event_payload, '{}'::jsonb),
    p_idempotency_key
  ) returning id into v_id;
  return v_id;
end;
$function$;

revoke all on function public.append_candidate_application_handoff_event(uuid,text,text,text,text,text,timestamptz,uuid,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.append_candidate_application_handoff_event(uuid,text,text,text,text,text,timestamptz,uuid,text,jsonb,text) to service_role;

comment on table public.route_provider_aliases is 'Evidence-backed provider aliases; a name match alone never establishes legal identity or accreditation.';
comment on table public.route_provider_campuses is 'Structured campus/delivery-site records with independent source and verification status.';
comment on table public.institution_register_observations is 'Dated source-snapshot observations from official registers; registered/provisional/cancelled/lapsed are distinct states.';
comment on table public.candidate_application_eligibility_decisions is 'Persisted, versioned eligibility decisions; REVIEW_REQUIRED and INSUFFICIENT_EVIDENCE fail closed.';
comment on table public.candidate_application_handoff_events is 'External handoff events kept distinct from provider-confirmed receipt and provider decisions.';

commit;
