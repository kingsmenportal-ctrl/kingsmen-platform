-- 0037 - Candidate credential records
-- Credentials are backend-managed. This schema does not enable public signup or login by itself.

CREATE TABLE IF NOT EXISTS candidate_credentials (
  candidate_id uuid PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  auth_status text NOT NULL DEFAULT 'PENDING',
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  password_changed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_credentials_status_check
    CHECK (auth_status IN ('PENDING', 'ACTIVE', 'LOCKED', 'RECOVERY_REQUIRED', 'DISABLED')),
  CONSTRAINT candidate_credentials_failed_attempts_check
    CHECK (failed_login_attempts >= 0),
  CONSTRAINT candidate_credentials_password_hash_check
    CHECK (length(password_hash) BETWEEN 50 AND 512)
);

CREATE INDEX IF NOT EXISTS idx_candidate_credentials_status
  ON candidate_credentials(auth_status, locked_until);

ALTER TABLE candidate_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS candidate_credentials_service_role_backend_all ON candidate_credentials;
CREATE POLICY candidate_credentials_service_role_backend_all ON candidate_credentials
  FOR ALL
  USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

DROP POLICY IF EXISTS candidate_credentials_founder_operator_read ON candidate_credentials;
CREATE POLICY candidate_credentials_founder_operator_read ON candidate_credentials
  FOR SELECT
  USING (kingsmen_security.is_founder_or_operator());

COMMENT ON TABLE candidate_credentials IS
  'Backend-managed candidate authentication state. password_hash must use a reviewed slow password-hashing scheme; never store plaintext or reversible passwords. Public registration and login remain disabled until complete authentication flows and runtime controls are verified.';
