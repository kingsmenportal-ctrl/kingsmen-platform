#!/usr/bin/env bash
set -euo pipefail

# Read-only Netlify API and route smoke check. Does not trigger or publish deploys.
: "${NETLIFY_AUTH_TOKEN:?Set NETLIFY_AUTH_TOKEN in the execution environment}"
: "${NETLIFY_SITE_ID:?Set NETLIFY_SITE_ID}"
: "${RC1_SHA:?Set RC1_SHA to the full approved 40-character commit}"
[[ "$RC1_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "RC1_SHA must be a full 40-character SHA" >&2; exit 2; }

api="https://api.netlify.com/api/v1"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
auth="Authorization: Bearer $NETLIFY_AUTH_TOKEN"

curl --fail --silent --show-error -H "$auth" "$api/sites/$NETLIFY_SITE_ID" > "$tmp/site.json"
deploy_id="$(jq -r '.published_deploy.id // empty' "$tmp/site.json")"
site_url="$(jq -r '.ssl_url // .url // empty' "$tmp/site.json")"
[[ -n "$deploy_id" ]] || { echo "BLOCKED: Netlify site response has no published_deploy.id" >&2; exit 3; }
[[ -n "$site_url" ]] || { echo "BLOCKED: Netlify site response has no HTTPS URL" >&2; exit 3; }

curl --fail --silent --show-error -H "$auth" "$api/deploys/$deploy_id" > "$tmp/deploy.json"
state="$(jq -r '.state // empty' "$tmp/deploy.json")"
commit_ref="$(jq -r '.commit_ref // empty' "$tmp/deploy.json")"
deploy_url="$(jq -r '.deploy_ssl_url // .deploy_url // empty' "$tmp/deploy.json")"

printf 'site_id=%s\n' "$NETLIFY_SITE_ID"
printf 'published_deploy_id=%s\n' "$deploy_id"
printf 'deploy_state=%s\n' "$state"
printf 'published_commit=%s\n' "$commit_ref"
printf 'expected_rc1_sha=%s\n' "$RC1_SHA"
printf 'site_url=%s\n' "$site_url"
printf 'deploy_url=%s\n' "$deploy_url"

[[ "$state" == "ready" ]] || { echo "FAIL: published deploy state is not ready" >&2; exit 4; }
[[ "$commit_ref" == "$RC1_SHA" ]] || { echo "FAIL: published deploy commit does not match RC1_SHA" >&2; exit 5; }

# Smoke check only. Route names are taken from the planned RC1 UI integration
# (PR #190 auth/identity review, PR #202 candidate workspace, PR #120 tracker).
# Protected routes must still be tested with authenticated sessions.
for route in / /auth/login /candidate/login /candidate /candidate/workbench /candidate/identity-review /candidate/applications /reviewer/identity-reviews; do
  code="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' --max-time 20 "${site_url%/}$route")"
  printf 'route=%s http_status=%s\n' "$route" "$code"
  case "$route" in
    /)
      [[ "$code" == "200" ]] || { echo "FAIL: homepage must return HTTP 200" >&2; exit 6; }
      ;;
    /auth/login|/candidate/login)
      case "$code" in 200|301|302|303|307|308) ;; *) echo "FAIL: login route unavailable: $route" >&2; exit 6 ;; esac
      ;;
    *)
      case "$code" in 200|301|302|303|307|308|401|403) ;; *) echo "FAIL: unexpected HTTP status for $route" >&2; exit 6 ;; esac
      ;;
  esac
done
echo "PASS: published deploy is ready and matches the immutable RC1 SHA."
