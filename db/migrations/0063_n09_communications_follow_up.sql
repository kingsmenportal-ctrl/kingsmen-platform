-- N09 Communications & Candidate Follow-up. Depends on N06/N07/N08 migrations.
CREATE TABLE IF NOT EXISTS public.candidate_communication_preferences (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 candidate_id uuid NOT NULL UNIQUE REFERENCES public.candidates(id) ON DELETE RESTRICT,
 email_address text, phone_e164 text, phone_verified_at timestamptz,
 email_transactional boolean NOT NULL DEFAULT false,
 whatsapp_urgent boolean NOT NULL DEFAULT false,
 sms_backup boolean NOT NULL DEFAULT false,
 preferences_updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by_auth_user_id uuid,
 CHECK(email_address IS NULL OR length(email_address)<=320),
 CHECK(phone_e164 IS NULL OR phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);
CREATE TABLE IF NOT EXISTS public.candidate_communications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), communication_ref text NOT NULL UNIQUE,
 candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
 application_id uuid REFERENCES public.candidate_applications(id) ON DELETE RESTRICT,
 outcome_id uuid REFERENCES public.candidate_outcomes(id) ON DELETE RESTRICT,
 event_key text NOT NULL, channel text NOT NULL CHECK(channel IN ('EMAIL','WHATSAPP','SMS','IN_APP')),
 priority text NOT NULL CHECK(priority IN ('NORMAL','URGENT')),
 recipient text NOT NULL, subject text, body text NOT NULL CHECK(length(body) BETWEEN 1 AND 5000),
 state text NOT NULL DEFAULT 'PREPARED' CHECK(state IN ('PREPARED','QUEUED','SENDING','SENT','DELIVERED','ACKNOWLEDGED','FAILED','CANCELLED')),
 idempotency_key text NOT NULL UNIQUE, consent_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
 attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 3),
 max_attempts integer NOT NULL DEFAULT 3 CHECK(max_attempts BETWEEN 1 AND 3),
 provider_message_id text, provider_delivery_event_id text,
 prepared_by_auth_user_id uuid NOT NULL, sent_at timestamptz, delivered_at timestamptz, acknowledged_at timestamptz,
 last_error_code text, next_attempt_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(channel <> 'WHATSAPP' OR priority='URGENT'),
 CHECK(state NOT IN ('SENT','DELIVERED','ACKNOWLEDGED') OR sent_at IS NOT NULL),
 CHECK(state NOT IN ('DELIVERED','ACKNOWLEDGED') OR (delivered_at IS NOT NULL AND provider_delivery_event_id IS NOT NULL)),
 CHECK(state <> 'ACKNOWLEDGED' OR acknowledged_at IS NOT NULL),
 CHECK(state NOT IN ('SENT','DELIVERED','ACKNOWLEDGED') OR provider_message_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_n09_communications_candidate ON public.candidate_communications(candidate_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n09_communications_queue ON public.candidate_communications(state,next_attempt_at,created_at);
CREATE INDEX IF NOT EXISTS idx_n09_communications_application ON public.candidate_communications(application_id,created_at DESC);
CREATE TABLE IF NOT EXISTS public.candidate_communication_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), communication_id uuid NOT NULL REFERENCES public.candidate_communications(id) ON DELETE RESTRICT,
 attempt_no integer NOT NULL CHECK(attempt_no BETWEEN 1 AND 3 OR (attempt_no=0 AND action='PREPARED')), action text NOT NULL CHECK(action IN ('PREPARED','SEND_REQUESTED','SENT','DELIVERED','FAILED','RETRY_SCHEDULED','ACKNOWLEDGED','CANCELLED')),
 provider_event_id text, provider_message_id text, error_code text, actor_auth_user_id uuid,
 details jsonb NOT NULL DEFAULT '{}'::jsonb, occurred_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(communication_id,attempt_no,action,provider_event_id)
);
CREATE INDEX IF NOT EXISTS idx_n09_attempts_communication ON public.candidate_communication_attempts(communication_id,occurred_at);
CREATE TABLE IF NOT EXISTS public.candidate_follow_up_tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_ref text NOT NULL UNIQUE,
 candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
 application_id uuid REFERENCES public.candidate_applications(id) ON DELETE RESTRICT,
 outcome_id uuid REFERENCES public.candidate_outcomes(id) ON DELETE RESTRICT,
 communication_id uuid REFERENCES public.candidate_communications(id) ON DELETE RESTRICT,
 task_type text NOT NULL CHECK(task_type IN ('CANDIDATE_REPLY','DOCUMENT_ACTION','APPLICATION_CHECK_IN','OUTCOME_NEXT_STEP','PROVIDER_FOLLOW_UP','MANUAL_REVIEW','OTHER')),
 title text NOT NULL CHECK(length(title) BETWEEN 3 AND 160), description text CHECK(description IS NULL OR length(description)<=2000),
 due_at timestamptz, status text NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','IN_PROGRESS','COMPLETED','CANCELLED','SNOOZED')),
 assigned_to_auth_user_id uuid, created_by_auth_user_id uuid NOT NULL, completed_by_auth_user_id uuid, completed_at timestamptz,
 completion_note text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_n09_tasks_candidate ON public.candidate_follow_up_tasks(candidate_id,status,due_at);
