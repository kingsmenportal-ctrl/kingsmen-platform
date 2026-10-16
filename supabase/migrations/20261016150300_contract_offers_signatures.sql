-- H: Contract offers/signatures. DRAFT ONLY; legal/product review and schema validation required.
begin;
create table if not exists public.contract_offers (
 id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidates(id) on delete restrict,
 offer_version integer not null check(offer_version>0), terms jsonb not null,
 status text not null default 'draft' check(status in ('draft','issued','accepted','declined','expired','withdrawn')),
 issued_by uuid, issued_at timestamptz, expires_at timestamptz, idempotency_key text not null unique,
 created_at timestamptz not null default now(), unique(candidate_id,offer_version)
);
create table if not exists public.contract_signatures (
 id uuid primary key default gen_random_uuid(), offer_id uuid not null references public.contract_offers(id) on delete restrict,
 candidate_id uuid not null references public.candidates(id) on delete restrict, signed_at timestamptz not null default now(),
 signature_method text not null, document_sha256 text not null check(document_sha256 ~ '^[0-9a-f]{64}$'),
 idempotency_key text not null unique, created_at timestamptz not null default now()
);
alter table public.contract_offers enable row level security;
alter table public.contract_signatures enable row level security;
revoke all on table public.contract_offers,public.contract_signatures from public,anon,authenticated;
grant select on table public.contract_offers,public.contract_signatures to authenticated;
create policy contract_offer_candidate_read on public.contract_offers for select to authenticated using(candidate_id=kingsmen_security.current_authenticated_candidate_id());
create policy contract_offer_founder_read on public.contract_offers for select to authenticated using(kingsmen_security.is_kingsmen_founder());
create policy contract_signature_candidate_read on public.contract_signatures for select to authenticated using(candidate_id=kingsmen_security.current_authenticated_candidate_id());
create policy contract_signature_founder_read on public.contract_signatures for select to authenticated using(kingsmen_security.is_kingsmen_founder());
create or replace function public.issue_offer(p_candidate_id uuid,p_offer_version integer,p_terms jsonb,p_expires_at timestamptz,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_id uuid; v_existing public.contract_offers%rowtype;
begin
 if not kingsmen_security.is_kingsmen_founder() then raise exception 'founder role required' using errcode='42501'; end if;
 if p_candidate_id is null or p_offer_version is null or p_offer_version <= 0 or p_terms is null
    or jsonb_typeof(p_terms) <> 'object' or p_idempotency_key is null
    or length(p_idempotency_key) < 8 or length(p_idempotency_key) > 128 then
   raise exception 'invalid contract offer input' using errcode='22023';
 end if;
 insert into public.contract_offers(candidate_id,offer_version,terms,status,issued_by,issued_at,expires_at,idempotency_key)
 values(p_candidate_id,p_offer_version,p_terms,'issued',auth.uid(),now(),p_expires_at,p_idempotency_key)
 on conflict(idempotency_key) do nothing returning id into v_id;
 if v_id is null then
   select * into v_existing from public.contract_offers where idempotency_key=p_idempotency_key;
   if not found or v_existing.candidate_id <> p_candidate_id or v_existing.offer_version <> p_offer_version
      or v_existing.terms is distinct from p_terms or v_existing.expires_at is distinct from p_expires_at then
     raise exception 'idempotency key reused with different offer' using errcode='23505';
   end if;
   return v_existing.id;
 end if;
 insert into public.audit_log(actor_id,action,entity_type,entity_id,metadata,created_at)
 values(auth.uid(),'contract.offer.issued','contract_offer',v_id,
        jsonb_build_object('candidate_id',p_candidate_id,'offer_version',p_offer_version),now());
 return v_id;
end $;
create or replace function public.sign_offer(p_offer_id uuid,p_signature_method text,p_document_sha256 text,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_candidate uuid; v_sig uuid; v_offer public.contract_offers%rowtype;
        v_existing public.contract_signatures%rowtype; v_inserted boolean := false;
begin
 v_candidate:=kingsmen_security.current_authenticated_candidate_id();
 if v_candidate is null then raise exception 'candidate authentication required' using errcode='42501'; end if;
 if p_offer_id is null or p_signature_method is null or p_signature_method not in ('typed_name','electronic_signature','external_signature')
    or p_document_sha256 is null or p_document_sha256 !~ '^[0-9a-f]{64}
revoke all on function public.issue_offer(uuid,integer,jsonb,timestamptz,text) from public,anon;
grant execute on function public.issue_offer(uuid,integer,jsonb,timestamptz,text) to authenticated;
revoke all on function public.sign_offer(uuid,text,text,text) from public,anon;
grant execute on function public.sign_offer(uuid,text,text,text) to authenticated;
commit;

    or p_idempotency_key is null or length(p_idempotency_key) < 8 or length(p_idempotency_key) > 128 then
   raise exception 'invalid signature input' using errcode='22023';
 end if;
 select * into v_offer from public.contract_offers
  where id=p_offer_id and candidate_id=v_candidate for update;
 if not found then raise exception 'offer unavailable' using errcode='P0002'; end if;
 select * into v_existing from public.contract_signatures where idempotency_key=p_idempotency_key;
 if found then
   if v_existing.offer_id <> p_offer_id or v_existing.candidate_id <> v_candidate
      or v_existing.signature_method <> p_signature_method
      or v_existing.document_sha256 <> p_document_sha256 then
     raise exception 'idempotency key reused with different signature' using errcode='23505';
   end if;
   return v_existing.id;
 end if;
 if v_offer.status <> 'issued' or (v_offer.expires_at is not null and v_offer.expires_at <= now()) then
   raise exception 'offer unavailable or expired' using errcode='P0002';
 end if;
 insert into public.contract_signatures(offer_id,candidate_id,signature_method,document_sha256,idempotency_key)
 values(p_offer_id,v_candidate,p_signature_method,p_document_sha256,p_idempotency_key)
 on conflict(idempotency_key) do nothing returning id into v_sig;
 if v_sig is null then
   select * into v_existing from public.contract_signatures where idempotency_key=p_idempotency_key;
   if not found or v_existing.offer_id <> p_offer_id or v_existing.candidate_id <> v_candidate
      or v_existing.signature_method <> p_signature_method
      or v_existing.document_sha256 <> p_document_sha256 then
     raise exception 'idempotency key reused with different signature' using errcode='23505';
   end if;
   return v_existing.id;
 end if;
 update public.contract_offers set status='accepted' where id=p_offer_id and candidate_id=v_candidate and status='issued';
 insert into public.audit_log(actor_id,action,entity_type,entity_id,metadata,created_at)
 values(auth.uid(),'contract.offer.signed','contract_signature',v_sig,jsonb_build_object('offer_id',p_offer_id),now());
 return v_sig;
end $;
revoke all on function public.issue_offer(uuid,integer,jsonb,timestamptz,text) from public,anon;
grant execute on function public.issue_offer(uuid,integer,jsonb,timestamptz,text) to authenticated;
revoke all on function public.sign_offer(uuid,text,text,text) from public,anon;
grant execute on function public.sign_offer(uuid,text,text,text) to authenticated;
commit;
