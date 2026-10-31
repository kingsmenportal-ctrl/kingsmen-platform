-- Generic N15 date-only closing support. No opportunity rows are imported here.
-- A date-only close is a calendar date in the row's declared timezone; do not invent a timestamp.
BEGIN;

ALTER TABLE public.opportunity_deadlines
  ADD COLUMN IF NOT EXISTS closes_on date;

DO $deadline_representation$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.opportunity_deadlines'::regclass
      AND conname = 'opportunity_deadlines_close_representation_check'
  ) THEN
    ALTER TABLE public.opportunity_deadlines
      ADD CONSTRAINT opportunity_deadlines_close_representation_check
      CHECK (closes_on IS NULL OR closes_at IS NULL) NOT VALID;
  END IF;
END
$deadline_representation$;

ALTER TABLE public.opportunity_deadlines
  VALIDATE CONSTRAINT opportunity_deadlines_close_representation_check;

COMMENT ON COLUMN public.opportunity_deadlines.closes_on IS
  'Date-only application close date in the row timezone. Must not be combined with closes_at; no clock time is implied.';

CREATE INDEX IF NOT EXISTS opportunity_deadlines_programme_date_only_idx
  ON public.opportunity_deadlines (programme_ref, closes_on)
  WHERE closes_on IS NOT NULL AND deadline_status = 'CONFIRMED';

COMMIT;
