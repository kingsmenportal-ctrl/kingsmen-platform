-- 0106: add an initial official private-employer careers batch and the DPSA vacancy circular.
-- These records give candidates real, official external destinations for employment discovery
-- and private Kingsmen preparation. They do NOT activate a portal adapter or assert a live job.
BEGIN;

INSERT INTO public.source_authorities (
  source_key, source_name, source_type, base_url, default_confidence_band,
  verification_required, last_verified_at, verification_notes
) VALUES
    ('dpsa_public_service_vacancies', 'Department of Public Service and Administration — Public Service Vacancy Circular', 'government_vacancy_circular', 'https://www.dpsa.gov.za/newsroom/psvc/', 'C', true, NULL, 'Government vacancy discovery only. Applications must be addressed to the department advertising each role, using the prescribed Z83, vacancy reference, CV and supporting documents before its deadline. Kingsmen cannot submit to the department or confirm a receipt.'),
    ('private_employer_pepkor', 'Pepkor Group Careers (PEP, Ackermans and group businesses)', 'employer_career_portal', 'https://pepkor.co.za/careers/', 'C', true, NULL, 'Official group career/vacancy portal. Recheck every role, closing date, hiring brand and required documents. No Kingsmen login, submission, receipt or partnership.'),
    ('private_employer_sasol', 'Sasol Careers', 'employer_career_portal', 'https://www.sasol.com/careers/', 'C', true, NULL, 'Official careers discovery and link to jobs.sasol.com. Recheck each role and route. Sasol warns candidates not to pay for recruitment or share banking data by email. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_woolworths', 'Woolworths South Africa Careers', 'employer_career_portal', 'https://careers.woolworths.co.za/applicant/index.php?controller=Page&name=jobsearch', 'C', true, NULL, 'Official job search and candidate sign-up. Recheck live listing, closing date and role requirements. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_mr_price', 'Mr Price Group Careers', 'employer_career_portal', 'https://mrpricegroup.com/careers/', 'C', true, NULL, 'Official careers overview, retail opportunities and published work-experience/graduate routes. Recheck the current programme or listing. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_vodafone', 'Vodafone / Vodacom Careers', 'employer_career_portal', 'https://careers.vodafone.com/', 'C', true, NULL, 'Official group careers search; verify exact South African country, employing company, location and work-authorisation conditions before a candidate applies. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_pepsico_sa', 'PepsiCo South Africa Careers', 'employer_career_portal', 'https://www.pepsicojobs.com/southafrica/', 'C', true, NULL, 'Official South Africa job search across business areas. Recheck role location, eligibility and closing date. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_nedbank', 'Nedbank Careers', 'employer_career_portal', 'https://jobs.nedbank.co.za/', 'C', true, NULL, 'Official vacancies and candidate profile route. Recheck the precise role, minimum requirements and application process. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_clicks_group', 'Clicks Group Careers', 'employer_career_portal', 'https://careers.clicksgroup.co.za/', 'C', true, NULL, 'Official external job search across retail, pharmacy, logistics and support functions. Recheck the exact brand/employer, professional registration conditions and role deadline. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_tfg', 'TFG Careers', 'employer_career_portal', 'https://tfglimited.co.za/careers/', 'C', true, NULL, 'Official career overview linking to its Oracle candidate job portal, including retail, manufacturing, technology, support and youth workplace routes. Recheck exact listing and employing division. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_standard_bank', 'Standard Bank Group Careers', 'employer_career_portal', 'https://www.standardbank.com/careers/', 'C', true, NULL, 'Official careers and jobs route; applications use the bank''s own candidate profile/SmartRecruiters route. Recheck country, role, requirements and closing date. No Kingsmen submission, receipt or partnership.')
ON CONFLICT (source_key) DO NOTHING;

DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1 FROM (VALUES
      ('dpsa_public_service_vacancies', 'https://www.dpsa.gov.za/newsroom/psvc/'),
      ('private_employer_pepkor', 'https://pepkor.co.za/careers/'),
      ('private_employer_sasol', 'https://www.sasol.com/careers/'),
      ('private_employer_woolworths', 'https://careers.woolworths.co.za/applicant/index.php?controller=Page&name=jobsearch'),
      ('private_employer_mr_price', 'https://mrpricegroup.com/careers/'),
      ('private_employer_vodafone', 'https://careers.vodafone.com/'),
      ('private_employer_pepsico_sa', 'https://www.pepsicojobs.com/southafrica/'),
      ('private_employer_nedbank', 'https://jobs.nedbank.co.za/'),
      ('private_employer_clicks_group', 'https://careers.clicksgroup.co.za/'),
      ('private_employer_tfg', 'https://tfglimited.co.za/careers/'),
      ('private_employer_standard_bank', 'https://www.standardbank.com/careers/')
    ) AS expected(source_key,base_url)
    LEFT JOIN public.source_authorities actual ON actual.source_key=expected.source_key
    WHERE actual.id IS NULL OR actual.base_url IS DISTINCT FROM expected.base_url OR actual.verification_required IS DISTINCT FROM true
  ) THEN
    RAISE EXCEPTION 'EMPLOYER_CAREER_SOURCE_AUTHORITY_MISSING_OR_CONFLICTING';
  END IF;
END
$preflight$;

WITH provider_seed(provider_key,provider_name,provider_type,base_url,source_key,short_name,verification_notes) AS (
  VALUES
    ('dpsa_public_service_vacancies', 'Department of Public Service and Administration — Public Service Vacancy Circular', 'GOVERNMENT_AUTHORITY', 'https://www.dpsa.gov.za/newsroom/psvc/', 'dpsa_public_service_vacancies', 'DPSA vacancy circular', 'Government vacancy discovery only. Applications must be addressed to the department advertising each role, using the prescribed Z83, vacancy reference, CV and supporting documents before its deadline. Kingsmen cannot submit to the department or confirm a receipt.'),
    ('private_employer_pepkor', 'Pepkor Group Careers (PEP, Ackermans and group businesses)', 'EMPLOYER', 'https://pepkor.co.za/careers/', 'private_employer_pepkor', 'Pepkor Group', 'Official group career/vacancy portal. Recheck every role, closing date, hiring brand and required documents. No Kingsmen login, submission, receipt or partnership.'),
    ('private_employer_sasol', 'Sasol Careers', 'EMPLOYER', 'https://www.sasol.com/careers/', 'private_employer_sasol', 'Sasol', 'Official careers discovery and link to jobs.sasol.com. Recheck each role and route. Sasol warns candidates not to pay for recruitment or share banking data by email. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_woolworths', 'Woolworths South Africa Careers', 'EMPLOYER', 'https://careers.woolworths.co.za/applicant/index.php?controller=Page&name=jobsearch', 'private_employer_woolworths', 'Woolworths', 'Official job search and candidate sign-up. Recheck live listing, closing date and role requirements. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_mr_price', 'Mr Price Group Careers', 'EMPLOYER', 'https://mrpricegroup.com/careers/', 'private_employer_mr_price', 'Mr Price Group', 'Official careers overview, retail opportunities and published work-experience/graduate routes. Recheck the current programme or listing. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_vodafone', 'Vodafone / Vodacom Careers', 'EMPLOYER', 'https://careers.vodafone.com/', 'private_employer_vodafone', 'Vodafone / Vodacom', 'Official group careers search; verify exact South African country, employing company, location and work-authorisation conditions before a candidate applies. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_pepsico_sa', 'PepsiCo South Africa Careers', 'EMPLOYER', 'https://www.pepsicojobs.com/southafrica/', 'private_employer_pepsico_sa', 'PepsiCo South Africa', 'Official South Africa job search across business areas. Recheck role location, eligibility and closing date. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_nedbank', 'Nedbank Careers', 'EMPLOYER', 'https://jobs.nedbank.co.za/', 'private_employer_nedbank', 'Nedbank', 'Official vacancies and candidate profile route. Recheck the precise role, minimum requirements and application process. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_clicks_group', 'Clicks Group Careers', 'EMPLOYER', 'https://careers.clicksgroup.co.za/', 'private_employer_clicks_group', 'Clicks Group', 'Official external job search across retail, pharmacy, logistics and support functions. Recheck the exact brand/employer, professional registration conditions and role deadline. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_tfg', 'TFG Careers', 'EMPLOYER', 'https://tfglimited.co.za/careers/', 'private_employer_tfg', 'TFG', 'Official career overview linking to its Oracle candidate job portal, including retail, manufacturing, technology, support and youth workplace routes. Recheck exact listing and employing division. No Kingsmen submission, receipt or partnership.'),
    ('private_employer_standard_bank', 'Standard Bank Group Careers', 'EMPLOYER', 'https://www.standardbank.com/careers/', 'private_employer_standard_bank', 'Standard Bank Group', 'Official careers and jobs route; applications use the bank''s own candidate profile/SmartRecruiters route. Recheck country, role, requirements and closing date. No Kingsmen submission, receipt or partnership.')
),
source_linked AS (
  SELECT p.*, a.id AS source_authority_id
  FROM provider_seed p
  JOIN public.source_authorities a ON a.source_key=p.source_key
)
INSERT INTO public.route_providers (
  provider_key,provider_name,provider_type,province,base_url,source_authority_id,
  default_confidence_band,verification_status,public_safe,
  private_provider_requires_accreditation_check,notes,metadata
)
SELECT
  provider_key,provider_name,provider_type,NULL,base_url,source_authority_id,
  'D','NEEDS_REVIEW',false,false,
  verification_notes,
  jsonb_build_object('directory_seed',jsonb_build_object(
    'source_key',source_key,
    'source_url',base_url,
    'official_external_career_portal',base_url,
    'short_name',short_name,
    'source_snapshot_date','2026-10-31',
    'record_status','NEEDS_REVIEW',
    'source_confidence','D',
    'public_safe',false,
    'provider_identity_status','OFFICIAL_CAREER_SOURCE_LISTED_NEEDS_REVIEW',
    'vacancy_status','UNKNOWN_UNTIL_EXACT_LIVE_NOTICE_CHECK',
    'programme_status','UNKNOWN',
    'intake_status','UNKNOWN',
    'eligibility_status','UNKNOWN',
    'application_route_status','OFFICIAL_EXTERNAL_PORTAL_NOT_CONNECTED',
    'integration_status','NOT_CONNECTED',
    'partnership_status','NOT_A_PARTNER',
    'automation_authorized',false,
    'provider_submission_supported_by_kingsmen',false,
    'provider_receipt_supported',false,
    'evidence_scope','Official career or vacancy discovery page only. Each live advert, employing legal entity, application method, deadline, eligibility and required documents must be checked independently.'
  ))
