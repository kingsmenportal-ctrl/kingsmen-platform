create table if not exists public.finance_plan_catalog (
  id uuid primary key default gen_random_uuid(),
  plan_code text unique not null,
  plan_name text not null,
  description text not null,
  amount_cents integer not null,
  currency text not null default 'ZAR',
  active boolean not null default true,
  managed_application_count integer not null default 0,
  accommodation_route_count integer not null default 0,
  cv_versions integer not null default 0,
  motivation_letters integer not null default 0,
  doctrine_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text unique not null,
  candidate_ref text not null,
  plan_code text not null references public.finance_plan_catalog(plan_code),
  order_status text not null default 'DRAFT',
  amount_cents integer not null,
  currency text not null default 'ZAR',
  evidence_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_orders_status_chk check (
    order_status in ('DRAFT','PENDING_PAYMENT','PAID','CANCELLED','EXPIRED','REFUNDED','FAILED')
  )
);

create table if not exists public.finance_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_ref text unique not null,
  order_ref text not null references public.finance_orders(order_ref),
  candidate_ref text not null,
  invoice_status text not null default 'OPEN',
  amount_cents integer not null,
  currency text not null default 'ZAR',
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  paid_at timestamptz,
  evidence_ref text,
  created_at timestamptz not null default now(),
  constraint finance_invoices_status_chk check (
    invoice_status in ('OPEN','PAID','VOID','OVERDUE','REFUNDED','FAILED')
  )
);

create table if not exists public.payfast_payment_intents (
  id uuid primary key default gen_random_uuid(),
  intent_ref text unique not null,
  order_ref text not null references public.finance_orders(order_ref),
  invoice_ref text references public.finance_invoices(invoice_ref),
  candidate_ref text not null,
  merchant_reference text unique not null,
  amount_cents integer not null,
  currency text not null default 'ZAR',
  item_name text not null,
  item_description text not null,
  return_url text,
  cancel_url text,
  notify_url text not null,
  payfast_environment text not null default 'sandbox',
  payment_url text not null,
  signed_payload jsonb not null default '{}'::jsonb,
  signature text,
  intent_status text not null default 'CREATED',
  idempotency_key text unique not null,
  evidence_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payfast_environment_chk check (payfast_environment in ('sandbox','live')),
  constraint payfast_intent_status_chk check (
    intent_status in ('CREATED','REDIRECTED','ITN_RECEIVED','PAID','FAILED','CANCELLED','EXPIRED')
  )
);

create table if not exists public.finance_payments (
  id uuid primary key default gen_random_uuid(),
  payment_ref text unique not null,
  order_ref text not null references public.finance_orders(order_ref),
  invoice_ref text references public.finance_invoices(invoice_ref),
  candidate_ref text not null,
  provider text not null default 'PAYFAST',
  provider_payment_id text,
  merchant_reference text not null,
  amount_gross_cents integer not null,
  amount_fee_cents integer not null default 0,
  amount_net_cents integer not null,
  currency text not null default 'ZAR',
  payment_status text not null default 'PENDING',
  verified boolean not null default false,
  verified_at timestamptz,
  evidence_ref text,
  created_at timestamptz not null default now(),
  constraint finance_payments_status_chk check (
    payment_status in ('PENDING','COMPLETE','FAILED','CANCELLED','REFUNDED','DISPUTED')
  )
);

create table if not exists public.payfast_itn_receipts (
  id uuid primary key default gen_random_uuid(),
  itn_ref text unique not null,
  merchant_reference text not null,
  provider_payment_id text,
  payment_status text,
  amount_gross text,
  amount_fee text,
  amount_net text,
  received_payload jsonb not null default '{}'::jsonb,
  canonical_string text,
  received_signature text,
  calculated_signature text,
  signature_valid boolean not null default false,
  ip_valid boolean not null default false,
  amount_valid boolean not null default false,
  duplicate boolean not null default false,
  accepted boolean not null default false,
  rejection_reason text,
  idempotency_key text unique not null,
  evidence_ref text,
  received_at timestamptz not null default now()
);

