-- N20 Final Assembly seed values
-- Markers: FINAL_SYSTEM_LOCK PRODUCTION_READINESS ORACLE_LITE_DISCIPLINE FOUNDER_FINAL_AUTHORITY

insert into public.system_runtime_config (key, value, description)
values
  ('N20_FINAL_ASSEMBLY_ENABLED', '"true"', 'Final assembly and system lock module is enabled.'),
  ('KINGSMEN_RELEASE_SCOPE', '"500 active operational candidates; all national route categories enabled; caps limit volume not capability."', 'Locked launch scope.'),
  ('KINGSMEN_ORACLE_LITE_DISCIPLINE', '"true"', 'Oracle Lite realistic deployment discipline remains required.'),
  ('KINGSMEN_POSTGRES_TRUTH', '"true"', 'PostgreSQL remains the truth vault.'),
  ('KINGSMEN_AIRTABLE_MIRROR_ONLY', '"true"', 'Airtable remains a mirror and operational view, not the source of truth.'),
  ('KINGSMEN_N8N_THIN_WORKERS', '"true"', 'n8n workers remain stateless thin workers with one Airtable write and one backend result POST.'),
  ('KINGSMEN_EMAIL_PRIMARY', '"true"', 'Email remains the primary communication nervous system.'),
  ('KINGSMEN_WHATSAPP_URGENT_ONLY', '"true"', 'WhatsApp remains urgent-only and cannot become routine bulk communication.'),
  ('KINGSMEN_NO_FAKE_CLAIMS', '"true"', 'No fake status, deadlines, acceptance, funding, payment, refund, or AI governance claims.'),
  ('KINGSMEN_FOUNDER_FINAL_AUTHORITY', '"true"', 'Founder/operator authority remains required for hard governance decisions.')
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

insert into public.release_module_registry
  (module_key, module_name, phase_order, release_status, owner_boundary, truth_source, has_validator, has_report)
values
  ('N00', 'Constitution / Doctrine Lock', 0, 'locked', 'doctrine', 'repo', true, true),
  ('N01', 'Monorepo / Oracle Lite Runtime', 1, 'validated', 'runtime', 'repo', true, true),
  ('N02', 'Backend API Kernel / State Machine', 2, 'validated', 'backend', 'postgres', true, true),
  ('N03', 'PostgreSQL Truth Vault', 3, 'validated', 'database', 'postgres', true, true),
  ('N04', 'Candidate Core / Portal', 4, 'validated', 'candidate', 'postgres', true, true),
  ('N05', 'Document Vault', 5, 'validated', 'documents', 'postgres', true, true),
  ('N06', 'Route Universe / Application Workbench', 6, 'validated', 'routes', 'postgres', true, true),
  ('N07', 'Airtable Sync', 7, 'validated', 'mirror', 'postgres', true, true),
  ('N08', 'Control Plane', 8, 'validated', 'operator', 'postgres', true, true),
  ('N09', 'Communications', 9, 'validated', 'communications', 'postgres', true, true),
  ('N10', 'Finance / PayFast', 10, 'validated', 'finance', 'postgres', true, true),
  ('N11', 'AI Decision', 11, 'validated', 'ai_advisory', 'postgres', true, true),
  ('N12', 'Governance', 12, 'validated', 'governance', 'postgres', true, true),
  ('N13', 'Observability / Reports / Incidents', 13, 'validated', 'observability', 'postgres', true, true),
  ('N14', 'Integrations / Workflow Connectors', 14, 'validated', 'integrations', 'postgres', true, true),
  ('N15', 'Opportunity Engine / Source Intelligence', 15, 'validated', 'opportunity', 'postgres', true, true),
  ('N16', 'Orchestrator / Execution Runtime', 16, 'validated', 'orchestrator', 'postgres', true, true),
  ('N17', 'Founder Control Plane / Command Ops', 17, 'validated', 'founder_ops', 'postgres', true, true),
  ('N18', 'Public Website / Route House Front Door', 18, 'validated', 'public_site', 'postgres', true, true),
  ('N19', 'Candidate Mobile / Public-to-Portal Experience', 19, 'validated', 'candidate_mobile', 'postgres', true, true),
  ('N20', 'Final Assembly / System Lock / Production Readiness', 20, 'locked', 'release', 'postgres', true, true)
on conflict (module_key) do update set
  module_name = excluded.module_name,
  phase_order = excluded.phase_order,
  release_status = excluded.release_status,
  owner_boundary = excluded.owner_boundary,
  truth_source = excluded.truth_source,
  has_validator = excluded.has_validator,
  has_report = excluded.has_report;

insert into public.system_release_locks
  (release_key, release_name, lock_status, lock_reason, locked_by, locked_at, doctrine_snapshot)
