-- PayFast provider identifiers must be globally unique across orders and ITN receipts.
-- Preflight deliberately fails rather than silently deleting or merging historical records.
do $$
begin
  if exists (
    select 1 from public.finance_payments
    where provider = 'PAYFAST' and provider_payment_id is not null
    group by provider_payment_id having count(*) > 1
  ) then
    raise exception 'Duplicate PayFast provider_payment_id values exist in finance_payments; reconcile them before applying migration 0036.';
  end if;

  if exists (
    select 1 from public.payfast_itn_receipts
    where provider_payment_id is not null
    group by provider_payment_id having count(*) > 1
  ) then
    raise exception 'Duplicate provider_payment_id values exist in payfast_itn_receipts; reconcile them before applying migration 0036.';
  end if;
end $$;

create unique index if not exists uq_finance_payments_payfast_provider_payment_id
  on public.finance_payments(provider_payment_id)
  where provider = 'PAYFAST' and provider_payment_id is not null;

create unique index if not exists uq_payfast_itn_receipts_provider_payment_id
  on public.payfast_itn_receipts(provider_payment_id)
  where provider_payment_id is not null;
