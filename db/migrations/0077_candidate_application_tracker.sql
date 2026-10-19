-- Candidate-owned application tracker. This records candidate-reported progress only;
-- it never asserts that an institution received or accepted an application.
CREATE UNIQUE INDEX IF NOT EXISTS candidate_workspace_saved_opportunities_id_candidate_uidx
  ON public.candidate_workspace_saved_opportunities (id, candidate_id);

CREATE TABLE IF NOT EXISTS public.candidate_application_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  saved_opportunity_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'SAVED',
  candidate_note text NOT NULL DEFAULT '',
  evidence_reference text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_application_tracker_saved_opportunity_owner_fk
    FOREIGN KEY (saved_opportunity_id, candidate_id)
    REFERENCES public.candidate_workspace_saved_opportunities(id, candidate_id) ON DELETE CASCADE,
  CONSTRAINT candidate_application_tracker_status_check CHECK (
    status IN ('SAVED','PREPARING','READY_TO_APPLY','SUBMITTED_CANDIDATE_REPORTED',
      'RESPONSE_RECEIVED','INTERVIEW','OFFER_RECEIVED','REJECTED','CLOSED')
  ),
  CONSTRAINT candidate_application_tracker_note_length CHECK (length(candidate_note) <= 1200),
  CONSTRAINT candidate_application_tracker_evidence_length CHECK (length(evidence_reference) <= 500),
  CONSTRAINT candidate_application_tracker_submitted_evidence_check CHECK (
    status <> 'SUBMITTED_CANDIDATE_REPORTED' OR length(trim(evidence_reference)) > 0
  ),
  UNIQUE(candidate_id, saved_opportunity_id)
);

CREATE INDEX IF NOT EXISTS candidate_application_tracker_owner_updated_idx
  ON public.candidate_application_tracker(candidate_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.candidate_application_tracker_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  candidate_note text NOT NULL DEFAULT '',
  evidence_reference text NOT NULL DEFAULT '',
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS candidate_application_tracker_events_owner_time_idx
  ON public.candidate_application_tracker_events(candidate_id, changed_at DESC);

ALTER TABLE public.candidate_application_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_application_tracker_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS candidate_application_tracker_read_own ON public.candidate_application_tracker;
CREATE POLICY candidate_application_tracker_read_own ON public.candidate_application_tracker
  FOR SELECT USING (candidate_id = (SELECT public.current_verified_candidate_id()));
DROP POLICY IF EXISTS candidate_application_tracker_insert_own ON public.candidate_application_tracker;
CREATE POLICY candidate_application_tracker_insert_own ON public.candidate_application_tracker
  FOR INSERT WITH CHECK (candidate_id = (SELECT public.current_verified_candidate_id()));
DROP POLICY IF EXISTS candidate_application_tracker_update_own ON public.candidate_application_tracker;
CREATE POLICY candidate_application_tracker_update_own ON public.candidate_application_tracker
  FOR UPDATE USING (candidate_id = (SELECT public.current_verified_candidate_id()))
  WITH CHECK (candidate_id = (SELECT public.current_verified_candidate_id()));
DROP POLICY IF EXISTS candidate_application_tracker_delete_own ON public.candidate_application_tracker;
CREATE POLICY candidate_application_tracker_delete_own ON public.candidate_application_tracker
  FOR DELETE USING (candidate_id = (SELECT public.current_verified_candidate_id()));

DROP POLICY IF EXISTS candidate_application_tracker_events_read_own ON public.candidate_application_tracker_events;
CREATE POLICY candidate_application_tracker_events_read_own ON public.candidate_application_tracker_events
  FOR SELECT USING (candidate_id = (SELECT public.current_verified_candidate_id()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_application_tracker TO authenticated;
GRANT SELECT ON public.candidate_application_tracker_events TO authenticated;

CREATE OR REPLACE FUNCTION public.record_candidate_application_tracker_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.candidate_application_tracker_events
    (tracker_id, candidate_id, previous_status, new_status, candidate_note, evidence_reference)
  VALUES
    (NEW.id, NEW.candidate_id, CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END,
     NEW.status, NEW.candidate_note, NEW.evidence_reference);
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.record_candidate_application_tracker_event() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS candidate_application_tracker_audit_insert ON public.candidate_application_tracker;
CREATE TRIGGER candidate_application_tracker_audit_insert
  AFTER INSERT ON public.candidate_application_tracker
  FOR EACH ROW EXECUTE FUNCTION public.record_candidate_application_tracker_event();
DROP TRIGGER IF EXISTS candidate_application_tracker_audit_update ON public.candidate_application_tracker;
CREATE TRIGGER candidate_application_tracker_audit_update
  AFTER UPDATE OF status, candidate_note, evidence_reference ON public.candidate_application_tracker
  FOR EACH ROW WHEN (
    OLD.status IS DISTINCT FROM NEW.status OR OLD.candidate_note IS DISTINCT FROM NEW.candidate_note
    OR OLD.evidence_reference IS DISTINCT FROM NEW.evidence_reference
  ) EXECUTE FUNCTION public.record_candidate_application_tracker_event();
