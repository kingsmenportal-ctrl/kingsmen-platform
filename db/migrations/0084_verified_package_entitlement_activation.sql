-- N10/N12: canonical package activation is transactionally gated by accepted PayFast ITN evidence.
-- Apply only through the reviewed staging migration gate. Client roles receive no direct finance-table access.
create table if not exists public.candidate_package_entitlements (
  id uuid primary key default gen_random_uuid(),
  candidate_ref text not null,
  package_code text not null references public.finance_plan_catalog(plan_code),
  order_ref text not null unique references public.finance_orders(order_ref),
  payment_ref text not null unique references public.finance_payments(payment_ref),
  managed_application_count integer not null check (managed_application_count >= 0),
  accommodation_route_count integer not null check (accommodation_route_count >= 0),
  cv_versions integer not null check (cv_versions >= 0),
  motivation_letters integer not null check (motivation_letters >= 0),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPENDED','REVOKED')),
  activated_at timestamptz not null default now(),
  evidence_ref text not null,
  created_at timestamptz not null default now()
);
create index if not exists candidate_package_entitlements_candidate_idx
  on public.candidate_package_entitlements(candidate_ref, status, activated_at desc);
alter table public.candidate_package_entitlements enable row level security;
revoke all on public.candidate_package_entitlements from anon, authenticated;
grant select, insert, update on public.candidate_package_entitlements to service_role;

-- Remove the broad allow-all finance policies introduced by the legacy finance migration.
drop policy if exists finance_plan_catalog_all on public.finance_plan_catalog;
drop policy if exists finance_orders_all on public.finance_orders;
drop policy if exists finance_invoices_all on public.finance_invoices;
drop policy if exists payfast_payment_intents_all on public.payfast_payment_intents;
drop policy if exists finance_payments_all on public.finance_payments;
drop policy if exists payfast_itn_receipts_all on public.payfast_itn_receipts;
drop policy if exists payfast_signature_audit_all on public.payfast_signature_audit;
drop policy if exists finance_refund_requests_all on public.finance_refund_requests;
drop policy if exists finance_ledger_entries_all on public.finance_ledger_entries;
drop policy if exists payment_evidence_ledger_all on public.payment_evidence_ledger;
revoke all on public.finance_plan_catalog, public.finance_orders, public.finance_invoices,
  public.payfast_payment_intents, public.finance_payments, public.payfast_itn_receipts,
  public.payfast_signature_audit, public.finance_refund_requests, public.finance_ledger_entries,
  public.payment_evidence_ledger from anon, authenticated;
grant select on public.finance_plan_catalog to anon, authenticated;
grant all on public.finance_plan_catalog, public.finance_orders, public.finance_invoices,
  public.payfast_payment_intents, public.finance_payments, public.payfast_itn_receipts,
  public.payfast_signature_audit, public.finance_refund_requests, public.finance_ledger_entries,
  public.payment_evidence_ledger to service_role;

create or replace function public.activate_verified_candidate_package_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.finance_orders%rowtype;
  v_plan public.finance_plan_catalog%rowtype;
  v_receipt public.payfast_itn_receipts%rowtype;
begin
  if new.provider <> 'PAYFAST' or new.payment_status <> 'COMPLETE' or new.verified is not true then
    return new;
  end if;
  if new.evidence_ref is null or new.merchant_reference is null then
    raise exception 'PAYMENT_EVIDENCE_REQUIRED';
  end if;

  select * into v_order from public.finance_orders
   where order_ref = new.order_ref for update;
  if not found then raise exception 'FINANCE_ORDER_NOT_FOUND'; end if;

  select * into v_plan from public.finance_plan_catalog
   where plan_code = v_order.plan_code and active = true;
  if not found then raise exception 'CANONICAL_PACKAGE_INACTIVE_OR_UNKNOWN'; end if;

  if new.candidate_ref <> v_order.candidate_ref
     or new.amount_gross_cents <> v_order.amount_cents
     or v_plan.amount_cents <> v_order.amount_cents
     or new.merchant_reference <> v_order.order_ref then
    raise exception 'PAYMENT_ORDER_AMOUNT_OR_CANDIDATE_MISMATCH';
  end if;

  select * into v_receipt from public.payfast_itn_receipts
   where merchant_reference = v_order.order_ref
     and accepted is true and signature_valid is true
     and ip_valid is true and amount_valid is true
     and duplicate is false
     and amount_gross = to_char(v_order.amount_cents::numeric / 100, 'FM999999990.00')
   order by received_at desc limit 1;
  if not found then raise exception 'ACCEPTED_PAYFAST_ITN_EVIDENCE_REQUIRED'; end if;

  update public.finance_orders set order_status = 'PAID',
    evidence_ref = new.evidence_ref, updated_at = now()
   where order_ref = v_order.order_ref;
  update public.finance_invoices set invoice_status = 'PAID',
    paid_at = coalesce(paid_at, now()), evidence_ref = new.evidence_ref
   where order_ref = v_order.order_ref and candidate_ref = v_order.candidate_ref;

  insert into public.candidate_package_entitlements
    (candidate_ref, package_code, order_ref, payment_ref, managed_application_count,
     accommodation_route_count, cv_versions, motivation_letters, evidence_ref)
  values
    (v_order.candidate_ref, v_order.plan_code, v_order.order_ref, new.payment_ref,
     v_plan.managed_application_count, v_plan.accommodation_route_count,
     v_plan.cv_versions, v_plan.motivation_letters, new.evidence_ref)
  on conflict (order_ref) do nothing;

  return new;
end;
$$;

drop trigger if exists finance_payment_activate_package_entitlement on public.finance_payments;
create trigger finance_payment_activate_package_entitlement
after insert or update of payment_status, verified, evidence_ref on public.finance_payments
for each row execute function public.activate_verified_candidate_package_entitlement();

revoke all on function public.activate_verified_candidate_package_entitlement() from public, anon, authenticated;
grant execute on function public.activate_verified_candidate_package_entitlement() to service_role;
