-- N06 Applications and Pathway Execution. Additive; review/apply through approved migration process.
CREATE TABLE IF NOT EXISTS public.candidate_opportunities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), opportunity_ref text NOT NULL UNIQUE, title text NOT NULL, provider_name text NOT NULL,
 pathway_type text NOT NULL CHECK(pathway_type IN ('HIGHER_EDUCATION','TVET','SETA_LEARNERSHIP','INTERNSHIP','APPRENTICESHIP','EMPLOYMENT')),
 description text, location_text text, source_url text, application_url text,
 application_method text NOT NULL DEFAULT 'EXTERNAL_PORTAL' CHECK(application_method IN ('INTERNAL','EXTERNAL_PORTAL','EMAIL','MANUAL_ONLY','IN_PERSON')),
 required_document_types text[] NOT NULL DEFAULT '{}', required_profile_fields text[] NOT NULL DEFAULT '{}',
 opens_at timestamptz, closes_at timestamptz, source_checked_at timestamptz,
 source_status text NOT NULL DEFAULT 'UNVERIFIED' CHECK(source_status IN ('UNVERIFIED','VERIFIED','STALE','CLOSED','WITHDRAWN')),
 is_published boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.candidate_saved_opportunities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
 opportunity_id uuid NOT NULL REFERENCES public.candidate_opportunities(id) ON DELETE RESTRICT, saved_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(candidate_id,opportunity_id)
);
CREATE TABLE IF NOT EXISTS public.candidate_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), application_ref text NOT NULL UNIQUE,
 candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
 opportunity_id uuid NOT NULL REFERENCES public.candidate_opportunities(id) ON DELETE RESTRICT,
 pathway_type text NOT NULL CHECK(pathway_type IN ('HIGHER_EDUCATION','TVET','SETA_LEARNERSHIP','INTERNSHIP','APPRENTICESHIP','EMPLOYMENT')),
 status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','READINESS_BLOCKED','READY_FOR_REVIEW','READY_TO_SUBMIT','SUBMISSION_PENDING','SUBMITTED_CONFIRMED','PROVIDER_REVIEW','SHORTLISTED','INTERVIEW','OFFERED','ACCEPTED','REJECTED','WITHDRAWN','CANCELLED','MANUAL_ACTION_REQUIRED','EXPIRED')),
 readiness_status text NOT NULL DEFAULT 'NOT_CHECKED' CHECK(readiness_status IN ('NOT_CHECKED','BLOCKED','WARNINGS','READY')),
 readiness_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb, provider_reference text, submission_evidence_ref text, submitted_at timestamptz,
 last_status_reason text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(candidate_id,opportunity_id)
);
CREATE TABLE IF NOT EXISTS public.candidate_application_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_ref text NOT NULL UNIQUE,
 application_id uuid NOT NULL REFERENCES public.candidate_applications(id) ON DELETE RESTRICT,
 candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT, actor_auth_user_id uuid,
 event_type text NOT NULL CHECK(event_type IN ('APPLICATION_CREATED','READINESS_CHECKED','STATUS_CHANGED','EVIDENCE_ATTACHED','MANUAL_PACKAGE_CREATED','MANUAL_ACTION_RECORDED')),
 from_status text, to_status text, reason_code text, evidence_ref text, details jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_n06_opportunities_discovery ON public.candidate_opportunities(is_published,pathway_type,closes_at);
CREATE INDEX IF NOT EXISTS idx_n06_saved_candidate ON public.candidate_saved_opportunities(candidate_id,saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_n06_applications_candidate ON public.candidate_applications(candidate_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_n06_applications_status ON public.candidate_applications(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_n06_application_events_application ON public.candidate_application_events(application_id,created_at DESC);
ALTER TABLE public.candidate_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_application_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.candidate_opportunities FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.candidate_saved_opportunities FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.candidate_applications FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.candidate_application_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidate_opportunities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidate_saved_opportunities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidate_applications TO service_role;
GRANT SELECT, INSERT ON TABLE public.candidate_application_events TO service_role;
DROP POLICY IF EXISTS n06_service_role_opportunities ON public.candidate_opportunities;
CREATE POLICY n06_service_role_opportunities ON public.candidate_opportunities FOR ALL TO service_role USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS n06_service_role_saved_opportunities ON public.candidate_saved_opportunities;
CREATE POLICY n06_service_role_saved_opportunities ON public.candidate_saved_opportunities FOR ALL TO service_role USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS n06_service_role_applications ON public.candidate_applications;
CREATE POLICY n06_service_role_applications ON public.candidate_applications FOR ALL TO service_role USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS n06_service_role_application_events ON public.candidate_application_events;
CREATE POLICY n06_service_role_application_events ON public.candidate_application_events FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE OR REPLACE FUNCTION public.prevent_candidate_application_event_mutation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $
BEGIN RAISE EXCEPTION 'candidate application events are append-only'; END; $$;
DROP TRIGGER IF EXISTS n06_application_event_no_update ON public.candidate_application_events;
CREATE TRIGGER n06_application_event_no_update BEFORE UPDATE OR DELETE ON public.candidate_application_events FOR EACH ROW EXECUTE FUNCTION public.prevent_candidate_application_event_mutation();
COMMENT ON TABLE public.candidate_applications IS 'Candidate-owned application lifecycle; provider submission and acceptance require evidence and are not inferred.';
COMMENT ON TABLE public.candidate_application_events IS 'Append-only audit trail for application state transitions and evidence.';
