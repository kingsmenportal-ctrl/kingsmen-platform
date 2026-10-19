-- N05 document review: durable, append-only review decisions without changing source-document status.
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
-- Intentionally no direct insert/update/delete policies. Use the guarded transaction RPC.

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
declare v_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_reviewer_user_id or not public.is_kingsmen_founder() then
    raise exception 'FOUNDER_ACCESS_REQUIRED' using errcode = '42501';
  end if;
  if char_length(coalesce(p_decision_ref,'')) not between 8 and 100
    or char_length(coalesce(p_document_ref,'')) not between 3 and 180
    or char_length(coalesce(p_candidate_ref,'')) not between 3 and 180
    or p_document_ref = p_candidate_ref
    or p_review_status not in ('verified','rejected','needs_more_info','fraud_review')
    or char_length(coalesce(p_proof_ref,'')) not between 3 and 180
    or char_length(coalesce(p_evidence_ref,'')) not between 3 and 180
    or char_length(coalesce(p_audit_ref,'')) not between 8 and 100
    or p_proof_ref in (p_evidence_ref,p_audit_ref)
    or p_evidence_ref = p_audit_ref
    or char_length(coalesce(p_safe_notes,'')) > 1200 then
    raise exception 'INVALID_DOCUMENT_REVIEW' using errcode = '22023';
  end if;

  insert into public.founder_document_review_decisions
    (decision_ref, document_ref, candidate_ref, review_status, proof_ref, evidence_ref,
     audit_ref, reviewer_user_id, reviewer_email, safe_notes)
  values
    (p_decision_ref, p_document_ref, p_candidate_ref, p_review_status, p_proof_ref, p_evidence_ref,
     p_audit_ref, auth.uid(), left(coalesce(p_reviewer_email,''),254), coalesce(p_safe_notes,''))
  returning id into v_id;

  insert into public.founder_ops_audit_events
    (audit_ref, actor_ref, action_key, target_ref, severity, audit_message, audit_payload, evidence_refs)
  values
    (p_audit_ref, auth.uid()::text, 'N05_DOCUMENT_REVIEW_RECORDED', p_document_ref,
     case when p_review_status = 'fraud_review' or p_review_status = 'rejected' then 'WARNING' else 'INFO' end,
     'Founder document review decision recorded. Source document status was not changed; ownership and evidence resolution remain unverified.',
     jsonb_build_object(
       'decisionRef',p_decision_ref,'candidateRef',p_candidate_ref,'reviewStatus',p_review_status,
       'ownershipVerified',false,'evidenceResolved',false,'sourceStatusChanged',false
     ), array[p_proof_ref,p_evidence_ref]);

  return jsonb_build_object(
    'id',v_id,'decisionRef',p_decision_ref,'documentRef',p_document_ref,'candidateRef',p_candidate_ref,
    'reviewStatus',p_review_status,'auditRef',p_audit_ref,'persisted',true,
    'ownershipVerified',false,'evidenceResolved',false,'sourceStatusChanged',false
  );
end;
$$;
revoke all on function public.record_founder_document_review(text,text,text,text,text,text,text,uuid,text,text) from public, anon;
grant execute on function public.record_founder_document_review(text,text,text,text,text,text,text,uuid,text,text) to authenticated;
