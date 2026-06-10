insert into public.founder_runtime_config (config_key, config_value, config_scope, locked) values
('FOUNDER_CONTROL_IS_COMMAND_COCKPIT','true'::jsonb,'FOUNDER_OPS',true),
('FOUNDER_COMMANDS_ROUTE_THROUGH_N12_AND_N16','true'::jsonb,'FOUNDER_OPS',true),
('NO_DIRECT_STATE_MACHINE_BYPASS','true'::jsonb,'FOUNDER_OPS',true),
('NO_DIRECT_OFFICIAL_SUBMISSION_FROM_FOUNDER_PANEL','true'::jsonb,'FOUNDER_OPS',true),
('NO_DIRECT_REFUND_OR_FRAUD_FINALITY_FROM_FOUNDER_PANEL','true'::jsonb,'FOUNDER_OPS',true),
('PHONE_COCKPIT_ENABLED','true'::jsonb,'FOUNDER_OPS',true),
('DAILY_BRIEF_TYPES','["MORNING","MIDDAY","EVENING","INCIDENT","WEEKLY","MONTHLY"]'::jsonb,'FOUNDER_OPS',true),
('CANDIDATE_COMMS_EMAIL_FIRST_WHATSAPP_URGENT_ONLY','true'::jsonb,'FOUNDER_OPS',true),
('ORACLE_LITE_ACTIVE_CANDIDATE_CAP','500'::jsonb,'CAPACITY',true)
on conflict (config_key) do update set config_value = excluded.config_value, updated_at = now();

insert into public.founder_operator_profiles
(operator_ref, display_name, role_key, phone_access_enabled, emergency_contact_enabled, active)
values
('founder:kingsmenportal','Kingsmen Founder','FOUNDER',true,true,true),
('auditor:system','System Auditor','READ_ONLY_AUDITOR',false,false,true)
on conflict (operator_ref) do update set
  display_name = excluded.display_name,
  role_key = excluded.role_key,
  phone_access_enabled = excluded.phone_access_enabled,
  emergency_contact_enabled = excluded.emergency_contact_enabled,
  active = true,
  updated_at = now();

insert into public.founder_command_catalog
(command_key, command_name, command_group, command_intent, routes_through, requires_approval, requires_evidence, allowed_from_phone, dangerous, notes)
values
('INSPECT_CANDIDATE','Inspect Candidate','INSPECT','Open candidate operational picture without changing state.','N08_CONTROL_PLANE_READ_ONLY',false,true,true,false,'Read-only founder view.'),
('INSPECT_APPLICATION','Inspect Application','INSPECT','Open application workbench status, blockers, and evidence.','N08_CONTROL_PLANE_READ_ONLY',false,true,true,false,'Read-only founder view.'),
('SET_PRIORITY_LANE','Set Priority Lane','PRIORITIZE','Request priority lane change while preserving equal sector access.','N12_GOVERNANCE_AND_N16_ORCHESTRATOR',true,true,true,true,'Priority affects order and intensity only.'),
('PAUSE_WORKER','Pause Worker','PAUSE_RESUME','Pause a worker or connector through governance and capacity controls.','N12_GOVERNANCE_AND_N16_ORCHESTRATOR',true,true,true,true,'Used for incidents and unsafe automation.'),
('RESUME_WORKER','Resume Worker','PAUSE_RESUME','Resume a paused worker after reason and fix path are recorded.','N12_GOVERNANCE_AND_N16_ORCHESTRATOR',true,true,true,true,'Requires evidence of safe resume.'),
('APPROVE_MANUAL_PACKAGE','Approve MAP','APPROVAL','Approve a Manual Application Package for candidate-facing use.','N12_GOVERNANCE_AND_N16_ORCHESTRATOR',true,true,true,true,'Does not claim official submission success.'),
('REJECT_MANUAL_PACKAGE','Reject MAP','APPROVAL','Reject a Manual Application Package and request correction.','N12_GOVERNANCE_AND_N16_ORCHESTRATOR',true,true,true,false,'Must state correction reason.'),
('REQUEST_MAP_HANDOFF','Request MAP Handoff','MAP','Create manual handoff for blocked, CAPTCHA, OTP, down, or manual-only portal.','N12_GOVERNANCE_AND_N16_ORCHESTRATOR',false,true,true,false,'Uses N16 manual handoff path.'),
('REQUEST_PHOENIX_FALLBACK','Request Phoenix Fallback','PHOENIX','Ask system to reroute after failure using evidence-backed fallback.','N12_GOVERNANCE_AND_N16_ORCHESTRATOR',true,true,true,true,'No false rescue claims.'),
('ESCALATE_INCIDENT','Escalate Incident','INCIDENT','Escalate incident with cause, current risk, and fix path.','N12_GOVERNANCE_AND_N16_ORCHESTRATOR',false,true,true,false,'Creates visible escalation.'),
('REQUEST_DOCUMENT_REVIEW','Request Document Review','DOCUMENTS','Send document issue to human/operator review.','N12_GOVERNANCE_AND_N16_ORCHESTRATOR',false,true,true,false,'Fraud flags are not final decisions.'),
('REQUEST_SOURCE_REVIEW','Request Source Review','SOURCE_REVIEW','Send uncertain source/deadline/fee/requirement to source confidence review.','N12_GOVERNANCE_AND_N16_ORCHESTRATOR',false,true,true,false,'No fake source claims.'),
('REQUEST_COMMS_ESCALATION','Request Comms Escalation','COMMS','Request communication escalation while preserving email-first doctrine.','N12_GOVERNANCE_AND_N16_ORCHESTRATOR',true,true,true,true,'WhatsApp urgent-only.'),
('REQUEST_REFUND_REVIEW','Request Refund Review','FINANCE','Create refund review request; founder panel cannot process final refund directly.','N12_GOVERNANCE_AND_N16_ORCHESTRATOR',true,true,true,true,'Finance finality boundary applies.'),
('BUILD_MORNING_BRIEF','Build Morning Brief','REPORT','Build founder morning brief.','N13_OBSERVABILITY_ONLY',false,true,true,false,'Read/report command.'),
('BUILD_MIDDAY_BRIEF','Build Midday Brief','REPORT','Build founder midday brief.','N13_OBSERVABILITY_ONLY',false,true,true,false,'Read/report command.'),
('BUILD_EVENING_BRIEF','Build Evening Brief','REPORT','Build founder evening brief.','N13_OBSERVABILITY_ONLY',false,true,true,false,'Read/report command.'),
('CAPACITY_CHECK','Capacity Check','CAPACITY','Inspect Oracle Lite cap and queue pressure.','N13_OBSERVABILITY_ONLY',false,true,true,false,'Cap controls throughput only.')
on conflict (command_key) do update set
  command_name = excluded.command_name,
  command_group = excluded.command_group,
  command_intent = excluded.command_intent,
  routes_through = excluded.routes_through,
  requires_approval = excluded.requires_approval,
  requires_evidence = excluded.requires_evidence,
  allowed_from_phone = excluded.allowed_from_phone,
  dangerous = excluded.dangerous,
  active = true,
  notes = excluded.notes,
  updated_at = now();

