-- 0090: remove only the byte-for-byte duplicate partial unique index.
-- The canonical index remains, preserving the uniqueness invariant. This is intentionally
-- separate from 0087 so index cleanup does not alter RLS policies.
begin;

do $guard$
declare
  v_canonical oid;
  v_duplicate oid;
  v_canonical_def text;
  v_duplicate_def text;
begin
  select indexrelid into v_canonical
  from pg_index
  where indexrelid = to_regclass('public.candidate_identity_review_one_open_request_per_user');

  select indexrelid into v_duplicate
  from pg_index
  where indexrelid = to_regclass('public.candidate_identity_review_one_open_request_per_user_idx');

  if v_canonical is null or v_duplicate is null then
    raise exception 'Refusing duplicate index cleanup: both audited indexes must exist';
  end if;

  select pg_get_indexdef(i.indexrelid) into v_canonical_def
  from pg_index i
  where i.indexrelid = v_canonical
    and i.indrelid = 'public.candidate_identity_review_requests'::regclass
    and i.indisunique
    and i.indisvalid
    and i.indisready;

  select pg_get_indexdef(i.indexrelid) into v_duplicate_def
  from pg_index i
  where i.indexrelid = v_duplicate
    and i.indrelid = 'public.candidate_identity_review_requests'::regclass
    and i.indisunique
    and i.indisvalid
    and i.indisready;

  if v_canonical_def is null or v_duplicate_def is null or v_canonical_def <> v_duplicate_def then
    raise exception 'Refusing duplicate index cleanup: index definitions, validity, or uniqueness differ';
  end if;

  if exists (select 1 from pg_constraint where conindid in (v_canonical, v_duplicate)) then
    raise exception 'Refusing duplicate index cleanup: an audited index backs a constraint';
  end if;
end
$guard$;

drop index public.candidate_identity_review_one_open_request_per_user_idx;

commit;
