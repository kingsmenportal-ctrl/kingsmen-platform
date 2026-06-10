insert into public.integration_connectors
(connector_key, connector_name, connector_type, trust_boundary, enabled, requires_secret, secret_ref, endpoint_ref, doctrine_note)
values
('n8n_worker_gateway','n8n Worker Gateway','N8N','WORKER',false,true,'N8N_WEBHOOK_SECRET','N8N_BASE_URL','Stateless thin workers only.'),
('airtable_mirror_gateway','Airtable Mirror Gateway','AIRTABLE','MIRROR',false,true,'AIRTABLE_TOKEN','AIRTABLE_BASE_REGISTRY','Mirror only, PostgreSQL wins.'),
('playwright_probe_service','Playwright Probe Service','PLAYWRIGHT','SCOUT',false,true,'PLAYWRIGHT_SERVICE_TOKEN','PLAYWRIGHT_SERVICE_URL','Scout/probe only; MAP fallback on CAPTCHA, OTP, portal down, blocked.'),
('payfast_itn_gateway','PayFast ITN Gateway','PAYFAST','PAYMENT_PROVIDER',false,true,'PAYFAST_PASSPHRASE','PAYFAST_ITN_URL','Payment evidence only; refunds require governance.'),
('email_delivery_gateway','Email Delivery Gateway','EMAIL','COMMUNICATION_PROVIDER',false,true,'EMAIL_PROVIDER_SECRET','EMAIL_PROVIDER_ENDPOINT','Email primary communications connector.'),
('whatsapp_urgent_gateway','WhatsApp Urgent Gateway','WHATSAPP','COMMUNICATION_PROVIDER',false,true,'WHATSAPP_PROVIDER_SECRET','WHATSAPP_PROVIDER_ENDPOINT','WhatsApp urgent-only connector.')
on conflict (connector_key) do update set doctrine_note = excluded.doctrine_note, updated_at = now();

insert into public.workflow_connector_registry
(workflow_code, workflow_name, target_state, connector_key, enabled, same_state_worker, standard_contract_required, max_airtable_writes, max_backend_result_posts, doctrine_note)
values
('W00','Template Registry','SAME','n8n_worker_gateway',false,true,true,1,1,'Same-state template registry.'),
('W01','Kingsmen Intake Web','EVALUATION_PENDING','n8n_worker_gateway',false,false,true,1,1,'Intake duplicate gate, claim, commit, heartbeat.'),
('W02','MSB Evaluate','DOCUMENT_PENDING','n8n_worker_gateway',false,false,true,1,1,'Evaluation worker.'),
('W03','MSB Execute','COMPLETED','n8n_worker_gateway',false,false,true,1,1,'Execution worker; no portal bypass.'),
('W04','MSB Govern','SAME','n8n_worker_gateway',false,true,true,1,1,'Same-state governance worker.'),
('W05','Playwright Trigger','SAME','playwright_probe_service',false,true,true,1,1,'Playwright scout/probe with MAP fallback.'),
('W06','MSB Defer','DOCUMENT_PENDING','n8n_worker_gateway',false,false,true,1,1,'Defer worker.'),
('W07','Document Uploaded','EXECUTION_PENDING','n8n_worker_gateway',false,false,true,1,1,'Document readiness worker.'),
('W08','MSB Status','SAME','n8n_worker_gateway',false,true,true,1,1,'Same-state status worker.'),
('W09','Comms Inbound','SAME','email_delivery_gateway',false,true,true,1,1,'Inbound communications worker.'),
('W10','MSB Fee','EXECUTION_PENDING','payfast_itn_gateway',false,false,true,1,1,'Payment evidence worker.'),
('W11','MSB Content','DOCUMENT_PENDING','n8n_worker_gateway',false,false,true,1,1,'Content/document worker.'),
('W12','Outreach Inbound','INTAKE_PENDING','n8n_worker_gateway',false,false,true,1,1,'Outreach-to-intake worker.'),
('W13','Social Generate','SAME','n8n_worker_gateway',false,true,true,1,1,'Social same-state worker.'),
('W14','Analytics Request','SAME','n8n_worker_gateway',false,true,true,1,1,'Analytics same-state worker.'),
('W15','System Insight Generator','SAME','n8n_worker_gateway',false,true,true,1,1,'W15 insight suggests; governance decides.'),
('W16','Sovereign Kernel','SAME','n8n_worker_gateway',false,true,true,1,1,'Kernel same-state worker.'),
('W17','Sovereign Kernel v2','SAME','n8n_worker_gateway',false,true,true,1,1,'W24 routes through W17.'),
('W24','W24 Command','SAME','n8n_worker_gateway',false,true,true,1,1,'W24 -> W17 -> worker -> /workflow/result.')
on conflict (workflow_code) do update set doctrine_note = excluded.doctrine_note, updated_at = now();