insert into public.founder_mobile_cards
(card_key, card_title, card_group, card_order, enabled, requires_attention_threshold, summary_query_hint)
values
('TODAY_COMMANDS','Today''s Commands','TODAY',10,true,'WARNING','Open commands requiring founder action.'),
('URGENT_CANDIDATES','Urgent Candidates','CANDIDATES',20,true,'WARNING','Show candidates with deadlines, blockers, or harm signals.'),
('QUEUE_PRESSURE','Queue Pressure','QUEUE',30,true,'WARNING','Show active runs, waiting approvals, manual backlog, and delayed dispatch.'),
('DOCUMENT_PIPELINE','Document Pipeline','DOCUMENTS',40,true,'WARNING','Show missing, rejected, suspicious, or ready documents.'),
('ROUTE_SOURCE_REVIEW','Route Source Review','ROUTES',50,true,'WARNING','Show low-confidence sources, deadlines, fees, and requirements.'),
('FINANCE_REVIEW','Finance Review','FINANCE',60,true,'WARNING','Show payments, unpaid invoices, refund reviews, and plan risks.'),
('COMMS_ESCALATION','Comms Escalation','COMMS',70,true,'WARNING','Show urgent messages and email-first communication health.'),
('INCIDENTS','Incidents','INCIDENTS',80,true,'WARNING','Show open incidents with cause and fix path.'),
('MAP_HANDOFFS','MAP Handoffs','MAP',90,true,'WATCH','Show manual packages and blocked portals.'),
('PHOENIX_FALLBACKS','Phoenix Fallbacks','PHOENIX',100,true,'WATCH','Show failure reroutes and fallback plans.'),
('SYSTEM_HEALTH','System Health','HEALTH',110,true,'WARNING','Show backend, database, worker, connector, and report health.'),
('CAPACITY_CAP','Capacity Cap','CAPACITY',120,true,'WARNING','Show Oracle Lite 500 active-candidate cap pressure.')
on conflict (card_key) do update set
  card_title = excluded.card_title,
  card_group = excluded.card_group,
  card_order = excluded.card_order,
  enabled = excluded.enabled,
  requires_attention_threshold = excluded.requires_attention_threshold,
  summary_query_hint = excluded.summary_query_hint,
  updated_at = now();