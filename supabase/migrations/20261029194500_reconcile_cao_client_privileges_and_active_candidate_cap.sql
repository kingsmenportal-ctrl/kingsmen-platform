-- Corrective migration between the last recorded 0095 migration and the read-only CAO 0096 provenance attestation.
-- Close the CAO bridge client privilege gap and enforce the 500-active-candidate cap.
-- Prepared for independent review. Do not apply to staging until protected backup/restore
-- evidence and formal change approval are recorded.
-- This migration is intentionally corrective: it does not fabricate history for 0096-0098.
BEGIN;

DO $preflight$
DECLARE
  v_cap_text text;
  v_cap integer;
  v_active_count bigint;
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
  SELECT value->>'value' INTO v_cap_text
  FROM public.system_runtime_config
  WHERE key='KINGSMEN_CAP_ACTIVE_CANDIDATES';
  IF v_cap_text IS NULL OR v_cap_text !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_CONFIG_INVALID';
  END IF;
  BEGIN
    v_cap := v_cap_text::integer;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_CONFIG_INVALID';
  END;
  IF v_cap NOT IN (500,1000,5000,10000,25000) THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_STAGE_NOT_REGISTERED';
  END IF;
  SELECT count(*) INTO v_active_count FROM public.candidates WHERE is_active IS TRUE;
  IF v_active_count > v_cap THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_PREEXISTING_OVERFLOW: active=% cap=%',v_active_count,v_cap;
  END IF;
END
$preflight$;

-- CAO choices are backend-owned records linked to a candidate/application.
-- RLS alone is not a substitute for least-privilege table grants.
ALTER TABLE public.cao_choice_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.cao_choice_items FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cao_choice_items TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_candidate_active_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_cap_text text;
  v_cap integer;
  v_active_count bigint;
BEGIN
  IF NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_active IS TRUE THEN
    RETURN NEW;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('kingsmen.active-candidate-admission.v1', 0)
  );

  SELECT value->>'value' INTO v_cap_text
  FROM public.system_runtime_config
  WHERE key='KINGSMEN_CAP_ACTIVE_CANDIDATES'
  FOR SHARE;

  IF v_cap_text IS NULL OR v_cap_text !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_CONFIG_INVALID';
  END IF;
  BEGIN
    v_cap := v_cap_text::integer;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_CONFIG_INVALID';
  END;
  IF v_cap NOT IN (500,1000,5000,10000,25000) THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_STAGE_NOT_REGISTERED';
  END IF;

  SELECT count(*) INTO v_active_count
  FROM public.candidates WHERE is_active IS TRUE;
  IF v_active_count >= v_cap THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_EXCEEDED'
      USING ERRCODE='23514', CONSTRAINT='candidates_active_capacity_guard';
  END IF;
  RETURN NEW;
END
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION public.enforce_candidate_active_capacity() FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_candidates_active_capacity
  ON public.candidates (id)
  WHERE is_active IS TRUE;

DROP TRIGGER IF EXISTS candidates_active_capacity_guard ON public.candidates;
CREATE TRIGGER candidates_active_capacity_guard
BEFORE INSERT OR UPDATE OF is_active ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.enforce_candidate_active_capacity();

COMMENT ON FUNCTION public.enforce_candidate_active_capacity() IS
  'Serializes active candidate admission and fail-closes at the approved cap stored in system_runtime_config.KINGSMEN_CAP_ACTIVE_CANDIDATES.';

DO $postflight$
DECLARE
  client_grants bigint;
  trigger_count bigint;
  v_cap_text text;
  v_cap integer;
  active_candidates bigint;
BEGIN
  SELECT count(*) INTO client_grants
  FROM information_schema.role_table_grants
  WHERE table_schema='public' AND table_name='cao_choice_items'
    AND grantee IN ('anon','authenticated')
    AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN');
  IF client_grants <> 0
     OR has_table_privilege('anon','public.cao_choice_items','SELECT')
     OR has_table_privilege('anon','public.cao_choice_items','INSERT')
     OR has_table_privilege('anon','public.cao_choice_items','UPDATE')
     OR has_table_privilege('anon','public.cao_choice_items','DELETE')
     OR has_table_privilege('anon','public.cao_choice_items','TRUNCATE')
     OR has_table_privilege('anon','public.cao_choice_items','REFERENCES')
     OR has_table_privilege('anon','public.cao_choice_items','TRIGGER')
     OR has_table_privilege('authenticated','public.cao_choice_items','SELECT')
     OR has_table_privilege('authenticated','public.cao_choice_items','INSERT')
     OR has_table_privilege('authenticated','public.cao_choice_items','UPDATE')
     OR has_table_privilege('authenticated','public.cao_choice_items','DELETE')
     OR has_table_privilege('authenticated','public.cao_choice_items','TRUNCATE')
     OR has_table_privilege('authenticated','public.cao_choice_items','REFERENCES')
     OR has_table_privilege('authenticated','public.cao_choice_items','TRIGGER')
     OR has_table_privilege('authenticated','public.cao_choice_items','MAINTAIN') THEN
    RAISE EXCEPTION 'CAO_CLIENT_PRIVILEGE_POSTFLIGHT_FAILED: % explicit grants remain or inherited privileges survive', client_grants;
  END IF;

  SELECT count(*) INTO trigger_count
  FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname='candidates'
    AND t.tgname='candidates_active_capacity_guard' AND NOT t.tgisinternal;
  IF trigger_count <> 1 THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_TRIGGER_POSTFLIGHT_FAILED';
  END IF;

  SELECT value->>'value' INTO v_cap_text
  FROM public.system_runtime_config WHERE key='KINGSMEN_CAP_ACTIVE_CANDIDATES';
  IF v_cap_text IS NULL OR v_cap_text !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_CONFIG_INVALID';
  END IF;
  v_cap := v_cap_text::integer;
  IF v_cap NOT IN (500,1000,5000,10000,25000) THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_STAGE_NOT_REGISTERED';
  END IF;
  SELECT count(*) INTO active_candidates FROM public.candidates WHERE is_active IS TRUE;
  IF active_candidates > v_cap THEN
    RAISE EXCEPTION 'ACTIVE_CANDIDATE_CAP_POSTFLIGHT_FAILED: active=% cap=%',active_candidates,v_cap;
  END IF;
END
$postflight$;

COMMIT;