CREATE INDEX IF NOT EXISTS idx_n09_tasks_queue ON public.candidate_follow_up_tasks(status,due_at);
ALTER TABLE public.candidate_communication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_communication_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_follow_up_tasks ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE ON public.candidate_communication_preferences TO service_role;
GRANT SELECT,INSERT,UPDATE ON public.candidate_communications TO service_role;
GRANT SELECT,INSERT ON public.candidate_communication_attempts TO service_role;
GRANT SELECT,INSERT,UPDATE ON public.candidate_follow_up_tasks TO service_role;
DROP POLICY IF EXISTS n09_service_preferences ON public.candidate_communication_preferences;
CREATE POLICY n09_service_preferences ON public.candidate_communication_preferences FOR ALL TO service_role USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS n09_service_communications ON public.candidate_communications;
CREATE POLICY n09_service_communications ON public.candidate_communications FOR ALL TO service_role USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS n09_service_attempts ON public.candidate_communication_attempts;
CREATE POLICY n09_service_attempts ON public.candidate_communication_attempts FOR ALL TO service_role USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS n09_service_tasks ON public.candidate_follow_up_tasks;
CREATE POLICY n09_service_tasks ON public.candidate_follow_up_tasks FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE OR REPLACE FUNCTION public.guard_n09_communication_state() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.candidate_id IS DISTINCT FROM OLD.candidate_id OR NEW.application_id IS DISTINCT FROM OLD.application_id OR NEW.outcome_id IS DISTINCT FROM OLD.outcome_id OR NEW.event_key IS DISTINCT FROM OLD.event_key OR NEW.channel IS DISTINCT FROM OLD.channel OR NEW.priority IS DISTINCT FROM OLD.priority OR NEW.recipient IS DISTINCT FROM OLD.recipient OR NEW.subject IS DISTINCT FROM OLD.subject OR NEW.body IS DISTINCT FROM OLD.body OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key OR NEW.prepared_by_auth_user_id IS DISTINCT FROM OLD.prepared_by_auth_user_id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'communication identity/content is immutable'; END IF;
 IF NEW.attempt_count < OLD.attempt_count OR NEW.attempt_count > NEW.max_attempts THEN RAISE EXCEPTION 'invalid communication attempt count'; END IF;
 IF NEW.state IS DISTINCT FROM OLD.state AND NOT (
 (OLD.state='PREPARED' AND NEW.state IN ('QUEUED','CANCELLED')) OR
 (OLD.state='QUEUED' AND NEW.state IN ('SENDING','CANCELLED','FAILED')) OR
 (OLD.state='SENDING' AND NEW.state IN ('SENT','FAILED','QUEUED')) OR
 (OLD.state='SENT' AND NEW.state IN ('DELIVERED','FAILED')) OR
 (OLD.state='DELIVERED' AND NEW.state='ACKNOWLEDGED')
 ) THEN RAISE EXCEPTION 'invalid communication state transition'; END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS n09_communication_state_guard ON public.candidate_communications;
CREATE TRIGGER n09_communication_state_guard BEFORE UPDATE ON public.candidate_communications FOR EACH ROW EXECUTE FUNCTION public.guard_n09_communication_state();
CREATE OR REPLACE FUNCTION public.prevent_n09_ledger_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'N09 communication ledger is append-preserving'; END; $$;
DROP TRIGGER IF EXISTS n09_communications_no_delete ON public.candidate_communications;
CREATE TRIGGER n09_communications_no_delete BEFORE DELETE ON public.candidate_communications FOR EACH ROW EXECUTE FUNCTION public.prevent_n09_ledger_delete();
DROP TRIGGER IF EXISTS n09_attempts_no_update ON public.candidate_communication_attempts;
CREATE TRIGGER n09_attempts_no_update BEFORE UPDATE OR DELETE ON public.candidate_communication_attempts FOR EACH ROW EXECUTE FUNCTION public.prevent_n09_ledger_delete();
COMMENT ON TABLE public.candidate_communications IS 'Governed communication outbox; SENT is not DELIVERED, and DELIVERED is not ACKNOWLEDGED.';
COMMENT ON TABLE public.candidate_communication_attempts IS 'Append-only audit ledger for communication preparation, provider events, failures and retries.';
