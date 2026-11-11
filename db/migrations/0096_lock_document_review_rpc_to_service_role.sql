-- Reviewer identity is validated by the candidate-private-documents Edge Function before service-role RPC.
-- Do not expose the review transaction directly to candidate JWTs.
revoke all on function public.review_candidate_private_document(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.review_candidate_private_document(uuid,uuid,text,text,text) to service_role;
