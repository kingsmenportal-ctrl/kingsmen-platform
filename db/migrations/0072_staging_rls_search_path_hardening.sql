-- Staging security-advisor remediation for finance and append-only trigger functions.
-- These tables remain backend-only: this migration adds SELECT policies for service_role only.
-- It does not grant anon/authenticated access or broaden write privileges.

begin;

drop policy if exists candidate_payment_events_service_role_read on public.candidate_payment_events;
create policy candidate_payment_events_service_role_read
  on public.candidate_payment_events
  for select to service_role
  using (true);

drop policy if exists candidate_refund_requests_service_role_read on public.candidate_refund_requests;
create policy candidate_refund_requests_service_role_read
  on public.candidate_refund_requests
  for select to service_role
  using (true);

drop policy if exists candidate_service_orders_service_role_read on public.candidate_service_orders;
create policy candidate_service_orders_service_role_read
  on public.candidate_service_orders
  for select to service_role
  using (true);

drop policy if exists finance_audit_events_service_role_read on public.finance_audit_events;
create policy finance_audit_events_service_role_read
  on public.finance_audit_events
  for select to service_role
  using (true);

drop policy if exists service_packages_service_role_read on public.service_packages;
create policy service_packages_service_role_read
  on public.service_packages
  for select to service_role
  using (true);

-- Trigger functions below use only NEW/OLD records and raise exceptions; no
-- application objects need resolution through a mutable schema search path.
alter function public.prevent_candidate_application_event_mutation() set search_path = '';
alter function public.prevent_candidate_outcome_ledger_mutation() set search_path = '';
alter function public.guard_candidate_outcome_identity() set search_path = '';
alter function public.guard_n09_communication_state() set search_path = '';
alter function public.prevent_n09_ledger_delete() set search_path = '';
alter function public.n10_prevent_finance_audit_mutation() set search_path = '';

commit;