values
  (
    'oracle_lite_founder_release',
    'Kingsmen Meta Ultra National - Oracle Lite Founder Release',
    'locked',
    'N00-N20 repo-materialized system lock for controlled launch readiness; future work must be repairs, deployment wiring, DB apply, UI routing, CI, or evidence-backed enhancements.',
    'founder-primary',
    now(),
    '{
      "active_candidate_cap": 500,
      "postgres_truth": true,
      "airtable_mirror_only": true,
      "email_primary": true,
      "whatsapp_urgent_only": true,
      "payfast_provider_boundary": true,
      "all_sectors_open": true,
      "caps_limit_volume_not_scope": true,
      "oracle_lite_realistic": true
    }'::jsonb
  )
on conflict (release_key) do update set
  release_name = excluded.release_name,
  lock_status = excluded.lock_status,
  lock_reason = excluded.lock_reason,
  locked_by = excluded.locked_by,
  locked_at = excluded.locked_at,
  doctrine_snapshot = excluded.doctrine_snapshot;

insert into public.production_readiness_checks
  (check_key, check_group, title, description, severity, status, remediation)
values
  ('repo_validators_present', 'repo', 'N-series validators present', 'Each repo-materialized phase must have a validator or validation evidence.', 'required', 'passed', 'Run phase validators and repair any missing validator outputs.'),
  ('database_migrations_ordered', 'database', 'Database migrations ordered', 'Migration numbers must remain sequential and non-conflicting.', 'required', 'passed', 'Inspect db/migrations and repair numbering before applying to production database.'),
  ('secrets_not_committed', 'security', 'Secrets not committed', 'No live API keys, PayFast passphrases, database URLs, or Airtable keys may be committed.', 'required', 'pending', 'Run secret scan before production deployment and use environment variables only.'),
  ('database_backup_drill', 'backup', 'Database backup drill', 'Production database backup and restore drill must be proven before launch.', 'required', 'pending', 'Run backup export and restore test using staging database evidence.'),
  ('email_channel_ready', 'communications', 'Email channel ready', 'Email must be configured before routine candidate operations.', 'required', 'pending', 'Configure email provider credentials and send test messages to founder address.'),
  ('whatsapp_urgent_boundary', 'communications', 'WhatsApp urgent-only boundary', 'WhatsApp may only handle urgent cases and must not run routine bulk reminders.', 'required', 'passed', 'Keep N09/N19 policy checks and Control Plane approvals active.'),
  ('payfast_sandbox_tested', 'finance', 'PayFast sandbox tested', 'Finance must not mark payments successful without provider evidence.', 'required', 'pending', 'Complete sandbox checkout, cancel, return, and ITN receipt test before live activation.'),
  ('rls_review_required', 'security', 'RLS review required', 'RLS policies must be reviewed before production public access.', 'required', 'pending', 'Run database advisor/security review and tighten service-only policies before public launch.'),
  ('playwright_manual_fallback', 'automation', 'Playwright manual fallback ready', 'CAPTCHA, OTP, down portals, and manual-only routes must create MAP handoffs.', 'required', 'passed', 'Keep MAP fallback and manual handoff gates enabled.'),
  ('founder_daily_reports', 'operations', 'Founder daily reports configured', 'Morning, midday, evening, incident, finance, document, route, and capacity reports must be available.', 'recommended', 'passed', 'Use N13 reports and N17 founder brief panels.')
on conflict (check_key) do update set
  check_group = excluded.check_group,
  title = excluded.title,
  description = excluded.description,
  severity = excluded.severity,
  status = excluded.status,
  remediation = excluded.remediation,
  updated_at = now();

insert into public.launch_gate_decisions
  (gate_key, gate_name, gate_status, required_before, decision_by, decision_reason)
values
  ('gate_repo_lock', 'Repo lock gate', 'open', 'DB apply / staging deploy', 'founder-primary', 'N00-N20 materialized and validators passed.'),
  ('gate_database_apply', 'Database apply gate', 'manual_review', 'staging runtime', 'founder-primary', 'Apply migrations only when DATABASE_URL points to intended database.'),
  ('gate_secret_wiring', 'Secret wiring gate', 'closed', 'production runtime', null, 'Live secrets must be wired outside git.'),
  ('gate_payment_live', 'Payment live gate', 'closed', 'paid candidates', null, 'PayFast sandbox and ITN verification required before live payment activation.'),
  ('gate_public_launch', 'Public launch gate', 'closed', 'public users', null, 'Public launch requires DB apply, secrets, email, PayFast, RLS, backup, and incident readiness.'),
  ('gate_500_candidate_cap', '500 active candidate cap gate', 'manual_review', 'first active candidates', 'founder-primary', 'Cap is operational candidates, not concurrent browser users.')
on conflict (gate_key) do update set
  gate_name = excluded.gate_name,
  gate_status = excluded.gate_status,
  required_before = excluded.required_before,
  decision_by = excluded.decision_by,
  decision_reason = excluded.decision_reason;

insert into public.deployment_environment_registry
  (environment_key, environment_name, environment_type, provider, status, allowed_capacity, secrets_required, secrets_committed)
