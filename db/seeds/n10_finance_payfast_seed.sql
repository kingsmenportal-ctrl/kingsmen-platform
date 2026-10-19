insert into public.finance_plan_catalog
(plan_code, plan_name, description, amount_cents, currency, managed_application_count, accommodation_route_count, cv_versions, motivation_letters, doctrine_notes)
values
('FREE_DESTINY_MAP_R0','Free Destiny Map','All-sector preview only. Exact targets, application links, and manual route plans stay sealed until package activation.',0,'ZAR',0,0,0,0,'Free route preview only; no managed applications.'),
('CV_REVAMP_R49_99','CV Revamp','15 personalised truthful CV versions and 15 matching motivation letters. Never invent fake experience, qualifications, references, certificates, skills, or results.',4999,'ZAR',0,0,15,15,'Truthful South African ATS-ready CV and motivation letter service.')
on conflict (plan_code) do update set
  plan_name = excluded.plan_name,
  description = excluded.description,
  amount_cents = excluded.amount_cents,
  currency = excluded.currency,
  managed_application_count = excluded.managed_application_count,
  accommodation_route_count = excluded.accommodation_route_count,
  cv_versions = excluded.cv_versions,
  motivation_letters = excluded.motivation_letters,
  doctrine_notes = excluded.doctrine_notes,
  active = true,
  updated_at = now();

-- Deliberately do not seed ACCOMMODATION_SUPPORT_R179 as a sellable plan.
-- The canonical catalogue treats accommodation support as a package privilege where
-- relevant; exact route quantities and any separate paid product require founder approval.
-- If a legacy row already exists, deactivate it explicitly in a reviewed data migration.
update public.finance_plan_catalog
set active = false, updated_at = now()
where plan_code = 'ACCOMMODATION_SUPPORT_R179';