FROM source_linked
ON CONFLICT (provider_key) DO NOTHING;

DO $postflight$
DECLARE expected_count integer := 11; actual_count integer; bad_count integer;
BEGIN
  SELECT count(*) INTO actual_count FROM public.route_providers WHERE provider_key IN ('dpsa_public_service_vacancies', 'private_employer_pepkor', 'private_employer_sasol', 'private_employer_woolworths', 'private_employer_mr_price', 'private_employer_vodafone', 'private_employer_pepsico_sa', 'private_employer_nedbank', 'private_employer_clicks_group', 'private_employer_tfg', 'private_employer_standard_bank');
  IF actual_count <> expected_count THEN
    RAISE EXCEPTION 'EMPLOYER_CAREER_PROVIDER_COUNT_MISMATCH expected %, got %',expected_count,actual_count;
  END IF;

  SELECT count(*) INTO bad_count
  FROM public.route_providers
  WHERE provider_key IN ('dpsa_public_service_vacancies', 'private_employer_pepkor', 'private_employer_sasol', 'private_employer_woolworths', 'private_employer_mr_price', 'private_employer_vodafone', 'private_employer_pepsico_sa', 'private_employer_nedbank', 'private_employer_clicks_group', 'private_employer_tfg', 'private_employer_standard_bank')
    AND (verification_status IS DISTINCT FROM 'NEEDS_REVIEW'
      OR default_confidence_band IS DISTINCT FROM 'D'
      OR public_safe IS DISTINCT FROM false
      OR base_url IS NULL
      OR base_url !~* '^https://');
  IF bad_count>0 THEN RAISE EXCEPTION 'EMPLOYER_CAREER_PROVIDER_REVIEW_STATE_INVALID %',bad_count; END IF;
END
$postflight$;

COMMIT;
