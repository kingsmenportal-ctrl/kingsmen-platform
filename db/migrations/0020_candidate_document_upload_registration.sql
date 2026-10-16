-- Register authenticated candidate uploads in the canonical N05 document vault.
-- Storage object existence and candidate ownership are resolved server-side; caller-supplied
-- candidate IDs or object paths are never trusted. Registration is transactional and idempotency
-- is provided by the newly generated references plus the unique storage path guard.
create or replace function public.register_candidate_document_upload(
  p_document_type text,
  p_display_name text,
  p_original_filename text,
  p_mime_type text,
  p_file_size_bytes bigint,
  p_storage_path text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate_id uuid;
  v_document_id uuid;
  v_document_ref text;
  v_evidence_ref text;
  v_event_ref text;
  v_bucket text := 'candidate-documents';
  v_object_name text;
begin
  if auth.uid() is null then
    raise exception 'CANDIDATE_AUTH_REQUIRED' using errcode = '42501';
  end if;

  if p_document_type not in ('CV','ID_DOCUMENT','ACADEMIC_RECORD','OTHER')
    or char_length(coalesce(p_display_name,'')) not between 1 and 180
    or char_length(coalesce(p_original_filename,'')) not between 1 and 180
    or p_mime_type not in (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/octet-stream',
      'text/txt'
    )
    or p_file_size_bytes not between 1 and 10485760
    or char_length(coalesce(p_storage_path,'')) not between 38 and 220
    or split_part(p_storage_path,'/',1) <> auth.uid()::text
    or split_part(p_storage_path,'/',2) = ''
    or split_part(p_storage_path,'/',3) <> '' then
    raise exception 'INVALID_CANDIDATE_DOCUMENT_UPLOAD' using errcode = '22023';
  end if;

  v_candidate_id := kingsmen_security.current_authenticated_candidate_id();
  if v_candidate_id is null then
    raise exception 'CANDIDATE_RECORD_NOT_FOUND' using errcode = 'P0002';
  end if;
  v_object_name := p_storage_path;

  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = v_bucket
      and o.name = v_object_name
      and o.owner_id = auth.uid()::text
  ) then
    raise exception 'UPLOADED_STORAGE_OBJECT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.document_files d
    where d.storage_bucket = v_bucket and d.storage_path = p_storage_path
  ) then
    raise exception 'DOCUMENT_ALREADY_REGISTERED' using errcode = '23505';
  end if;

  v_document_ref := 'doc-' || gen_random_uuid()::text;
  v_evidence_ref := 'evidence-' || gen_random_uuid()::text;
  v_event_ref := 'event-' || gen_random_uuid()::text;

  insert into public.document_files
    (candidate_id, document_ref, document_type, display_name, original_filename,
     mime_type, file_size_bytes, storage_provider, storage_bucket, storage_path,
     protected_data, source_channel, document_status, verification_status,
     extraction_status, source_confidence_band, evidence_ref, metadata)
  values
    (v_candidate_id, v_document_ref, p_document_type, p_display_name, p_original_filename,
     p_mime_type, p_file_size_bytes, 'SUPABASE_STORAGE', v_bucket, p_storage_path,
     true, 'PORTAL', 'UPLOADED', 'PENDING', 'NOT_STARTED', 'C',
     v_evidence_ref, jsonb_build_object('registrationSource','authenticated_candidate_portal'))
  returning id into v_document_id;

  insert into public.document_storage_events
    (document_id, event_ref, event_type, storage_provider, storage_bucket,
     storage_path, file_size_bytes, status, message, metadata)
  values
    (v_document_id, v_event_ref, 'UPLOAD_COMPLETED', 'SUPABASE_STORAGE', v_bucket,
     p_storage_path, p_file_size_bytes, 'OK',
     'Authenticated candidate upload registered in the canonical document vault.',
     jsonb_build_object('registrationSource','authenticated_candidate_portal'));

  return jsonb_build_object(
    'registered', true,
    'documentRef', v_document_ref,
    'evidenceRef', v_evidence_ref,
    'storageEventRef', v_event_ref,
    'candidateId', v_candidate_id,
    'documentStatus', 'UPLOADED',
    'verificationStatus', 'PENDING'
  );
end;
$$;

revoke all on function public.register_candidate_document_upload(text,text,text,text,bigint,text) from public, anon;
grant execute on function public.register_candidate_document_upload(text,text,text,text,bigint,text) to authenticated;
