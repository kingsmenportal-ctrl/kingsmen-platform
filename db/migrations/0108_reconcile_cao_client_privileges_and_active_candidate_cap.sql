-- 0108: close the CAO bridge client privilege gap and enforce the 500-active-candidate cap.
-- Prepared for independent review. Do not apply to staging until protected backup/restore
-- evidence and formal change approval are recorded.
-- This migration is intentionally corrective: it does not fabricate history for 0096-0098.
BEGIN;

DO $preflight$
DECLARE active_candidates bigint;
BEGIN
  IF to_regclass('public.candidates') IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='candidates'
         AND column_name='is_active' AND data_type='boolean'
     ) THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_SCHEMA_MISMATCH: public.candidates.is_active missing';
  END IF;
  IF to_regclass('public.cao_choice_items') IS NULL THEN
    RAISE EXCEPTION 'CAO_BRIDGE_SCHEMA_MISMATCH: public.cao_choice_items missing';
  END IF;
  SELECT count(*) INTO active_candidates
  FROM public.candidates WHERE is_active IS TRUE;
  IF active_candidates > 500 THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_PREEXISTING_OVERFLOW: % active candidates', active_candidates;
  END IF;
END
$preflight$;

-- CAO choices are backend-owned records linked to a candidate/application.
-- RLS alone is not a substitute for least-privilege table grants.
ALTER TABLE public.cao_choice_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.cao_choice_items FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cao_choice_items TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_active_candidate_cap_500()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  active_candidates bigint;
BEGIN
  IF NEW.is_active IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_active IS TRUE THEN
    RETURN NEW;
  END IF;

  -- Serialize concurrent activations so two requests cannot both consume slot 500.
  PERFORM pg_advisory_xact_lock(741028, 500);
  SELECT count(*) INTO active_candidates
  FROM public.candidates
  WHERE is_active IS TRUE;

  IF active_candidates >= 500 THEN
    RAISE EXCEPTION 'KINGSMEN_ACTIVE_CANDIDATE_CAP_REACHED: limit=500 active=%', active_candidates
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION public.enforce_active_candidate_cap_500() FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS candidates_active_cap_lookup_idx
  ON public.candidates (is_active)
  WHERE is_active IS TRUE;

DROP TRIGGER IF EXISTS candidates_active_cap_500_guard ON public.candidates;
CREATE TRIGGER candidates_active_cap_500_guard
BEFORE INSERT OR UPDATE OF is_active ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.enforce_active_candidate_cap_500();

DO $postflight$
DECLARE
  client_grants bigint;
  trigger_count bigint;
  active_candidates bigint;
BEGIN
  SELECT count(*) INTO client_grants
  FROM information_schema.role_table_grants
  WHERE table_schema='public' AND table_name='cao_choice_items'
    AND grantee IN ('anon','authenticated')
    AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER');

  IF client_grants <> 0 THEN
    RAISE EXCEPTION 'CAO_CLIENT_PRIVILEGE_POSTFLIGHT_FAILED: % grants remain', client_grants;
  END IF;

  SELECT count(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid=t.tgrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname='candidates'
    AND t.tgname='candidates_active_cap_500_guard' AND NOT t.tgisinternal;
  IF trigger_count <> 1 THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_TRIGGER_POSTFLIGHT_FAILED';
  END IF;

  SELECT count(*) INTO active_candidates
  FROM public.candidates WHERE is_active IS TRUE;
  IF active_candidates > 500 THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_POSTFLIGHT_FAILED: % active candidates', active_candidates;
  END IF;
END
$postflight$;

COMMIT;
