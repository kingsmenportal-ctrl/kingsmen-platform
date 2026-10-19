-- Kingsmen FK index hardening (reviewed, idempotent).
-- Baseline: Supabase performance advisor reported 14 unindexed single-column FKs
-- on 2026-10-19. This migration changes indexes only: no rows, grants, or RLS.
-- Before applying, capture the preflight query in docs/performance/KINGSMEN_FK_INDEX_HARDENING.md.

create index if not exists candidate_application_events_candidate_id_idx
  on public.candidate_application_events using btree (candidate_id);
create index if not exists candidate_application_evidence_candidate_id_idx
  on public.candidate_application_evidence using btree (candidate_id);
create index if not exists candidate_application_submission_jobs_opportunity_id_idx
  on public.candidate_application_submission_jobs using btree (opportunity_id);
create index if not exists candidate_applications_opportunity_id_idx
  on public.candidate_applications using btree (opportunity_id);
create index if not exists candidate_communications_outcome_id_idx
  on public.candidate_communications using btree (outcome_id);
create index if not exists candidate_follow_up_tasks_application_id_idx
  on public.candidate_follow_up_tasks using btree (application_id);
create index if not exists candidate_follow_up_tasks_communication_id_idx
  on public.candidate_follow_up_tasks using btree (communication_id);
create index if not exists candidate_follow_up_tasks_outcome_id_idx
  on public.candidate_follow_up_tasks using btree (outcome_id);
create index if not exists candidate_identity_review_requests_reviewed_by_idx
  on public.candidate_identity_review_requests using btree (reviewed_by);
create index if not exists candidate_outcomes_evidence_id_idx
  on public.candidate_outcomes using btree (evidence_id);
create index if not exists candidate_outcomes_opportunity_id_idx
  on public.candidate_outcomes using btree (opportunity_id);
create index if not exists candidate_refund_requests_order_id_idx
  on public.candidate_refund_requests using btree (order_id);
create index if not exists candidate_saved_opportunities_opportunity_id_idx
  on public.candidate_saved_opportunities using btree (opportunity_id);
create index if not exists candidate_service_orders_package_id_idx
  on public.candidate_service_orders using btree (package_id);

-- Postflight assertion: every intended FK column must be the leading key of a
-- valid, ready, non-partial index. Fail the migration rather than silently
-- declaring success if a same-named index already exists with the wrong shape.
do $$
declare
  target record;
  table_oid oid;
  column_attnum smallint;
  covered boolean;
begin
  for target in
    select * from (values
      ('candidate_application_events','candidate_id','candidate_application_events_candidate_id_idx'),
      ('candidate_application_evidence','candidate_id','candidate_application_evidence_candidate_id_idx'),
      ('candidate_application_submission_jobs','opportunity_id','candidate_application_submission_jobs_opportunity_id_idx'),
      ('candidate_applications','opportunity_id','candidate_applications_opportunity_id_idx'),
      ('candidate_communications','outcome_id','candidate_communications_outcome_id_idx'),
      ('candidate_follow_up_tasks','application_id','candidate_follow_up_tasks_application_id_idx'),
      ('candidate_follow_up_tasks','communication_id','candidate_follow_up_tasks_communication_id_idx'),
      ('candidate_follow_up_tasks','outcome_id','candidate_follow_up_tasks_outcome_id_idx'),
      ('candidate_identity_review_requests','reviewed_by','candidate_identity_review_requests_reviewed_by_idx'),
      ('candidate_outcomes','evidence_id','candidate_outcomes_evidence_id_idx'),
      ('candidate_outcomes','opportunity_id','candidate_outcomes_opportunity_id_idx'),
      ('candidate_refund_requests','order_id','candidate_refund_requests_order_id_idx'),
      ('candidate_saved_opportunities','opportunity_id','candidate_saved_opportunities_opportunity_id_idx'),
      ('candidate_service_orders','package_id','candidate_service_orders_package_id_idx')
    ) as x(table_name,column_name,index_name)
  loop
    select c.oid into table_oid
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=target.table_name and c.relkind in ('r','p');
    if table_oid is null then
      raise exception 'FK index postflight: public.% table missing', target.table_name;
    end if;

    select a.attnum into column_attnum
      from pg_attribute a
      where a.attrelid=table_oid and a.attname=target.column_name
        and a.attnum > 0 and not a.attisdropped;
    if column_attnum is null then
      raise exception 'FK index postflight: public.%.% column missing', target.table_name, target.column_name;
    end if;

    select exists (
      select 1
        from pg_index i
        join pg_class ix on ix.oid=i.indexrelid
        join pg_am am on am.oid=ix.relam and am.amname='btree'
        where i.indrelid=table_oid
          and ix.relname=target.index_name
          and i.indisvalid and i.indisready
          and i.indpred is null
          and i.indkey[0]=column_attnum
    ) into covered;
    if not covered then
      raise exception 'FK index postflight failed: %.% not covered by leading key of index %',
        target.table_name, target.column_name, target.index_name;
    end if;
  end loop;
end $$;

