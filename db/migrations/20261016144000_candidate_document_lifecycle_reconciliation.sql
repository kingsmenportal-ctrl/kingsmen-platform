-- FORWARD RECONCILIATION MIGRATION — prepared for staging, NOT YET APPLIED.
-- Reinstates missing candidate document lifecycle RPCs under a new migration version.
-- Preconditions: document_files/document_storage_events and the private storage bucket exist.
-- Apply only after staging backup/restore safeguards and SQL review are complete.

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.document_files'::regclass and conname='document_files_size_nonnegative') then
    alter table public.document_files add constraint document_files_size_nonnegative check (file_size_bytes >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.document_files'::regclass and conname='document_files_metadata_object') then
    alter table public.document_files add constraint document_files_metadata_object check (jsonb_typeof(metadata) = 'object');
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from public.document_files
    group by storage_bucket, storage_path having count(*) > 1
  ) then
    raise exception 'Cannot create unique canonical storage-path index: duplicate storage references exist';
  end if;
end $$;

create unique index if not exists document_files_storage_bucket_path_key
  on public.document_files(storage_bucket, storage_path);

alter table public.document_storage_events
  drop constraint if exists document_storage_events_type_check;
alter table public.document_storage_events
  add constraint document_storage_events_type_check check (
    event_type in ('SIGNED_UPLOAD_CREATED','UPLOAD_COMPLETED','CHECKSUM_RECORDED','FILE_ACCESSED','ARCHIVED','DELETED','RETENTION_CHECK','APPLICATION_LINKED')
  );

-- Authenticated upload registration: derives candidate identity from auth.uid() and
-- verifies the actual private storage object before creating canonical records.
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
    or split_part(p_storage_path,'/',3) <> ''
    or length(p_storage_path) - length(replace(p_storage_path,'/','')) <> 1 then
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


