-- Isolated fixture for Phase 5 finance privilege hardening.
do $roles$
begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end
$roles$;

create table public.finance_plan_catalog(id uuid primary key default gen_random_uuid());
create table public.finance_orders(id uuid primary key default gen_random_uuid());
create table public.finance_invoices(id uuid primary key default gen_random_uuid());
create table public.payfast_payment_intents(id uuid primary key default gen_random_uuid());
create table public.finance_payments(id uuid primary key default gen_random_uuid());
create table public.payfast_itn_receipts(id uuid primary key default gen_random_uuid());
create table public.payfast_signature_audit(id uuid primary key default gen_random_uuid());
create table public.finance_refund_requests(id uuid primary key default gen_random_uuid());
create table public.finance_ledger_entries(id uuid primary key default gen_random_uuid());
create table public.finance_audit_events(id uuid primary key default gen_random_uuid());

grant all privileges on table
  public.finance_plan_catalog, public.finance_orders, public.finance_invoices,
  public.payfast_payment_intents, public.finance_payments, public.payfast_itn_receipts,
  public.payfast_signature_audit, public.finance_refund_requests,
  public.finance_ledger_entries, public.finance_audit_events
to anon, authenticated, service_role;

alter table public.finance_plan_catalog enable row level security;
alter table public.finance_orders enable row level security;
alter table public.finance_invoices enable row level security;
alter table public.payfast_payment_intents enable row level security;
alter table public.finance_payments enable row level security;
alter table public.payfast_itn_receipts enable row level security;
alter table public.payfast_signature_audit enable row level security;
alter table public.finance_refund_requests enable row level security;
alter table public.finance_ledger_entries enable row level security;
alter table public.finance_audit_events enable row level security;

create policy finance_plan_catalog_service_only on public.finance_plan_catalog for all to service_role using (true) with check (true);
create policy finance_orders_service_only on public.finance_orders for all to service_role using (true) with check (true);
create policy finance_invoices_service_only on public.finance_invoices for all to service_role using (true) with check (true);
create policy payfast_payment_intents_service_only on public.payfast_payment_intents for all to service_role using (true) with check (true);
create policy finance_payments_service_only on public.finance_payments for all to service_role using (true) with check (true);
create policy payfast_itn_receipts_service_only on public.payfast_itn_receipts for all to service_role using (true) with check (true);
create policy payfast_signature_audit_service_only on public.payfast_signature_audit for all to service_role using (true) with check (true);
create policy finance_refund_requests_service_only on public.finance_refund_requests for all to service_role using (true) with check (true);
create policy finance_ledger_entries_service_only on public.finance_ledger_entries for all to service_role using (true) with check (true);
create policy finance_audit_events_service_only on public.finance_audit_events for all to service_role using (true) with check (true);

create table public.candidate_communication_preferences(id uuid primary key default gen_random_uuid());
create table public.candidate_communications(id uuid primary key default gen_random_uuid());
create table public.candidate_communication_attempts(id uuid primary key default gen_random_uuid());
create table public.candidate_messages(id uuid primary key default gen_random_uuid());
create table public.candidate_mobile_notification_preferences(id uuid primary key default gen_random_uuid());

grant all privileges on table
  public.candidate_communication_preferences, public.candidate_communications,
  public.candidate_communication_attempts, public.candidate_messages,
  public.candidate_mobile_notification_preferences
to anon, authenticated, service_role;

alter table public.candidate_communication_preferences enable row level security;
alter table public.candidate_communications enable row level security;
alter table public.candidate_communication_attempts enable row level security;
alter table public.candidate_messages enable row level security;
alter table public.candidate_mobile_notification_preferences enable row level security;

create policy candidate_communication_preferences_service_only on public.candidate_communication_preferences for all to service_role using (true) with check (true);
create policy candidate_communications_service_only on public.candidate_communications for all to service_role using (true) with check (true);
create policy candidate_communication_attempts_service_only on public.candidate_communication_attempts for all to service_role using (true) with check (true);
create policy candidate_messages_service_only on public.candidate_messages for all to service_role using (true) with check (true);
create policy candidate_mobile_notification_preferences_service_only on public.candidate_mobile_notification_preferences for all to service_role using (true) with check (true);
