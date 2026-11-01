-- 0038 - Persistent candidate session storage.
-- Stores only opaque-token hashes; raw tokens must never be persisted.
-- Supports the earlier empty staging schema that used session_id/trust_status.
CREATE TABLE IF NOT EXISTS public.candidate_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  revoke_reason text,
  device_label text NOT NULL DEFAULT 'Unknown device',
  device_fingerprint_hash text,
  ip_hash text,
  user_agent text,
  CONSTRAINT candidate_sessions_token_hash_check CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT candidate_sessions_expiry_check CHECK (expires_at > created_at),
  CONSTRAINT candidate_sessions_revoke_reason_check CHECK (
    revoke_reason IS NULL OR revoke_reason IN ('LOGOUT','PASSWORD_RESET','ADMIN_REVOKE','SECURITY_EVENT','ACCOUNT_DISABLED')
  )
);

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='candidate_sessions' AND column_name='session_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='candidate_sessions' AND column_name='id'
  ) THEN
    IF EXISTS (SELECT 1 FROM public.candidate_sessions) THEN
      RAISE EXCEPTION 'Legacy candidate_sessions rows require a reviewed migration; refusing to discard sessions.';
    END IF;
    ALTER TABLE public.candidate_sessions RENAME COLUMN session_id TO id;
    ALTER TABLE public.candidate_sessions ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
  END IF;
END $migration$;

ALTER TABLE public.candidate_sessions
  ADD COLUMN IF NOT EXISTS token_hash text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoke_reason text;

DO $migration$
BEGIN
  IF EXISTS (SELECT 1 FROM public.candidate_sessions WHERE token_hash IS NULL) THEN
    RAISE EXCEPTION 'candidate_sessions has rows without token hashes; refusing to invent credentials.';
  END IF;
END $migration$;

ALTER TABLE public.candidate_sessions ALTER COLUMN token_hash SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_candidate_sessions_token_hash ON public.candidate_sessions(token_hash);

DO $migration$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.candidate_sessions'::regclass AND conname='candidate_sessions_token_hash_check') THEN
    ALTER TABLE public.candidate_sessions ADD CONSTRAINT candidate_sessions_token_hash_check CHECK (token_hash ~ '^[a-f0-9]{64}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.candidate_sessions'::regclass AND conname='candidate_sessions_expiry_check') THEN
    ALTER TABLE public.candidate_sessions ADD CONSTRAINT candidate_sessions_expiry_check CHECK (expires_at > created_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.candidate_sessions'::regclass AND conname='candidate_sessions_revoke_reason_check') THEN
    ALTER TABLE public.candidate_sessions ADD CONSTRAINT candidate_sessions_revoke_reason_check
      CHECK (revoke_reason IS NULL OR revoke_reason IN ('LOGOUT','PASSWORD_RESET','ADMIN_REVOKE','SECURITY_EVENT','ACCOUNT_DISABLED'));
  END IF;
END $migration$;

CREATE INDEX IF NOT EXISTS idx_candidate_sessions_candidate_active
  ON public.candidate_sessions(candidate_id, expires_at DESC) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_candidate_sessions_expiry ON public.candidate_sessions(expires_at);

ALTER TABLE public.candidate_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_all_candidate_sessions ON public.candidate_sessions;
DROP POLICY IF EXISTS candidate_sessions_service_role_backend_all ON public.candidate_sessions;
CREATE POLICY candidate_sessions_service_role_backend_all ON public.candidate_sessions
  FOR ALL USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());
DROP POLICY IF EXISTS candidate_sessions_founder_operator_read ON public.candidate_sessions;
CREATE POLICY candidate_sessions_founder_operator_read ON public.candidate_sessions
  FOR SELECT USING (kingsmen_security.is_founder_or_operator());
DROP POLICY IF EXISTS candidate_sessions_candidate_read_own ON public.candidate_sessions;
CREATE POLICY candidate_sessions_candidate_read_own ON public.candidate_sessions
  FOR SELECT USING (candidate_id = kingsmen_security.current_candidate_id());

COMMENT ON TABLE public.candidate_sessions IS 'Persistent candidate sessions. Only SHA-256 hashes of opaque random tokens are stored.';
COMMENT ON COLUMN public.candidate_sessions.token_hash IS 'SHA-256 hex digest of opaque session token; raw tokens must never be stored.';
