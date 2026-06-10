insert into public.finance_plan_catalog
(plan_code, plan_name, description, amount_cents, currency, managed_application_count, accommodation_route_count, cv_versions, motivation_letters, doctrine_notes)
values
('FREE_DESTINY_MAP_R0','Free Destiny Map','All-sector preview only. Exact targets, application links, and manual route plans stay sealed until package activation.',0,'ZAR',0,0,0,0,'Free route preview only; no managed applications.'),
('CV_REVAMP_R49_99','CV Revamp','15 personalised truthful CV versions and 15 matching motivation letters. Never invent fake experience, qualifications, references, certificates, skills, or results.',4999,'ZAR',0,0,15,15,'Truthful South African ATS-ready CV and motivation letter service.'),
('ACCOMMODATION_SUPPORT_R179','Accommodation Support Package','Standalone support for up to 8 accommodation applications/routes. Paid Kingsmen packages also include up to 8 ACC-01 accommodation routes.',17900,'ZAR',8,8,0,0,'Accommodation route support; evidence-backed route readiness.')
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