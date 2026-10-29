-- Forward-only cleanup of redundant permissive policies and a confirmed duplicate index.
-- This migration intentionally fails closed if live definitions differ from the audited staging snapshot.
begin;

do $$
declare
  item record;
  policy_count integer;
begin
  for item in
    select * from (values
      ('applications','service_role_all_applications','applications_service_role_backend_all'),
      ('candidate_profiles','service_role_all_candidate_profiles','candidate_profiles_service_role_backend_all'),
      ('candidates','service_role_all_candidates','candidates_service_role_backend_all'),
      ('evidence_ledger','service_role_all_evidence_ledger','evidence_ledger_service_role_backend_all'),
      ('route_sources','service_role_all_route_sources','route_sources_service_role_backend_all'),
      ('workflow_runs','service_role_all_workflow_runs','workflow_runs_service_role_backend_all')
    ) as expected(tablename, legacy_policy, guarded_policy)
  loop
    select count(*) into policy_count
    from pg_policies
    where schemaname='public'
      and tablename=item.tablename
      and policyname=item.legacy_policy
      and permissive='PERMISSIVE'
      and roles='{service_role}'
      and cmd='ALL'
      and coalesce(qual,'')='true'
      and coalesce(with_check,'')='true';

    if policy_count <> 1 then
      raise exception 'Refusing policy cleanup: %.% is absent or differs from audited definition',
        item.tablename, item.legacy_policy;
    end if;

    -- Fail closed unless the helper-guarded replacement is present with exact
    -- role/command/check semantics. This prevents accidentally removing the
    -- only policy enforcing the backend service-role guard.
    select count(*) into policy_count
    from pg_policies
    where schemaname='public'
      and tablename=item.tablename
      and policyname=item.guarded_policy
      and permissive='PERMISSIVE'
      and roles='{service_role}'
      and cmd='ALL'
      and coalesce(qual,'')='kingsmen_security.is_backend_service_role()'
      and coalesce(with_check,'')='kingsmen_security.is_backend_service_role()';

    if policy_count <> 1 then
      raise exception 'Refusing policy cleanup: guarded replacement %.% is absent or differs from expected definition',
        item.tablename, item.guarded_policy;
    end if;
  end loop;
end $$;

-- Keep the helper-guarded service-role policy on each table; remove only the
-- older unconditional duplicate. service_role itself retains its native bypass.
drop policy service_role_all_applications on public.applications;
drop policy service_role_all_candidate_profiles on public.candidate_profiles;
drop policy service_role_all_candidates on public.candidates;
drop policy service_role_all_evidence_ledger on public.evidence_ledger;
drop policy service_role_all_route_sources on public.route_sources;
drop policy service_role_all_workflow_runs on public.workflow_runs;

do $
declare
  canonical_oid oid;
  duplicate_oid oid;
  canonical_def text;
  duplicate_def text;
begin
  canonical_oid := to_regclass('public.candidate_identity_review_one_open_request_per_user');
  duplicate_oid := to_regclass('public.candidate_identity_review_one_open_request_per_user_idx');

  if canonical_oid is null then
    raise exception 'Refusing duplicate-index cleanup: canonical unique index is absent';
  end if;

  select regexp_replace(pg_get_indexdef(i.indexrelid),
      '^CREATE UNIQUE INDEX [^ ]+ ON ', 'CREATE UNIQUE INDEX <name> ON ')
    into canonical_def
  from pg_index i
  where i.indexrelid = canonical_oid
    and i.indrelid = 'public.candidate_identity_review_requests'::regclass
    and i.indisunique and i.indisvalid and i.indisready;

  if canonical_def is null then
    raise exception 'Refusing duplicate-index cleanup: canonical index is invalid or not unique';
  end if;

  -- Migration 0090 may have already removed the redundant index. If it still
  -- exists, compare definitions after normalizing only their different names.
  if duplicate_oid is not null then
    select regexp_replace(pg_get_indexdef(i.indexrelid),
        '^CREATE UNIQUE INDEX [^ ]+ ON ', 'CREATE UNIQUE INDEX <name> ON ')
      into duplicate_def
    from pg_index i
    where i.indexrelid = duplicate_oid
      and i.indrelid = 'public.candidate_identity_review_requests'::regclass
      and i.indisunique and i.indisvalid and i.indisready;

    if duplicate_def is null or canonical_def <> duplicate_def then
      raise exception 'Refusing duplicate-index cleanup: index definitions differ or duplicate is invalid';
    end if;

    if exists (select 1 from pg_constraint where conindid in (canonical_oid, duplicate_oid)) then
      raise exception 'Refusing duplicate-index cleanup: an audited index backs a constraint';
    end if;
  end if;
end $;

drop index if exists public.candidate_identity_review_one_open_request_per_user_idx;

commit;
