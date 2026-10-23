create or replace function public.review_candidate_private_document(
  p_document_id uuid,
  p_reviewer_auth_user_id uuid,
  p_decision text,
  p_reviewer_note text default '',
  p_evidence_reference text default ''
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_doc public.candidate_private_documents%rowtype;
  v_to_status text;
  v_stored_decision text;
  v_decision_kind text;
  v_review_id uuid;
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
  return jsonb_build_object('document_id',p_document_id,'review_id',v_review_id,
    'from_status',v_doc.status,'status',v_to_status,'decision_kind',v_decision_kind);
end;
$$;
revoke all on function public.review_candidate_private_document(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.review_candidate_private_document(uuid,uuid,text,text,text) to service_role;
