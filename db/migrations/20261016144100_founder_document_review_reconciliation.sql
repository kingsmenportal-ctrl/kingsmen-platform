-- FORWARD RECONCILIATION MIGRATION — prepared for staging, NOT YET APPLIED.
-- Restores the canonical founder review decision table/RPC absent from staging.
-- Does not change founder_ops_audit_events policies; those remain service-role-only pending
-- an explicit decision about the application's audit-read access pattern.

create or replace function public.is_kingsmen_founder()
returns boolean language sql stable security invoker set search_path = ''
as $$
  select coalesce(
    lower(auth.jwt() -> 'app_metadata' ->> 'role') in ('founder','admin','super_admin')
    or exists (
      select 1 from jsonb_array_elements_text(
        case when jsonb_typeof(auth.jwt() -> 'app_metadata' -> 'roles') = 'array'
          then auth.jwt() -> 'app_metadata' -> 'roles' else '[]'::jsonb end
      ) as role_names(role_name)
      where lower(role_name) in ('founder','admin','super_admin')
    ), false
  );
$$;


revoke all on function public.is_kingsmen_founder() from public, anon;
grant execute on function public.is_kingsmen_founder() to authenticated;

create table if not exists public.founder_document_review_decisions (
  id uuid primary key default gen_random_uuid(),
  decision_ref text not null unique,
  document_ref text not null,
  candidate_ref text not null,
  review_status text not null check (review_status in ('verified','rejected','needs_more_info','fraud_review')),
  proof_ref text not null,
  evidence_ref text not null,
  audit_ref text not null unique,
  reviewer_user_id uuid not null,
  reviewer_email text not null default '',
  safe_notes text not null default '',
  ownership_verified boolean not null default false,
  evidence_resolved boolean not null default false,
  source_status_changed boolean not null default false check (source_status_changed = false),
  created_at timestamptz not null default now(),
  constraint founder_document_review_distinct_refs check (
    document_ref <> candidate_ref
    and proof_ref <> evidence_ref
    and proof_ref <> audit_ref
    and evidence_ref <> audit_ref
  ),
  constraint founder_document_review_notes_length check (char_length(safe_notes) <= 1200)
);

create index if not exists idx_founder_document_review_document
  on public.founder_document_review_decisions(document_ref, created_at desc);
create index if not exists idx_founder_document_review_candidate
  on public.founder_document_review_decisions(candidate_ref, created_at desc);

alter table public.founder_document_review_decisions enable row level security;
drop policy if exists founder_document_review_select on public.founder_document_review_decisions;
create policy founder_document_review_select on public.founder_document_review_decisions
  for select to authenticated using (public.is_kingsmen_founder());

