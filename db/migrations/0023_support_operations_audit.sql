-- Founder-controlled support operations: durable event history and role-scoped access.
-- This migration intentionally does not migrate the candidate-local JSON supportRequests
-- array; staff operations act only on canonical candidate_support_tickets rows.

ALTER TABLE public.candidate_support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_candidate_support_tickets ON public.candidate_support_tickets;
DROP POLICY IF EXISTS founder_support_ticket_select ON public.candidate_support_tickets;
DROP POLICY IF EXISTS founder_support_ticket_update ON public.candidate_support_tickets;

CREATE POLICY founder_support_ticket_select ON public.candidate_support_tickets
  FOR SELECT TO authenticated
  USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('founder', 'admin', 'super_admin')
    OR coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ?| ARRAY['founder','admin','super_admin']
  );

CREATE POLICY founder_support_ticket_update ON public.candidate_support_tickets
  FOR UPDATE TO authenticated
  USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('founder', 'admin', 'super_admin')
    OR coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ?| ARRAY['founder','admin','super_admin']
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('founder', 'admin', 'super_admin')
    OR coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ?| ARRAY['founder','admin','super_admin']
  );

CREATE TABLE IF NOT EXISTS public.candidate_support_ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.candidate_support_tickets(id) ON DELETE CASCADE,
  ticket_ref text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('ASSIGNED','STATUS_CHANGED','RESOLUTION_NOTE','INTERNAL_NOTE')),
  from_status text,
  to_status text,
  from_assignee text,
  to_assignee text,
  note text NOT NULL CHECK (char_length(note) BETWEEN 4 AND 2000),
  actor_user_id uuid NOT NULL,
  actor_email text NOT NULL DEFAULT '',
  audit_ref text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_events_ticket_created
  ON public.candidate_support_ticket_events(ticket_id, created_at DESC);

ALTER TABLE public.candidate_support_ticket_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS founder_support_ticket_events_select ON public.candidate_support_ticket_events;
DROP POLICY IF EXISTS founder_support_ticket_events_insert ON public.candidate_support_ticket_events;

CREATE POLICY founder_support_ticket_events_select ON public.candidate_support_ticket_events
  FOR SELECT TO authenticated
  USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('founder', 'admin', 'super_admin')
    OR coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ?| ARRAY['founder','admin','super_admin']
  );

CREATE POLICY founder_support_ticket_events_insert ON public.candidate_support_ticket_events
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('founder', 'admin', 'super_admin')
      OR coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ?| ARRAY['founder','admin','super_admin']
    )
    AND actor_user_id = auth.uid()
  );

COMMENT ON TABLE public.candidate_support_ticket_events IS
  'Append-only founder/operator audit timeline for canonical candidate support tickets; no external notifications are implied.';
