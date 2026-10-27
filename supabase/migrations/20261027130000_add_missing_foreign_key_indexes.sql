-- Add child-side indexes for foreign keys flagged by the staging performance advisor.
-- These indexes are additive and do not alter authorization or row-level security.
CREATE INDEX IF NOT EXISTS candidate_identity_review_evidence_reviewed_by_idx
  ON public.candidate_identity_review_evidence (reviewed_by);

CREATE INDEX IF NOT EXISTS candidate_identity_review_evidence_supabase_user_id_idx
  ON public.candidate_identity_review_evidence (supabase_user_id);

CREATE INDEX IF NOT EXISTS candidate_master_target_application_owner_idx
  ON public.candidate_master_application_targets (application_id, candidate_id)
  WHERE application_id IS NOT NULL;
