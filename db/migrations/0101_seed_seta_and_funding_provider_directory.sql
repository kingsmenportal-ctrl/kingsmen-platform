-- 0101: add all 21 DHET-listed SETAs and two national funding providers to the
-- existing canonical provider registry. These are discovery/provider identity rows only.
-- They are deliberately private to the review pipeline until individual identity,
-- programme, grant and application-route evidence has been checked.
BEGIN;

INSERT INTO public.source_authorities (
  source_key, source_name, source_type, base_url, default_confidence_band,
  verification_required, last_verified_at, verification_notes
) VALUES
  ('dhet_seta_directory', 'DHET Sector Education and Training Authorities Directory',
   'government_institution_list', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx',
   'C', true, NULL,
   'DHET SETA directory source anchor. Each SETA record is a source-listed institution only. Recheck the current SETA website, governance/registration status, active grants, current learning programmes and exact application route before publishing any opportunity or provider service.'),
  ('dhet_nsf_official', 'National Skills Fund (NSF)', 'government_funding_programme',
   'https://www.dhet.gov.za/SitePages/NSF.aspx', 'C', true, NULL,
   'Official DHET National Skills Fund information source. This source anchor does not prove an open funding call, individual candidate eligibility, award, payment or Kingsmen submission authority.'),
  ('dbe_funza_lushaka', 'Funza Lushaka Bursary Programme', 'government_funding_programme',
   'https://www.funzalushaka.doe.gov.za/', 'C', true, NULL,
   'Official Funza Lushaka bursary portal source anchor. Recheck current cycle, eligibility and programme-specific conditions. No open bursary window, eligibility, award, payment or Kingsmen submission authority is implied.')
ON CONFLICT (source_key) DO NOTHING;

DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.source_authorities
    WHERE source_key = 'dhet_seta_directory'
      AND base_url = 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'
      AND verification_required = true
  ) THEN
    RAISE EXCEPTION 'DHET_SETA_SOURCE_AUTHORITY_MISSING_OR_CONFLICTING';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.source_authorities
    WHERE source_key = 'dhet_nsf_official'
      AND base_url = 'https://www.dhet.gov.za/SitePages/NSF.aspx'
      AND verification_required = true
  ) THEN
    RAISE EXCEPTION 'DHET_NSF_SOURCE_AUTHORITY_MISSING_OR_CONFLICTING';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.source_authorities
    WHERE source_key = 'dbe_funza_lushaka'
      AND base_url = 'https://www.funzalushaka.doe.gov.za/'
      AND verification_required = true
  ) THEN
    RAISE EXCEPTION 'FUNZA_LUSHAKA_SOURCE_AUTHORITY_MISSING_OR_CONFLICTING';
  END IF;
END
$preflight$;

