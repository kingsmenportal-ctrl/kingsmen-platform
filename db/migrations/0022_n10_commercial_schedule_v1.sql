-- N10 commercial schedule v1.0; schema migration 0022.
-- Reviewed code migration only; do not apply to staging until PR review and approved rollout window.
alter table public.finance_plan_catalog
  add column if not exists service_term_days integer not null default 0,
  add column if not exists acknowledgement_target_business_hours integer not null default 0,
  add column if not exists first_response_target_business_hours integer not null default 0,
  add column if not exists upgrade_bonus_routes_when_cv_revamp_owned integer not null default 0,
  add column if not exists refund_policy_version text not null default 'ZA_CONSUMER_REVIEW_PENDING_PUBLICATION_V1',
  add column if not exists catalogue_version text not null default '1.0',
  add column if not exists service_scope text not null default '',
  add column if not exists response_target_disclaimer text not null default '';

alter table public.finance_plan_catalog
  drop constraint if exists finance_plan_catalog_service_term_days_chk,
  add constraint finance_plan_catalog_service_term_days_chk check (service_term_days >= 0),
  drop constraint if exists finance_plan_catalog_ack_target_chk,
  add constraint finance_plan_catalog_ack_target_chk check (acknowledgement_target_business_hours >= 0),
  drop constraint if exists finance_plan_catalog_response_target_chk,
  add constraint finance_plan_catalog_response_target_chk check (first_response_target_business_hours >= 0),
  drop constraint if exists finance_plan_catalog_upgrade_bonus_chk,
  add constraint finance_plan_catalog_upgrade_bonus_chk check (upgrade_bonus_routes_when_cv_revamp_owned >= 0);

-- Snapshot entitlements on each order so later catalogue edits do not change an existing purchase.
alter table public.finance_orders
  add column if not exists catalogue_version text not null default '1.0',
  add column if not exists service_term_days integer not null default 0,
  add column if not exists managed_application_count integer not null default 0,
  add column if not exists accommodation_route_count integer not null default 0,
  add column if not exists cv_versions integer not null default 0,
  add column if not exists motivation_letters integer not null default 0,
  add column if not exists acknowledgement_target_business_hours integer not null default 0,
  add column if not exists first_response_target_business_hours integer not null default 0,
  add column if not exists upgrade_bonus_routes integer not null default 0,
  add column if not exists refund_policy_version text not null default 'ZA_CONSUMER_REVIEW_PENDING_PUBLICATION_V1',
  add column if not exists service_scope text not null default '',
  add column if not exists entitlement_snapshot jsonb not null default '{}'::jsonb;

alter table public.finance_orders
  drop constraint if exists finance_orders_entitlement_counts_chk,
  add constraint finance_orders_entitlement_counts_chk check (
    service_term_days >= 0 and managed_application_count >= 0 and accommodation_route_count >= 0
    and cv_versions >= 0 and motivation_letters >= 0
    and acknowledgement_target_business_hours >= 0 and first_response_target_business_hours >= 0
    and upgrade_bonus_routes >= 0
  );

comment on column public.finance_plan_catalog.service_term_days is '0 for one-off deliverables; otherwise calendar-day managed-service term.';
comment on column public.finance_plan_catalog.first_response_target_business_hours is 'Business-hour target after complete intake; not an outcome guarantee.';
comment on column public.finance_plan_catalog.refund_policy_version is 'Version of customer-facing refund terms governing a new order.';
comment on column public.finance_orders.entitlement_snapshot is 'Immutable-at-order-time JSON snapshot of approved package entitlements and service terms.';
