-- N16 scoped Playwright public-source scout claims.
-- Reuse the existing durable queue. No second job table is created.
-- Apply only after independent review and protected backup/change control.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kingsmen_playwright_scout_worker') THEN
    CREATE ROLE kingsmen_playwright_scout_worker NOLOGIN NOINHERIT;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO kingsmen_playwright_scout_worker;
GRANT USAGE ON TYPE public.orchestrator_dispatch_queue TO kingsmen_playwright_scout_worker;

CREATE INDEX IF NOT EXISTS orchestrator_dispatch_playwright_scout_due_idx
  ON public.orchestrator_dispatch_queue(dispatch_after, priority_lane, created_at)
  WHERE queue_status = 'READY'
    AND worker_code = 'playwright.public_source.scout';

CREATE OR REPLACE FUNCTION public.n16_claim_playwright_scout_dispatches(
  p_worker_id text,
  p_limit integer DEFAULT 1,
  p_lease_seconds integer DEFAULT 90
)
RETURNS SETOF public.orchestrator_dispatch_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT pg_has_role(session_user, 'kingsmen_playwright_scout_worker', 'MEMBER') THEN
    RAISE EXCEPTION 'N16_PLAYWRIGHT_SCOUT_ROLE_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_worker_id IS NULL
     OR p_worker_id !~ '^playwright-scout:[a-z0-9][a-z0-9._-]{0,63}$' THEN
    RAISE EXCEPTION 'N16_PLAYWRIGHT_SCOUT_WORKER_ID_INVALID' USING ERRCODE = '22023';
  END IF;
  IF p_limit IS NULL OR p_limit <> 1 THEN
    RAISE EXCEPTION 'N16_PLAYWRIGHT_SCOUT_CLAIM_LIMIT_INVALID' USING ERRCODE = '22023';
  END IF;
  IF p_lease_seconds IS NULL OR p_lease_seconds < 30 OR p_lease_seconds > 300 THEN
    RAISE EXCEPTION 'N16_PLAYWRIGHT_SCOUT_LEASE_INVALID' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT q.id
    FROM public.orchestrator_dispatch_queue q
    WHERE q.worker_code = 'playwright.public_source.scout'
      AND (
        (q.queue_status = 'READY' AND q.dispatch_after <= clock_timestamp())
        OR
        (q.queue_status = 'LOCKED' AND q.lease_expires_at <= clock_timestamp())
      )
      AND q.attempt_count < q.max_attempts
    ORDER BY
      CASE q.priority_lane
        WHEN 'FOUNDER_OVERRIDE' THEN 0
        WHEN 'URGENT' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'NORMAL' THEN 3
        ELSE 4
      END,
      q.dispatch_after,
      q.created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.orchestrator_dispatch_queue q
  SET queue_status = 'LOCKED',
      locked_at = clock_timestamp(),
      locked_by = p_worker_id,
      lease_expires_at = clock_timestamp() + make_interval(secs => p_lease_seconds),
      attempt_count = q.attempt_count + 1,
      updated_at = clock_timestamp()
  FROM candidates c
  WHERE q.id = c.id
    AND q.worker_code = 'playwright.public_source.scout'
  RETURNING q.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.n16_record_playwright_scout_result(
  p_dispatch_ref text,
  p_worker_id text,
  p_result_ref text,
  p_worker_status text,
  p_result_payload jsonb,
  p_evidence_refs text[],
  p_failure_class text DEFAULT NULL,
  p_failure_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  q public.orchestrator_dispatch_queue%ROWTYPE;
BEGIN
  IF NOT pg_has_role(session_user, 'kingsmen_playwright_scout_worker', 'MEMBER') THEN
    RAISE EXCEPTION 'N16_PLAYWRIGHT_SCOUT_ROLE_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF coalesce(trim(p_dispatch_ref), '') = ''
     OR coalesce(trim(p_worker_id), '') = ''
     OR coalesce(trim(p_result_ref), '') = '' THEN
    RAISE EXCEPTION 'N16_PLAYWRIGHT_SCOUT_RESULT_IDENTIFIERS_REQUIRED' USING ERRCODE = '22023';
  END IF;
  IF p_worker_status IS NULL
     OR p_worker_status NOT IN ('SUCCEEDED', 'FAILED', 'BLOCKED', 'NEEDS_APPROVAL', 'NEEDS_MANUAL') THEN
    RAISE EXCEPTION 'N16_PLAYWRIGHT_SCOUT_RESULT_STATUS_INVALID' USING ERRCODE = '22023';
  END IF;
  IF p_failure_class IS NOT NULL AND p_failure_class NOT IN ('TRANSIENT', 'AUTHENTICATION', 'POLICY', 'INVALID_PAYLOAD', 'PORTAL_BLOCKED', 'DUPLICATE', 'UNKNOWN') THEN
    RAISE EXCEPTION 'N16_PLAYWRIGHT_SCOUT_FAILURE_CLASS_INVALID' USING ERRCODE = '22023';
  END IF;
  IF p_failure_code IS NOT NULL AND length(p_failure_code) > 128 THEN
    RAISE EXCEPTION 'N16_PLAYWRIGHT_SCOUT_FAILURE_CODE_TOO_LONG' USING ERRCODE = '22023';
  END IF;
  IF coalesce(cardinality(p_evidence_refs), 0) = 0 THEN
    RAISE EXCEPTION 'N16_PLAYWRIGHT_SCOUT_RESULT_EVIDENCE_REQUIRED' USING ERRCODE = '22023';
  END IF;
  IF octet_length(coalesce(p_result_payload, '{}'::jsonb)::text) > 32768 THEN
    RAISE EXCEPTION 'N16_PLAYWRIGHT_SCOUT_RESULT_TOO_LARGE' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO q
  FROM public.orchestrator_dispatch_queue
  WHERE dispatch_ref = p_dispatch_ref
  FOR UPDATE;

  IF NOT FOUND
     OR q.worker_code IS DISTINCT FROM 'playwright.public_source.scout'
     OR q.queue_status IS DISTINCT FROM 'LOCKED'
     OR q.locked_by IS DISTINCT FROM p_worker_id
     OR q.lease_expires_at IS NULL
     OR q.lease_expires_at <= clock_timestamp() THEN
    RAISE EXCEPTION 'N16_PLAYWRIGHT_SCOUT_DISPATCH_NOT_OWNED' USING ERRCODE = '42501';
  END IF;
  IF coalesce(p_evidence_refs, ARRAY[]::text[]) IS DISTINCT FROM
     coalesce(q.evidence_refs, ARRAY[]::text[]) THEN
    RAISE EXCEPTION 'N16_PLAYWRIGHT_SCOUT_EVIDENCE_REFERENCE_MISMATCH' USING ERRCODE = '22023';
  END IF;

  -- This public-source scout is read-only: same-state result only; never SENT.
  RETURN public.n16_record_dispatch_result(
    p_dispatch_ref,
    p_result_ref,
    p_worker_status,
    'SAME',
    coalesce(p_result_payload, '{}'::jsonb),
    p_evidence_refs,
    p_failure_class,
    p_failure_code,
    2,
    900
  );
END;
$$;

REVOKE ALL ON TABLE public.orchestrator_dispatch_queue,
  public.orchestrator_worker_results,
  public.orchestrator_execution_events,
  public.orchestrator_manual_handoffs
FROM kingsmen_playwright_scout_worker;

REVOKE ALL ON FUNCTION public.n16_claim_playwright_scout_dispatches(text, integer, integer)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.n16_record_playwright_scout_result(text, text, text, text, jsonb, text[], text, text)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.n16_claim_playwright_scout_dispatches(text, integer, integer)
  TO kingsmen_playwright_scout_worker;
GRANT EXECUTE ON FUNCTION public.n16_record_playwright_scout_result(text, text, text, text, jsonb, text[], text, text)
  TO kingsmen_playwright_scout_worker;

COMMENT ON ROLE kingsmen_playwright_scout_worker IS
  'Least-privilege NOLOGIN role for the isolated Playwright public-source scout. A dedicated NOINHERIT login must be explicitly provisioned and assigned to this role. No queue-table access, generic claim, SENT function, or provider write capability.';
COMMENT ON FUNCTION public.n16_claim_playwright_scout_dispatches(text, integer, integer) IS
  'Atomically claims only playwright.public_source.scout rows; one row maximum; unrelated N16 work is never leased.';
COMMENT ON FUNCTION public.n16_record_playwright_scout_result(text, text, text, text, jsonb, text[], text, text) IS
  'Records a same-state public-source scout result only for a LOCKED dispatch owned by this worker ID. Does not authorize SENT or external provider actions.';
