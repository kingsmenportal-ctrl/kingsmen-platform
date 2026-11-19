-- Correct the composite FK delete action: unlink a deleted checklist item without
-- nulling the required candidate owner. Add supporting indexes for workflow foreign keys.
ALTER TABLE public.candidate_private_documents
  DROP CONSTRAINT IF EXISTS candidate_private_documents_preparation_owner_fk;
ALTER TABLE public.candidate_private_documents
  ADD CONSTRAINT candidate_private_documents_preparation_owner_fk
  FOREIGN KEY (preparation_item_id, candidate_id)
  REFERENCES public.candidate_application_preparation_items(id, candidate_id)
  ON DELETE SET NULL (preparation_item_id);

CREATE INDEX IF NOT EXISTS candidate_application_tracker_saved_owner_idx
  ON public.candidate_application_tracker(saved_opportunity_id, candidate_id);
CREATE INDEX IF NOT EXISTS candidate_application_tracker_events_tracker_owner_idx
  ON public.candidate_application_tracker_events(tracker_id, candidate_id);
CREATE INDEX IF NOT EXISTS candidate_application_preparation_items_tracker_owner_idx
  ON public.candidate_application_preparation_items(tracker_id, candidate_id);
CREATE INDEX IF NOT EXISTS candidate_application_preparation_events_item_idx
  ON public.candidate_application_preparation_events(item_id);
CREATE INDEX IF NOT EXISTS candidate_application_preparation_events_tracker_owner_idx
  ON public.candidate_application_preparation_events(tracker_id, candidate_id);
CREATE INDEX IF NOT EXISTS candidate_identity_review_audit_candidate_idx
  ON public.candidate_identity_review_audit(candidate_id);
CREATE INDEX IF NOT EXISTS candidate_private_documents_preparation_owner_idx
  ON public.candidate_private_documents(preparation_item_id, candidate_id);
CREATE INDEX IF NOT EXISTS candidate_private_document_events_document_idx
  ON public.candidate_private_document_events(document_id);
CREATE INDEX IF NOT EXISTS candidate_private_document_reviews_candidate_idx
  ON public.candidate_private_document_reviews(candidate_id);
