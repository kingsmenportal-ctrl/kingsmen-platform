-- Restrict all N10 finance/payment truth tables to the trusted backend role.
-- The prior migration's USING (true) policies exposed writes to every RLS-enabled role.
-- Apply only after reviewing the target environment and confirming the table set exists.

begin;

do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'finance_plan_catalog',
    'finance_orders',
    'finance_invoices',
    'payfast_payment_intents',
    'finance_payments',
    'payfast_itn_receipts',
    'payfast_signature_audit',
    'finance_refund_requests',
    'finance_ledger_entries',
    'payment_evidence_ledger'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      policy_name := table_name || '_all';
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
      policy_name := table_name || '_service_role_only';
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
      execute format(
        'create policy %I on public.%I for all to service_role using (true) with check (true)',
        policy_name,
        table_name
      );
      execute format('revoke all on table public.%I from anon, authenticated', table_name);
      execute format('grant select, insert, update, delete on table public.%I to service_role', table_name);
    end if;
  end loop;
end $$;

commit;
