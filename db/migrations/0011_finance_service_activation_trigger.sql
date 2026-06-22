create or replace function public.kingsmen_activate_service_entitlement_from_payment()
returns trigger
language plpgsql
security definer
as $$
declare
  v_order public.finance_orders%rowtype;
  v_plan public.finance_plan_catalog%rowtype;
  v_entitlement_ref text;
  v_activation_ref text;
begin
  if new.provider <> 'PAYFAST' or new.payment_status <> 'COMPLETE' or new.verified is not true then
    return new;
  end if;

  select * into v_order
  from public.finance_orders
  where order_ref = new.order_ref
  limit 1;

  if not found then
    raise exception 'Cannot activate Kingsmen service entitlement because finance order % was not found.', new.order_ref;
  end if;

  select * into v_plan
  from public.finance_plan_catalog
  where plan_code = v_order.plan_code and active is true
  limit 1;

  if not found then
    raise exception 'Cannot activate Kingsmen service entitlement because active plan % was not found.', v_order.plan_code;
  end if;

  v_entitlement_ref := 'ent_' || substr(md5(new.order_ref || ':' || v_order.plan_code), 1, 24);
  v_activation_ref := 'act_' || substr(md5(new.payment_ref || ':' || coalesce(new.evidence_ref, 'no_evidence')), 1, 24);

  insert into public.finance_service_entitlements (
    entitlement_ref,
    candidate_ref,
    order_ref,
    invoice_ref,
    payment_ref,
    plan_code,
    entitlement_status,
    managed_application_limit,
    accommodation_route_limit,
    cv_versions_limit,
    motivation_letters_limit,
    evidence_ref
  ) values (
    v_entitlement_ref,
    new.candidate_ref,
    new.order_ref,
    new.invoice_ref,
    new.payment_ref,
    v_order.plan_code,
    'ACTIVE',
    v_plan.managed_application_count,
    v_plan.accommodation_route_count,
    v_plan.cv_versions,
    v_plan.motivation_letters,
    coalesce(new.evidence_ref, v_activation_ref)
  )
  on conflict (order_ref) do update set
    payment_ref = excluded.payment_ref,
    entitlement_status = 'ACTIVE',
    managed_application_limit = excluded.managed_application_limit,
    accommodation_route_limit = excluded.accommodation_route_limit,
    cv_versions_limit = excluded.cv_versions_limit,
    motivation_letters_limit = excluded.motivation_letters_limit,
    evidence_ref = excluded.evidence_ref,
    updated_at = now();

  insert into public.finance_service_activation_events (
    activation_ref,
    entitlement_ref,
    candidate_ref,
    order_ref,
    payment_ref,
    plan_code,
    event_name,
    event_summary,
    evidence_ref
  ) values (
    v_activation_ref,
    v_entitlement_ref,
    new.candidate_ref,
    new.order_ref,
    new.payment_ref,
    v_order.plan_code,
    'service.entitlement.activated',
    'Kingsmen service entitlement opened after verified PayFast payment evidence reached finance truth.',
    coalesce(new.evidence_ref, v_activation_ref)
  )
  on conflict (activation_ref) do nothing;

  update public.candidates
  set active_package_code = v_order.plan_code,
      updated_at = now()
  where public_ref = new.candidate_ref;

  return new;
end;
$$;

drop trigger if exists trg_kingsmen_activate_service_entitlement_from_payment on public.finance_payments;
create trigger trg_kingsmen_activate_service_entitlement_from_payment
after insert or update of payment_status, verified, evidence_ref on public.finance_payments
for each row
when (new.provider = 'PAYFAST' and new.payment_status = 'COMPLETE' and new.verified is true)
execute function public.kingsmen_activate_service_entitlement_from_payment();