WITH provider_seed(provider_key, provider_name, provider_type, base_url, source_key, seed_kind, source_url) AS (
  VALUES
    ('seta_agriseta', 'AgriSETA', 'SETA', 'https://www.agriseta.co.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_bankseta', 'BANKSETA', 'SETA', 'https://www.bankseta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_cathsseta', 'CATHSSETA', 'SETA', 'https://www.cathsseta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_ceta', 'Construction Education and Training Authority (CETA)', 'SETA', 'https://www.ceta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_chieta', 'Chemical Industries Education and Training Authority (CHIETA)', 'SETA', 'https://www.chieta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_etdpseta', 'Education, Training and Development Practices SETA', 'SETA', 'https://www.etdpseta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_ewseta', 'Energy and Water Sector Education and Training Authority', 'SETA', 'https://www.eseta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_fasset', 'Financial and Accounting Services SETA (FASSET)', 'SETA', 'https://www.fasset.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_foodbev', 'FoodBev Manufacturing SETA', 'SETA', 'https://www.foodbev.co.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_fpm', 'Fibre Processing and Manufacturing SETA (FP&M)', 'SETA', 'https://www.fpmseta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_hwseta', 'Health and Welfare Sector Education and Training Authority', 'SETA', 'https://www.hwseta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_inseta', 'Insurance Sector Education and Training Authority (INSETA)', 'SETA', 'https://www.inseta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_lgseta', 'Local Government Sector Education and Training Authority (LGSETA)', 'SETA', 'https://lgseta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_merseta', 'Manufacturing, Engineering and Related Services SETA (merSETA)', 'SETA', 'https://www.merseta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_mict', 'Media, Information and Communication Technologies SETA (MICT SETA)', 'SETA', 'https://www.mict.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_mqa', 'Mining Qualifications Authority (MQA)', 'SETA', 'https://www.mqa.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_pseta', 'Public Service Sector Education and Training Authority (PSETA)', 'SETA', 'https://www.pseta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_sasseta', 'Safety and Security Sector Education and Training Authority (SASSETA)', 'SETA', 'https://www.sasseta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_services', 'Services Sector Education and Training Authority (Services SETA)', 'SETA', 'https://www.serviceseta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_teta', 'Transport Education and Training Authority (TETA)', 'SETA', 'https://www.teta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('seta_wrseta', 'Wholesale and Retail SETA (W&RSETA)', 'SETA', 'https://www.wrseta.org.za/', 'dhet_seta_directory', 'SETA', 'https://www.dhet.gov.za/SitePages/SETAlinks.aspx'),
    ('funder_nsf', 'National Skills Fund (NSF)', 'BURSARY_PROVIDER', 'https://www.dhet.gov.za/SitePages/NSF.aspx', 'dhet_nsf_official', 'FUNDING', 'https://www.dhet.gov.za/SitePages/NSF.aspx'),
    ('funder_funza_lushaka', 'Funza Lushaka Bursary Programme', 'BURSARY_PROVIDER', 'https://www.funzalushaka.doe.gov.za/', 'dbe_funza_lushaka', 'FUNDING', 'https://www.funzalushaka.doe.gov.za/')
),
source_linked AS (
  SELECT p.*, s.id AS source_authority_id
  FROM provider_seed p
  JOIN public.source_authorities s ON s.source_key = p.source_key
)
INSERT INTO public.route_providers (
  provider_key, provider_name, provider_type, province, base_url, source_authority_id,
  default_confidence_band, verification_status, public_safe,
  private_provider_requires_accreditation_check, notes, metadata
)
SELECT
  provider_key,
  provider_name,
  provider_type,
  NULL,
  base_url,
  source_authority_id,
  'D',
  'NEEDS_REVIEW',
  false,
  false,
  CASE WHEN seed_kind = 'SETA'
    THEN 'DHET SETA directory entry only. Independently verify SETA current status, current grant/programme notice, learner eligibility, exact application channel and any delivery-provider accreditation. No Kingsmen partnership, connector, intake, deadline or submission is implied.'
    ELSE 'Official funding-provider source entry only. Independently verify current call/application cycle, candidate eligibility, conditions, deadlines and exact portal route. No award, payment, Kingsmen partnership, connector or submission is implied.'
  END,
  jsonb_build_object(
    'directory_seed', jsonb_build_object(
      'source_key', source_key,
      'source_url', source_url,
      'provider_homepage_url', base_url,
      'source_snapshot_date', '2026-10-31',
      'record_status', 'NEEDS_REVIEW',
      'source_confidence', 'D',
      'public_safe', false,
      'provider_identity_status', 'DIRECTORY_LISTED_NEEDS_REVIEW',
      'programme_status', 'UNKNOWN',
      'intake_status', 'UNKNOWN',
      'eligibility_status', 'UNKNOWN',
      'application_route_status', 'NOT_VERIFIED',
      'integration_status', 'NOT_CONNECTED',
      'partnership_status', 'NOT_A_PARTNER',
      'automation_authorized', false,
      'provider_receipt_supported', false,
      'evidence_scope', 'Official directory or official programme portal entry only. No current programme, grant, open intake, eligibility, application route, partnership, connector, submission or outcome is proven.'
    )
  )
FROM source_linked
ON CONFLICT (provider_key) DO NOTHING;

DO $postflight$
DECLARE
  expected_count integer := 23;
  actual_count integer;
  bad_count integer;
BEGIN
  SELECT count(*) INTO actual_count
  FROM public.route_providers
  WHERE provider_key IN ('seta_agriseta', 'seta_bankseta', 'seta_cathsseta', 'seta_ceta', 'seta_chieta', 'seta_etdpseta', 'seta_ewseta', 'seta_fasset', 'seta_foodbev', 'seta_fpm', 'seta_hwseta', 'seta_inseta', 'seta_lgseta', 'seta_merseta', 'seta_mict', 'seta_mqa', 'seta_pseta', 'seta_sasseta', 'seta_services', 'seta_teta', 'seta_wrseta', 'funder_nsf', 'funder_funza_lushaka');
  IF actual_count <> expected_count THEN
    RAISE EXCEPTION 'SETA_FUNDER_PROVIDER_SEED_COUNT_MISMATCH expected %, got %', expected_count, actual_count;
  END IF;

  WITH expected(provider_key, provider_name, provider_type, base_url) AS (
    VALUES
    ('seta_agriseta', 'AgriSETA', 'SETA', 'https://www.agriseta.co.za/'),
    ('seta_bankseta', 'BANKSETA', 'SETA', 'https://www.bankseta.org.za/'),
    ('seta_cathsseta', 'CATHSSETA', 'SETA', 'https://www.cathsseta.org.za/'),
    ('seta_ceta', 'Construction Education and Training Authority (CETA)', 'SETA', 'https://www.ceta.org.za/'),
    ('seta_chieta', 'Chemical Industries Education and Training Authority (CHIETA)', 'SETA', 'https://www.chieta.org.za/'),
    ('seta_etdpseta', 'Education, Training and Development Practices SETA', 'SETA', 'https://www.etdpseta.org.za/'),
    ('seta_ewseta', 'Energy and Water Sector Education and Training Authority', 'SETA', 'https://www.eseta.org.za/'),
    ('seta_fasset', 'Financial and Accounting Services SETA (FASSET)', 'SETA', 'https://www.fasset.org.za/'),
    ('seta_foodbev', 'FoodBev Manufacturing SETA', 'SETA', 'https://www.foodbev.co.za/'),
    ('seta_fpm', 'Fibre Processing and Manufacturing SETA (FP&M)', 'SETA', 'https://www.fpmseta.org.za/'),
    ('seta_hwseta', 'Health and Welfare Sector Education and Training Authority', 'SETA', 'https://www.hwseta.org.za/'),
    ('seta_inseta', 'Insurance Sector Education and Training Authority (INSETA)', 'SETA', 'https://www.inseta.org.za/'),
    ('seta_lgseta', 'Local Government Sector Education and Training Authority (LGSETA)', 'SETA', 'https://lgseta.org.za/'),
    ('seta_merseta', 'Manufacturing, Engineering and Related Services SETA (merSETA)', 'SETA', 'https://www.merseta.org.za/'),
    ('seta_mict', 'Media, Information and Communication Technologies SETA (MICT SETA)', 'SETA', 'https://www.mict.org.za/'),
    ('seta_mqa', 'Mining Qualifications Authority (MQA)', 'SETA', 'https://www.mqa.org.za/'),
    ('seta_pseta', 'Public Service Sector Education and Training Authority (PSETA)', 'SETA', 'https://www.pseta.org.za/'),
    ('seta_sasseta', 'Safety and Security Sector Education and Training Authority (SASSETA)', 'SETA', 'https://www.sasseta.org.za/'),
    ('seta_services', 'Services Sector Education and Training Authority (Services SETA)', 'SETA', 'https://www.serviceseta.org.za/'),
    ('seta_teta', 'Transport Education and Training Authority (TETA)', 'SETA', 'https://www.teta.org.za/'),
    ('seta_wrseta', 'Wholesale and Retail SETA (W&RSETA)', 'SETA', 'https://www.wrseta.org.za/'),
    ('funder_nsf', 'National Skills Fund (NSF)', 'BURSARY_PROVIDER', 'https://www.dhet.gov.za/SitePages/NSF.aspx'),
    ('funder_funza_lushaka', 'Funza Lushaka Bursary Programme', 'BURSARY_PROVIDER', 'https://www.funzalushaka.doe.gov.za/')
  )
  SELECT count(*) INTO bad_count
  FROM expected e
  LEFT JOIN public.route_providers p ON p.provider_key = e.provider_key
  WHERE p.id IS NULL
     OR p.provider_name IS DISTINCT FROM e.provider_name
     OR p.provider_type IS DISTINCT FROM e.provider_type
     OR p.base_url IS DISTINCT FROM e.base_url
     OR p.verification_status IS DISTINCT FROM 'NEEDS_REVIEW'
     OR p.default_confidence_band IS DISTINCT FROM 'D'
     OR p.public_safe IS DISTINCT FROM false;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'SETA_FUNDER_PROVIDER_SEED_CONFLICT % rows; inspect existing canonical provider records before rerunning', bad_count;
  END IF;
END
$postflight$;

COMMIT;
