-- Document purpose and creator are required to turn reviewed private uploads into typed application evidence.
alter table public.candidate_private_documents
  add column if not exists evidence_purpose text not null default 'CANDIDATE_DOCUMENT',
  add column if not exists created_by_auth_user_id uuid;
do $$
begin
  if not exists (select 1 from pg_constraint where conname='candidate_private_documents_evidence_purpose_check' and conrelid='public.candidate_private_documents'::regclass) then
    alter table public.candidate_private_documents add constraint candidate_private_documents_evidence_purpose_check
      check (evidence_purpose in ('CANDIDATE_DOCUMENT','PRE_SUBMISSION_CHECKLIST','PROVIDER_SUBMISSION_RECEIPT','PROVIDER_REFERENCE','PROVIDER_STATUS_NOTICE','PROVIDER_OUTCOME_NOTICE'));
  end if;
end $$;

create or replace function public.review_candidate_private_document(
  p_document_id uuid,
  p_reviewer_auth_user_id uuid,
  p_decision text,
  p_reviewer_note text default '',
  p_evidence_reference text default ''
) returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $function$
declare
  v_doc public.candidate_private_documents%rowtype;
  v_to_status text;
  v_stored_decision text;
  v_decision_kind text;
  v_review_id uuid;
  v_application_status text;
  v_application_evidence_type text;
  v_application_evidence_ref text;
  v_verified_at timestamptz := now();
