insert into public.orchestrator_runtime_config (config_key, config_value, config_scope, locked) values
('BACKEND_ORCHESTRATOR_CONTROLS_STATE','true'::jsonb,'ORCHESTRATOR',true),
('N8N_WORKERS_ARE_THIN','true'::jsonb,'ORCHESTRATOR',true),
('WORKFLOW_RESULT_REQUIRED','true'::jsonb,'ORCHESTRATOR',true),
('SAME_STATE_WORKERS_DO_NOT_ADVANCE_STATE','true'::jsonb,'ORCHESTRATOR',true),
('W24_ROUTES_THROUGH_W17','true'::jsonb,'ORCHESTRATOR',true),
('PLAYWRIGHT_SCOUT_ONLY','true'::jsonb,'ORCHESTRATOR',true),
('MANUAL_FALLBACK_FOR_BLOCKED_PORTALS','true'::jsonb,'ORCHESTRATOR',true),
('ORACLE_LITE_ACTIVE_CANDIDATE_CAP','500'::jsonb,'CAPACITY',true)
on conflict (config_key) do update set config_value = excluded.config_value, updated_at = now();

insert into public.orchestrator_capacity_lanes (lane_key, lane_name, max_parallel_runs, throttle_seconds, lane_status, notes) values
('LOW','Low priority lane',1,20,'OPEN','Slow non-urgent queue.'),
('NORMAL','Normal operations lane',3,8,'OPEN','Default Oracle Lite queue.'),
('HIGH','High priority lane',2,5,'OPEN','Paid priority and deadline-sensitive queue.'),
('URGENT','Urgent incident lane',1,2,'OPEN','Urgent controlled lane; no retry storms.'),
('FOUNDER_OVERRIDE','Founder override lane',1,1,'OPEN','Founder-controlled lane with audit trail.')
on conflict (lane_key) do update set
  lane_name = excluded.lane_name,
  max_parallel_runs = excluded.max_parallel_runs,
  throttle_seconds = excluded.throttle_seconds,
  lane_status = excluded.lane_status,
  notes = excluded.notes,
  updated_at = now();

insert into public.orchestrator_worker_registry
(worker_code, worker_name, worker_kind, target_state, is_same_state_worker, requires_w17_gate, requires_human_approval, can_dispatch_playwright, notes)
values
('W00','Template Registry','GOVERNANCE','SAME',true,false,false,false,'Same-state registry worker.'),
('W01','Kingsmen Intake Web','INTAKE','EVALUATION_PENDING',false,false,false,false,'Intake claim/commit/heartbeat worker.'),
('W02','MSB Evaluate','EVALUATION','DOCUMENT_PENDING',false,false,false,false,'Evaluation worker.'),
('W03','MSB Execute','EXECUTION','COMPLETED',false,false,true,false,'Execution worker requires submission boundary approval where applicable.'),
('W04','MSB Govern','GOVERNANCE','SAME',true,false,true,false,'Governance same-state worker.'),
('W05','Playwright Trigger','PLAYWRIGHT','SAME',true,false,false,true,'Probe/scout only; blocked sources create MAP handoff.'),
('W06','MSB Defer','GOVERNANCE','DOCUMENT_PENDING',false,false,false,false,'Defer worker.'),
('W07','Document Uploaded','DOCUMENT','EXECUTION_PENDING',false,false,false,false,'Document readiness worker.'),
('W08','MSB Status','STATUS','SAME',true,false,false,false,'Status check worker.'),
('W09','Comms Inbound','COMMUNICATION','SAME',true,false,false,false,'Inbound communications worker.'),
('W10','MSB Fee','FINANCE','EXECUTION_PENDING',false,false,true,false,'Fee/payment worker; no refund/payment finality by AI.'),
('W11','MSB Content','CONTENT','DOCUMENT_PENDING',false,false,false,false,'Content/doc request worker.'),
('W12','Outreach Inbound','OUTREACH','INTAKE_PENDING',false,false,false,false,'Outreach-to-intake worker.'),
('W13','Social Generate','CONTENT','SAME',true,false,false,false,'Same-state social/content worker.'),
('W14','Analytics Request','ANALYTICS','SAME',true,false,false,false,'Analytics read worker.'),
('W15','System Insight Generator','ANALYTICS','SAME',true,false,true,false,'Override insight worker; cannot silently govern.'),
('W16','Sovereign Kernel','KERNEL','SAME',true,false,true,false,'Kernel same-state governance.'),
('W17','Sovereign Kernel v2','KERNEL','SAME',true,false,true,false,'Command gate used by W24 routing.'),
('W24','W24 Command','COMMAND','SAME',true,true,true,false,'Command worker must route through W17 before dispatch.')
on conflict (worker_code) do update set
  worker_name = excluded.worker_name,
  worker_kind = excluded.worker_kind,
  target_state = excluded.target_state,
  is_same_state_worker = excluded.is_same_state_worker,
  requires_w17_gate = excluded.requires_w17_gate,
  requires_human_approval = excluded.requires_human_approval,
  can_dispatch_playwright = excluded.can_dispatch_playwright,
  active = true,
  notes = excluded.notes,
  updated_at = now();

insert into public.orchestrator_state_guards
(guard_ref, from_state, to_state, guard_name, required_evidence, human_approval_required, blocked_by_default)
values
('GUARD_NEW_TO_INTAKE','NEW','INTAKE_PENDING','Start intake after candidate contact or route request',array['candidate_ref'],false,false),
('GUARD_INTAKE_TO_EVALUATION','INTAKE_PENDING','EVALUATION_PENDING','Smart intake complete or enough evidence captured',array['candidate_profile','intake_evidence'],false,false),
('GUARD_EVALUATION_TO_DOCUMENT','EVALUATION_PENDING','DOCUMENT_PENDING','Evaluation completed with route requirements',array['evaluation_result','source_confidence'],false,false),
('GUARD_DOCUMENT_TO_EXECUTION','DOCUMENT_PENDING','EXECUTION_PENDING','Document readiness approved',array['document_readiness_snapshot'],false,false),
('GUARD_EXECUTION_TO_COMPLETED','EXECUTION_PENDING','COMPLETED','Official execution completed or manual proof captured',array['submission_evidence','official_or_manual_proof'],true,false),
('GUARD_ANY_TO_FAILED','ANY','FAILED','Failure must include reason and fix path',array['failure_reason','fix_path'],false,false),
('GUARD_SAME_STATE','ANY','SAME','Same-state workers cannot advance workflow state',array['worker_result'],false,false),
('GUARD_OFFICIAL_SUBMISSION','EXECUTION_PENDING','COMPLETED','Official submission finality boundary',array['approval_ref','evidence_ref'],true,false),
('GUARD_REFUND_PAYMENT','ANY','SAME','Refund and payment finality boundary',array['finance_evidence','human_approval'],true,false),
('GUARD_PRIVACY_FRAUD','ANY','SAME','Privacy, fraud, and hard-blocker boundary',array['governance_evidence','human_approval'],true,false)
on conflict (guard_ref) do update set
  from_state = excluded.from_state,
  to_state = excluded.to_state,
  guard_name = excluded.guard_name,
  required_evidence = excluded.required_evidence,
  human_approval_required = excluded.human_approval_required,
  blocked_by_default = excluded.blocked_by_default,
  active = true;