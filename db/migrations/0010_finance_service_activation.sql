create table if not exists public.finance_service_entitlements (
  id uuid primary key default gen_random_uuid(),
  entitlement_ref text unique not null,
  candidate_ref text not null,
  order_ref text unique not null references public.finance_orders(order_ref),
  invoice_ref text references public.finance_invoices(invoice_ref),
  payment_ref text references public.finance_payments(payment_ref),
  plan_code text not null references public.finance_plan_catalog(plan_code),
  entitlement_status text not null default 'ACTIVE',
  managed_application_limit integer not null default 0,
  accommodation_route_limit integer not null default 0,
  cv_versions_limit integer not null default 0,
  motivation_letters_limit integer not null default 0,
  activated_at timestamptz not null default now(),
  expires_at timestamptz,
  evidence_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_service_entitlements_status_chk check (
    entitlement_status in ('ACTIVE','SUSPENDED','EXPIRED','REFUNDED','REVOKED')
  )
);

create table if not exists public.finance_service_activation_events (
  id uuid primary key default gen_random_uuid(),
  activation_ref text unique not null,
  entitlement_ref text not null references public.finance_service_entitlements(entitlement_ref),
  candidate_ref text not null,
  order_ref text not null references public.finance_orders(order_ref),
  payment_ref text references public.finance_payments(payment_ref),
  plan_code text not null references public.finance_plan_catalog(plan_code),
  event_name text not null,
  event_summary text not null,
  evidence_ref text not null,
  created_at timestamptz not null default now(),
  constraint finance_service_activation_event_name_chk check (
    event_name in ('service.entitlement.activated','service.entitlement.replay_ignored','service.entitlement.revoked','service.entitlement.refund_suspended')
  )
);

create index if not exists idx_finance_entitlements_candidate on public.finance_service_entitlements(candidate_ref, entitlement_status, created_at desc);
create index if not exists idx_finance_entitlements_plan on public.finance_service_entitlements(plan_code, entitlement_status, created_at desc);
create index if not exists idx_finance_activation_events_candidate on public.finance_service_activation_events(candidate_ref, created_at desc);
create index if not exists idx_finance_activation_events_order on public.finance_service_activation_events(order_ref, created_at desc);

alter table public.finance_service_entitlements enable row level security;
alter table public.finance_service_activation_events enable row level security;

drop policy if exists finance_service_entitlements_all on public.finance_service_entitlements;
create policy finance_service_entitlements_all on public.finance_service_entitlements for all using (true) with check (true);

drop policy if exists finance_service_activation_events_all on public.finance_service_activation_events;
create policy finance_service_activation_events_all on public.finance_service_activation_events for all using (true) with check (true);
