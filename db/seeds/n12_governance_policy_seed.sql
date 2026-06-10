insert into public.governance_runtime_config (config_key, config_value, enabled, doctrine_note)
values
('GOVERNANCE_RUNTIME_ENABLED', '{"enabled":true}', true, 'N12 central governance runtime is enabled.'),
('BACKEND_STATE_MACHINE_CONTROLS_FLOW', '{"enabled":true}', true, 'Backend state machine controls flow.'),
('AI_HARD_BOUNDARY', '{"blocked":["money","refunds","official_status","submissions","fraud","privacy","hard_blockers"]}', true, 'AI may suggest but must not govern hard decisions.'),
('NO_SILENT_OVERRIDE', '{"enabled":true}', true, 'No silent override.'),
('POPIA_PRIVACY_BOUNDARY', '{"lawful_basis_required":true,"evidence_required":true}', true, 'Privacy-sensitive processing requires lawful basis and evidence.'),
('SOURCE_CONFIDENCE_REQUIRED', '{"official_claims_minimum":"OFFICIAL_VERIFIED","route_recommendations_minimum":"MEDIUM"}', true, 'Source confidence must be attached to official claims and route recommendations.'),
('GROWTH_CAP_DISCIPLINE', '{"starting_active_candidate_cap":500,"quality_evidence_required_for_increase":true}', true, 'No growth cap increase without outcome-quality evidence.')
on conflict (config_key) do update set
  config_value = excluded.config_value,
  enabled = excluded.enabled,
  doctrine_note = excluded.doctrine_note,
  updated_at = now();

insert into public.governance_policies (policy_ref, policy_domain, policy_name, policy_version, enforcement_level, policy_status, policy_text, evidence_required, human_review_required)
values
('POL-AI-BOUNDARY-001','AI_BOUNDARY','AI hard decision boundary','v1','HARD_BLOCK','ACTIVE','AI may suggest but must not govern money, refunds, official status, submissions, fraud, privacy, or hard blockers.',true,true),
('POL-SUBMISSION-001','SUBMISSION','Official submission approval boundary','v1','REVIEW_REQUIRED','ACTIVE','Official submissions require permitted state, evidence, source confidence, and human/operator approval where required.',true,true),
('POL-REFUND-001','FINANCE_REFUND','Refund approval boundary','v1','REVIEW_REQUIRED','ACTIVE','Refund decisions require finance boundary, policy evidence, payment evidence, and human/operator approval.',true,true),
('POL-POPIA-001','POPIA_PRIVACY','POPIA lawful processing boundary','v1','HARD_BLOCK','ACTIVE','Privacy-sensitive processing requires lawful basis, minimum data, consent/contract/legal basis, and audit evidence.',true,true),
('POL-SOURCE-001','SOURCE_CONFIDENCE','Source confidence and official claim policy','v1','REVIEW_REQUIRED','ACTIVE','Official claims require official verified sources. Low confidence sources route to review.',true,true),
('POL-FRAUD-001','DOCUMENT_FRAUD','Document fraud review boundary','v1','REVIEW_REQUIRED','ACTIVE','AI may flag anomalies but cannot confirm fraud. Fraud confirmation requires human/operator review.',true,true),
('POL-OVERRIDE-001','HUMAN_OVERRIDE','No silent override policy','v1','HARD_BLOCK','ACTIVE','Every override requires reason, evidence, audit event, and visible review trail.',true,true),
('POL-PHOENIX-001','PHOENIX_FALLBACK','Phoenix no false rescue policy','v1','HARD_BLOCK','ACTIVE','Phoenix fallback cannot claim rescue without evidence-backed viable alternatives and human review.',true,true),
('POL-COMMS-001','COMMUNICATION','Email-first and WhatsApp urgent-only policy','v1','REVIEW_REQUIRED','ACTIVE','Email is primary. WhatsApp is urgent/emergency/ceremonial only. Non-urgent exceptions require review.',true,true),
('POL-GROWTH-001','GROWTH_CAP','Growth cap quality gate','v1','REVIEW_REQUIRED','ACTIVE','Growth cap increases require outcome-quality evidence, system health, and founder/operator approval.',true,true),
('POL-ORACLE-001','ORACLE_LITE','Oracle Lite budget discipline','v1','WARN','ACTIVE','Oracle Lite runtime must prefer rules-first, caps, batch discipline, and no unnecessary infrastructure.',true,false)
on conflict (policy_ref) do update set
  policy_domain = excluded.policy_domain,
  policy_name = excluded.policy_name,
  policy_version = excluded.policy_version,
  enforcement_level = excluded.enforcement_level,
  policy_status = excluded.policy_status,
  policy_text = excluded.policy_text,
  evidence_required = excluded.evidence_required,
  human_review_required = excluded.human_review_required,
  updated_at = now();