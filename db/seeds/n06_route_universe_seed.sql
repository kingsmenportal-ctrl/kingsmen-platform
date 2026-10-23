-- N06 seed - verified route universe source anchors.
-- These are source anchors, not a claim that the whole programme universe is complete.

INSERT INTO system_runtime_config (key, value, description)
VALUES
  ('ROUTE_UNIVERSE_ENABLED', '{"value": true}'::jsonb, 'Route Universe is enabled.'),
  ('APPLICATION_WORKBENCH_ENABLED', '{"value": true}'::jsonb, 'Application Workbench is enabled.'),
  ('CAO_CHILD_CHOICES_MAX', '{"value": 6}'::jsonb, 'CAO is one Kingsmen application with up to six CAO choices based on CAO portal rule.'),
  ('NSFAS_SUPPORT_IS_NOT_APPROVAL_GUARANTEE', '{"value": true}'::jsonb, 'NSFAS support does not guarantee funding approval.'),
  ('MAP_FALLBACK_FOR_BLOCKED_PORTALS', '{"value": true}'::jsonb, 'OTP/CAPTCHA/down/manual-only portals use Manual Application Package fallback.'),
  ('PRIVATE_PROVIDER_ACCREDITATION_CHECK_REQUIRED', '{"value": true}'::jsonb, 'Private colleges require accreditation verification before safe routing.')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO route_categories (category_code, category_name, description, enabled, requires_source_verification)
VALUES
  ('UNIVERSITY', 'Universities', 'Public university routes and direct institutional application routes.', true, true),
  ('TVET', 'TVET Colleges', 'Public TVET and vocational education routes.', true, true),
  ('SETA', 'SETA / Skills', 'Sector education, learnership, apprenticeship, and skills routes.', true, true),
  ('LEARNERSHIP', 'Learnerships', 'Learnership routes from SETAs, employers, and providers.', true, true),
  ('BURSARY', 'Bursaries', 'Funding and bursary opportunities.', true, true),
  ('ACCOMMODATION', 'Accommodation', 'Student accommodation support routes.', true, true),
  ('EMPLOYER', 'Employment / Internships', 'Employer, internship, and job routes.', true, true),
  ('PRIVATE_COLLEGE', 'Private Colleges', 'Private provider routes requiring accreditation verification.', true, true),
  ('NSFAS', 'NSFAS Support', 'NSFAS application, document, status, and appeal support.', true, true),
  ('CAO', 'CAO Routes', 'CAO application route with child choices.', true, true)
ON CONFLICT (category_code) DO UPDATE SET
  category_name = EXCLUDED.category_name,
  description = EXCLUDED.description,
  enabled = EXCLUDED.enabled,
  requires_source_verification = EXCLUDED.requires_source_verification,
  updated_at = now();

INSERT INTO source_authorities (
  source_key,
  source_name,
  source_type,
  base_url,
  default_confidence_band,
  verification_required,
  verification_notes
)
VALUES
  ('govza_education', 'South African Government Education Overview', 'government_overview', 'https://www.gov.za/about-sa/education', 'A', true, 'Official government education overview covering DHET, universities, TVET, SETAs, NSFAS and quality authorities.'),
  ('dhet_universities', 'DHET Universities', 'government_institution_list', 'https://www.dhet.gov.za/SitePages/Universities.aspx', 'A', true, 'Official DHET universities source.'),
  ('cao_official', 'Central Applications Office', 'application_portal', 'https://www.cao.ac.za/', 'A', true, 'Official CAO portal for applications, documents, programme choices, payments and status checks.'),
  ('nsfas_apply', 'NSFAS How to Apply', 'government_funding', 'https://www.nsfas.org.za/content/how-to-apply.html', 'A', true, 'Official NSFAS application, myNSFAS, tracking and supporting document source.'),
  ('saqa_official', 'SAQA', 'qualification_authority', 'https://www.saqa.org.za/', 'A', true, 'Official qualification authority.'),
  ('che_official', 'Council on Higher Education', 'quality_authority', 'https://www.che.ac.za/', 'A', true, 'Official higher education quality council.'),
  ('qcto_official', 'Quality Council for Trades and Occupations', 'quality_authority', 'https://www.qcto.org.za/', 'A', true, 'Official trades and occupational qualifications quality council.')