-- Retirement happens before storage cleanup; cleanup outcome is recorded separately.
create or replace function public.retire_candidate_document_upload(p_document_ref text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate_id uuid;
  v_document_id uuid;
  v_storage_bucket text;
  v_storage_path text;
  v_size bigint;
  v_event_ref text;
begin
  if auth.uid() is null then
    raise exception 'CANDIDATE_AUTH_REQUIRED' using errcode = '42501';
  end if;
  if char_length(coalesce(p_document_ref,'')) not between 3 and 180 then
    raise exception 'INVALID_DOCUMENT_REFERENCE' using errcode = '22023';
  end if;

  v_candidate_id := kingsmen_security.current_authenticated_candidate_id();
  if v_candidate_id is null then
    raise exception 'CANDIDATE_RECORD_NOT_FOUND' using errcode = 'P0002';
  end if;

  select d.id, d.storage_bucket, d.storage_path, d.file_size_bytes
    into v_document_id, v_storage_bucket, v_storage_path, v_size
  from public.document_files d
  where d.document_ref = p_document_ref and d.candidate_id = v_candidate_id
  for update;
  if not found then
    raise exception 'DOCUMENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_storage_bucket <> 'candidate-documents'
    or split_part(v_storage_path,'/',1) <> auth.uid()::text
    or split_part(v_storage_path,'/',2) = ''
    or split_part(v_storage_path,'/',3) <> ''
    or length(v_storage_path) - length(replace(v_storage_path,'/','')) <> 1 then
    raise exception 'UNSAFE_DOCUMENT_STORAGE_REFERENCE' using errcode = '23514';
  end if;

  if (select d.document_status from public.document_files d where d.id = v_document_id) <> 'DELETED' then
    update public.document_files
      set document_status = 'DELETED', archived_at = coalesce(archived_at, now()), updated_at = now()
    where id = v_document_id;
    v_event_ref := 'event-' || gen_random_uuid()::text;
    insert into public.document_storage_events
      (document_id,event_ref,event_type,storage_provider,storage_bucket,storage_path,file_size_bytes,status,message,metadata)
    values
      (v_document_id,v_event_ref,'DELETED','SUPABASE_STORAGE',v_storage_bucket,v_storage_path,v_size,'WARNING',
       'Canonical document retired before private object cleanup; cleanup outcome pending.',
       jsonb_build_object('actor','candidate_portal','phase','retirement'));
  end if;

  return jsonb_build_object('retired',true,'documentRef',p_document_ref,
    'storageBucket',v_storage_bucket,'storagePath',v_storage_path,'fileSizeBytes',v_size);
end;
$$;

create or replace function public.record_candidate_document_deletion_result(
  p_document_ref text,
  p_success boolean
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate_id uuid;
  v_document_id uuid;
  v_bucket text;
  v_path text;
  v_size bigint;
  v_event_ref text;
begin
  if auth.uid() is null then
    raise exception 'CANDIDATE_AUTH_REQUIRED' using errcode = '42501';
  end if;
  if p_success is null or char_length(coalesce(p_document_ref,'')) not between 3 and 180 then
    raise exception 'INVALID_DOCUMENT_DELETION_RESULT' using errcode = '22023';
  end if;

  v_candidate_id := kingsmen_security.current_authenticated_candidate_id();
  if v_candidate_id is null then
    raise exception 'CANDIDATE_RECORD_NOT_FOUND' using errcode = 'P0002';
  end if;

  select d.id,d.storage_bucket,d.storage_path,d.file_size_bytes
    into v_document_id,v_bucket,v_path,v_size
  from public.document_files d
  where d.document_ref = p_document_ref and d.candidate_id = v_candidate_id
    and d.document_status = 'DELETED'
  for share;
  if not found then
    raise exception 'RETIRED_DOCUMENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  v_event_ref := 'event-' || gen_random_uuid()::text;
  insert into public.document_storage_events
    (document_id,event_ref,event_type,storage_provider,storage_bucket,storage_path,file_size_bytes,status,message,metadata)
  values
    (v_document_id,v_event_ref,'DELETED','SUPABASE_STORAGE',v_bucket,v_path,v_size,
     case when p_success then 'OK' else 'FAILED' end,
     case when p_success then 'Private storage object deletion confirmed by storage API.'
          else 'Private storage object cleanup did not complete; document remains retired and cannot be reviewed.' end,
     jsonb_build_object('actor','candidate_portal','phase','storage_cleanup','success',p_success));

  return jsonb_build_object('recorded',true,'documentRef',p_document_ref,'cleanupConfirmed',p_success,'storageEventRef',v_event_ref);
end;
$$;

revoke all on function public.retire_candidate_document_upload(text) from public, anon;
revoke all on function public.record_candidate_document_deletion_result(text,boolean) from public, anon;
grant execute on function public.retire_candidate_document_upload(text) to authenticated;
grant execute on function public.record_candidate_document_deletion_result(text,boolean) to authenticated;


-- Canonical application linkage is ownership-checked and audited transactionally.
create or replace function public.link_candidate_document_to_application(
  p_document_ref text,
  p_application_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate_id uuid;
  v_document_id uuid;
  v_old_application_id uuid;
  v_status text;
  v_bucket text;
  v_path text;
  v_size bigint;
  v_event_ref text;
begin
  if auth.uid() is null then
    raise exception 'CANDIDATE_AUTH_REQUIRED' using errcode = '42501';
  end if;
  if char_length(coalesce(p_document_ref,'')) not between 3 and 180 or p_application_id is null then
    raise exception 'INVALID_APPLICATION_DOCUMENT_LINK' using errcode = '22023';
  end if;

  v_candidate_id := kingsmen_security.current_authenticated_candidate_id();
  if v_candidate_id is null then
    raise exception 'CANDIDATE_RECORD_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.applications a
    where a.id = p_application_id and a.candidate_id = v_candidate_id
  ) then
    raise exception 'APPLICATION_NOT_OWNED_BY_CANDIDATE' using errcode = '42501';
  end if;

  select d.id, d.application_id, d.document_status, d.storage_bucket, d.storage_path, d.file_size_bytes
    into v_document_id, v_old_application_id, v_status, v_bucket, v_path, v_size
    from public.document_files d
    where d.document_ref = p_document_ref and d.candidate_id = v_candidate_id
    for update;
  if not found then
    raise exception 'DOCUMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_status in ('ARCHIVED','DELETED','REJECTED') then
    raise exception 'DOCUMENT_NOT_ACTIVE' using errcode = '23514';
  end if;
  if v_bucket <> 'candidate-documents'
    or split_part(v_path,'/',1) <> auth.uid()::text
    or split_part(v_path,'/',2) = ''
    or split_part(v_path,'/',3) <> ''
    or length(v_path) - length(replace(v_path,'/','')) <> 1 then
    raise exception 'UNSAFE_DOCUMENT_STORAGE_REFERENCE' using errcode = '23514';
  end if;
  if v_old_application_id = p_application_id then
    return jsonb_build_object('linked',true,'unchanged',true,'documentRef',p_document_ref,'applicationId',p_application_id);
  end if;

  update public.document_files
    set application_id = p_application_id, updated_at = now()
    where id = v_document_id;

  v_event_ref := 'event-' || gen_random_uuid()::text;
  insert into public.document_storage_events
    (document_id,event_ref,event_type,storage_provider,storage_bucket,storage_path,file_size_bytes,status,message,metadata)
  values
    (v_document_id,v_event_ref,'APPLICATION_LINKED','SUPABASE_STORAGE',v_bucket,v_path,v_size,'OK',
     'Candidate linked an active canonical document to an owned application pack.',
     jsonb_build_object('actor','candidate_portal','applicationId',p_application_id,
       'previousApplicationId',v_old_application_id));

  return jsonb_build_object('linked',true,'unchanged',false,'documentRef',p_document_ref,
    'applicationId',p_application_id,'storageEventRef',v_event_ref);
end;
$$;

revoke all on function public.link_candidate_document_to_application(text,uuid) from public, anon;
grant execute on function public.link_candidate_document_to_application(text,uuid) to authenticated;
