-- O: Invoice/payment metadata only. Does not process payments or verify PayFast callbacks.
begin;
create table if not exists public.invoices (
 id uuid primary key default gen_random_uuid(),
 candidate_id uuid not null references public.candidates(id) on delete restrict,
 amount_cents integer not null check(amount_cents>=0),
 currency text not null default 'ZAR' check(currency='ZAR'),
 status text not null default 'draft' check(status in ('draft','issued','paid','void')),
 idempotency_key text not null unique,
 created_at timestamptz not null default now(),
 issued_at timestamptz,
 paid_at timestamptz
);
create table if not exists public.invoice_line_items (
 id uuid primary key default gen_random_uuid(),
 invoice_id uuid not null references public.invoices(id) on delete restrict,
 description text not null check(length(btrim(description))>0),
 amount_cents integer not null check(amount_cents>=0),
 created_at timestamptz not null default now()
);
create table if not exists public.payments (
 id uuid primary key default gen_random_uuid(),
 invoice_id uuid not null references public.invoices(id) on delete restrict,
 provider text not null check(provider in ('payfast','manual')),
 provider_payment_id text,
 amount_cents integer not null check(amount_cents>=0),
 status text not null check(status in ('pending','verified','failed','refunded','reversed')),
 verified_at timestamptz,
 created_at timestamptz not null default now(),
 unique(provider,provider_payment_id)
);
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.payments enable row level security;
revoke all on table public.invoices,public.invoice_line_items,public.payments from public,anon,authenticated;
grant select on table public.invoices,public.invoice_line_items,public.payments to authenticated;
create policy invoices_candidate_read on public.invoices for select to authenticated
 using(candidate_id=kingsmen_security.current_authenticated_candidate_id() or kingsmen_security.is_kingsmen_founder());
create policy invoice_line_items_owner_read on public.invoice_line_items for select to authenticated
 using(exists(select 1 from public.invoices i where i.id=invoice_id and
 (i.candidate_id=kingsmen_security.current_authenticated_candidate_id() or kingsmen_security.is_kingsmen_founder())));
create policy payments_owner_read on public.payments for select to authenticated
 using(exists(select 1 from public.invoices i where i.id=invoice_id and
 (i.candidate_id=kingsmen_security.current_authenticated_candidate_id() or kingsmen_security.is_kingsmen_founder())));
create or replace view public.invoice_balance_check with (security_invoker=true) as
select i.id invoice_id,i.amount_cents,coalesce(sum(li.amount_cents),0)::bigint line_total,
 i.amount_cents::bigint-coalesce(sum(li.amount_cents),0)::bigint difference_cents
from public.invoices i left join public.invoice_line_items li on li.invoice_id=i.id group by i.id,i.amount_cents;
revoke all on public.invoice_balance_check from public,anon;
grant select on public.invoice_balance_check to authenticated;
commit;
