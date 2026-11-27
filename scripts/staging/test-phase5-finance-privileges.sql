do $test$
declare
  table_name text;
  privilege text;
  names text[] := array[
    'finance_plan_catalog',
    'finance_orders',
    'finance_invoices',
    'payfast_payment_intents',
    'finance_payments',
    'payfast_itn_receipts',
    'payfast_signature_audit',
    'finance_refund_requests',
    'finance_ledger_entries',
    'finance_audit_events',
    'candidate_communication_preferences',
    'candidate_communications',
    'candidate_communication_attempts',
    'candidate_messages',
    'candidate_mobile_notification_preferences'
  ];
  privileges text[] := array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'];
begin
  foreach table_name in array names loop
    foreach privilege in array privileges loop
      if has_table_privilege('anon', format('public.%I', table_name), privilege) then
        raise exception 'anon retains % on %', privilege, table_name;
      end if;
      if has_table_privilege('authenticated', format('public.%I', table_name), privilege) then
        raise exception 'authenticated retains % on %', privilege, table_name;
      end if;
    end loop;
    if not has_table_privilege('service_role', format('public.%I', table_name), 'SELECT')
       or not has_table_privilege('service_role', format('public.%I', table_name), 'INSERT')
       or not has_table_privilege('service_role', format('public.%I', table_name), 'UPDATE')
       or not has_table_privilege('service_role', format('public.%I', table_name), 'DELETE') then
      raise exception 'service_role server workflow privileges unexpectedly removed from %', table_name;
    end if;
    if not (select relrowsecurity from pg_class where oid = to_regclass(format('public.%I',table_name))) then
      raise exception 'RLS disabled on %', table_name;
    end if;
    if not exists (
      select 1 from pg_policies p
      where p.schemaname='public' and p.tablename=table_name and p.roles @> array['service_role']::name[]
    ) then
      raise exception 'service_role RLS policy missing on %', table_name;
    end if;
  end loop;
end
$test$;
select 'PASS: Phase 5 finance and communications tables deny direct anon/authenticated privileges while preserving service_role workflow access.' as result;
