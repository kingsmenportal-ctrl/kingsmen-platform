insert into public.control_plane_operator_profiles
(operator_ref, display_name, email, role, allowed_command_scopes, can_use_dangerous_actions)
values
('founder-primary', 'Kingsmen Founder', 'kingsmenportal@gmail.com', 'founder',
 array['read','queue','approve','route','document','finance','worker','report','kill_switch','capacity'], true)
on conflict (operator_ref) do update set
  display_name = excluded.display_name,
  email = excluded.email,
  role = excluded.role,
  allowed_command_scopes = excluded.allowed_command_scopes,
  can_use_dangerous_actions = excluded.can_use_dangerous_actions,
  updated_at = now();

insert into public.control_plane_command_catalog
(command_key, command_name, command_scope, description, requires_approval, dangerous, allowed_roles)
values
('queue.prioritize_candidate','Prioritize Candidate','queue','Move a candidate into a higher execution lane without skipping gates.',true,false,array['founder','operator']),
('route.phoenix_reroute','Phoenix Reroute','route','Controlled fallback routing after a failed or blocked application route.',true,true,array['founder']),
('route.manual_package_generate','Generate MAP','route','Generate a Manual Application Package with verified links, steps, fees, deadlines, and evidence.',true,false,array['founder','operator']),
('worker.restart','Restart Worker','worker','Request workflow worker restart through backend boundary.',true,true,array['founder']),
('kill_switch.enable','Enable Kill Switch','kill_switch','Enable a scoped operational kill switch.',true,true,array['founder']),
('capacity.set_throttle','Set Capacity Throttle','capacity','Apply throughput throttle for Oracle Lite capacity guard.',true,true,array['founder']),
('report.generate','Generate Operator Report','report','Generate founder reports without mutating data-plane state.',false,false,array['founder','operator','readonly']),
('communication.urgent_whatsapp','Urgent WhatsApp Escalation','queue','Escalate urgent issues only; email remains primary.',true,false,array['founder','support'])
on conflict (command_key) do update set
  command_name = excluded.command_name,
  command_scope = excluded.command_scope,
  description = excluded.description,
  requires_approval = excluded.requires_approval,
  dangerous = excluded.dangerous,
  allowed_roles = excluded.allowed_roles,
  is_active = true;

insert into public.control_plane_kill_switches
(switch_key, switch_name, scope, enabled, reason, changed_by_operator_ref)
values
('global.stop_all_execution','Global Stop All Execution','global',false,'Default unlocked. Critical incidents only.','founder-primary'),
('playwright.pause_portal_probe','Pause Playwright Portal Probe','playwright',false,'Use on CAPTCHA/OTP risk.','founder-primary'),
('communication.pause_whatsapp','Pause WhatsApp Escalations','communication',false,'WhatsApp urgent-only; email remains primary.','founder-primary'),
('airtable.pause_mirror','Pause Airtable Mirror','airtable',false,'Airtable mirror can pause without stopping PostgreSQL truth.','founder-primary')
on conflict (switch_key) do update set
  switch_name = excluded.switch_name,
  scope = excluded.scope,
  enabled = excluded.enabled,
  reason = excluded.reason,
  changed_by_operator_ref = excluded.changed_by_operator_ref,
  changed_at = now();

insert into public.control_plane_capacity_limits
(limit_key, limit_name, current_value, max_value, warn_at, throttle_at, stop_at, status, details)
values
('active_candidates','Active Candidate Cap',0,500,350,450,500,'NORMAL','{"law":"cap limits volume only"}'::jsonb),
('daily_application_dispatches','Daily Application Dispatch Cap',0,250,175,225,250,'NORMAL','{"oracleLite":"queue discipline"}'::jsonb),
('playwright_concurrency','Playwright Concurrency Cap',0,3,2,3,3,'NORMAL','{"boundary":"probe/scout only"}'::jsonb),
('email_daily_outbound','Email Daily Outbound Guard',0,800,600,750,800,'NORMAL','{"doctrine":"email primary"}'::jsonb),
('whatsapp_urgent_daily','WhatsApp Urgent Daily Guard',0,25,15,20,25,'NORMAL','{"doctrine":"urgent-only"}'::jsonb)
on conflict (limit_key) do update set
  current_value = excluded.current_value,
  max_value = excluded.max_value,
  warn_at = excluded.warn_at,
  throttle_at = excluded.throttle_at,
  stop_at = excluded.stop_at,
  status = excluded.status,
  details = excluded.details,
  measured_at = now();