create table if not exists public.payfast_signature_audit (
  id uuid primary key default gen_random_uuid(),
  audit_ref text unique not null,
  merchant_reference text not null,
  verification_stage text not null,
  signature_valid boolean not null default false,
  canonical_string_hash text,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.finance_refund_requests (
  id uuid primary key default gen_random_uuid(),
  refund_ref text unique not null,
  payment_ref text references public.finance_payments(payment_ref),
  order_ref text references public.finance_orders(order_ref),
  candidate_ref text not null,
  amount_cents integer not null,
  currency text not null default 'ZAR',
  reason text not null,
  refund_status text not null default 'PENDING_REVIEW',
  requested_by text not null,
  reviewed_by_operator_ref text,
  approval_ref text,
  evidence_ref text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  completed_at timestamptz,
  constraint finance_refund_status_chk check (
    refund_status in ('PENDING_REVIEW','APPROVED','REJECTED','PROCESSING','COMPLETED','FAILED','CANCELLED')
  )
);

create table if not exists public.finance_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  ledger_ref text unique not null,
  candidate_ref text,
  order_ref text,
  invoice_ref text,
  payment_ref text,
  refund_ref text,
  entry_type text not null,
  debit_cents integer not null default 0,
  credit_cents integer not null default 0,
  currency text not null default 'ZAR',
  description text not null,
  evidence_ref text,
  created_at timestamptz not null default now(),
  constraint finance_ledger_entries_type_chk check (
    entry_type in ('ORDER_CREATED','INVOICE_ISSUED','PAYMENT_RECEIVED','PAYFAST_FEE','REFUND_REQUESTED','REFUND_APPROVED','REFUND_COMPLETED','ADJUSTMENT','CREDIT_GRANTED')
  )
);

create table if not exists public.payment_evidence_ledger (
  id uuid primary key default gen_random_uuid(),
  evidence_ref text unique not null,
  source_type text not null,
  source_ref text not null,
  candidate_ref text,
  order_ref text,
  payment_ref text,
  event_name text not null,
  event_summary text not null,
  proof_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_finance_orders_candidate on public.finance_orders(candidate_ref, created_at desc);
create index if not exists idx_finance_invoices_candidate on public.finance_invoices(candidate_ref, issued_at desc);
create index if not exists idx_payfast_intents_status on public.payfast_payment_intents(intent_status, created_at desc);
create index if not exists idx_finance_payments_candidate on public.finance_payments(candidate_ref, created_at desc);
create index if not exists idx_itn_receipts_merchant on public.payfast_itn_receipts(merchant_reference, received_at desc);
create index if not exists idx_refund_requests_status on public.finance_refund_requests(refund_status, created_at desc);
create index if not exists idx_finance_ledger_candidate on public.finance_ledger_entries(candidate_ref, created_at desc);
create index if not exists idx_payment_evidence_source on public.payment_evidence_ledger(source_type, source_ref);

alter table public.finance_plan_catalog enable row level security;
alter table public.finance_orders enable row level security;
alter table public.finance_invoices enable row level security;
alter table public.payfast_payment_intents enable row level security;
alter table public.finance_payments enable row level security;
alter table public.payfast_itn_receipts enable row level security;
alter table public.payfast_signature_audit enable row level security;
alter table public.finance_refund_requests enable row level security;
alter table public.finance_ledger_entries enable row level security;
alter table public.payment_evidence_ledger enable row level security;

drop policy if exists finance_plan_catalog_all on public.finance_plan_catalog;
create policy finance_plan_catalog_all on public.finance_plan_catalog for all using (true) with check (true);
drop policy if exists finance_orders_all on public.finance_orders;
create policy finance_orders_all on public.finance_orders for all using (true) with check (true);
drop policy if exists finance_invoices_all on public.finance_invoices;
create policy finance_invoices_all on public.finance_invoices for all using (true) with check (true);
drop policy if exists payfast_payment_intents_all on public.payfast_payment_intents;
create policy payfast_payment_intents_all on public.payfast_payment_intents for all using (true) with check (true);
drop policy if exists finance_payments_all on public.finance_payments;
create policy finance_payments_all on public.finance_payments for all using (true) with check (true);
drop policy if exists payfast_itn_receipts_all on public.payfast_itn_receipts;
create policy payfast_itn_receipts_all on public.payfast_itn_receipts for all using (true) with check (true);
drop policy if exists payfast_signature_audit_all on public.payfast_signature_audit;
create policy payfast_signature_audit_all on public.payfast_signature_audit for all using (true) with check (true);
drop policy if exists finance_refund_requests_all on public.finance_refund_requests;
create policy finance_refund_requests_all on public.finance_refund_requests for all using (true) with check (true);
drop policy if exists finance_ledger_entries_all on public.finance_ledger_entries;
create policy finance_ledger_entries_all on public.finance_ledger_entries for all using (true) with check (true);
drop policy if exists payment_evidence_ledger_all on public.payment_evidence_ledger;
create policy payment_evidence_ledger_all on public.payment_evidence_ledger for all using (true) with check (true);