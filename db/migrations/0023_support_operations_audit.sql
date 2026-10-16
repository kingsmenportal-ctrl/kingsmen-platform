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

CREATE OR REPLACE FUNCTION public.update_support_ticket_as_operator(
  p_ticket_ref text,
  p_status text,
  p_assigned_to text,
  p_event_type text,
  p_note text,
  p_actor_user_id uuid,
  p_actor_email text,
  p_audit_ref text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_ticket public.candidate_support_tickets%ROWTYPE;
  v_old_status text;
  v_old_assignee text;
BEGIN
  IF NOT (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('founder', 'admin', 'super_admin')
    OR coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ?| ARRAY['founder','admin','super_admin']
  ) THEN
    RAISE EXCEPTION 'SUPPORT_OPERATOR_ROLE_REQUIRED';
  END IF;
  IF p_actor_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'SUPPORT_ACTOR_MISMATCH';
  END IF;
  IF p_status NOT IN ('OPEN','WAITING_ON_CANDIDATE','WAITING_ON_OPERATOR','RESOLVED','CLOSED') THEN
    RAISE EXCEPTION 'SUPPORT_STATUS_INVALID';
  END IF;
  IF p_event_type NOT IN ('ASSIGNED','STATUS_CHANGED','RESOLUTION_NOTE','INTERNAL_NOTE') THEN
    RAISE EXCEPTION 'SUPPORT_EVENT_TYPE_INVALID';
  END IF;
  IF char_length(coalesce(p_note,'')) < 4 OR char_length(p_note) > 2000 THEN
    RAISE EXCEPTION 'SUPPORT_NOTE_INVALID';
  END IF;
  IF p_assigned_to IS NOT NULL AND char_length(p_assigned_to) > 160 THEN
    RAISE EXCEPTION 'SUPPORT_ASSIGNEE_INVALID';
  END IF;
  IF p_audit_ref !~ '^[A-Za-z0-9][A-Za-z0-9_-]{7,99}$' THEN
    RAISE EXCEPTION 'SUPPORT_AUDIT_REF_INVALID';
  END IF;

  SELECT * INTO v_ticket
  FROM public.candidate_support_tickets
  WHERE ticket_ref = p_ticket_ref
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'SUPPORT_TICKET_NOT_FOUND'; END IF;

  v_old_status := v_ticket.status;
  v_old_assignee := v_ticket.assigned_to;
  UPDATE public.candidate_support_tickets
  SET status = p_status,
      assigned_to = p_assigned_to,
      updated_at = now(),
      closed_at = CASE WHEN p_status IN ('RESOLVED','CLOSED') THEN coalesce(closed_at, now()) ELSE NULL END
  WHERE id = v_ticket.id
  RETURNING * INTO v_ticket;

  INSERT INTO public.candidate_support_ticket_events (
    ticket_id, ticket_ref, event_type, from_status, to_status,
    from_assignee, to_assignee, note, actor_user_id, actor_email, audit_ref
  ) VALUES (
    v_ticket.id, v_ticket.ticket_ref, p_event_type, v_old_status, p_status,
    v_old_assignee, p_assigned_to, p_note, p_actor_user_id, coalesce(p_actor_email,''), p_audit_ref
  );

  RETURN jsonb_build_object(
    'ticket_ref', v_ticket.ticket_ref,
    'status', v_ticket.status,
    'assigned_to', v_ticket.assigned_to,
    'updated_at', v_ticket.updated_at,
    'closed_at', v_ticket.closed_at,
    'audit_ref', p_audit_ref
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_support_ticket_as_operator(text,text,text,text,text,uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_support_ticket_as_operator(text,text,text,text,text,uuid,text,text) TO authenticated;


-- Candidate-originated support requests enter the same canonical queue used by
-- founder operations. Candidate identity is derived from auth.uid(), never input.
CREATE OR REPLACE FUNCTION public.create_candidate_support_ticket(
  p_ticket_ref text,
  p_category text,
  p_priority text,
  p_title text,
  p_description text,
  p_evidence_ref text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_candidate_id uuid;
  v_ticket public.candidate_support_tickets%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'CANDIDATE_AUTH_REQUIRED' USING errcode='42501'; END IF;
  IF char_length(coalesce(p_ticket_ref,'')) NOT BETWEEN 8 AND 160
     OR char_length(coalesce(p_title,'')) NOT BETWEEN 4 AND 160
     OR char_length(coalesce(p_description,'')) NOT BETWEEN 10 AND 3000
     OR p_category NOT IN ('GENERAL','APPLICATION','DOCUMENTS','FINANCE','URGENT_BLOCKER','DISPUTE')
     OR p_priority NOT IN ('NORMAL','HIGH','URGENT') THEN
    RAISE EXCEPTION 'SUPPORT_TICKET_INPUT_INVALID' USING errcode='22023';
  END IF;

  SELECT c.id INTO v_candidate_id
    FROM public.candidates c WHERE c.owner_user_id = auth.uid();
  IF v_candidate_id IS NULL THEN
    RAISE EXCEPTION 'CANDIDATE_RECORD_NOT_FOUND' USING errcode='P0002';
  END IF;

  INSERT INTO public.candidate_support_tickets
    (ticket_ref,candidate_id,category,priority,status,title,description,evidence_ref)
  VALUES
    (p_ticket_ref,v_candidate_id,p_category,p_priority,'OPEN',p_title,p_description,nullif(p_evidence_ref,''))
  ON CONFLICT(ticket_ref) DO NOTHING;

  SELECT * INTO v_ticket FROM public.candidate_support_tickets WHERE ticket_ref=p_ticket_ref;
  IF v_ticket.id IS NULL OR v_ticket.candidate_id <> v_candidate_id THEN
    RAISE EXCEPTION 'SUPPORT_TICKET_REFERENCE_CONFLICT' USING errcode='23505';
  END IF;
  RETURN jsonb_build_object('created',true,'ticket_ref',v_ticket.ticket_ref,'status',v_ticket.status);
END;
$$;

REVOKE ALL ON FUNCTION public.create_candidate_support_ticket(text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_candidate_support_ticket(text,text,text,text,text,text) TO authenticated;
