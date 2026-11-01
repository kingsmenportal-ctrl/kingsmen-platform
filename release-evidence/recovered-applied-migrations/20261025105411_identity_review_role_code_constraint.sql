-- Extend the registry vocabulary with the dedicated least-privilege identity role.
ALTER TABLE public.platform_reviewers
  DROP CONSTRAINT platform_reviewers_role_code_check;
ALTER TABLE public.platform_reviewers
  ADD CONSTRAINT platform_reviewers_role_code_check
  CHECK (role_code = ANY (ARRAY[
    'APPLICATION_REVIEWER'::text,
    'EVIDENCE_VERIFIER'::text,
    'PROVIDER_OPERATOR'::text,
    'FINANCE_REVIEWER'::text,
    'PLATFORM_ADMIN'::text,
    'IDENTITY_REVIEWER'::text
  ]));

