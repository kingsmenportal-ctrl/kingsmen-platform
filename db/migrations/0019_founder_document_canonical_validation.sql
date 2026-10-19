-- N05 document review hardening: resolve references against canonical document records.
-- Does not change source document status or treat OCR/metadata as proof of identity.
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