-- Validates the canonical document, verification proof and evidence records in one transaction.
create or replace function public.record_founder_document_review(
  p_decision_ref text,
  p_document_ref text,
  p_candidate_ref text,
  p_review_status text,
  p_proof_ref text,
  p_evidence_ref text,
  p_audit_ref text,
  p_reviewer_user_id uuid,
  p_reviewer_email text,
  p_safe_notes text default ''
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_document_id uuid;
  v_candidate_id uuid;
  v_proof_status text;
begin
  if auth.uid() is null or auth.uid() <> p_reviewer_user_id or not public.is_kingsmen_founder() then
    raise exception 'FOUNDER_ACCESS_REQUIRED' using errcode = '42501';
  end if;

  if char_length(coalesce(p_decision_ref,'')) not between 8 and 100
    or char_length(coalesce(p_document_ref,'')) not between 3 and 180
    or char_length(coalesce(p_candidate_ref,'')) not between 3 and 180
    or p_document_ref = p_candidate_ref
    or p_review_status is null
    or p_review_status not in ('verified','rejected','needs_more_info','fraud_review')
    or char_length(coalesce(p_proof_ref,'')) not between 3 and 180
    or char_length(coalesce(p_evidence_ref,'')) not between 3 and 180
    or char_length(coalesce(p_audit_ref,'')) not between 8 and 100
    or p_proof_ref in (p_evidence_ref,p_audit_ref)
    or p_evidence_ref = p_audit_ref
    or char_length(coalesce(p_safe_notes,'')) > 1200
    or coalesce(p_candidate_ref,'') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'INVALID_DOCUMENT_REVIEW' using errcode = '22023';
  end if;

  select d.id, d.candidate_id
    into v_document_id, v_candidate_id
  from public.document_files d
  where d.document_ref = p_document_ref
    and d.archived_at is null
    and d.document_status <> 'DELETED'
  for share;

  if not found then
    raise exception 'DOCUMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_candidate_id <> p_candidate_ref::uuid then
    raise exception 'DOCUMENT_CANDIDATE_MISMATCH' using errcode = '23514';
  end if;

  select v.verification_status into v_proof_status
  from public.document_verifications v
  where v.document_id = v_document_id
    and v.verification_ref = p_proof_ref
  order by v.created_at desc
  limit 1;
  if not found then
    raise exception 'PROOF_REFERENCE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if p_review_status = 'verified' and v_proof_status <> 'PASSED' then
    raise exception 'VERIFICATION_PROOF_NOT_PASSED' using errcode = '23514';
  end if;

  if not (
    exists (
      select 1 from public.document_files d
      where d.id = v_document_id and d.evidence_ref = p_evidence_ref
    )
    or exists (
      select 1 from public.document_verifications v
      where v.document_id = v_document_id and v.evidence_ref = p_evidence_ref
    )
    or exists (
      select 1 from public.document_storage_events e
      where e.document_id = v_document_id
        and e.event_ref = p_evidence_ref
        and e.status = 'OK'
        and e.event_type in ('UPLOAD_COMPLETED','CHECKSUM_RECORDED','RETENTION_CHECK')
    )
  ) then
    raise exception 'EVIDENCE_REFERENCE_NOT_FOUND' using errcode = 'P0002';
  end if;

  insert into public.founder_document_review_decisions
    (decision_ref, document_ref, candidate_ref, review_status, proof_ref, evidence_ref,
     audit_ref, reviewer_user_id, reviewer_email, safe_notes,
     ownership_verified, evidence_resolved, source_status_changed)
  values
    (p_decision_ref, p_document_ref, p_candidate_ref, p_review_status, p_proof_ref, p_evidence_ref,
     p_audit_ref, auth.uid(), left(coalesce(p_reviewer_email,''),254), coalesce(p_safe_notes,''),
     true, true, false)
  returning id into v_id;

  insert into public.founder_ops_audit_events
    (audit_ref, actor_ref, action_key, target_ref, severity, audit_message, audit_payload, evidence_refs)
  values
    (p_audit_ref, auth.uid()::text, 'N05_DOCUMENT_REVIEW_RECORDED', p_document_ref,
     case when p_review_status = 'fraud_review' or p_review_status = 'rejected' then 'WARNING' else 'INFO' end,
     'Founder document review decision recorded against the canonical document registry and linked proof/evidence records. Source document status was not changed.',
     jsonb_build_object(
       'decisionRef',p_decision_ref,'candidateRef',p_candidate_ref,'reviewStatus',p_review_status,
       'ownershipVerified',true,'evidenceResolved',true,'sourceStatusChanged',false,
       'proofRecordStatus',v_proof_status
     ), array[p_proof_ref,p_evidence_ref]);

  return jsonb_build_object(
    'id',v_id,'decisionRef',p_decision_ref,'documentRef',p_document_ref,'candidateRef',p_candidate_ref,
    'reviewStatus',p_review_status,'auditRef',p_audit_ref,'persisted',true,
    'ownershipVerified',true,'evidenceResolved',true,'sourceStatusChanged',false,
    'proofRecordStatus',v_proof_status
  );
end;
$$;
revoke all on function public.record_founder_document_review(text,text,text,text,text,text,text,uuid,text,text) from public, anon;
grant execute on function public.record_founder_document_review(text,text,text,text,text,text,text,uuid,text,text) to authenticated;
