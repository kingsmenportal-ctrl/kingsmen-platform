-- Draft only: atomic PayFast payment persistence and ledger.
-- Do not apply until backup/restore verification and schema review are complete.
begin;
alter table public.invoices add column if not exists payment_reference text;
update public.invoices set payment_reference = 'INV-' || upper(replace(gen_random_uuid()::text, '-', '')) where payment_reference is null;
alter table public.invoices alter column payment_reference set default ('INV-' || upper(replace(gen_random_uuid()::text, '-', ''))), alter column payment_reference set not null;
create unique index if not exists invoices_payment_reference_uidx on public.invoices(payment_reference);
alter table public.payments add column if not exists event_fingerprint text;
create unique index if not exists payments_payfast_provider_payment_uidx on public.payments(provider, provider_payment_id) where provider='payfast' and provider_payment_id is not null;
create unique index if not exists payments_payfast_event_fingerprint_uidx on public.payments(provider, event_fingerprint) where provider='payfast' and event_fingerprint is not null;
create table if not exists public.finance_ledger_entries (
 id uuid primary key default gen_random_uuid(),
 payment_id uuid not null references public.payments(id) on delete restrict,
 invoice_id uuid not null references public.invoices(id) on delete restrict,
 entry_role text not null check (entry_role in ('cash_clearing_debit','accounts_receivable_credit')),
 account_code text not null check (account_code in ('PAYFAST_CLEARING','ACCOUNTS_RECEIVABLE')),
 debit_cents bigint not null default 0 check (debit_cents >= 0),
 credit_cents bigint not null default 0 check (credit_cents >= 0),
 currency text not null default 'ZAR' check (currency='ZAR'),
 created_at timestamptz not null default now(),
 check ((debit_cents > 0 and credit_cents=0) or (credit_cents > 0 and debit_cents=0)),
 unique(payment_id, entry_role)
);
alter table public.finance_ledger_entries enable row level security;
revoke all on public.finance_ledger_entries from public, anon, authenticated;
grant select on public.finance_ledger_entries to authenticated;
drop policy if exists finance_ledger_founder_read on public.finance_ledger_entries;
create policy finance_ledger_founder_read on public.finance_ledger_entries for select to authenticated using (kingsmen_security.is_kingsmen_founder());
create or replace function public.payfast_expected_payment(p_payment_reference text)
returns table(invoice_id uuid, payment_reference text, amount_cents integer, currency text, invoice_status text)
language plpgsql security definer set search_path=''
as $$
begin
 if p_payment_reference is null or length(p_payment_reference)>128 then raise exception 'invalid payment reference' using errcode='22023'; end if;
 return query select i.id,i.payment_reference,i.amount_cents,i.currency,i.status from public.invoices i where i.payment_reference=p_payment_reference;
end $$;
revoke all on function public.payfast_expected_payment(text) from public, anon, authenticated;
grant execute on function public.payfast_expected_payment(text) to service_role;
create or replace function public.commit_verified_payfast_payment(
 p_invoice_id uuid, p_payment_reference text, p_provider_payment_id text,
 p_amount_cents integer, p_currency text, p_event_fingerprint text
)
returns table(outcome text,payment_id uuid,invoice_status text)
language plpgsql security definer set search_path=''
as $$
declare v_invoice public.invoices%rowtype; v_payment public.payments%rowtype; v_existing public.payments%rowtype;
begin
 if p_invoice_id is null or p_payment_reference is null or p_provider_payment_id !~ '^[0-9]{1,30}$'
 or p_amount_cents is null or p_amount_cents<=0 or p_currency<>'ZAR'
 or p_event_fingerprint !~ '^[0-9a-f]{64}$' then raise exception 'invalid verified payment input' using errcode='22023'; end if;
 select * into v_invoice from public.invoices where id=p_invoice_id and payment_reference=p_payment_reference for update;
 if not found then raise exception 'invoice/reference mismatch' using errcode='P0002'; end if;
 select * into v_existing from public.payments where provider='payfast' and
 (provider_payment_id=p_provider_payment_id or event_fingerprint=p_event_fingerprint) limit 1 for update;
 if found then
  if v_existing.invoice_id<>v_invoice.id or v_existing.amount_cents<>p_amount_cents
   or v_existing.provider_payment_id<>p_provider_payment_id or v_existing.event_fingerprint<>p_event_fingerprint
   or v_existing.status<>'verified' then raise exception 'conflicting duplicate payment event' using errcode='23505'; end if;
  return query select 'duplicate'::text,v_existing.id,v_invoice.status; return;
 end if;
 if v_invoice.status<>'issued' then raise exception 'invoice is not payable' using errcode='55000'; end if;
 if v_invoice.currency<>p_currency or v_invoice.amount_cents<>p_amount_cents then raise exception 'payment amount/currency mismatch' using errcode='22023'; end if;
 if exists(select 1 from public.payments p where p.invoice_id=v_invoice.id and p.status='verified') then raise exception 'invoice already has verified payment' using errcode='23505'; end if;
 insert into public.payments(invoice_id,provider,provider_payment_id,amount_cents,status,verified_at,event_fingerprint)
 values(v_invoice.id,'payfast',p_provider_payment_id,p_amount_cents,'verified',now(),p_event_fingerprint) returning * into v_payment;
 insert into public.finance_ledger_entries(payment_id,invoice_id,entry_role,account_code,debit_cents,credit_cents)
 values (v_payment.id,v_invoice.id,'cash_clearing_debit','PAYFAST_CLEARING',p_amount_cents,0),
        (v_payment.id,v_invoice.id,'accounts_receivable_credit','ACCOUNTS_RECEIVABLE',0,p_amount_cents);
 update public.invoices set status='paid',paid_at=now() where id=v_invoice.id and status='issued';
 return query select 'recorded'::text,v_payment.id,'paid'::text;
end $$;
revoke all on function public.commit_verified_payfast_payment(uuid,text,text,integer,text,text) from public, anon, authenticated;
grant execute on function public.commit_verified_payfast_payment(uuid,text,text,integer,text,text) to service_role;
commit;