ON CONFLICT (source_key) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_type = EXCLUDED.source_type,
  base_url = EXCLUDED.base_url,
  default_confidence_band = EXCLUDED.default_confidence_band,
  verification_required = EXCLUDED.verification_required,
  verification_notes = EXCLUDED.verification_notes,
  updated_at = now();

INSERT INTO route_providers (
  provider_key,
  provider_name,
  provider_type,
  province,
  base_url,
  source_authority_id,
  default_confidence_band,
  verification_status,
  public_safe,
  private_provider_requires_accreditation_check,
  notes
)
SELECT
  'cao_official',
  'Central Applications Office',
  'APPLICATION_PORTAL',
  'KwaZulu-Natal',
  'https://www.cao.ac.za/',
  id,
  'A',
  'VERIFIED',
  true,
  false,
  'CAO route: one Kingsmen application with up to six internal CAO choices; fees and deadlines remain source-verified portal rules.'
FROM source_authorities WHERE source_key = 'cao_official'
ON CONFLICT (provider_key) DO UPDATE SET
  provider_name = EXCLUDED.provider_name,
  provider_type = EXCLUDED.provider_type,
  province = EXCLUDED.province,
  base_url = EXCLUDED.base_url,
  source_authority_id = EXCLUDED.source_authority_id,
  default_confidence_band = EXCLUDED.default_confidence_band,
  verification_status = EXCLUDED.verification_status,
  public_safe = EXCLUDED.public_safe,
  private_provider_requires_accreditation_check = EXCLUDED.private_provider_requires_accreditation_check,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO route_providers (
  provider_key,
  provider_name,
  provider_type,
  base_url,
  source_authority_id,
  default_confidence_band,
  verification_status,
  public_safe,
  private_provider_requires_accreditation_check,
  notes
)
SELECT
  'nsfas_official',
  'National Student Financial Aid Scheme',
  'GOVERNMENT_AUTHORITY',
  'https://www.nsfas.org.za/content/how-to-apply.html',
  id,
  'A',
  'VERIFIED',
  true,
  false,
  'NSFAS support route: application support, document support, tracking and appeals; no funding guarantee.'
FROM source_authorities WHERE source_key = 'nsfas_apply'
ON CONFLICT (provider_key) DO UPDATE SET
  provider_name = EXCLUDED.provider_name,
  provider_type = EXCLUDED.provider_type,
  base_url = EXCLUDED.base_url,
  source_authority_id = EXCLUDED.source_authority_id,
  default_confidence_band = EXCLUDED.default_confidence_band,
  verification_status = EXCLUDED.verification_status,
  public_safe = EXCLUDED.public_safe,
  private_provider_requires_accreditation_check = EXCLUDED.private_provider_requires_accreditation_check,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO route_programmes (
  provider_id,
  programme_key,
  programme_name,
  route_type,
  qualification_type,
  application_method,
  source_url,
  source_confidence_band,
  route_status,
  availability_status,
  eligibility_summary
)
SELECT
  id,
  'cao_route_anchor',
  'CAO Application Route Anchor',
  'CAO',
  'MULTI_CHOICE_APPLICATION',
  'CAO',
  'https://www.cao.ac.za/',
  'A',
  'VERIFIED',
  'MANUAL_CHECK_REQUIRED',
  'CAO route anchor. Programme-specific closing dates, fees and requirements must be checked per CAO programme/institution source before candidate-facing execution.'
FROM route_providers WHERE provider_key = 'cao_official'
ON CONFLICT (programme_key) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  programme_name = EXCLUDED.programme_name,
  route_type = EXCLUDED.route_type,
  qualification_type = EXCLUDED.qualification_type,
  application_method = EXCLUDED.application_method,
  source_url = EXCLUDED.source_url,
  source_confidence_band = EXCLUDED.source_confidence_band,
  route_status = EXCLUDED.route_status,
  availability_status = EXCLUDED.availability_status,
  eligibility_summary = EXCLUDED.eligibility_summary,
  updated_at = now();

