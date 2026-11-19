-- Keep audit actor-role validation aligned with the dedicated role.
ALTER TABLE public.candidate_identity_review_audit
  DROP CONSTRAINT candidate_identity_review_audit_actor_role_check;
ALTER TABLE public.candidate_identity_review_audit
  ADD CONSTRAINT candidate_identity_review_audit_actor_role_check
  CHECK (actor_role = ANY (ARRAY[
    'CANDIDATE'::text,
    'PLATFORM_ADMIN'::text,
    'IDENTITY_REVIEWER'::text
  ]));

