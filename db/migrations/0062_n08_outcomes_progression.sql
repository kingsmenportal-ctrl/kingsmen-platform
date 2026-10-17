-- N08 Candidate Outcomes & Progression. Depends on N06 + N07 migrations.
CREATE TABLE IF NOT EXISTS public.candidate_outcomes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), outcome_ref text NOT NULL UNIQUE,
 application_id uuid NOT NULL REFERENCES public.candidate_applications(id) ON DELETE RESTRICT,
 candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
 opportunity_id uuid NOT NULL REFERENCES public.candidate_opportunities(id) ON DELETE RESTRICT,
 outcome_type text NOT NULL CHECK(outcome_type IN ('PROVIDER_OFFER','PROVIDER_ACCEPTANCE','PROVIDER_REJECTION','ENROLMENT_CONFIRMED','PLACEMENT_CONFIRMED','EMPLOYMENT_STARTED')),
 outcome_status text NOT NULL DEFAULT 'CONFIRMED' CHECK(outcome_status IN ('CONFIRMED','DISPUTED','SUPERSEDED')),
 provider_name text NOT NULL, evidence_id uuid NOT NULL REFERENCES public.candidate_application_evidence(id) ON DELETE RESTRICT,
 evidence_ref text NOT NULL, provider_reference text, confirmed_by_auth_user_id uuid NOT NULL, confirmed_at timestamptz NOT NULL DEFAULT now(),
 summary text NOT NULL CHECK(length(summary)>=12 AND length(summary)<=2000), next_step text CHECK(next_step IS NULL OR length(next_step)<=2000),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(application_id,outcome_type,evidence_id)
);
CREATE INDEX IF NOT EXISTS idx_n08_outcomes_candidate ON public.candidate_outcomes(candidate_id,confirmed_at DESC);
CREATE INDEX IF NOT EXISTS idx_n08_outcomes_application ON public.candidate_outcomes(application_id,confirmed_at DESC);
CREATE INDEX IF NOT EXISTS idx_n08_outcomes_status ON public.candidate_outcomes(outcome_status,confirmed_at DESC);
CREATE TABLE IF NOT EXISTS public.candidate_outcome_correction_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_ref text NOT NULL UNIQUE,
 outcome_id uuid NOT NULL REFERENCES public.candidate_outcomes(id) ON DELETE RESTRICT,
 candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
 requested_by_auth_user_id uuid NOT NULL, reason text NOT NULL CHECK(length(reason)>=20 AND length(reason)<=3000),
 requested_change text NOT NULL CHECK(length(requested_change)>=10 AND length(requested_change)<=2000),
 status text NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','UNDER_REVIEW','ACCEPTED','DECLINED','WITHDRAWN')),
 decided_by_auth_user_id uuid, decided_at timestamptz, decision_note text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_n08_correction_candidate ON public.candidate_outcome_correction_requests(candidate_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n08_correction_queue ON public.candidate_outcome_correction_requests(status,created_at ASC);
ALTER TABLE public.candidate_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_outcome_correction_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE ON public.candidate_outcomes TO service_role;
GRANT SELECT,INSERT,UPDATE ON public.candidate_outcome_correction_requests TO service_role;
DROP POLICY IF EXISTS n08_service_outcomes ON public.candidate_outcomes;
CREATE POLICY n08_service_outcomes ON public.candidate_outcomes FOR ALL TO service_role USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS n08_service_outcome_corrections ON public.candidate_outcome_correction_requests;
CREATE POLICY n08_service_outcome_corrections ON public.candidate_outcome_correction_requests FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE OR REPLACE FUNCTION public.prevent_candidate_outcome_ledger_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'candidate outcomes are append-only; use correction requests and new evidence'; END; $$;
DROP TRIGGER IF EXISTS n08_outcomes_no_delete ON public.candidate_outcomes;
CREATE TRIGGER n08_outcomes_no_delete BEFORE DELETE ON public.candidate_outcomes FOR EACH ROW EXECUTE FUNCTION public.prevent_candidate_outcome_ledger_mutation();
CREATE OR REPLACE FUNCTION public.guard_candidate_outcome_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.application_id IS DISTINCT FROM OLD.application_id OR NEW.candidate_id IS DISTINCT FROM OLD.candidate_id
 OR NEW.opportunity_id IS DISTINCT FROM OLD.opportunity_id OR NEW.outcome_type IS DISTINCT FROM OLD.outcome_type
 OR NEW.evidence_id IS DISTINCT FROM OLD.evidence_id OR NEW.evidence_ref IS DISTINCT FROM OLD.evidence_ref
 OR NEW.confirmed_by_auth_user_id IS DISTINCT FROM OLD.confirmed_by_auth_user_id OR NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at
 THEN RAISE EXCEPTION 'candidate outcome identity and evidence are immutable'; END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS n08_outcomes_identity_immutable ON public.candidate_outcomes;
CREATE TRIGGER n08_outcomes_identity_immutable BEFORE UPDATE ON public.candidate_outcomes FOR EACH ROW EXECUTE FUNCTION public.guard_candidate_outcome_identity();
ALTER TABLE public.candidate_application_events DROP CONSTRAINT IF EXISTS candidate_application_events_event_type_check;
ALTER TABLE public.candidate_application_events ADD CONSTRAINT candidate_application_events_event_type_check CHECK(event_type IN (
 'APPLICATION_CREATED','READINESS_CHECKED','STATUS_CHANGED','EVIDENCE_ATTACHED','MANUAL_PACKAGE_CREATED','MANUAL_ACTION_RECORDED',
 'EVIDENCE_VERIFIED','EVIDENCE_REJECTED','SUBMISSION_AUTHORIZED','SUBMISSION_ATTEMPT_CREATED','SUBMISSION_DISPATCHED',
 'PROVIDER_ACKNOWLEDGED','PROVIDER_STATUS_RECORDED','PROVIDER_OUTCOME_RECORDED','REVIEW_DECISION_RECORDED',
 'OUTCOME_RECORDED','OUTCOME_DISPUTED','OUTCOME_CORRECTION_DECIDED','OUTCOME_SUPERSEDED'
));
COMMENT ON TABLE public.candidate_outcomes IS 'Append-first outcome ledger tied to verified provider evidence. Kingsmen does not guarantee provider decisions.';
COMMENT ON TABLE public.candidate_outcome_correction_requests IS 'Candidate-owned requests to dispute or correct outcome records; changes require reviewer decision.';
