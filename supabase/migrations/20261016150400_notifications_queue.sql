-- I: Notification queue; provider dispatch is separate and credential-gated. DRAFT ONLY.
begin;
create table if not exists public.notification_queue (
 id uuid primary key default gen_random_uuid(), candidate_id uuid references public.candidates(id) on delete restrict,
 channel text not null check(channel in ('email','sms','whatsapp','in_app')), template_key text not null,
 payload jsonb not null default '{}'::jsonb, status text not null default 'queued' check(status in ('queued','processing','sent','failed','cancelled')),
 idempotency_key text not null unique, scheduled_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.notification_deliveries (
 id uuid primary key default gen_random_uuid(), queue_id uuid not null references public.notification_queue(id) on delete restrict,
 provider text not null, provider_message_id text, status text not null check(status in ('sent','failed','unknown')),
 attempted_at timestamptz not null default now(), error_code text
);
alter table public.notification_queue enable row level security;
alter table public.notification_deliveries enable row level security;
revoke all on table public.notification_queue,public.notification_deliveries from public,anon,authenticated;
create or replace function public.enqueue_notification(p_candidate_id uuid,p_channel text,p_template_key text,p_payload jsonb,p_idempotency_key text,p_scheduled_at timestamptz default now())
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_id uuid; v_existing public.notification_queue%rowtype;
        v_payload jsonb := coalesce(p_payload,'{}'::jsonb);
        v_scheduled_at timestamptz := coalesce(p_scheduled_at,now());
begin
 if not kingsmen_security.is_kingsmen_founder() then raise exception 'founder role required' using errcode='42501'; end if;
 if p_channel is null or p_channel not in ('email','sms','whatsapp','in_app')
    or p_template_key is null or length(p_template_key) not between 2 and 100
    or p_idempotency_key is null or length(p_idempotency_key) not between 8 and 128
    or jsonb_typeof(v_payload) <> 'object' then
   raise exception 'invalid notification input' using errcode='22023';
 end if;
 insert into public.notification_queue(candidate_id,channel,template_key,payload,idempotency_key,scheduled_at)
 values(p_candidate_id,p_channel,p_template_key,v_payload,p_idempotency_key,v_scheduled_at)
 on conflict(idempotency_key) do nothing returning id into v_id;
 if v_id is not null then return v_id; end if;
 select * into v_existing from public.notification_queue where idempotency_key=p_idempotency_key;
 if not found or v_existing.candidate_id is distinct from p_candidate_id
    or v_existing.channel <> p_channel or v_existing.template_key <> p_template_key
    or v_existing.payload is distinct from v_payload or v_existing.scheduled_at is distinct from v_scheduled_at then
   raise exception 'idempotency key reused with different notification' using errcode='23505';
 end if;
 return v_existing.id;
end $;
revoke all on function public.enqueue_notification(uuid,text,text,jsonb,text,timestamptz) from public,anon;
grant execute on function public.enqueue_notification(uuid,text,text,jsonb,text,timestamptz) to authenticated;
commit;
