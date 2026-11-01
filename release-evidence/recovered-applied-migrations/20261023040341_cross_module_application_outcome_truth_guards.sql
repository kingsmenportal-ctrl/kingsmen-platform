-- Cross-module truth guard: never present candidate-reported activity as provider-confirmed.
-- Application submission statuses require independently verified receipt/reference evidence.
-- Outcome ledger rows require verified provider-outcome evidence matching the same candidate/application/opportunity.
-- This migration deliberately does not create fake evidence, accounts, reviewers, or opportunities.

CREATE OR REPLACE FUNCTION public.guard_candidate_application_submission_truth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_evidence_count integer;
BEGIN
  IF NEW.status IN (
    'SUBMITTED_CONFIRMED',
    'PROVIDER_REVIEW',
    'SHORTLISTED',
    'INTERVIEW',
    'OFFERED',
    'ACCEPTED',
    'REJECTED'
  ) THEN
    SELECT count(*)
      INTO v_evidence_count
      FROM public.candidate_application_evidence e
     WHERE e.application_id = NEW.id
       AND e.candidate_id = NEW.candidate_id
       AND e.evidence_type IN ('PROVIDER_SUBMISSION_RECEIPT', 'PROVIDER_REFERENCE')
       AND e.verification_status = 'VERIFIED'
       AND e.verified_by_auth_user_id IS NOT NULL
       AND e.verified_at IS NOT NULL
       AND length(trim(coalesce(e.evidence_locator, ''))) > 0
       AND length(trim(coalesce(e.source_label, ''))) > 0;

    IF v_evidence_count = 0 THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'Application cannot be marked submitted or beyond without verified provider submission evidence for the same candidate and application.',
        DETAIL = 'Candidate-reported submission and automation attempts are not provider confirmation.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS candidate_application_submission_truth_guard ON public.candidate_applications;
CREATE TRIGGER candidate_application_submission_truth_guard
BEFORE INSERT OR UPDATE OF status, candidate_id
ON public.candidate_applications
FOR EACH ROW
EXECUTE FUNCTION public.guard_candidate_application_submission_truth();

CREATE OR REPLACE FUNCTION public.guard_candidate_outcome_evidence_truth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_application_candidate uuid;
  v_application_opportunity uuid;
  v_evidence_candidate uuid;
  v_evidence_application uuid;
  v_evidence_type text;
  v_verification_status text;
  v_verified_by uuid;
  v_verified_at timestamptz;
  v_locator text;
  v_source_label text;
BEGIN
  SELECT a.candidate_id, a.opportunity_id
    INTO v_application_candidate, v_application_opportunity
    FROM public.candidate_applications a
   WHERE a.id = NEW.application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'Outcome application does not exist.';
  END IF;

  IF NEW.candidate_id IS DISTINCT FROM v_application_candidate
     OR NEW.opportunity_id IS DISTINCT FROM v_application_opportunity THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Outcome candidate and opportunity must match its application.';
  END IF;

  SELECT e.candidate_id, e.application_id, e.evidence_type,
         e.verification_status, e.verified_by_auth_user_id, e.verified_at,
         e.evidence_locator, e.source_label
    INTO v_evidence_candidate, v_evidence_application, v_evidence_type,
         v_verification_status, v_verified_by, v_verified_at,
         v_locator, v_source_label
    FROM public.candidate_application_evidence e
   WHERE e.id = NEW.evidence_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'Outcome evidence does not exist.';
  END IF;

  IF v_evidence_candidate IS DISTINCT FROM NEW.candidate_id
     OR v_evidence_application IS DISTINCT FROM NEW.application_id THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Outcome evidence must belong to the same candidate and application.';
  END IF;

  IF v_evidence_type <> 'PROVIDER_OUTCOME_NOTICE'
     OR v_verification_status <> 'VERIFIED'
     OR v_verified_by IS NULL
     OR v_verified_at IS NULL
     OR length(trim(coalesce(v_locator, ''))) = 0
     OR length(trim(coalesce(v_source_label, ''))) = 0 THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'A confirmed outcome requires independently verified provider-outcome evidence.',
      DETAIL = 'Candidate reports, predictions, screenshots not yet reviewed, and submission receipts are not confirmed outcomes.';
  END IF;

  IF NEW.outcome_status <> 'CONFIRMED' THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'New outcome ledger entries must begin CONFIRMED; corrections use the append-only dispute/supersession workflow.';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS candidate_outcome_evidence_truth_guard ON public.candidate_outcomes;
CREATE TRIGGER candidate_outcome_evidence_truth_guard
BEFORE INSERT
ON public.candidate_outcomes
FOR EACH ROW
EXECUTE FUNCTION public.guard_candidate_outcome_evidence_truth();

COMMENT ON FUNCTION public.guard_candidate_application_submission_truth() IS
  'Fail-closed application state guard: provider-submitted-or-later states require verified submission receipt/reference evidence for the same candidate and application.';
COMMENT ON FUNCTION public.guard_candidate_outcome_evidence_truth() IS
  'Fail-closed outcome guard: confirmed outcomes require a verified provider outcome notice tied to the same candidate and application; candidate reports are not confirmation.';
