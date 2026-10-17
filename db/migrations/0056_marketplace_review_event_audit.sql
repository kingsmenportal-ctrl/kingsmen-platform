-- Append-only, reviewer-readable audit history for marketplace verification and publication.
-- The event table is exposed through PostgREST but has RLS enabled and no client write grants.
create table if not exists public.marketplace_review_events (
  id bigint generated always as identity primary key,
  entity_kind text not null check (entity_kind in ('organisation','listing')),
  entity_id uuid not null,
  actor_id uuid,
  action text not null,
  previous_state text,
  new_state text,
  evidence_urls text[] not null default array[]::text[],
  occurred_at timestamptz not null default clock_timestamp(),
  transaction_id bigint not null default txid_current()
);
alter table public.marketplace_review_events enable row level security;
grant select on public.marketplace_review_events to authenticated;
revoke insert, update, delete, truncate, references, trigger on public.marketplace_review_events from anon, authenticated;
drop policy if exists marketplace_review_events_reviewer_read on public.marketplace_review_events;
create policy marketplace_review_events_reviewer_read
  on public.marketplace_review_events for select to authenticated
  using (kingsmen_security.is_founder_or_operator());

create or replace function kingsmen_security.capture_marketplace_review_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth, kingsmen_security, pg_temp
as $function$
declare
  event_action text;
  before_state text;
  after_state text;
  evidence text[];
begin
  if tg_table_name = 'organisations' then
    if old.verification_status is not distinct from new.verification_status
      and old.reviewed_by is not distinct from new.reviewed_by
      and old.reviewed_at is not distinct from new.reviewed_at
      and old.verification_evidence is not distinct from new.verification_evidence then
      return new;
    end if;
    before_state := old.verification_status;
    after_state := new.verification_status;
    evidence := coalesce(new.verification_evidence, array[]::text[]);
    event_action := case
      when old.verification_status is distinct from new.verification_status then new.verification_status
      else 'REVIEW_EVIDENCE_UPDATED'
    end;
    insert into public.marketplace_review_events
      (entity_kind, entity_id, actor_id, action, previous_state, new_state, evidence_urls)
    values ('organisation', new.id, auth.uid(), event_action, before_state, after_state, evidence);
  elsif tg_table_name = 'organisation_listings' then
    if old.status is not distinct from new.status
      and old.source_verified_at is not distinct from new.source_verified_at
      and old.source_verified_by is not distinct from new.source_verified_by
      and old.reviewed_by is not distinct from new.reviewed_by
      and old.reviewed_at is not distinct from new.reviewed_at
      and old.evidence_refs is not distinct from new.evidence_refs then
      return new;
    end if;
    before_state := old.status;
    after_state := new.status;
    evidence := coalesce(new.evidence_refs, array[]::text[]);
    event_action := case
      when old.status is distinct from new.status then new.status
      when old.source_verified_at is distinct from new.source_verified_at
        or old.source_verified_by is distinct from new.source_verified_by then 'SOURCE_VERIFIED'
      else 'REVIEW_EVIDENCE_UPDATED'
    end;
    insert into public.marketplace_review_events
      (entity_kind, entity_id, actor_id, action, previous_state, new_state, evidence_urls)
    values ('listing', new.id, auth.uid(), event_action, before_state, after_state, evidence);
  end if;
  return new;
end;
$function$;
revoke all on function kingsmen_security.capture_marketplace_review_event() from public, anon, authenticated;

drop trigger if exists organisations_review_audit on public.organisations;
create trigger organisations_review_audit
  after update of verification_status, reviewed_by, reviewed_at, verification_evidence
  on public.organisations
  for each row execute function kingsmen_security.capture_marketplace_review_event();
drop trigger if exists organisation_listings_review_audit on public.organisation_listings;
create trigger organisation_listings_review_audit
  after update of status, source_verified_at, source_verified_by, reviewed_by, reviewed_at, evidence_refs
  on public.organisation_listings
  for each row execute function kingsmen_security.capture_marketplace_review_event();

create index if not exists marketplace_review_events_occurred_idx
  on public.marketplace_review_events(occurred_at desc);
create index if not exists marketplace_review_events_entity_idx
  on public.marketplace_review_events(entity_kind, entity_id, occurred_at desc);
