-- Rejected or unconfirmed callbacks must not consume a provider payment ID.
-- This allows a later legitimate retry after a transient confirmation/network failure.
-- Preserve the unique provider ID invariant for accepted receipts.
begin;

drop index if exists public.uq_payfast_itn_receipts_provider_payment_id;
create unique index uq_payfast_itn_receipts_accepted_provider_payment_id
  on public.payfast_itn_receipts(provider_payment_id)
  where accepted = true and provider_payment_id is not null;

commit;
