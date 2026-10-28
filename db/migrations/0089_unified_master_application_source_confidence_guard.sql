-- Candidate-owned target edits may never self-certify source confidence.
drop policy if exists candidate_master_targets_update_own on public.candidate_master_application_targets;
create policy candidate_master_targets_update_own on public.candidate_master_application_targets
 for update to authenticated
 using (candidate_id = kingsmen_security.current_authenticated_candidate_id())
 with check (
   candidate_id = kingsmen_security.current_authenticated_candidate_id()
   and created_by_auth_user_id = (select auth.uid())
   and source_confidence = 'UNVERIFIED'
   and planning_status in ('PLANNING','PREPARING','EXTERNAL_PORTAL_REQUIRED','CANCELLED')
 );
