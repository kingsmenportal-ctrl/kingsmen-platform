-- P: WhatsApp session/message metadata. No provider connection or outbound delivery is implemented.
begin;
create table if not exists public.whatsapp_sessions (
 id uuid primary key default gen_random_uuid(),
 candidate_id uuid not null references public.candidates(id) on delete restrict,
 whatsapp_id text unique,
 last_message_at timestamptz not null default now(),
 status text not null default 'pending' check(status in ('pending','active','blocked','closed')),
 created_at timestamptz not null default now()
);
create table if not exists public.whatsapp_messages (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.whatsapp_sessions(id) on delete restrict,
 direction text not null check(direction in ('inbound','outbound')),
 body text not null,
 provider_message_id text,
 created_at timestamptz not null default now()
);
create table if not exists public.bot_commands (
 id uuid primary key default gen_random_uuid(),
 command text not null unique,
 handler text not null,
 enabled boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.whatsapp_sessions enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.bot_commands enable row level security;
revoke all on table public.whatsapp_sessions,public.whatsapp_messages,public.bot_commands from public,anon,authenticated;
grant select on table public.whatsapp_sessions,public.whatsapp_messages to authenticated;
create policy whatsapp_sessions_candidate_read on public.whatsapp_sessions for select to authenticated
 using(candidate_id=kingsmen_security.current_authenticated_candidate_id() or kingsmen_security.is_kingsmen_founder());
create policy whatsapp_messages_owner_read on public.whatsapp_messages for select to authenticated
 using(exists(select 1 from public.whatsapp_sessions s where s.id=session_id and
 (s.candidate_id=kingsmen_security.current_authenticated_candidate_id() or kingsmen_security.is_kingsmen_founder())));
create policy bot_commands_founder_read on public.bot_commands for select to authenticated
 using(kingsmen_security.is_kingsmen_founder());
commit;
