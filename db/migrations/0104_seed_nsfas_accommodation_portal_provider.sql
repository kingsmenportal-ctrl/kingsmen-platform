-- 0104: register the official NSFAS accommodation application portal as a
-- provider route candidate only. This does not copy a live property catalogue,
-- authenticate a candidate to NSFAS, create a booking, or submit an application.
BEGIN;

INSERT INTO public.source_authorities (
  source_key, source_name, source_type, base_url, default_confidence_band,
  verification_required, last_verified_at, verification_notes
) VALUES (
  'nsfas_student_accommodation_portal',
  'NSFAS Student Housing Management App — official accommodation portal',
  'government_student_accommodation_portal',
  'https://profprod.nsfas.org.za/',
  'C',
  true,
  NULL,
  'Official NSFAS Student Housing Management App source. The portal provides live student-accommodation listings and describes applying directly to a selected property and completing a lease. Candidate eligibility, current property listing/bed availability, institution association, provider requirements and any Kingsmen integration must be rechecked for each exact listing. No Kingsmen submission authority is granted.'
)
ON CONFLICT (source_key) DO NOTHING;

DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.source_authorities
    WHERE source_key = 'nsfas_student_accommodation_portal'
      AND base_url = 'https://profprod.nsfas.org.za/'
      AND verification_required = true
  ) THEN
    RAISE EXCEPTION 'NSFAS_ACCOMMODATION_SOURCE_AUTHORITY_MISSING_OR_CONFLICTING';
  END IF;
END
$preflight$;

INSERT INTO public.route_providers (
  provider_key, provider_name, provider_type, province, base_url, source_authority_id,
  default_confidence_band, verification_status, public_safe,
  private_provider_requires_accreditation_check, notes, metadata
)
SELECT
  'nsfas_accommodation_portal',
  'NSFAS Student Housing Management App',
  'ACCOMMODATION_PROVIDER',
  NULL,
  'https://profprod.nsfas.org.za/',
  id,
  'D',
  'NEEDS_REVIEW',
  false,
  'Official NSFAS accommodation portal source only. The portal lists accommodation properties and offers its own student application/lease workflow. Recheck every exact property, institution, current bed availability, candidate eligibility and accommodation terms. Kingsmen has no API credentials or authority to submit, reserve, sign a lease or confirm a place.',
  jsonb_build_object(
    'directory_seed', jsonb_build_object(
      'source_key', 'nsfas_student_accommodation_portal',
      'source_url', 'https://profprod.nsfas.org.za/accommodations',
      'provider_homepage_url', 'https://profprod.nsfas.org.za/',
      'source_snapshot_date', '2026-10-31',
      'record_status', 'NEEDS_REVIEW',
      'source_confidence', 'D',
      'public_safe', false,
      'provider_identity_status', 'OFFICIAL_PORTAL_SOURCE_NEEDS_REVIEW',
      'property_catalogue_status', 'LIVE_SOURCE_RECHECK_REQUIRED',
      'bed_availability_status', 'UNKNOWN_UNTIL_EXACT_PROPERTY_RECHECK',
      'eligibility_status', 'UNKNOWN',
      'application_route_status', 'OFFICIAL_EXTERNAL_PORTAL',
      'integration_status', 'NOT_CONNECTED',
      'partnership_status', 'NOT_A_PARTNER',
      'automation_authorized', false,
      'provider_submission_supported_by_kingsmen', false,
      'provider_receipt_supported', false,
      'candidate_can_apply_on_provider_platform', true,
      'evidence_scope', 'Official provider portal discovery only. No property availability, candidate eligibility, Kingsmen integration, partnership, submission, reservation, lease, payment or outcome is proven.'
    )
  )
FROM public.source_authorities
WHERE source_key = 'nsfas_student_accommodation_portal'
ON CONFLICT (provider_key) DO NOTHING;

DO $postflight$
DECLARE
  v_source_count integer;
  v_provider_count integer;
  v_bad_count integer;
BEGIN
  SELECT count(*) INTO v_source_count
  FROM public.source_authorities
  WHERE source_key = 'nsfas_student_accommodation_portal'
    AND base_url = 'https://profprod.nsfas.org.za/'
    AND verification_required = true;

  SELECT count(*) INTO v_provider_count
  FROM public.route_providers
  WHERE provider_key = 'nsfas_accommodation_portal';

  IF v_source_count <> 1 OR v_provider_count <> 1 THEN
    RAISE EXCEPTION 'NSFAS_ACCOMMODATION_SEED_COUNT_MISMATCH';
  END IF;

  SELECT count(*) INTO v_bad_count
  FROM public.route_providers
  WHERE provider_key = 'nsfas_accommodation_portal'
    AND (
      provider_name IS DISTINCT FROM 'NSFAS Student Housing Management App'
      OR provider_type IS DISTINCT FROM 'ACCOMMODATION_PROVIDER'
      OR base_url IS DISTINCT FROM 'https://profprod.nsfas.org.za/'
      OR verification_status IS DISTINCT FROM 'NEEDS_REVIEW'
      OR default_confidence_band IS DISTINCT FROM 'D'
      OR public_safe IS DISTINCT FROM false
    );
  IF v_bad_count > 0 THEN
    RAISE EXCEPTION 'NSFAS_ACCOMMODATION_SEED_CONFLICT';
  END IF;
END
$postflight$;

COMMIT;
