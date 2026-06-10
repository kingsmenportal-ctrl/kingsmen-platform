insert into public.observability_runtime_config (config_key, config_value, enabled, doctrine_note)
values
('OBSERVABILITY_RUNTIME_ENABLED', '{"enabled":true}', true, 'N13 observability runtime is enabled.'),
('FOUNDER_REPORTS_ENABLED', '{"morning":"08:00","midday":"13:00","evening":"18:00","timezone":"Africa/Johannesburg"}', true, 'Founder receives daily operational visibility reports.'),
('EMAIL_FIRST_REPORT_DELIVERY', '{"primary":"EMAIL","secondary":"PORTAL","urgent":"WHATSAPP_URGENT"}', true, 'Email remains primary report delivery.'),
('WHATSAPP_URGENT_ONLY_INCIDENTS', '{"allowedSeverities":["SEV1","SEV2"],"nonUrgentBlocked":true}', true, 'WhatsApp escalation is urgent-only.'),
('INCIDENT_EVIDENCE_REQUIRED', '{"closureRequiresEvidence":true,"requiresCauseReasonFixPath":true}', true, 'Incident closure requires evidence, cause, reason, and fix path.'),
('ORACLE_LITE_CAPACITY_MONITOR', '{"ocpu":4,"memoryGb":24,"startingActiveCandidateCap":500}', true, 'Oracle Lite capacity monitor is locked to real starting cap discipline.'),
('NO_FALSE_GREEN_HEALTH', '{"greenRequiresNoOpenSev1":true,"greenRequiresMetricsOk":true}', true, 'No false green health status.'),
('CANDIDATE_PRIVACY_IN_REPORTS', '{"redactSensitiveData":true,"aggregateByDefault":true}', true, 'Candidate privacy must be protected in reports.')
on conflict (config_key) do update set
  config_value = excluded.config_value,
  enabled = excluded.enabled,
  doctrine_note = excluded.doctrine_note,
  updated_at = now();