-- Fail closed on expired or undated "open" routes at both public-read and application-creation boundaries.
DROP POLICY IF EXISTS route_programmes_public_verified_read ON public.route_programmes;
CREATE POLICY route_programmes_public_verified_read ON public.route_programmes
FOR SELECT TO anon, authenticated
USING (
  route_status = 'VERIFIED'
  AND availability_status IN ('OPEN','FUTURE')
  AND source_confidence_band IN ('A','B')
  AND source_url IS NOT NULL
  AND updated_at >= now() - interval '90 days'
  AND EXISTS (
    SELECT 1 FROM public.route_providers p
    WHERE p.id = route_programmes.provider_id
      AND p.public_safe = true
      AND p.verification_status = 'VERIFIED'
      AND p.default_confidence_band IN ('A','B')
  )
  AND (
    (
      availability_status = 'OPEN'
      AND CASE
        WHEN metadata->>'closing_date' ~ '^\d{4}-\d{2}-\d{2}$'
          THEN (metadata->>'closing_date')::date >= current_date
        ELSE false
      END
    )
    OR
    (
      availability_status = 'FUTURE'
      AND CASE
        WHEN metadata->>'opening_date' ~ '^\d{4}-\d{2}-\d{2}$'
          THEN (metadata->>'opening_date')::date > current_date
        ELSE false
      END
      AND (
        metadata->>'closing_date' IS NULL
        OR CASE
          WHEN metadata->>'closing_date' ~ '^\d{4}-\d{2}-\d{2}$'
            THEN (metadata->>'closing_date')::date >= current_date
          ELSE false
        END
      )
    )
  )
);
COMMENT ON POLICY route_programmes_public_verified_read ON public.route_programmes IS
  'Public routes must be verified, recent, public-safe, confidence A/B and time-valid: OPEN requires a verified future-or-today closing date; FUTURE requires a future opening date and no expired closing date.';