INSERT INTO route_programmes (
  provider_id,
  programme_key,
  programme_name,
  route_type,
  qualification_type,
  application_method,
  source_url,
  source_confidence_band,
  route_status,
  availability_status,
  eligibility_summary
)
SELECT
  id,
  'nsfas_support_anchor',
  'NSFAS Support Route Anchor',
  'NSFAS',
  'FUNDING_SUPPORT',
  'NSFAS',
  'https://www.nsfas.org.za/content/how-to-apply.html',
  'A',
  'VERIFIED',
  'MANUAL_CHECK_REQUIRED',
  'NSFAS support route for application, document, status tracking and appeal support. Funding decisions remain NSFAS official decisions.'
FROM route_providers WHERE provider_key = 'nsfas_official'
ON CONFLICT (programme_key) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  programme_name = EXCLUDED.programme_name,
  route_type = EXCLUDED.route_type,
  qualification_type = EXCLUDED.qualification_type,
  application_method = EXCLUDED.application_method,
  source_url = EXCLUDED.source_url,
  source_confidence_band = EXCLUDED.source_confidence_band,
  route_status = EXCLUDED.route_status,
  availability_status = EXCLUDED.availability_status,
  eligibility_summary = EXCLUDED.eligibility_summary,
  updated_at = now();

INSERT INTO portal_dna (
  provider_id,
  portal_key,
  portal_name,
  portal_url,
  login_required,
  otp_risk,
  captcha_risk,
  supports_document_upload,
  supports_status_check,
  playwright_allowed,
  manual_map_required,
  notes,
  source_confidence_band
)
SELECT
  id,
  'cao_portal',
  'CAO Portal',
  'https://www.cao.ac.za/',
  true,
  true,
  true,
  true,
  true,
  false,
  true,
  'CAO supports application, documents, status and change-of-mind flows. Automated submission is not allowed by default; use MAP/manual confirmation.',
  'A'
FROM route_providers WHERE provider_key = 'cao_official'
ON CONFLICT (portal_key) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  portal_name = EXCLUDED.portal_name,
  portal_url = EXCLUDED.portal_url,
  login_required = EXCLUDED.login_required,
  otp_risk = EXCLUDED.otp_risk,
  captcha_risk = EXCLUDED.captcha_risk,
  supports_document_upload = EXCLUDED.supports_document_upload,
  supports_status_check = EXCLUDED.supports_status_check,
  playwright_allowed = EXCLUDED.playwright_allowed,
  manual_map_required = EXCLUDED.manual_map_required,
  notes = EXCLUDED.notes,
  source_confidence_band = EXCLUDED.source_confidence_band,
  updated_at = now();

INSERT INTO portal_dna (
  provider_id,
  portal_key,
  portal_name,
  portal_url,
  login_required,
  otp_risk,
  captcha_risk,
  supports_document_upload,
  supports_status_check,
  playwright_allowed,
  manual_map_required,
  notes,
  source_confidence_band
)
SELECT
  id,
  'mynsfas_portal',
  'myNSFAS Portal',
  'https://my.nsfas.org.za/',
  true,
  true,
  true,
  true,
  true,
  false,
  true,
  'myNSFAS requires account login and may use CAPTCHA/identity controls. Use support and manual confirmation boundary.',
  'A'
FROM route_providers WHERE provider_key = 'nsfas_official'
ON CONFLICT (portal_key) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  portal_name = EXCLUDED.portal_name,
  portal_url = EXCLUDED.portal_url,
  login_required = EXCLUDED.login_required,
  otp_risk = EXCLUDED.otp_risk,
  captcha_risk = EXCLUDED.captcha_risk,
  supports_document_upload = EXCLUDED.supports_document_upload,
  supports_status_check = EXCLUDED.supports_status_check,
  playwright_allowed = EXCLUDED.playwright_allowed,
  manual_map_required = EXCLUDED.manual_map_required,
  notes = EXCLUDED.notes,
  source_confidence_band = EXCLUDED.source_confidence_band,
  updated_at = now();

