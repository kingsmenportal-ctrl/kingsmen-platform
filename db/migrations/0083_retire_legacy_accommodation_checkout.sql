-- Kingsmen N10: retire a legacy product that conflicts with the canonical business catalogue.
-- Idempotent; does not delete historical orders or finance evidence.
-- Do not apply to production without the normal release gate and founder approval.
update public.finance_plan_catalog
set active = false,
    description = 'Retired legacy plan. Do not offer for new checkout; preserve historical orders for reconciliation.',
    managed_application_count = 0,
    accommodation_route_count = 0,
    doctrine_notes = 'Legacy-only compatibility record. New checkout prohibited until founder-approved commercial schedule exists.',
    updated_at = now()
where plan_code = 'ACCOMMODATION_SUPPORT_R179';
