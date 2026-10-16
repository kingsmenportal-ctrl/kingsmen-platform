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
declare v_id uuid;
begin
 if not kingsmen_security.is_kingsmen_founder() then raise exception 'founder role required' using errcode='42501'; end if;
 insert into public.notification_queue(candidate_id,channel,template_key,payload,idempotency_key,scheduled_at)
 values(p_candidate_id,p_channel,p_template_key,coalesce(p_payload,'{}'::jsonb),p_idempotency_key,coalesce(p_scheduled_at,now()))
 on conflict(idempotency_key) do update set idempotency_key=excluded.idempotency_key returning id into v_id;
 return v_id;
end $$;
revoke all on function public.enqueue_notification(uuid,text,text,jsonb,text,timestamptz) from public,anon;
grant execute on function public.enqueue_notification(uuid,text,text,jsonb,text,timestamptz) to authenticated;
commit;
