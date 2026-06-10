insert into public.airtable_base_registry
  (base_key, base_name, purpose, mirror_allowed, inbound_allowed, outbound_allowed)
values
  ('nexus_7', 'Kingsman Nexus-7', 'Candidate portal sessions, form drafts, onboarding, notifications, and portal mirror.', true, true, true),
  ('nexus_msb', 'Kingsman Nexus (MSB)', 'Student profiles, qualification profiles, sovereign council, and sync state mirror.', true, true, true),
  ('applications_hub', 'Applications Hub', 'Applications, timeline, war room, automation runs, and portal execution mirror.', true, false, true),
  ('ai_engine', 'AI Engine', 'Model configs, prompt templates, content logs, and AI execution mirror.', true, false, true),
  ('ai_decision_orchestration', 'AI Decision & Orchestration Engine', 'Destiny maps, predictions, optimization rules, and decision read mirror.', true, false, true),
  ('system_operations', 'System Operations', 'Health, capacity, errors, incident reports, and runtime mirror.', true, false, true),
  ('automation_control', 'Automation Control', 'Approvals queue, kill switches, rate limits, trigger rules, and workflow versions mirror.', true, true, true),
  ('communications_center', 'Communications Center', 'Messages, campaigns, tickets, and email-first communication ledger mirror.', true, true, true),
  ('programs_intelligence', 'Programs & Intelligence', 'Programs, institutions, requirements, SETA, bursary, accommodation, matching, and deadlines mirror.', true, false, true),
  ('financial_operations', 'Kingsmen Financial Operations', 'Invoices, payments, plans, orders, expenses, and finance read mirror.', true, false, true),
  ('partner_ecosystem', 'Partner Ecosystem Directory', 'Institutions, SETA providers, employers, bursary providers, portal DNA, fees, contacts, and health monitor mirror.', true, false, true),
  ('document_vault', 'Document Vault', 'Documents, document requests, AI analysis, verification, fraud, and storage monitoring mirror.', true, true, true)
on conflict (base_key) do update set
  base_name = excluded.base_name,
  purpose = excluded.purpose,
  mirror_allowed = excluded.mirror_allowed,
  inbound_allowed = excluded.inbound_allowed,
  outbound_allowed = excluded.outbound_allowed,
  updated_at = now();

insert into public.airtable_sync_targets
  (base_key, table_key, table_name, postgres_table, direction, sync_priority, mirror_frequency_seconds, inbound_requires_operator_review)
values
  ('applications_hub', 'applications', 'Applications', 'applications', 'POSTGRES_TO_AIRTABLE', 10, 120, true),
  ('applications_hub', 'timeline', 'Timeline', 'application_timeline', 'POSTGRES_TO_AIRTABLE', 20, 180, true),
  ('document_vault', 'documents', 'Documents', 'candidate_documents', 'POSTGRES_TO_AIRTABLE', 10, 120, true),
  ('document_vault', 'document_requests', 'Document Requests', 'document_requests', 'POSTGRES_TO_AIRTABLE', 10, 120, true),
  ('programs_intelligence', 'programs', 'Programs', 'route_programs', 'POSTGRES_TO_AIRTABLE', 40, 900, true),
  ('programs_intelligence', 'institutions', 'Institutions', 'route_institutions', 'POSTGRES_TO_AIRTABLE', 40, 900, true),
  ('partner_ecosystem', 'portal_dna', 'Portal DNA', 'portal_dna', 'POSTGRES_TO_AIRTABLE', 30, 600, true),
  ('partner_ecosystem', 'health_monitor', 'Health Monitor', 'portal_health_events', 'POSTGRES_TO_AIRTABLE', 20, 300, true),
  ('automation_control', 'approvals_queue', 'Approvals Queue', 'operator_approvals', 'BIDIRECTIONAL_REVIEWED', 5, 60, true),
  ('communications_center', 'messages', 'Messages', 'candidate_messages', 'POSTGRES_TO_AIRTABLE', 15, 180, true),
  ('financial_operations', 'invoices', 'Invoices', 'invoices', 'POSTGRES_TO_AIRTABLE', 15, 300, true),
  ('system_operations', 'health', 'Health', 'system_health_events', 'POSTGRES_TO_AIRTABLE', 25, 300, true),
  ('nexus_7', 'form_drafts', 'Form Drafts', 'candidate_form_drafts', 'AIRTABLE_TO_POSTGRES_INTAKE_ONLY', 10, 120, true),
  ('nexus_msb', 'student_profiles', 'Student Profiles', 'candidate_profiles', 'BIDIRECTIONAL_REVIEWED', 10, 180, true)
on conflict (base_key, table_key) do update set
  table_name = excluded.table_name,
  postgres_table = excluded.postgres_table,
  direction = excluded.direction,
  sync_priority = excluded.sync_priority,
  mirror_frequency_seconds = excluded.mirror_frequency_seconds,
  inbound_requires_operator_review = excluded.inbound_requires_operator_review,
  updated_at = now();