begin
  if p_document_id is null or p_reviewer_auth_user_id is null then
    raise exception using errcode = '22023', message = 'Document and reviewer identifiers are required.';
  end if;
  if not exists (
    select 1 from public.platform_reviewers r
    where r.auth_user_id = p_reviewer_auth_user_id
      and r.is_active = true and r.revoked_at is null
      and r.role_code in ('EVIDENCE_VERIFIER', 'PLATFORM_ADMIN')
  ) then
    raise exception using errcode = '42501', message = 'Active evidence reviewer permission required.';
  end if;

  select * into v_doc from public.candidate_private_documents where id = p_document_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Document not found.'; end if;

  if p_decision = 'START_REVIEW' then
    if v_doc.status <> 'UPLOADED_CANDIDATE_REPORTED' then
      raise exception using errcode = '40001', message = 'Only candidate-reported documents can enter review.';
    end if;
    update public.candidate_private_documents set status = 'UNDER_REVIEW', updated_at = now() where id = p_document_id;
    insert into public.candidate_private_document_events
      (document_id,candidate_id,actor_type,event_type,from_status,to_status,metadata)
    values (p_document_id,v_doc.candidate_id,'REVIEWER','REVIEW_STATUS_CHANGED',v_doc.status,'UNDER_REVIEW',
      jsonb_build_object('decision_kind','START_REVIEW','reviewer_auth_user_id',p_reviewer_auth_user_id));
    return jsonb_build_object('document_id',p_document_id,'from_status',v_doc.status,'status','UNDER_REVIEW','decision_kind','START_REVIEW');
  end if;

  if p_decision not in ('VERIFIED','CORRECTION_REQUIRED','REJECTED') then
    raise exception using errcode = '22023', message = 'Unsupported reviewer decision.';
  end if;
  if v_doc.status <> 'UNDER_REVIEW' then
    raise exception using errcode = '40001', message = 'Document must be under review before a final decision.';
  end if;
  if length(trim(coalesce(p_reviewer_note,''))) < 3 or length(trim(p_reviewer_note)) > 1200 then
    raise exception using errcode = '22023', message = 'A reviewer note between 3 and 1200 characters is required.';
  end if;
  if length(trim(coalesce(p_evidence_reference,''))) < 3 or length(trim(p_evidence_reference)) > 500 then
    raise exception using errcode = '22023', message = 'An evidence reference between 3 and 500 characters is required.';
  end if;
  if p_decision = 'VERIFIED' and v_doc.application_id is not null and length(trim(coalesce(p_reviewer_note,''))) < 12 then
    raise exception using errcode = '22023', message = 'Application-linked evidence verification requires a reviewer note of at least 12 characters.';
  end if;

  v_decision_kind := p_decision;
  if p_decision = 'VERIFIED' then v_to_status := 'VERIFIED'; v_stored_decision := 'VERIFIED';
  else v_to_status := 'REJECTED'; v_stored_decision := 'REJECTED'; end if;

  update public.candidate_private_documents set status = v_to_status, updated_at = now() where id = p_document_id;
  insert into public.candidate_private_document_reviews
    (document_id,candidate_id,reviewer_auth_user_id,decision,reviewer_note,evidence_reference)
  values (p_document_id,v_doc.candidate_id,p_reviewer_auth_user_id,v_stored_decision,trim(p_reviewer_note),trim(p_evidence_reference))
  returning id into v_review_id;
  insert into public.candidate_private_document_events
    (document_id,candidate_id,actor_type,event_type,from_status,to_status,metadata)
  values (p_document_id,v_doc.candidate_id,'REVIEWER','REVIEW_STATUS_CHANGED',v_doc.status,v_to_status,
    jsonb_build_object('decision_kind',v_decision_kind,'review_id',v_review_id,
      'reviewer_auth_user_id',p_reviewer_auth_user_id,'evidence_reference',trim(p_evidence_reference)));

  if p_decision = 'VERIFIED' and v_doc.application_id is not null then
    if v_doc.created_by_auth_user_id is null or v_doc.sha256_hex is null or v_doc.sha256_hex !~ '^[a-fA-F0-9]{64}$' then
      raise exception using errcode = '23514', message = 'Application evidence requires authenticated creator attribution and a verified SHA-256 file hash.';
    end if;
    select status into v_application_status from public.candidate_applications
      where id = v_doc.application_id and candidate_id = v_doc.candidate_id;
    if not found then raise exception using errcode = '23503', message = 'Linked application does not belong to the document candidate.'; end if;
    v_application_evidence_type := v_doc.evidence_purpose;
    v_application_evidence_ref := 'PRIVATE-DOC-' || upper(replace(v_doc.id::text,'-',''));
    insert into public.candidate_application_evidence(
      evidence_ref,application_id,candidate_id,evidence_type,evidence_locator,evidence_sha256,
      source_label,captured_at,verification_status,verification_note,verified_by_auth_user_id,
      verified_at,created_by_auth_user_id
    ) values (
      v_application_evidence_ref,v_doc.application_id,v_doc.candidate_id,v_application_evidence_type,
      'private-document:' || v_doc.id::text,v_doc.sha256_hex,v_doc.original_filename,v_doc.uploaded_at,
      'VERIFIED',trim(p_reviewer_note),p_reviewer_auth_user_id,v_verified_at,v_doc.created_by_auth_user_id
    ) on conflict (evidence_ref) do nothing;

    insert into public.candidate_application_events(
      event_ref,application_id,candidate_id,actor_auth_user_id,event_type,to_status,
      evidence_ref,reason_code,details
    ) values (
      'private-document-evidence-attached:' || v_doc.id::text,v_doc.application_id,v_doc.candidate_id,
      p_reviewer_auth_user_id,'EVIDENCE_ATTACHED',v_application_status,v_application_evidence_ref,
      'PRIVATE_DOCUMENT_REVIEW_VERIFIED',
      jsonb_build_object('document_id',v_doc.id,'evidence_type',v_application_evidence_type,
        'review_id',v_review_id,'private_storage_path_exposed',false)
    ) on conflict (event_ref) do nothing;
  end if;

  return jsonb_build_object('document_id',p_document_id,'review_id',v_review_id,
    'from_status',v_doc.status,'status',v_to_status,'decision_kind',v_decision_kind,
    'application_evidence_attached',p_decision='VERIFIED' and v_doc.application_id is not null);
end;
$function$;
