-- Candidate workspace persistence using the existing reviewed identity-link authority.
-- Identity links are created/approved by the established authorised review process; this migration does not create links.
CREATE TABLE IF NOT EXISTS candidate_workspace_readiness (
  candidate_id uuid PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  completed_tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  priority_pathway text NOT NULL DEFAULT '',
  revision bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_workspace_tasks_array CHECK (jsonb_typeof(completed_tasks) = 'array'),
  CONSTRAINT candidate_workspace_pathway_check CHECK (
    priority_pathway IN ('','higher_education','tvet','seta_learnership','internship','apprenticeship','employment')
  )
);

CREATE TABLE IF NOT EXISTS candidate_saved_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 180),
  organisation text NOT NULL CHECK (length(trim(organisation)) BETWEEN 1 AND 180),
  official_url text NOT NULL CHECK (official_url ~ '^https?://'),
  pathway text NOT NULL CHECK (pathway IN ('higher_education','tvet','seta_learnership','internship','apprenticeship','employment')),
  closing_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, official_url)
);
CREATE INDEX IF NOT EXISTS candidate_saved_opportunities_owner_created_idx
  ON candidate_saved_opportunities(candidate_id, created_at DESC);

ALTER TABLE candidate_workspace_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_saved_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS candidate_workspace_readiness_read_own ON candidate_workspace_readiness;
CREATE POLICY candidate_workspace_readiness_read_own ON candidate_workspace_readiness
  FOR SELECT USING (candidate_id IN (
    SELECT candidate_id FROM candidate_auth_identity_links
    WHERE supabase_user_id = auth.uid() AND link_status = 'VERIFIED' AND verified_at IS NOT NULL
  ));
DROP POLICY IF EXISTS candidate_workspace_readiness_insert_own ON candidate_workspace_readiness;
CREATE POLICY candidate_workspace_readiness_insert_own ON candidate_workspace_readiness
  FOR INSERT WITH CHECK (candidate_id IN (
    SELECT candidate_id FROM candidate_auth_identity_links
    WHERE supabase_user_id = auth.uid() AND link_status = 'VERIFIED' AND verified_at IS NOT NULL
  ));
DROP POLICY IF EXISTS candidate_workspace_readiness_update_own ON candidate_workspace_readiness;
CREATE POLICY candidate_workspace_readiness_update_own ON candidate_workspace_readiness
  FOR UPDATE USING (candidate_id IN (
    SELECT candidate_id FROM candidate_auth_identity_links
    WHERE supabase_user_id = auth.uid() AND link_status = 'VERIFIED' AND verified_at IS NOT NULL
  )) WITH CHECK (candidate_id IN (
    SELECT candidate_id FROM candidate_auth_identity_links
    WHERE supabase_user_id = auth.uid() AND link_status = 'VERIFIED' AND verified_at IS NOT NULL
  ));

DROP POLICY IF EXISTS candidate_saved_opportunities_read_own ON candidate_saved_opportunities;
CREATE POLICY candidate_saved_opportunities_read_own ON candidate_saved_opportunities
  FOR SELECT USING (candidate_id IN (
    SELECT candidate_id FROM candidate_auth_identity_links
    WHERE supabase_user_id = auth.uid() AND link_status = 'VERIFIED' AND verified_at IS NOT NULL
  ));
DROP POLICY IF EXISTS candidate_saved_opportunities_insert_own ON candidate_saved_opportunities;
CREATE POLICY candidate_saved_opportunities_insert_own ON candidate_saved_opportunities
  FOR INSERT WITH CHECK (candidate_id IN (
    SELECT candidate_id FROM candidate_auth_identity_links
    WHERE supabase_user_id = auth.uid() AND link_status = 'VERIFIED' AND verified_at IS NOT NULL
  ));
DROP POLICY IF EXISTS candidate_saved_opportunities_delete_own ON candidate_saved_opportunities;
CREATE POLICY candidate_saved_opportunities_delete_own ON candidate_saved_opportunities
  FOR DELETE USING (candidate_id IN (
    SELECT candidate_id FROM candidate_auth_identity_links
    WHERE supabase_user_id = auth.uid() AND link_status = 'VERIFIED' AND verified_at IS NOT NULL
  ));

-- Explicit table privileges are paired with RLS; the server service-role path still scopes every query by candidate_id.
GRANT SELECT, INSERT, UPDATE, DELETE ON candidate_workspace_readiness TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON candidate_saved_opportunities TO authenticated;
