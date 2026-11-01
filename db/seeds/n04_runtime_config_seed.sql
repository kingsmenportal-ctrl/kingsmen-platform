INSERT INTO system_runtime_config (key, value, description)
VALUES
  ('CANDIDATE_SMART_INTAKE_ENABLED', '{"value": true}'::jsonb, 'Candidate intake pre-fills fields from CVs and documents.'),
  ('CANDIDATE_REVIEW_REQUIRED_FOR_EXTRACTED_FIELDS', '{"value": true}'::jsonb, 'Candidate confirms extracted fields before trust upgrade.'),
  ('OPERATOR_APPROVAL_REQUIRED_FOR_SENSITIVE_PROFILE_CHANGES', '{"value": true}'::jsonb, 'Sensitive changes require operator approval.'),
  ('CANDIDATE_EMAIL_PRIMARY', '{"value": true}'::jsonb, 'Email and secure portal are the only enabled candidate channels.'),
  ('CANDIDATE_WHATSAPP_URGENT_ONLY', '{"value": false}'::jsonb, 'WhatsApp is disabled by current Kingsmen channel policy.'),
  ('CANDIDATE_SMS_BACKUP_ONLY', '{"value": false}'::jsonb, 'SMS is disabled by current Kingsmen channel policy.'),
  ('CANDIDATE_SUCCESS_LOOP_ENABLED', '{"value": true}'::jsonb, 'Capture proof-backed outcomes and feedback without uncontrolled AI learning.')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();
