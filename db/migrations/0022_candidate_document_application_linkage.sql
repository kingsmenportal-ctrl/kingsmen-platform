-- Candidate document lifecycle integrity and application-pack linkage.
-- Keep canonical metadata consistent and refuse links to retired or cross-candidate documents.
alter table public.document_files
  add constraint document_files_size_nonnegative check (file_size_bytes >= 0),
  add constraint document_files_metadata_object check (jsonb_typeof(metadata) = 'object');

create index if not exists idx_document_files_candidate_application_active
  on public.document_files(candidate_id, application_id, document_type, uploaded_at desc)
  where document_status not in ('ARCHIVED','DELETED');

alter table public.document_storage_events
  drop constraint if exists document_storage_events_type_check;
alter table public.document_storage_events
  add constraint document_storage_events_type_check check (
    event_type in ('SIGNED_UPLOAD_CREATED','UPLOAD_COMPLETED','CHECKSUM_RECORDED','FILE_ACCESSED','ARCHIVED','DELETED','RETENTION_CHECK','APPLICATION_LINKED')
  );

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