-- Official source discovery expansion (2026-10-22).
-- These are authority/source anchors only. They are NOT programme listings and
-- do not establish availability, deadlines, eligibility, or candidate outcomes.
INSERT INTO source_authorities (
  source_key, source_name, source_type, base_url, default_confidence_band,
  verification_required, verification_notes
)
VALUES
  ('govza_government_jobs', 'South African Government Jobs and Learnerships', 'government_jobs_directory', 'https://www.gov.za/about-government/government-jobs', 'A', true, 'Official government directory for departmental vacancies, learnerships, and youth employment initiatives; verify each advert and deadline at its issuing department.'),
  ('labour_vacancies', 'Department of Employment and Labour Vacancies', 'government_employment', 'https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx', 'A', true, 'Official department vacancy list. A listing is not an application outcome; recheck the advert and closing date before presenting it as open.'),
  ('etdp_seta_official', 'Education Training and Development Practices SETA', 'seta', 'https://www.etdpseta.org.za/', 'A', true, 'Official ETDP SETA source anchor. Programme availability, eligibility, provider accreditation, and closing dates require per-programme verification.'),
  ('services_seta_official', 'Services SETA', 'seta', 'https://www.serviceseta.org.za/', 'A', true, 'Official Services SETA source anchor for skills programmes, learnerships, internships and funding notices; verify each programme separately.'),
  ('merseta_official', 'Manufacturing, Engineering and Related Services SETA', 'seta', 'https://www.merseta.org.za/', 'A', true, 'Official merSETA source anchor. This record does not assert an open learnership or apprenticeship.'),
  ('ewseta_official', 'Energy and Water Sector Education and Training Authority', 'seta', 'https://ewseta.org.za/', 'A', true, 'Official EWSETA source anchor. Verify the individual programme and its live status before candidate-facing publication.'),
  ('agriseta_official', 'Agricultural Sector Education and Training Authority', 'seta', 'https://www.agriseta.co.za/', 'A', true, 'Official AgriSETA source anchor. Do not infer active opportunities from the authority record alone.'),
  ('bankseta_official', 'Banking Sector Education and Training Authority', 'seta', 'https://www.bankseta.org.za/', 'A', true, 'Official BANKSETA source anchor. Programme and deadline evidence must be captured per listing.'),
  ('teta_official', 'Transport Education Training Authority', 'seta', 'https://www.teta.org.za/', 'A', true, 'Official TETA source anchor. No vacancy or training intake is implied by this record.'),
  ('foodbev_seta_official', 'Food and Beverage Manufacturing SETA', 'seta', 'https://www.foodbev.co.za/', 'A', true, 'Official FoodBev SETA source anchor. Confirm individual programme status and deadline at source.'),
  ('fasset_official', 'Finance and Accounting Services SETA', 'seta', 'https://www.fasset.org.za/', 'A', true, 'Official FASSET source anchor. This is not evidence that a learnership or funding window is open.'),
  ('ceta_official', 'Construction Education and Training Authority', 'seta', 'https://www.ceta.org.za/', 'A', true, 'Official CETA source anchor. Verify each provider, programme, eligibility rule and closing date separately.'),
  ('mict_seta_official', 'Media, Information and Communication Technologies SETA', 'seta', 'https://www.mict.org.za/', 'A', true, 'Official MICT SETA source anchor. No active internship or learnership is asserted by this record.'),
  ('dhet_career_advice', 'DHET Career Development Services', 'government_career_guidance', 'https://www.careerhelp.org.za/', 'A', true, 'Career guidance resource referenced by the South African Government. Use for guidance only, not as evidence of a live vacancy or admission opening.')
ON CONFLICT (source_key) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_type = EXCLUDED.source_type,
  base_url = EXCLUDED.base_url,
  default_confidence_band = EXCLUDED.default_confidence_band,
  verification_required = EXCLUDED.verification_required,
  verification_notes = EXCLUDED.verification_notes,
  updated_at = now();
