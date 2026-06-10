insert into public.ai_decision_runtime_config (config_key, config_value, enabled, doctrine_note)
values
('AI_DECISION_MODE', '{"mode":"recommendation_only"}', true, 'AI recommends and explains; backend state machine and humans control hard decisions.'),
('AI_BLOCKED_DECISIONS', '{"blocked":["money","refunds","official_status","submissions","fraud","privacy","hard_blockers"]}', true, 'AI may suggest but must not govern money, refunds, official status, submissions, fraud, privacy, or hard blockers.'),
('AI_SOURCE_CONFIDENCE_REQUIRED', '{"minimum":"MEDIUM","official_required_for_hard_claims":true}', true, 'Recommendations require source confidence and evidence references.'),
('PHOENIX_FALSE_RESCUE_BLOCK', '{"enabled":true}', true, 'No Phoenix false rescue.'),
('NO_SILENT_LEARNING', '{"enabled":true}', true, 'Learning signals must be visible, governed, and evidence-backed.'),
('AI_BUDGET_GUARD', '{"oracle_lite":true,"max_expensive_calls_per_candidate_per_day":3}', true, 'Oracle Lite AI budget guard.')
on conflict (config_key) do update set
  config_value = excluded.config_value,
  enabled = excluded.enabled,
  doctrine_note = excluded.doctrine_note,
  updated_at = now();