-- Add covering indexes for three live foreign keys reported by the staging advisor.
-- Guarded and forward-only: fail if the audited FK definitions drift.
begin;

do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from pg_constraint con
  join pg_class tbl on tbl.oid=con.conrelid
  join pg_namespace ns on ns.oid=tbl.relnamespace
  where ns.nspname='public'
    and (
      (tbl.relname='candidate_identity_review_evidence'
       and con.conname='candidate_identity_review_evidence_reviewed_by_fkey'
       and con.contype='f'
       and pg_get_constraintdef(con.oid,true)='FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)')
      or
      (tbl.relname='candidate_identity_review_evidence'
       and con.conname='candidate_identity_review_evidence_supabase_user_id_fkey'
       and con.contype='f'
       and pg_get_constraintdef(con.oid,true)='FOREIGN KEY (supabase_user_id) REFERENCES auth.users(id) ON DELETE CASCADE')
      or
      (tbl.relname='candidate_master_application_targets'
       and con.conname='candidate_master_target_application_owner_fk'
       and con.contype='f'
       and pg_get_constraintdef(con.oid,true)='FOREIGN KEY (application_id, candidate_id) REFERENCES candidate_applications(id, candidate_id) ON DELETE RESTRICT')
    );
  if v_count <> 3 then
    raise exception 'Refusing FK index hardening: expected three audited FK definitions, found %', v_count;
  end if;
end $$;

create index if not exists candidate_identity_review_evidence_reviewed_by_idx
  on public.candidate_identity_review_evidence (reviewed_by);

create index if not exists candidate_identity_review_evidence_supabase_user_id_idx
  on public.candidate_identity_review_evidence (supabase_user_id);

create index if not exists candidate_master_targets_application_owner_idx
  on public.candidate_master_application_targets (application_id, candidate_id);

commit;
