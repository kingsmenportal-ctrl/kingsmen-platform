#!/usr/bin/env bash
set -uo pipefail

# Execute only from a clean checkout of the immutable RC1 SHA being certified.
# Required: RC1_SHA=<full 40-character SHA>. For live E2E, supply staging tokens
# through environment variables and KINGSMEN_STAGING_BASE_URL/KINGSMEN_E2E_PLAN.
# This script never creates identities, applies migrations, or deploys.

fail() { printf 'FATAL: %s\n' "$*" >&2; exit 2; }
[[ "${RC1_SHA:-}" =~ ^[0-9a-f]{40}$ ]] || fail "Set RC1_SHA to the full 40-character approved release commit."
actual_sha="$(git rev-parse HEAD 2>/dev/null)" || fail "Run inside the Kingsmen Git repository."
[[ "$actual_sha" == "$RC1_SHA" ]] || fail "HEAD $actual_sha does not equal RC1_SHA $RC1_SHA."
[[ -z "$(git status --porcelain)" ]] || fail "Working tree is not clean; certification must run against an immutable checkout."
[[ -f package-lock.json ]] || fail "Root package-lock.json is missing; refusing non-reproducible install."

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out_dir="${KINGSMEN_EVIDENCE_DIR:-artifacts/rc1-suite-$stamp}"
mkdir -p "$out_dir"
report="$out_dir/combined-suite.txt"
: > "$report"
overall=0

record() { printf '%s\n' "$*" | tee -a "$report"; }
run_gate() {
  local name="$1"; shift
  record ""
  record "=== GATE: $name ==="
  record "COMMAND: $*"
  "$@" 2>&1 | tee "$out_dir/$name.log"
  local rc=${PIPESTATUS[0]}
  record "RESULT: $name exit_code=$rc"
  if [[ "$rc" -ne 0 ]]; then overall=1; fi
}
record "schema=kingsmen.rc1.combined-suite.v1"
record "rc1_sha=$RC1_SHA"
record "executed_at_utc=$(date -u +%FT%TZ)"
record "node=$(node --version 2>&1)"
record "npm=$(npm --version 2>&1)"

run_gate install npm ci
if [[ "$overall" -eq 0 ]]; then
  run_gate lockfile npm run web:validate:lockfile
  run_gate repository_test npm test
  run_gate api_build npm run api:build
  run_gate web_build npm --prefix apps/web run build
  run_gate api_persistence npm run api:validate
  run_gate migration_integrity npm run db:validate:migration-integrity
  run_gate migration_integrity_test npm run db:validate:migration-integrity:test
  run_gate identity_review_security npm run security:validate:identity-review
  run_gate reviewer_table_access npm run security:validate:review-tables
  run_gate rls_security npm run security:validate:rls
  run_gate payfast_sandbox_contract npm run payments:validate:sandbox
  run_gate backup_restore_proof_validator npm run backup:validate:restore
  run_gate privacy_legal_controls npm run legal:validate
  run_gate observability_controls npm run observability:validate
  run_gate staging_proof_pack_validator npm run staging:validate:pack
  run_gate staging_evidence_capture_validator npm run staging:validate:capture
  run_gate authenticated_e2e_runner_validator npm run staging:e2e:validate
  run_gate canonical_finance_catalogue npm run finance:validate:canonical-catalogue
  run_gate source_intelligence npm run n15:sources:check
  run_gate opportunity_ingestion npm run n15:ingestion:check
  run_gate connector_reliability npm run n14:connectors:check
  run_gate launch_readiness_audit npm run kingsmen:launch:audit
fi

# Runtime E2E must be an explicit, separately authorized execution. Never mark
# this suite PASS if live E2E was skipped or the authorized sessions are absent.
if [[ "${KINGSMEN_RUN_LIVE_E2E:-0}" == "1" ]]; then
  for key in KINGSMEN_STAGING_BASE_URL KINGSMEN_E2E_PLAN KINGSMEN_E2E_CANDIDATE_A_TOKEN KINGSMEN_E2E_CANDIDATE_B_TOKEN KINGSMEN_E2E_REVIEWER_TOKEN; do
    [[ -n "${!key:-}" ]] || { record "RESULT: live_authenticated_e2e BLOCKED missing_$key"; overall=1; }
  done
  if [[ "$overall" -eq 0 ]]; then
    run_gate live_authenticated_e2e npm run staging:e2e
  fi
else
  record "RESULT: live_authenticated_e2e BLOCKED KINGSMEN_RUN_LIVE_E2E=1 and authorized staging sessions are required"
  overall=1
fi

if [[ "$overall" -eq 0 ]]; then
  record "FINAL: PASS rc1_sha=$RC1_SHA"
  record "Evidence directory: $out_dir"
  exit 0
fi
record "FINAL: FAIL_OR_BLOCKED rc1_sha=$RC1_SHA"
record "Evidence directory: $out_dir"
exit 1
