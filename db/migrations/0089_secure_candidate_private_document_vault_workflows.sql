-- 0089 - Secure, owner-bound candidate Document Vault workflow RPCs.
-- Additive only. These functions are called by the server-side candidate-private-documents
-- Edge Function after Supabase Auth getUser() validates the bearer token. They independently
-- re-check the reviewed identity link before touching a candidate's document records.
begin;

-- The private Vault's earlier metadata table omitted a normalized document type.
-- Add it with a conservative OTHER default; no candidate uploads exist in staging.
alter table public.candidate_private_documents
  add column if not exists document_type text not null default 'OTHER';
do $constraint$
begin
  alter table public.candidate_private_documents
    add constraint candidate_private_documents_document_type_check
    check (document_type in (
      'CV','ID_DOCUMENT','MATRIC_CERTIFICATE','ACADEMIC_RECORD','PROOF_OF_ADDRESS',
      'BANK_LETTER','PARENT_GUARDIAN_ID','PAYSLIP','AFFIDAVIT','APPLICATION_PROOF',
      'NSFAS_DOCUMENT','OTHER'
    ));
exception when duplicate_object then null;
end;
$constraint$;

create or replace function public.create_candidate_private_document_upload_request(
  p_supabase_user_id uuid,
  p_candidate_id uuid,
  p_document_id uuid,
  p_document_type text,
  p_storage_path text,
  p_original_filename text,
  p_mime_type text,
  p_size_bytes bigint,
  p_application_id uuid default null,
  p_preparation_item_id uuid default null,
  p_evidence_purpose text default 'CANDIDATE_DOCUMENT'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_verified boolean;
  v_doc public.candidate_private_documents%rowtype;
begin
  if p_supabase_user_id is null or p_candidate_id is null or p_document_id is null then
    raise exception 'DOCUMENT_UPLOAD_IDENTITY_REQUIRED' using errcode = '22023';
  end if;
  if p_size_bytes is null or p_size_bytes < 1 or p_size_bytes > 10485760 then
    raise exception 'DOCUMENT_SIZE_OUT_OF_RANGE' using errcode = '22023';
  end if;
  if p_mime_type is null or p_mime_type not in ('application/pdf', 'image/jpeg', 'image/png') then
    raise exception 'DOCUMENT_MIME_NOT_ALLOWED' using errcode = '22023';
  end if;
  if p_document_type is null or p_document_type not in (
    'CV','ID_DOCUMENT','MATRIC_CERTIFICATE','ACADEMIC_RECORD','PROOF_OF_ADDRESS',
    'BANK_LETTER','PARENT_GUARDIAN_ID','PAYSLIP','AFFIDAVIT','APPLICATION_PROOF',
    'NSFAS_DOCUMENT','OTHER'
  ) then
    raise exception 'DOCUMENT_TYPE_NOT_ALLOWED' using errcode = '22023';
  end if;
  if p_original_filename is null
     or length(btrim(p_original_filename)) not between 1 and 180
     or position('/' in p_original_filename) > 0
     or position(chr(92) in p_original_filename) > 0 then
    raise exception 'DOCUMENT_FILENAME_INVALID' using errcode = '22023';
  end if;
  if p_evidence_purpose is null or p_evidence_purpose not in (
    'CANDIDATE_DOCUMENT','PRE_SUBMISSION_CHECKLIST','PROVIDER_SUBMISSION_RECEIPT',
    'PROVIDER_REFERENCE','PROVIDER_STATUS_NOTICE','PROVIDER_OUTCOME_NOTICE'
  ) then
    raise exception 'DOCUMENT_EVIDENCE_PURPOSE_NOT_ALLOWED' using errcode = '22023';
  end if;
  if p_application_id is not null and not exists (
    select 1 from public.candidate_applications a
    where a.id = p_application_id and a.candidate_id = p_candidate_id
  ) then
    raise exception 'DOCUMENT_APPLICATION_OWNER_MISMATCH' using errcode = '42501';
  end if;
  if p_preparation_item_id is not null and not exists (
    select 1 from public.candidate_application_preparation_items i
    where i.id = p_preparation_item_id and i.candidate_id = p_candidate_id
  ) then
    raise exception 'DOCUMENT_PREPARATION_ITEM_OWNER_MISMATCH' using errcode = '42501';
  end if;
  if p_evidence_purpose in (
    'PROVIDER_SUBMISSION_RECEIPT','PROVIDER_REFERENCE','PROVIDER_STATUS_NOTICE','PROVIDER_OUTCOME_NOTICE'
  ) and p_application_id is null then
    raise exception 'APPLICATION_LINK_REQUIRED_FOR_PROVIDER_EVIDENCE' using errcode = '22023';
  end if;

  if p_storage_path is null
     or p_storage_path is distinct from (
       p_candidate_id::text || '/' || p_document_id::text || '/' ||
       case p_mime_type
         when 'application/pdf' then 'file.pdf'
         when 'image/jpeg' then 'file.jpg'
         when 'image/png' then 'file.png'
       end
     )
     or length(p_storage_path) > 200 then
    raise exception 'DOCUMENT_STORAGE_PATH_INVALID' using errcode = '22023';
  end if;

  select exists (
    select 1
    from public.candidate_auth_identity_links l
    where l.supabase_user_id = p_supabase_user_id
      and l.candidate_id = p_candidate_id
      and l.link_status = 'VERIFIED'
      and l.verified_at is not null
      and l.verified_at <= clock_timestamp()
      and l.verified_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ) into v_verified;
  if not v_verified then
    raise exception 'VERIFIED_IDENTITY_REQUIRED' using errcode = '42501';
  end if;

  insert into public.candidate_private_documents (
    id, candidate_id, document_type, application_id, preparation_item_id,
    evidence_purpose, storage_bucket, storage_path, original_filename,
    mime_type, size_bytes, status, created_by_auth_user_id
  )
  values (
    p_document_id, p_candidate_id, p_document_type, p_application_id, p_preparation_item_id,
    p_evidence_purpose, 'kingsmen-candidate-documents', p_storage_path,
    btrim(p_original_filename), p_mime_type, p_size_bytes, 'UPLOAD_PENDING', p_supabase_user_id
  )
  returning * into v_doc;

  insert into public.candidate_private_document_events (
    document_id, candidate_id, actor_type, event_type, from_status, to_status, metadata
  )
  values (
    v_doc.id, v_doc.candidate_id, 'CANDIDATE', 'UPLOAD_REQUESTED', null, v_doc.status,
    jsonb_build_object(
      'storageBucket', v_doc.storage_bucket,
      'mimeType', v_doc.mime_type,
      'declaredSizeBytes', v_doc.size_bytes
    )
  );

  return jsonb_build_object(
    'documentId', v_doc.id,
    'candidateId', v_doc.candidate_id,
    'status', v_doc.status,
    'createdAt', v_doc.created_at
  );
end;
$function$;

create or replace function public.finalize_candidate_private_document_upload(
  p_supabase_user_id uuid,
  p_candidate_id uuid,
  p_document_id uuid,
  p_actual_size_bytes bigint,
  p_sha256_hex text,
  p_signature_valid boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_verified boolean;
  v_doc public.candidate_private_documents%rowtype;
  v_to_status text;
  v_failure text;
begin
  select exists (
    select 1
    from public.candidate_auth_identity_links l
    where l.supabase_user_id = p_supabase_user_id
      and l.candidate_id = p_candidate_id
      and l.link_status = 'VERIFIED'
      and l.verified_at is not null
      and l.verified_at <= clock_timestamp()
      and l.verified_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ) into v_verified;
  if not v_verified then
    raise exception 'VERIFIED_IDENTITY_REQUIRED' using errcode = '42501';
  end if;

  select * into v_doc
  from public.candidate_private_documents d
  where d.id = p_document_id
    and d.candidate_id = p_candidate_id
  for update;
  if not found then
    raise exception 'DOCUMENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_doc.status in ('UPLOADED_CANDIDATE_REPORTED','UNDER_REVIEW','VERIFIED') then
    if v_doc.sha256_hex = p_sha256_hex and v_doc.size_bytes = p_actual_size_bytes then
      return jsonb_build_object('documentId', v_doc.id, 'status', v_doc.status, 'idempotent', true);
    end if;
    raise exception 'DOCUMENT_ALREADY_FINALIZED' using errcode = '23505';
  end if;
  if v_doc.status <> 'UPLOAD_PENDING' then
    raise exception 'DOCUMENT_NOT_PENDING' using errcode = '55000';
  end if;

  v_failure := null;
  if p_actual_size_bytes is null or p_actual_size_bytes <> v_doc.size_bytes
     or p_actual_size_bytes < 1 or p_actual_size_bytes > 10485760 then
    v_failure := 'SIZE_MISMATCH';
  elsif p_sha256_hex is null or p_sha256_hex !~ '^[0-9a-f]{64}$' then
    v_failure := 'CHECKSUM_INVALID';
  elsif p_signature_valid is distinct from true then
    v_failure := 'FILE_SIGNATURE_MISMATCH';
  end if;

  if v_failure is not null then
    update public.candidate_private_documents
      set status = 'UPLOAD_FAILED', updated_at = clock_timestamp()
      where id = v_doc.id
      returning * into v_doc;
    insert into public.candidate_private_document_events (
      document_id, candidate_id, actor_type, event_type, from_status, to_status, metadata
    )
    values (
      v_doc.id, v_doc.candidate_id, 'CANDIDATE', 'UPLOAD_FAILED', 'UPLOAD_PENDING', 'UPLOAD_FAILED',
      jsonb_build_object('reasonCode', v_failure)
    );
    return jsonb_build_object('documentId', v_doc.id, 'status', 'UPLOAD_FAILED', 'reasonCode', v_failure);
  end if;

  update public.candidate_private_documents
    set status = 'UPLOADED_CANDIDATE_REPORTED',
        sha256_hex = p_sha256_hex,
        uploaded_at = clock_timestamp(),
        updated_at = clock_timestamp()
    where id = v_doc.id
    returning * into v_doc;

  insert into public.candidate_private_document_events (
    document_id, candidate_id, actor_type, event_type, from_status, to_status, metadata
  )
  values (
    v_doc.id, v_doc.candidate_id, 'CANDIDATE', 'UPLOAD_CONFIRMED', 'UPLOAD_PENDING',
    'UPLOADED_CANDIDATE_REPORTED',
    jsonb_build_object('sha256Verified', true, 'sizeVerified', true, 'signatureVerified', true)
  );

  return jsonb_build_object(
    'documentId', v_doc.id,
    'status', v_doc.status,
    'uploadedAt', v_doc.uploaded_at,
    'sha256Hex', v_doc.sha256_hex,
    'idempotent', false
  );
end;
$function$;

create or replace function public.record_candidate_private_document_read_link(
  p_supabase_user_id uuid,
  p_candidate_id uuid,
  p_document_id uuid,
  p_link_lifetime_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_verified boolean;
  v_doc public.candidate_private_documents%rowtype;
begin
  if p_link_lifetime_seconds is null or p_link_lifetime_seconds < 30 or p_link_lifetime_seconds > 300 then
    raise exception 'SIGNED_LINK_LIFETIME_INVALID' using errcode = '22023';
  end if;

  select exists (
    select 1
    from public.candidate_auth_identity_links l
    where l.supabase_user_id = p_supabase_user_id
      and l.candidate_id = p_candidate_id
      and l.link_status = 'VERIFIED'
      and l.verified_at is not null
      and l.verified_at <= clock_timestamp()
      and l.verified_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ) into v_verified;
  if not v_verified then
    raise exception 'VERIFIED_IDENTITY_REQUIRED' using errcode = '42501';
  end if;

  select * into v_doc
  from public.candidate_private_documents d
  where d.id = p_document_id
    and d.candidate_id = p_candidate_id
    and d.status in ('UPLOADED_CANDIDATE_REPORTED','UNDER_REVIEW','VERIFIED','REJECTED')
  for update;
  if not found then
    raise exception 'DOCUMENT_NOT_FOUND_OR_NOT_READABLE' using errcode = '42501';
  end if;

  insert into public.candidate_private_document_events (
    document_id, candidate_id, actor_type, event_type, from_status, to_status, metadata
  )
  values (
    v_doc.id, v_doc.candidate_id, 'CANDIDATE', 'READ_LINK_ISSUED', v_doc.status, v_doc.status,
    jsonb_build_object('expiresInSeconds', p_link_lifetime_seconds)
  );

  return jsonb_build_object('documentId', v_doc.id, 'status', v_doc.status, 'auditRecorded', true);
end;
$function$;

revoke all on function public.create_candidate_private_document_upload_request(uuid,uuid,uuid,text,text,text,text,bigint,uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.finalize_candidate_private_document_upload(uuid,uuid,uuid,bigint,text,boolean) from public, anon, authenticated;
revoke all on function public.record_candidate_private_document_read_link(uuid,uuid,uuid,integer) from public, anon, authenticated;
grant execute on function public.create_candidate_private_document_upload_request(uuid,uuid,uuid,text,text,text,text,bigint,uuid,uuid,text) to service_role;
grant execute on function public.finalize_candidate_private_document_upload(uuid,uuid,uuid,bigint,text,boolean) to service_role;
grant execute on function public.record_candidate_private_document_read_link(uuid,uuid,uuid,integer) to service_role;

comment on function public.create_candidate_private_document_upload_request(uuid,uuid,uuid,text,text,text,text,bigint,uuid,uuid,text) is
  'Atomically records a private candidate document upload intent and audit event after re-checking the trusted Auth UUID to candidate link. Service role only.';
comment on function public.finalize_candidate_private_document_upload(uuid,uuid,uuid,bigint,text,boolean) is
  'Finalizes a candidate document only after the trusted server verifies bytes, size, hash and MIME signature. Idempotent for same checksum. Service role only.';
comment on function public.record_candidate_private_document_read_link(uuid,uuid,uuid,integer) is
  'Audits issuance of short-lived signed read links after verified owner and readable-status checks. Service role only.';

commit;
