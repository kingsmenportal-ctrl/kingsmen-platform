-- Trigger functions are invoked by PostgreSQL triggers, never via PostgREST RPC.
-- Remove the default PUBLIC execute grant and all direct client-role execution.
REVOKE ALL ON FUNCTION public.guard_candidate_application_submission_truth() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_candidate_application_submission_truth() FROM anon;
REVOKE ALL ON FUNCTION public.guard_candidate_application_submission_truth() FROM authenticated;
REVOKE ALL ON FUNCTION public.guard_candidate_outcome_evidence_truth() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_candidate_outcome_evidence_truth() FROM anon;
REVOKE ALL ON FUNCTION public.guard_candidate_outcome_evidence_truth() FROM authenticated;
