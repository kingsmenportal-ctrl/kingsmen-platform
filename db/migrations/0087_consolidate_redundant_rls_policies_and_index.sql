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
      ('applications','service_role_all_applications'),
      ('candidate_profiles','service_role_all_candidate_profiles'),
      ('candidates','service_role_all_candidates'),
      ('evidence_ledger','service_role_all_evidence_ledger'),
      ('route_sources','service_role_all_route_sources'),
      ('workflow_runs','service_role_all_workflow_runs')
    ) as expected(tablename, policyname)
  loop
    select count(*) into policy_count
    from pg_policies
    where schemaname='public'
      and tablename=item.tablename
      and policyname=item.policyname
      and permissive='PERMISSIVE'
      and roles='{service_role}'
      and cmd='ALL'
      and coalesce(qual,'')='true'
      and coalesce(with_check,'')='true';

    if policy_count <> 1 then
      raise exception 'Refusing policy cleanup: %.% is absent or differs from audited definition',
        item.tablename, item.policyname;
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

do $$
declare
  canonical_def text;
  duplicate_def text;
begin
  select pg_get_indexdef(indexrelid) into canonical_def
  from pg_index
  where indexrelid = 'public.candidate_identity_review_one_open_request_per_user'::regclass;

  select pg_get_indexdef(indexrelid) into duplicate_def
  from pg_index
  where indexrelid = 'public.candidate_identity_review_one_open_request_per_user_idx'::regclass;

  if canonical_def is null or duplicate_def is null or canonical_def <> duplicate_def then
    raise exception 'Refusing duplicate-index cleanup: index definitions do not match exactly';
  end if;
end $$;

drop index public.candidate_identity_review_one_open_request_per_user_idx;

commit;
