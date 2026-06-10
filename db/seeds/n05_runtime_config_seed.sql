INSERT INTO system_runtime_config (key, value, description)
VALUES
  ('DOCUMENT_VAULT_ENABLED', '{"value": true}'::jsonb, 'Document Vault is enabled.'),
  ('DOCUMENTS_PRIVATE_BY_DEFAULT', '{"value": true}'::jsonb, 'Candidate documents are private by default.'),
  ('DOCUMENT_EXTRACTION_PREFILLS_SMART_INTAKE', '{"value": true}'::jsonb, 'Document extraction can prefill candidate smart intake.'),
  ('DOCUMENT_EXTRACTION_REQUIRES_CANDIDATE_CONFIRMATION', '{"value": true}'::jsonb, 'Extracted fields require candidate confirmation before trust upgrade.'),
  ('DOCUMENT_FRAUD_FLAGS_ARE_NOT_FINAL_DECISIONS', '{"value": true}'::jsonb, 'Fraud flags require review and are not final guilt decisions.'),
  ('DOCUMENT_MAX_FILE_SIZE_MB', '{"value": 15}'::jsonb, 'Starting upload size limit per document for Oracle Lite discipline.'),
  ('DOCUMENT_ALLOWED_MIME_TYPES', '{"value": ["application/pdf", "image/jpeg", "image/png", "image/webp"]}'::jsonb, 'Allowed document MIME types for initial vault.')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();