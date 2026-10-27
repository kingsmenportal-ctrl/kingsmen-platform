-- Canonical Kingsmen finance catalogue. All amounts are integer ZAR cents.
-- Safe to re-run: preserves historical orders and reactivates the canonical standalone Accommodation Support product.
insert into public.finance_plan_catalog
(plan_code, plan_name, description, amount_cents, currency, managed_application_count, accommodation_route_count, cv_versions, motivation_letters, doctrine_notes, active)
values
('FREE_DESTINY_MAP_R0','Free Destiny Map','All-sector preview only; exact targets and route plans remain sealed until paid package activation.',0,'ZAR',0,0,0,0,'Preview only; zero managed applications.',true),
('FOUNDATIONAL_ACCORD_R169_99','Foundational Accord','Academic and opportunity foundation; five managed applications and up to eight accommodation routes where relevant.',16999,'ZAR',5,8,0,0,'Verified sources only; no outcome guarantees.',true),
('COLLEGIATE_ORDINANCE_R299_99','Collegiate Ordinance','Guided academic matching and progression; ten managed applications and up to eight accommodation routes where relevant.',29999,'ZAR',10,8,0,0,'Automated submissions only on verified supported routes.',true),
('CHANCELLORS_WRIT_R399_99','Chancellor''s Writ','Strategic academic orchestration; fifteen managed applications and up to eight accommodation routes where relevant.',39999,'ZAR',15,8,0,0,'Suitability estimates are not guarantees.',true),
('REGENCY_MANDATE_R469_99','Regency Mandate','Highest service intensity; fifteen managed applications and up to eight accommodation routes where relevant.',46999,'ZAR',15,8,0,0,'24-hour monitoring only subject to verified live coverage.',true),
('ARTISAN_CHARTER_R149_99','Artisan Charter','Employment, internship, learnership, apprenticeship and artisan support; five managed career applications.',14999,'ZAR',5,8,0,0,'No guaranteed interview, offer or employment.',true),
('GUILDMASTERS_CHARTER_R199_99','Guildmaster''s Charter','Advanced career positioning; eight managed career applications.',19999,'ZAR',8,8,1,1,'CV and letters must remain truthful.',true),
('CV_REVAMP_R49_99','CV Revamp','Fifteen truthful personalised CV versions and fifteen matching motivation letters.',4999,'ZAR',0,0,15,15,'Never invent candidate experience, qualifications, references, certificates, skills or results; a later paid package upgrade adds +2 managed routes once.',true),
('ACCOMMODATION_SUPPORT_R179','Accommodation Support Package','Eight accommodation routes; standalone service.',17900,'ZAR',0,8,0,0,'No rent/deposit handling or accommodation guarantee.',true)
on conflict (plan_code) do update set
  plan_name=excluded.plan_name,
  description=excluded.description,
  amount_cents=excluded.amount_cents,
  currency=excluded.currency,
  managed_application_count=excluded.managed_application_count,
  accommodation_route_count=excluded.accommodation_route_count,
  cv_versions=excluded.cv_versions,
  motivation_letters=excluded.motivation_letters,
  doctrine_notes=excluded.doctrine_notes,
  active=true,
  updated_at=now();

update public.finance_plan_catalog
set service_scope = case plan_code
  when 'FREE_DESTINY_MAP_R0' then 'All-sector preview only; exact targets remain sealed; zero managed applications.'
  when 'FOUNDATIONAL_ACCORD_R169_99' then 'Academic/opportunity profile review; readiness checklist; source/deadline/fee awareness; CAO/NSFAS/TVET/SETA support where relevant; five managed applications; proof tracking; MAP/Phoenix fallback.'
  when 'COLLEGIATE_ORDINANCE_R299_99' then 'Ten managed applications; structured programme matching; document readiness; motivation-letter support; deadline-aware alternatives; priority queue where configured.'
  when 'CHANCELLORS_WRIT_R399_99' then 'Fifteen managed applications; advanced evidence-backed matching; application sequencing; priority handling; consent-based document reuse; fallback planning.'
  when 'REGENCY_MANDATE_R469_99' then 'Fifteen managed applications; highest configured queue intensity; recovery strategy; live monitoring and escalation unavailable until verified operational coverage is enabled.'
  when 'ARTISAN_CHARTER_R149_99' then 'Five managed career applications; role matching; truthful CV/letter preparation; employment, internship, learnership, apprenticeship and artisan routes.'
  when 'GUILDMASTERS_CHARTER_R199_99' then 'Eight managed career applications; advanced role matching; truthful ATS-aware CV and letters; interview preparation; skills-gap analysis.'
  when 'CV_REVAMP_R49_99' then 'Fifteen personalised truthful CV versions and fifteen matching motivation letters; no managed applications; approved +2 managed-route upgrade credit is applied by later eligible core-package checkout.'
  when 'ACCOMMODATION_SUPPORT_R179' then 'Eight accommodation routes; source checks where verifiable; scam/deposit warnings; consent-controlled sharing; safety notes and proof tracking where available; no rent/deposit handling.'
  else service_scope end,
  catalogue_version = '2026-10-27',
  response_target_disclaimer = 'Availability depends on verified sources, eligibility, consent, provider rules and a deployed workflow. No guaranteed admission, funding, employment, accommodation, interview, provider response or outcome.',
  upgrade_bonus_routes_when_cv_revamp_owned = case
    when plan_code in ('FREE_DESTINY_MAP_R0','CV_REVAMP_R49_99','ACCOMMODATION_SUPPORT_R179') then 0
    else 2 end,
  updated_at = now()
where plan_code in (
  'FREE_DESTINY_MAP_R0','FOUNDATIONAL_ACCORD_R169_99','COLLEGIATE_ORDINANCE_R299_99',
  'CHANCELLORS_WRIT_R399_99','REGENCY_MANDATE_R469_99','ARTISAN_CHARTER_R149_99',
  'GUILDMASTERS_CHARTER_R199_99','CV_REVAMP_R49_99','ACCOMMODATION_SUPPORT_R179'
);
