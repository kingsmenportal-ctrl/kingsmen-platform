-- Keep the canonical unique partial index and remove its identical duplicate.
-- Both definitions were inspected in staging; predicates and key columns match exactly.
-- Dropping only the suffixed duplicate preserves the one-open-request invariant.
DROP INDEX IF EXISTS public.candidate_identity_review_one_open_request_per_user_idx;