values
  ('local_windows', 'Founder Windows local repo', 'local', 'Windows PowerShell + Git', 'configured', 1, '[]'::jsonb, false),
  ('oracle_lite', 'Oracle Lite runtime target', 'production', 'Oracle Cloud Free Tier Ampere A1', 'not_connected', 500, '["DATABASE_URL","EMAIL_PROVIDER_KEY","PAYFAST_MERCHANT_ID","PAYFAST_MERCHANT_KEY","PAYFAST_PASSPHRASE","AIRTABLE_API_KEY"]'::jsonb, false),
  ('staging_db', 'Staging database', 'staging', 'PostgreSQL/Supabase/Neon optional', 'not_connected', 50, '["DATABASE_URL"]'::jsonb, false),
  ('backup_export', 'Backup export store', 'backup', 'Encrypted file/object storage', 'not_connected', 0, '["BACKUP_ENCRYPTION_KEY"]'::jsonb, false)
on conflict (environment_key) do update set
  environment_name = excluded.environment_name,
  environment_type = excluded.environment_type,
  provider = excluded.provider,
  status = excluded.status,
  allowed_capacity = excluded.allowed_capacity,
  secrets_required = excluded.secrets_required,
  secrets_committed = false;

insert into public.backup_restore_drills
  (drill_key, environment_key, drill_type, status, scheduled_frequency)
values
  ('db_backup_daily', 'oracle_lite', 'database_backup', 'pending', 'daily'),
  ('db_restore_monthly', 'staging_db', 'database_restore', 'pending', 'monthly'),
  ('repo_clone_weekly', 'local_windows', 'repo_clone', 'pending', 'weekly'),
  ('secrets_rotation_quarterly', 'oracle_lite', 'secrets_rotation', 'pending', 'quarterly')
on conflict (drill_key) do update set
  environment_key = excluded.environment_key,
  drill_type = excluded.drill_type,
  status = excluded.status,
  scheduled_frequency = excluded.scheduled_frequency;

insert into public.operational_runbooks
  (runbook_key, title, scenario, owner_role, severity, steps, automation_allowed, human_approval_required)
values
  (
    'portal_blocked_map',
    'Portal blocked / MAP fallback',
    'A portal is blocked by CAPTCHA, OTP, outage, maintenance, or manual-only process.',
    'operator',
    'urgent',
    '["Stop automation attempt","Record portal health evidence","Generate MAP package","Notify candidate by email","Escalate WhatsApp only if deadline urgent","Keep backend state controlled"]'::jsonb,
    true,
    true
  ),
  (
    'payment_dispute',
    'Payment evidence dispute',
    'Candidate says payment succeeded but PayFast evidence is missing or contradictory.',
    'founder',
    'urgent',
    '["Do not mark payment successful","Check PayFast ITN/evidence ledger","Request proof if needed","Create finance review item","Founder approves final correction"]'::jsonb,
    false,
    true
  ),
  (
    'source_conflict',
    'Source conflict / deadline uncertainty',
    'Official source, aggregator, candidate claim, or portal data conflict.',
    'operator',
    'normal',
    '["Prefer official source","Mark route confidence manual_review","Pause automatic claim","Create source review task","Only publish verified deadline after evidence"]'::jsonb,
    false,
    true
  ),
  (
    'cap_pressure',
    '500 active candidate cap pressure',
    'Active candidates approach or exceed safe Oracle Lite launch cap.',
    'founder',
    'critical',
    '["Throttle new activations","Keep free previews allowed","Prioritize paid active routes","Review queue drain report","Increase capacity only after evidence"]'::jsonb,
    true,
    true
  )
on conflict (runbook_key) do update set
  title = excluded.title,
  scenario = excluded.scenario,
  owner_role = excluded.owner_role,
  severity = excluded.severity,
  steps = excluded.steps,
  automation_allowed = excluded.automation_allowed,
  human_approval_required = excluded.human_approval_required;

insert into public.final_system_manifest_snapshots
  (snapshot_key, release_key, active_candidate_cap, route_scope, doctrine_summary, module_count, validation_summary)
values
  (
    'n20_oracle_lite_founder_snapshot',
    'oracle_lite_founder_release',
    500,
    'Universities, universities of technology, comprehensive universities, TVET, SETA/QCTO/skills, learnerships, employers/internships, bursaries/scholarships, accommodation, and verified private colleges remain open from day 1.',
    'Kingsmen is a private route house / private route command house. PostgreSQL is truth. Airtable is mirror-only. Backend controls state. n8n workers are thin. Email is primary. WhatsApp urgent-only. PayFast handles payments. AI advises but does not govern hard outcomes.',
    21,
    '{"N00_N20":"repo_materialized","validators":"present","release_lock":"locked","production_gate":"manual_review_before_live"}'::jsonb
  )
on conflict (snapshot_key) do update set
  release_key = excluded.release_key,
  active_candidate_cap = excluded.active_candidate_cap,
  route_scope = excluded.route_scope,
  doctrine_summary = excluded.doctrine_summary,
  module_count = excluded.module_count,
  validation_summary = excluded.validation_summary;