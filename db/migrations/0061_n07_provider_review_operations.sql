-- N07 Provider Integration, Submission Evidence & Reviewer Operations.
-- Additive migration. Apply only through the approved staging migration process.
CREATE TABLE IF NOT EXISTS public.platform_reviewers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 auth_user_id uuid NOT NULL,
 role_code text NOT NULL CHECK(role_code IN ('APPLICATION_REVIEWER','EVIDENCE_VERIFIER','PROVIDER_OPERATOR','PLATFORM_ADMIN')),
 is_active boolean NOT NULL DEFAULT true,
 granted_by_auth_user_id uuid,
 granted_at timestamptz NOT NULL DEFAULT now(),
 revoked_at timestamptz,
 UNIQUE(auth_user_id,role_code)
);
CREATE INDEX IF NOT EXISTS idx_n07_reviewers_auth_active ON public.platform_reviewers(auth_user_id,is_active,role_code);
CREATE TABLE IF NOT EXISTS public.candidate_application_evidence (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 evidence_ref text NOT NULL UNIQUE,
 application_id uuid NOT NULL REFERENCES public.candidate_applications(id) ON DELETE RESTRICT,
 candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
 evidence_type text NOT NULL CHECK(evidence_type IN ('PRE_SUBMISSION_CHECKLIST','PROVIDER_SUBMISSION_RECEIPT','PROVIDER_REFERENCE','PROVIDER_STATUS_NOTICE','PROVIDER_OUTCOME_NOTICE','REVIEW_NOTE')),
 evidence_locator text NOT NULL,
 evidence_sha256 text NOT NULL CHECK(evidence_sha256 ~ '^[a-fA-F0-9]{64}$'),
 source_label text NOT NULL,
 captured_at timestamptz,
 verification_status text NOT NULL DEFAULT 'PENDING_REVIEW' CHECK(verification_status IN ('PENDING_REVIEW','VERIFIED','REJECTED')),
 verification_note text,
 verified_by_auth_user_id uuid,
 verified_at timestamptz,
 created_by_auth_user_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((verification_status='VERIFIED' AND verified_by_auth_user_id IS NOT NULL AND verified_at IS NOT NULL AND length(coalesce(verification_note,''))>=12) OR verification_status<>'VERIFIED')
);
CREATE INDEX IF NOT EXISTS idx_n07_evidence_application ON public.candidate_application_evidence(application_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n07_evidence_status ON public.candidate_application_evidence(verification_status,evidence_type);
CREATE TABLE IF NOT EXISTS public.candidate_application_submission_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 submission_ref text NOT NULL UNIQUE,
 application_id uuid NOT NULL REFERENCES public.candidate_applications(id) ON DELETE RESTRICT,
 candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
 opportunity_id uuid NOT NULL REFERENCES public.candidate_opportunities(id) ON DELETE RESTRICT,
 requested_by_auth_user_id uuid NOT NULL,
 delivery_mode text NOT NULL CHECK(delivery_mode IN ('INTERNAL_ADAPTER','EXTERNAL_PORTAL','EMAIL','MANUAL_ONLY','IN_PERSON')),
 job_status text NOT NULL CHECK(job_status IN ('PREPARED','AUTHORIZED','MANUAL_REQUIRED','DISPATCHING','PROVIDER_ACKNOWLEDGED','FAILED','CANCELLED')),
 adapter_key text NOT NULL DEFAULT 'NONE_CONFIGURED',
 idempotency_key text NOT NULL UNIQUE,
 authorized_by_auth_user_id uuid,
 authorized_at timestamptz,
 dispatched_at timestamptz,
 provider_acknowledged_at timestamptz,
 provider_reference text,
 failure_code text,
 failure_note text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((job_status IN ('AUTHORIZED','DISPATCHING','PROVIDER_ACKNOWLEDGED') AND authorized_by_auth_user_id IS NOT NULL AND authorized_at IS NOT NULL) OR job_status NOT IN ('AUTHORIZED','DISPATCHING','PROVIDER_ACKNOWLEDGED')),
 CHECK ((job_status='PROVIDER_ACKNOWLEDGED' AND provider_acknowledged_at IS NOT NULL AND length(coalesce(provider_reference,''))>0) OR job_status<>'PROVIDER_ACKNOWLEDGED')
);
CREATE INDEX IF NOT EXISTS idx_n07_submission_queue ON public.candidate_application_submission_jobs(job_status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n07_submission_candidate ON public.candidate_application_submission_jobs(candidate_id,created_at DESC);
ALTER TABLE public.platform_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_application_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_application_submission_jobs ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.platform_reviewers TO service_role;
GRANT SELECT,INSERT,UPDATE ON public.candidate_application_evidence TO service_role;
GRANT SELECT,INSERT,UPDATE ON public.candidate_application_submission_jobs TO service_role;
DROP POLICY IF EXISTS n07_service_reviewers ON public.platform_reviewers;
CREATE POLICY n07_service_reviewers ON public.platform_reviewers FOR ALL TO service_role USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS n07_service_evidence ON public.candidate_application_evidence;
CREATE POLICY n07_service_evidence ON public.candidate_application_evidence FOR ALL TO service_role USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS n07_service_submission_jobs ON public.candidate_application_submission_jobs;
CREATE POLICY n07_service_submission_jobs ON public.candidate_application_submission_jobs FOR ALL TO service_role USING(true) WITH CHECK(true);
ALTER TABLE public.candidate_application_events DROP CONSTRAINT IF EXISTS candidate_application_events_event_type_check;
ALTER TABLE public.candidate_application_events ADD CONSTRAINT candidate_application_events_event_type_check CHECK(event_type IN (
 'APPLICATION_CREATED','READINESS_CHECKED','STATUS_CHANGED','EVIDENCE_ATTACHED','MANUAL_PACKAGE_CREATED','MANUAL_ACTION_RECORDED',
 'EVIDENCE_VERIFIED','EVIDENCE_REJECTED','SUBMISSION_AUTHORIZED','SUBMISSION_ATTEMPT_CREATED','SUBMISSION_DISPATCHED',
 'PROVIDER_ACKNOWLEDGED','PROVIDER_STATUS_RECORDED','PROVIDER_OUTCOME_RECORDED','REVIEW_DECISION_RECORDED'
));
COMMENT ON TABLE public.platform_reviewers IS 'Reviewer roles are provisioned by an authorised operator; there is no self-enrolment endpoint.';
COMMENT ON TABLE public.candidate_application_evidence IS 'Evidence locator and SHA-256 fingerprint plus explicit reviewer verification attestation; not proof merely because a reference was supplied.';
COMMENT ON TABLE public.candidate_application_submission_jobs IS 'Controlled submission workflow ledger. A prepared or authorised job is not a provider submission; adapters are disabled unless separately configured.';
