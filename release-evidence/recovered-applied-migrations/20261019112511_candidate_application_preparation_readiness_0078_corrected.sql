-- Candidate-managed application preparation checklists. "Ready" is a candidate report,
-- never an independently verified credential or institution requirement.
CREATE UNIQUE INDEX IF NOT EXISTS candidate_application_tracker_id_candidate_uidx
  ON public.candidate_application_tracker(id, candidate_id);

CREATE TABLE IF NOT EXISTS public.candidate_application_preparation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id uuid NOT NULL,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('DOCUMENT','TASK')),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 2 AND 160),
  candidate_note text NOT NULL DEFAULT '' CHECK (length(candidate_note) <= 1200),
  official_source_url text NOT NULL DEFAULT '' CHECK (length(official_source_url) <= 1000),
  evidence_reference text NOT NULL DEFAULT '' CHECK (length(evidence_reference) <= 1000),
  status text NOT NULL DEFAULT 'NOT_STARTED'
    CHECK (status IN ('NOT_STARTED','IN_PROGRESS','READY_CANDIDATE_REPORTED')),
  required_by_candidate boolean NOT NULL DEFAULT true,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_application_preparation_tracker_owner_fk
    FOREIGN KEY (tracker_id, candidate_id)
    REFERENCES public.candidate_application_tracker(id, candidate_id) ON DELETE CASCADE,
  CONSTRAINT candidate_application_preparation_source_https_check CHECK (
    official_source_url = '' OR official_source_url ~ '^https://'
  ),
  CONSTRAINT candidate_application_preparation_ready_evidence_check CHECK (
    status <> 'READY_CANDIDATE_REPORTED' OR length(trim(evidence_reference)) > 0
  )
);
CREATE INDEX IF NOT EXISTS candidate_application_preparation_owner_tracker_idx
  ON public.candidate_application_preparation_items(candidate_id, tracker_id, created_at);

CREATE TABLE IF NOT EXISTS public.candidate_application_preparation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.candidate_application_preparation_items(id) ON DELETE CASCADE,
  tracker_id uuid NOT NULL,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  actor_type text NOT NULL DEFAULT 'CANDIDATE' CHECK (actor_type IN ('CANDIDATE')),
  previous_status text,
  new_status text NOT NULL CHECK (new_status IN ('NOT_STARTED','IN_PROGRESS','READY_CANDIDATE_REPORTED')),
  item_title text NOT NULL CHECK (length(trim(item_title)) BETWEEN 2 AND 160),
  evidence_reference text NOT NULL DEFAULT '' CHECK (length(evidence_reference) <= 1000),
  changed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_application_preparation_event_tracker_owner_fk
    FOREIGN KEY (tracker_id, candidate_id)
    REFERENCES public.candidate_application_tracker(id, candidate_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS candidate_application_preparation_events_owner_time_idx
  ON public.candidate_application_preparation_events(candidate_id, changed_at DESC);

ALTER TABLE public.candidate_application_preparation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_application_preparation_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS candidate_application_preparation_items_read_own ON public.candidate_application_preparation_items;
CREATE POLICY candidate_application_preparation_items_read_own ON public.candidate_application_preparation_items
  FOR SELECT USING (candidate_id = (SELECT public.current_verified_candidate_id()));
DROP POLICY IF EXISTS candidate_application_preparation_items_insert_own ON public.candidate_application_preparation_items;
CREATE POLICY candidate_application_preparation_items_insert_own ON public.candidate_application_preparation_items
  FOR INSERT WITH CHECK (candidate_id = (SELECT public.current_verified_candidate_id()));
DROP POLICY IF EXISTS candidate_application_preparation_items_update_own ON public.candidate_application_preparation_items;
CREATE POLICY candidate_application_preparation_items_update_own ON public.candidate_application_preparation_items
  FOR UPDATE USING (candidate_id = (SELECT public.current_verified_candidate_id()))
  WITH CHECK (candidate_id = (SELECT public.current_verified_candidate_id()));
DROP POLICY IF EXISTS candidate_application_preparation_items_delete_own ON public.candidate_application_preparation_items;
CREATE POLICY candidate_application_preparation_items_delete_own ON public.candidate_application_preparation_items
  FOR DELETE USING (candidate_id = (SELECT public.current_verified_candidate_id()));
DROP POLICY IF EXISTS candidate_application_preparation_events_read_own ON public.candidate_application_preparation_events;
CREATE POLICY candidate_application_preparation_events_read_own ON public.candidate_application_preparation_events
  FOR SELECT USING (candidate_id = (SELECT public.current_verified_candidate_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_application_preparation_items TO authenticated;
GRANT SELECT ON public.candidate_application_preparation_events TO authenticated;

CREATE OR REPLACE FUNCTION public.record_candidate_application_preparation_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.candidate_application_preparation_events
    (item_id, tracker_id, candidate_id, previous_status, new_status, item_title, evidence_reference)
  VALUES (
    NEW.id, NEW.tracker_id, NEW.candidate_id,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END,
    NEW.status, NEW.title, NEW.evidence_reference
  );
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.record_candidate_application_preparation_event() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS candidate_application_preparation_event_insert ON public.candidate_application_preparation_items;
CREATE TRIGGER candidate_application_preparation_event_insert
  AFTER INSERT ON public.candidate_application_preparation_items
  FOR EACH ROW EXECUTE FUNCTION public.record_candidate_application_preparation_event();
DROP TRIGGER IF EXISTS candidate_application_preparation_event_update ON public.candidate_application_preparation_items;
CREATE TRIGGER candidate_application_preparation_event_update
  AFTER UPDATE OF status, title, evidence_reference ON public.candidate_application_preparation_items
  FOR EACH ROW WHEN (
    OLD.status IS DISTINCT FROM NEW.status OR OLD.title IS DISTINCT FROM NEW.title
    OR OLD.evidence_reference IS DISTINCT FROM NEW.evidence_reference
  ) EXECUTE FUNCTION public.record_candidate_application_preparation_event();


-- Composite key required by the private document vault to enforce that a document's
-- preparation item and candidate owner are the same row, not merely matching UUIDs.
CREATE UNIQUE INDEX IF NOT EXISTS candidate_application_preparation_items_id_candidate_uidx
  ON public.candidate_application_preparation_items(id, candidate_id);
