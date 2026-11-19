-- N05/N13: cover the composite ownership FK used to prevent document/application cross-linking.
-- The existing application_id-only index does not cover the full (application_id, candidate_id) key.
begin;
create index if not exists candidate_private_documents_application_owner_idx
  on public.candidate_private_documents (application_id, candidate_id)
  where application_id is not null;
comment on index public.candidate_private_documents_application_owner_idx is
  'Covers candidate_private_documents_application_owner_fk and supports owner-safe application/document joins.';
commit;
