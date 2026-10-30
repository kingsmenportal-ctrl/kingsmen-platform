-- N09 communications tables are backend-owned until candidate-scoped read policies exist.
-- Fail closed: no direct browser reads/writes of recipients, message bodies, consent,
-- delivery responses, quiet-hours, rate limits, or delivery/audit evidence.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'communication_templates',
    'communication_threads',
    'notification_outbox',
    'notification_delivery_attempts',
    'inbound_messages',
    'candidate_portal_messages',
    'urgent_whatsapp_escalations',
    'communication_quiet_hours',
    'communication_rate_limits',
    'message_evidence_ledger',
    'privacy_consent_records'
  ] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated', t);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role', t);
    END IF;
  END LOOP;
END
$$;

DROP POLICY IF EXISTS communication_templates_all ON public.communication_templates;
DROP POLICY IF EXISTS communication_threads_all ON public.communication_threads;
DROP POLICY IF EXISTS notification_outbox_all ON public.notification_outbox;
DROP POLICY IF EXISTS notification_delivery_attempts_all ON public.notification_delivery_attempts;
DROP POLICY IF EXISTS inbound_messages_all ON public.inbound_messages;
DROP POLICY IF EXISTS candidate_portal_messages_all ON public.candidate_portal_messages;
DROP POLICY IF EXISTS urgent_whatsapp_escalations_all ON public.urgent_whatsapp_escalations;
DROP POLICY IF EXISTS communication_quiet_hours_all ON public.communication_quiet_hours;
DROP POLICY IF EXISTS communication_rate_limits_all ON public.communication_rate_limits;
DROP POLICY IF EXISTS message_evidence_ledger_all ON public.message_evidence_ledger;

CREATE POLICY communication_templates_backend_only ON public.communication_templates
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY communication_threads_backend_only ON public.communication_threads
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY notification_outbox_backend_only ON public.notification_outbox
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY notification_delivery_attempts_backend_only ON public.notification_delivery_attempts
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY inbound_messages_backend_only ON public.inbound_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY candidate_portal_messages_backend_only ON public.candidate_portal_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY urgent_whatsapp_escalations_backend_only ON public.urgent_whatsapp_escalations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY communication_quiet_hours_backend_only ON public.communication_quiet_hours
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY communication_rate_limits_backend_only ON public.communication_rate_limits
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY message_evidence_ledger_backend_only ON public.message_evidence_ledger
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.notification_outbox IS
  'Backend-only notification outbox. Candidate delivery must be consent/policy checked server-side; no direct browser access.';
COMMENT ON TABLE public.notification_delivery_attempts IS
  'Backend-only delivery evidence; provider responses and recipient metadata are not exposed to browser roles.';
COMMENT ON TABLE public.privacy_consent_records IS
  'Backend-only POPIA consent ledger; consent must be checked by trusted server-side dispatch before non-essential messaging.';

DROP POLICY IF EXISTS privacy_consent_records_all ON public.privacy_consent_records;
CREATE POLICY privacy_consent_records_backend_only ON public.privacy_consent_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);
