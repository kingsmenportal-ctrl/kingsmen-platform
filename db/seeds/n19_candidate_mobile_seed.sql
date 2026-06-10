-- N19 Candidate Mobile seed values
-- Markers: MOBILE_WEB_FIRST PUBLIC_TO_PORTAL_HANDOFF EMAIL_PRIMARY WHATSAPP_URGENT_ONLY SMS_BACKUP_ONLY

insert into public.system_runtime_config (key, value, description)
values
  ('CANDIDATE_MOBILE_ENABLED', '"true"', 'Candidate mobile web experience is enabled.'),
  ('CANDIDATE_MOBILE_NATIVE_APP_DEFERRED', '"true"', 'Native mobile app is deferred; responsive portal is the Oracle Lite realistic route.'),
  ('PUBLIC_TO_PORTAL_HANDOFF_ENABLED', '"true"', 'Public website leads can be claimed into the candidate portal using secure claim links.'),
  ('MOBILE_EMAIL_PRIMARY', '"true"', 'Candidate mobile notifications keep email as the primary channel.'),
  ('MOBILE_WHATSAPP_URGENT_ONLY', '"true"', 'WhatsApp remains urgent-only and cannot become routine bulk communication.'),
  ('MOBILE_SMS_BACKUP_ONLY', '"true"', 'SMS remains backup-only.'),
  ('MOBILE_NO_FAKE_STATUS', '"true"', 'Mobile status cards must not invent official results, deadlines, admissions status, NSFAS outcomes, or employer decisions.'),
  ('MOBILE_SMART_FORM_NO_RETYPE', '"true"', 'Mobile onboarding must reuse verified CV/document extraction and only ask for missing or uncertain fields.')
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

insert into public.candidate_mobile_quick_actions
  (action_key, label, description, target_module, action_boundary, display_order)
values
  ('continue_intake', 'Continue Intake', 'Resume a smart intake draft without retyping details already extracted from CV or uploaded documents.', 'candidate-core', 'candidate_may_submit_missing_fields_only', 10),
  ('upload_document', 'Upload Document', 'Send a missing document into the Document Vault for verification and readiness scoring.', 'document-vault', 'candidate_upload_only_no_final_verdict', 20),
  ('view_route_status', 'View Route Status', 'View route readiness, application workbench status, and manual fallback instructions.', 'route-universe', 'read_only_no_state_override', 30),
  ('open_destiny_map', 'Open Destiny Map', 'See candidate-facing route map preview and recommendations with confidence explanations.', 'ai-decision', 'read_only_no_guarantee_claims', 40),
  ('request_support', 'Request Support', 'Open an auditable support request using email-first communication rules.', 'communications', 'email_primary_whatsapp_urgent_only', 50),
  ('payment_status', 'Payment Status', 'View invoice/payment evidence and package activation state without changing finance decisions.', 'finance', 'read_only_no_refund_decision', 60),
  ('manual_package', 'Manual Package', 'View a Manual Application Package when automation is blocked by OTP, CAPTCHA, portal outage, or manual-only routes.', 'orchestrator', 'read_only_manual_instructions', 70)
on conflict (action_key) do update set
  label = excluded.label,
  description = excluded.description,
  target_module = excluded.target_module,
  action_boundary = excluded.action_boundary,
  display_order = excluded.display_order,
  is_enabled = true;