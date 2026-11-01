insert into public.communication_templates
(template_key, template_name, channel, subject_template, body_template, purpose, allowed_when, requires_human_review, is_active)
values
('candidate.welcome.email','Candidate Welcome Email','EMAIL_PRIMARY','Welcome to Kingsmen','Hello {{candidate_name}}, your Kingsmen route house journey has started. We will ask only for missing or unclear information and keep proof for every step.','WELCOME',array['INTAKE_PENDING'],false,true),
('candidate.documents.request.email','Document Request Email','EMAIL_PRIMARY','Documents needed for your route','Hello {{candidate_name}}, we need these documents before execution can continue: {{document_list}}.','DOCUMENT_REQUEST',array['DOCUMENT_PENDING'],false,true),
('candidate.status.update.email','Status Update Email','EMAIL_PRIMARY','Kingsmen status update','Hello {{candidate_name}}, your current status is {{status}}. Reason: {{reason}}.','STATUS_UPDATE',array['INTAKE_PENDING','EVALUATION_PENDING','DOCUMENT_PENDING','EXECUTION_PENDING','COMPLETED','FAILED'],false,true),
('candidate.portal.message','Candidate Portal Message','PORTAL_INBOX',null,'{{message_body}}','PORTAL_STATUS',array['ANY'],false,true),
('candidate.map.ready.email','Manual Application Package Ready','EMAIL_PRIMARY','Your manual route package is ready','Hello {{candidate_name}}, a Manual Application Package is ready because the portal was blocked, down, OTP-gated, or unsafe for automation.','MAP_FALLBACK',array['EXECUTION_PENDING','FAILED'],true,true),
('candidate.urgent.whatsapp','Retired WhatsApp template — disabled','WHATSAPP_URGENT_ONLY',null,'Disabled by current channel policy.','RETIRED_CHANNEL',array[]::text[],true,false),
('candidate.sms.backup','Retired SMS template — disabled','SMS_BACKUP_ONLY',null,'Disabled by current channel policy.','RETIRED_CHANNEL',array[]::text[],true,false)
on conflict (template_key) do update set
  template_name = excluded.template_name,
  channel = excluded.channel,
  subject_template = excluded.subject_template,
  body_template = excluded.body_template,
  purpose = excluded.purpose,
  allowed_when = excluded.allowed_when,
  requires_human_review = excluded.requires_human_review,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.communication_quiet_hours
(quiet_ref, name, timezone, starts_at_local, ends_at_local, applies_to_channels, emergency_override_allowed)
values
('quiet.za.night','South Africa Night Quiet Hours','Africa/Johannesburg','20:00','07:00',array['EMAIL_PRIMARY'],false)
on conflict (quiet_ref) do update set
  name = excluded.name,
  timezone = excluded.timezone,
  starts_at_local = excluded.starts_at_local,
  ends_at_local = excluded.ends_at_local,
  applies_to_channels = excluded.applies_to_channels,
  emergency_override_allowed = excluded.emergency_override_allowed,
  is_active = true;

insert into public.communication_rate_limits
(limit_ref, channel, window_name, max_count, current_count, reset_at, status, details)
values
('limit.email.daily','EMAIL_PRIMARY','DAILY',800,0,now() + interval '1 day','NORMAL','{"doctrine":"email primary"}'::jsonb),
('limit.whatsapp.daily','WHATSAPP_URGENT_ONLY','DAILY',25,0,now() + interval '1 day','NORMAL','{"doctrine":"disabled by current channel policy"}'::jsonb),
('limit.sms.daily','SMS_BACKUP_ONLY','DAILY',100,0,now() + interval '1 day','NORMAL','{"doctrine":"disabled by current channel policy"}'::jsonb),
('limit.portal.daily','PORTAL_INBOX','DAILY',2000,0,now() + interval '1 day','NORMAL','{"doctrine":"portal visible status"}'::jsonb)
on conflict (limit_ref) do update set
  max_count = excluded.max_count,
  status = excluded.status,
  details = excluded.details,
  updated_at = now();
