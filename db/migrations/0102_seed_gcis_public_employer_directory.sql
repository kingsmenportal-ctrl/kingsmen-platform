-- 0102: seed nine major national public-sector employers from the official
-- GCIS State-Owned Enterprises and Other Public Institutions directory.
-- These are source-listed employer records only: no vacancies, eligibility, application
-- portal permissions, APIs, partnerships or provider receipts are activated here.
BEGIN;

INSERT INTO public.source_authorities (
  source_key, source_name, source_type, base_url, default_confidence_band,
  verification_required, last_verified_at, verification_notes
) VALUES (
  'gcis_public_entities_and_soe_directory',
  'GCIS National Government Directory — State-Owned Enterprises and Other Public Institutions',
  'government_institution_list',
  'https://www.gov.za/about-government/contact-directory/soe-s',
  'C',
  true,
  NULL,
  'GCIS directory lists 123 state-owned enterprises and other public institutions. This directory supports discovery and an official entity profile only. Individual organisation status, recruitment activity, current vacancies, eligibility, application channel and application rules must be rechecked separately.'
)
ON CONFLICT (source_key) DO NOTHING;

DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.source_authorities
    WHERE source_key = 'gcis_public_entities_and_soe_directory'
      AND base_url = 'https://www.gov.za/about-government/contact-directory/soe-s'
      AND verification_required = true
  ) THEN
    RAISE EXCEPTION 'GCIS_SOE_SOURCE_AUTHORITY_MISSING_OR_CONFLICTING';
  END IF;
END
$preflight$;

WITH provider_seed(provider_key, provider_name, base_url, source_profile_url) AS (
  VALUES
    ('soe_acsa', 'Airports Company South Africa (ACSA)', 'https://www.airports.co.za/', 'https://www.gov.za/about-government/contact-directory/soe/airports-company-south-africa-acsa'),
    ('soe_denel', 'Denel (Pty) Ltd', 'https://www.denel.co.za/', 'https://www.gov.za/about-government/contact-directory/soe/denel-pty-ltd'),
    ('soe_prasa', 'Passenger Rail Agency of South Africa (PRASA)', 'https://www.prasa.com/', 'https://www.gov.za/about-government/contact-directory/soe/passenger-rail-agency-south-african-prasa'),
    ('soe_saa', 'South African Airways (SAA)', 'https://www.flysaa.com/', 'https://www.gov.za/about-government/contact-directory/soe/south-african-airways-saa'),
    ('soe_sabc', 'South African Broadcasting Corporation (SABC)', 'https://www.sabc.co.za/', 'https://www.gov.za/about-government/contact-directory/soe/south-african-broadcasting-corporation-sabc'),
    ('soe_sanral', 'South African National Road Agency (SANRAL)', 'https://www.nra.co.za/', 'https://www.gov.za/about-government/contact-directory/soe/south-african-national-road-agency'),
    ('soe_sapo', 'South African Post Office (SAPO)', 'https://www.postoffice.co.za/', 'https://www.gov.za/about-government/contact-directory/soe/south-african-post-office-sapo'),
    ('soe_telkom', 'Telkom SA (Ltd)', 'https://www.telkom.co.za/', 'https://www.gov.za/about-government/contact-directory/soe/telkom-sa-ltd'),
    ('soe_transnet', 'Transnet (Ltd)', 'https://www.transnet.net', 'https://www.gov.za/about-government/contact-directory/soe/transnet-ltd')
),
source_linked AS (
  SELECT p.*, s.id AS source_authority_id
  FROM provider_seed p
  JOIN public.source_authorities s ON s.source_key = 'gcis_public_entities_and_soe_directory'
)
INSERT INTO public.route_providers (
  provider_key, provider_name, provider_type, province, base_url, source_authority_id,
  default_confidence_band, verification_status, public_safe,
  private_provider_requires_accreditation_check, notes, metadata
)
SELECT
  provider_key,
  provider_name,
  'EMPLOYER',
  NULL,
  base_url,
  source_authority_id,
  'D',
  'NEEDS_REVIEW',
  false,
  false,
  'GCIS public-entity directory entry only. Verify current legal/employer status, the organisation’s active recruitment notice, closing date, eligibility, exact candidate portal and submission rules before any vacancy or application service is advertised. No partnership, connector, intake, vacancy or provider submission is implied.',
  jsonb_build_object(
    'directory_seed', jsonb_build_object(
      'source_key', 'gcis_public_entities_and_soe_directory',
      'source_profile_url', source_profile_url,
      'provider_homepage_url', base_url,
      'source_snapshot_date', '2026-10-31',
      'record_status', 'NEEDS_REVIEW',
      'source_confidence', 'D',
      'public_safe', false,
      'provider_identity_status', 'DIRECTORY_LISTED_NEEDS_REVIEW',
      'vacancy_status', 'UNKNOWN',
      'intake_status', 'UNKNOWN',
      'eligibility_status', 'UNKNOWN',
      'application_route_status', 'NOT_VERIFIED',
      'integration_status', 'NOT_CONNECTED',
      'partnership_status', 'NOT_A_PARTNER',
      'automation_authorized', false,
      'provider_receipt_supported', false,
      'evidence_scope', 'Official GCIS public-entity profile and website listing only. No vacancy, internship, deadline, eligibility, active recruitment route, partnership, connector, submission or outcome is proven.'
    )
  )
