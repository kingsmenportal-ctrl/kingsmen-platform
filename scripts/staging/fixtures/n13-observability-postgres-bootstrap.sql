\set ON_ERROR_STOP on

CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;

CREATE TABLE public.system_health_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_ref text NOT NULL UNIQUE,
  status text NOT NULL,
  active_candidates integer NOT NULL,
  active_candidate_cap integer NOT NULL,
  pending_workflows integer NOT NULL,
  failed_workflows integer NOT NULL,
  document_backlog integer NOT NULL,
  manual_fallback_backlog integer NOT NULL,
  payment_pending_count integer NOT NULL,
  source_review_backlog integer NOT NULL,
  incident_open_count integer NOT NULL,
  oracle_lite_pressure text NOT NULL,
  summary text NOT NULL,
  evidence_refs text[] NOT NULL,
  captured_at timestamptz NOT NULL
);

CREATE TABLE public.service_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_ref text NOT NULL UNIQUE,
  service_name text NOT NULL,
  service_domain text NOT NULL,
  status text NOT NULL,
  latency_ms integer,
  error_rate numeric,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  reason text NOT NULL,
  fix_path text NOT NULL,
  evidence_refs text[] NOT NULL,
  checked_at timestamptz NOT NULL
);

CREATE TABLE public.metric_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_ref text NOT NULL UNIQUE,
  metric_name text NOT NULL,
  metric_domain text NOT NULL,
  metric_value numeric NOT NULL,
  metric_unit text NOT NULL,
  warning_threshold numeric,
  critical_threshold numeric,
  status text NOT NULL,
  tags jsonb NOT NULL,
  sampled_at timestamptz NOT NULL
);

GRANT SELECT ON public.system_health_snapshots,
  public.service_health_checks,
  public.metric_samples TO service_role;
