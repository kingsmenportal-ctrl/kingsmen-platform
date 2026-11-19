-- N11: enforce the AI advisory evidence boundary at the database layer.
-- Existing staging tables were checked before applying: all nine evidence-bearing tables had zero rows.
begin;
alter table public.candidate_decision_signals drop constraint if exists candidate_decision_signals_evidence_refs_nonempty_chk;
alter table public.candidate_decision_signals add constraint candidate_decision_signals_evidence_refs_nonempty_chk check (cardinality(array_remove(evidence_refs, '')) > 0);
alter table public.eligibility_screen_results drop constraint if exists eligibility_screen_results_evidence_refs_nonempty_chk;
alter table public.eligibility_screen_results add constraint eligibility_screen_results_evidence_refs_nonempty_chk check (cardinality(array_remove(evidence_refs, '')) > 0);
alter table public.route_match_candidates drop constraint if exists route_match_candidates_evidence_refs_nonempty_chk;
alter table public.route_match_candidates add constraint route_match_candidates_evidence_refs_nonempty_chk check (cardinality(array_remove(evidence_refs, '')) > 0);
alter table public.placement_scores drop constraint if exists placement_scores_evidence_refs_nonempty_chk;
alter table public.placement_scores add constraint placement_scores_evidence_refs_nonempty_chk check (cardinality(array_remove(evidence_refs, '')) > 0);
alter table public.route_recommendations drop constraint if exists route_recommendations_evidence_refs_nonempty_chk;
alter table public.route_recommendations add constraint route_recommendations_evidence_refs_nonempty_chk check (cardinality(array_remove(evidence_refs, '')) > 0);
alter table public.destiny_maps drop constraint if exists destiny_maps_evidence_refs_nonempty_chk;
alter table public.destiny_maps add constraint destiny_maps_evidence_refs_nonempty_chk check (cardinality(array_remove(evidence_refs, '')) > 0);
alter table public.phoenix_fallback_plans drop constraint if exists phoenix_fallback_plans_evidence_refs_nonempty_chk;
alter table public.phoenix_fallback_plans add constraint phoenix_fallback_plans_evidence_refs_nonempty_chk check (cardinality(array_remove(evidence_refs, '')) > 0);
alter table public.ai_decision_events drop constraint if exists ai_decision_events_evidence_refs_nonempty_chk;
alter table public.ai_decision_events add constraint ai_decision_events_evidence_refs_nonempty_chk check (cardinality(array_remove(evidence_refs, '')) > 0);
alter table public.ai_learning_signals drop constraint if exists ai_learning_signals_evidence_refs_nonempty_chk;
alter table public.ai_learning_signals add constraint ai_learning_signals_evidence_refs_nonempty_chk check (cardinality(array_remove(evidence_refs, '')) > 0);
alter table public.route_recommendations drop constraint if exists route_recommendations_human_review_boundary_chk;
alter table public.route_recommendations add constraint route_recommendations_human_review_boundary_chk check (human_review_required or ai_confidence = 'OFFICIAL_VERIFIED');
comment on constraint route_recommendations_human_review_boundary_chk on public.route_recommendations is 'Non-official AI recommendations cannot bypass human review.';
commit;
