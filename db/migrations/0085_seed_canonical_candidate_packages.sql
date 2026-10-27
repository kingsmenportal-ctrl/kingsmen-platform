-- Seed the nine canonical finance plans with exact ZAR-cent prices and entitlements.
-- Existing historical orders are preserved; plan rows are upserted in place.
insert into public.finance_plan_catalog
(plan_code, plan_name, description, amount_cents, currency, managed_application_count, accommodation_route_count, cv_versions, motivation_letters, doctrine_notes, active)
values
('FREE_DESTINY_MAP_R0','Free Destiny Map','All-sector preview only; exact targets and route plans remain sealed until activation.',0,'ZAR',0,0,0,0,'Preview only; zero managed applications.',true),
('FOUNDATIONAL_ACCORD_R169_99','Foundational Accord','Academic and opportunity foundation; five managed applications.',16999,'ZAR',5,8,0,0,'Verified routes only; no outcome guarantees.',true),
('COLLEGIATE_ORDINANCE_R299_99','Collegiate Ordinance','Guided academic matching and progression; ten managed applications.',29999,'ZAR',10,8,0,0,'Automated submission only on verified supported routes.',true),
('CHANCELLORS_WRIT_R399_99','Chancellor''s Writ','Strategic academic orchestration; fifteen managed applications.',39999,'ZAR',15,8,0,0,'Suitability estimates are not guarantees.',true),
('REGENCY_MANDATE_R469_99','Regency Mandate','Highest service intensity; fifteen managed applications.',46999,'ZAR',15,8,0,0,'24-hour monitoring is subject to verified live coverage.',true),
('ARTISAN_CHARTER_R149_99','Artisan Charter','Employment, internship, learnership, apprenticeship and artisan routes; five managed career applications.',14999,'ZAR',5,8,0,0,'No guaranteed interview, offer or employment.',true),
('GUILDMASTERS_CHARTER_R199_99','Guildmaster''s Charter','Advanced career positioning; eight managed career applications.',19999,'ZAR',8,8,1,1,'CV and letters must remain truthful.',true),
('CV_REVAMP_R49_99','CV Revamp','Fifteen personalised truthful CV versions and fifteen matching motivation letters.',4999,'ZAR',0,0,15,15,'Never invent candidate experience, qualifications, references, certificates, skills or results; later paid package upgrade adds +2 managed routes once.',true),
('ACCOMMODATION_SUPPORT_R179','Accommodation Support Package','Eight accommodation routes; standalone service.',17900,'ZAR',0,8,0,0,'No rent/deposit handling or accommodation guarantee.',true)
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
  active = excluded.active,
  updated_at = now();
