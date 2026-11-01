#!/usr/bin/env bash
set -euo pipefail

: "${PGHOST:?PGHOST is required}"
: "${PGPORT:?PGPORT is required}"
: "${PGUSER:?PGUSER is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"
: "${PGDATABASE:?PGDATABASE is required}"

psql -X -v ON_ERROR_STOP=1 -c "TRUNCATE public.system_health_snapshots, public.service_health_checks, public.metric_samples;"

(
  psql -X -v ON_ERROR_STOP=1 <<'SQL'
SET ROLE service_role;
BEGIN;
SELECT public.n13_commit_observability_capture(
  jsonb_build_object(
    'snapshot_ref','n13-concurrent-first',
    'status','AMBER',
    'active_candidates',3,
    'active_candidate_cap',500,
    'pending_workflows',0,
    'failed_workflows',0,
    'document_backlog',0,
    'manual_fallback_backlog',0,
    'payment_pending_count',0,
    'source_review_backlog',0,
    'incident_open_count',0,
    'oracle_lite_pressure','LOW',
    'summary','First synthetic concurrent capture.',
    'evidence_refs',ARRAY['synthetic:n13-concurrency'],
    'captured_at',clock_timestamp()
  ),
  '[]'::jsonb,
  '[]'::jsonb
);
SELECT pg_sleep(2);
COMMIT;
RESET ROLE;
SQL
) >/tmp/n13-first-capture.log 2>&1 &
first_pid=$!

sleep 0.25

second_status="$(
  psql -X -qAt -v ON_ERROR_STOP=1 <<'SQL'
SET ROLE service_role;
SELECT public.n13_commit_observability_capture(
  jsonb_build_object(
    'snapshot_ref','n13-concurrent-second',
    'status','AMBER',
    'active_candidates',3,
    'active_candidate_cap',500,
    'pending_workflows',0,
    'failed_workflows',0,
    'document_backlog',0,
    'manual_fallback_backlog',0,
    'payment_pending_count',0,
    'source_review_backlog',0,
    'incident_open_count',0,
    'oracle_lite_pressure','LOW',
    'summary','Second synthetic concurrent capture.',
    'evidence_refs',ARRAY['synthetic:n13-concurrency'],
    'captured_at',clock_timestamp()
  ),
  '[]'::jsonb,
  '[]'::jsonb
) ->> 'status';
RESET ROLE;
SQL
)"

wait "$first_pid"

if [[ "$second_status" != "n13_capture_rate_limited" ]]; then
  echo "FAIL: concurrent second capture was not rate-limited; returned: $second_status"
  cat /tmp/n13-first-capture.log
  exit 1
fi

snapshot_count="$(psql -X -qAt -v ON_ERROR_STOP=1 -c "SELECT count(*) FROM public.system_health_snapshots;")"
if [[ "$snapshot_count" != "1" ]]; then
  echo "FAIL: concurrent capture wrote $snapshot_count snapshots; expected exactly one."
  exit 1
fi

echo "PASS: advisory transaction lock serializes concurrent N13 captures and enforces the 60-second cooldown."
