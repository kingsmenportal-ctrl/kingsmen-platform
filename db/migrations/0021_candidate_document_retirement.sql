-- Candidate-owned canonical document retirement and append-only storage cleanup evidence.
-- Retirement happens before object deletion so stale files cannot remain reviewable.
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

  select c.id into v_candidate_id
  from public.candidates c
  where c.owner_user_id = auth.uid();
  if not found then
    raise exception 'CANDIDATE_RECORD_NOT_FOUND' using errcode = 'P0002';
  end if;
  if (select count(*) from public.candidates c where c.owner_user_id = auth.uid()) <> 1 then
    raise exception 'CANDIDATE_RECORD_NOT_UNIQUE' using errcode = '23514';
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
    or split_part(v_storage_path,'/',3) <> '' then
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

  select c.id into v_candidate_id
  from public.candidates c where c.owner_user_id = auth.uid();
  if not found or (select count(*) from public.candidates c where c.owner_user_id = auth.uid()) <> 1 then
    raise exception 'CANDIDATE_RECORD_NOT_UNIQUE' using errcode = '23514';
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
