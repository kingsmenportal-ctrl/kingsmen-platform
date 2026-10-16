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
declare v_id uuid;
begin
 if not kingsmen_security.is_kingsmen_founder() then raise exception 'founder role required' using errcode='42501'; end if;
 insert into public.contract_offers(candidate_id,offer_version,terms,status,issued_by,issued_at,expires_at,idempotency_key)
 values(p_candidate_id,p_offer_version,p_terms,'issued',auth.uid(),now(),p_expires_at,p_idempotency_key)
 on conflict(idempotency_key) do update set idempotency_key=excluded.idempotency_key returning id into v_id;
 insert into public.audit_log(actor_id,action,entity_type,entity_id,metadata,created_at)
 values(auth.uid(),'contract.offer.issued','contract_offer',v_id,jsonb_build_object('candidate_id',p_candidate_id,'offer_version',p_offer_version),now());
 return v_id;
end $$;
create or replace function public.sign_offer(p_offer_id uuid,p_signature_method text,p_document_sha256 text,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_candidate uuid; v_sig uuid;
begin
 v_candidate:=kingsmen_security.current_authenticated_candidate_id();
 if v_candidate is null then raise exception 'candidate authentication required' using errcode='42501'; end if;
 insert into public.contract_signatures(offer_id,candidate_id,signature_method,document_sha256,idempotency_key)
 select o.id,o.candidate_id,p_signature_method,p_document_sha256,p_idempotency_key from public.contract_offers o
 where o.id=p_offer_id and o.candidate_id=v_candidate and o.status='issued' and (o.expires_at is null or o.expires_at>now())
 on conflict(idempotency_key) do nothing returning id into v_sig;
 if v_sig is null then select id into v_sig from public.contract_signatures where idempotency_key=p_idempotency_key and candidate_id=v_candidate; end if;
 if v_sig is null then raise exception 'offer unavailable or idempotency conflict' using errcode='P0002'; end if;
 update public.contract_offers set status='accepted' where id=p_offer_id and candidate_id=v_candidate and status='issued';
 insert into public.audit_log(actor_id,action,entity_type,entity_id,metadata,created_at)
 values(auth.uid(),'contract.offer.signed','contract_signature',v_sig,jsonb_build_object('offer_id',p_offer_id),now());
 return v_sig;
end $$;
revoke all on function public.issue_offer(uuid,integer,jsonb,timestamptz,text) from public,anon;
grant execute on function public.issue_offer(uuid,integer,jsonb,timestamptz,text) to authenticated;
revoke all on function public.sign_offer(uuid,text,text,text) from public,anon;
grant execute on function public.sign_offer(uuid,text,text,text) to authenticated;
commit;