FROM source_linked
ON CONFLICT (provider_key) DO NOTHING;

DO $postflight$
DECLARE
  expected_count integer := 9;
  actual_count integer;
  bad_count integer;
BEGIN
  SELECT count(*) INTO actual_count
  FROM public.route_providers
  WHERE provider_key IN ('soe_acsa', 'soe_denel', 'soe_prasa', 'soe_saa', 'soe_sabc', 'soe_sanral', 'soe_sapo', 'soe_telkom', 'soe_transnet');
  IF actual_count <> expected_count THEN
    RAISE EXCEPTION 'GCIS_PUBLIC_EMPLOYER_SEED_COUNT_MISMATCH expected %, got %', expected_count, actual_count;
  END IF;

  WITH expected(provider_key, provider_name, base_url) AS (
    VALUES
    ('soe_acsa', 'Airports Company South Africa (ACSA)', 'https://www.airports.co.za/'),
    ('soe_denel', 'Denel (Pty) Ltd', 'https://www.denel.co.za/'),
    ('soe_prasa', 'Passenger Rail Agency of South Africa (PRASA)', 'https://www.prasa.com/'),
    ('soe_saa', 'South African Airways (SAA)', 'https://www.flysaa.com/'),
    ('soe_sabc', 'South African Broadcasting Corporation (SABC)', 'https://www.sabc.co.za/'),
    ('soe_sanral', 'South African National Road Agency (SANRAL)', 'https://www.nra.co.za/'),
    ('soe_sapo', 'South African Post Office (SAPO)', 'https://www.postoffice.co.za/'),
    ('soe_telkom', 'Telkom SA (Ltd)', 'https://www.telkom.co.za/'),
    ('soe_transnet', 'Transnet (Ltd)', 'https://www.transnet.net')
  )
  SELECT count(*) INTO bad_count
  FROM expected e
  LEFT JOIN public.route_providers p ON p.provider_key = e.provider_key
  WHERE p.id IS NULL
     OR p.provider_name IS DISTINCT FROM e.provider_name
     OR p.provider_type IS DISTINCT FROM 'EMPLOYER'
     OR p.base_url IS DISTINCT FROM e.base_url
     OR p.verification_status IS DISTINCT FROM 'NEEDS_REVIEW'
     OR p.default_confidence_band IS DISTINCT FROM 'D'
     OR p.public_safe IS DISTINCT FROM false;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'GCIS_PUBLIC_EMPLOYER_SEED_CONFLICT % rows; inspect existing canonical provider records before rerunning', bad_count;
  END IF;
END
$postflight$;

COMMIT;
