# Netlify Deployment Readiness — kingsmen-portal-staging

Checked 2026-10-28 using the connected Netlify metadata action. No deployment was triggered.

## Metadata

| Field | Observed value |
|---|---|
| Site | `kingsmen-portal-staging` |
| Site ID | `fb27d0db-b116-4890-8f7f-14e654c27dbc` |
| Team ID | `69467d1afdbcc37d0e708e37` |
| Plan | `nf_team_dev` |
| Claimed | true |
| Primary site URL returned | `http://kingsmen-portal-staging.netlify.app` |
| Branch URL returned on one read | `http://6ae2274c0cf69b7057008200--kingsmen-portal-staging.netlify.app`; hash varied between reads and is not RC1 proof |
| Password protection | false |
| Team SSO required | false |
| Forms | not enabled |
| Current deploy field | state `current`; nested `currentDeploy` object empty |

The site exists and is claimed, but there is no surfaced published deploy ID, commit ref, published timestamp or deploy permalink. The branch preview URL is not evidence that the site serves integrated RC1. The enriched URL is HTTP; raw API HTTPS URL must be preferred.

## Gaps

1. Retrieve the site object’s `published_deploy.id`.
2. Retrieve `/api/v1/deploys/{id}` and prove `state=ready` and `commit_ref` equals the approved full 40-character RC1 SHA.
3. Confirm the deploy is the published primary site deploy, not a branch Deploy Preview.
4. Confirm required runtime environment variables exist and are correctly scoped in Netlify settings; never put secrets in netlify.toml/client bundle.
5. Confirm route files are actually integrated into the same RC1 commit before checking them.

## Read-only verifier

`scripts/release/verify-netlify-published-rc1.sh` requires `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` and `RC1_SHA`. It queries Netlify API, then checks routes. Requires `curl` and `jq`.

```bash
export NETLIFY_AUTH_TOKEN='<secure secret-manager injection>'
export NETLIFY_SITE_ID='fb27d0db-b116-4890-8f7f-14e654c27dbc'
export RC1_SHA='<approved full 40-character SHA>'
bash scripts/release/verify-netlify-published-rc1.sh
```

The script fails closed if there is no published deploy ID, deploy state isn't ready, commit ref differs from RC1, HTTPS URL isn't available, or route status is unexpected.

## Route smoke expectations

- `/`: HTTP 200.
- `/auth/login` and `/candidate/login`: 200 or normal redirect.
- `/candidate`, `/candidate/workbench`, `/candidate/identity-review`, `/candidate/applications`, `/reviewer/identity-reviews`: normal app/redirect/auth response (200/30x/401/403), never 404/5xx.

These are route-availability checks only, not authenticated journey proof. Follow with Candidate A/B and least-privilege reviewer tests, cross-candidate negative requests, document owner/expiry verification, and PayFast sandbox lifecycle.

## Decision

**Deployment binding remains BLOCKED** until raw published deploy ID/state/commit are retrieved and the commit exactly matches the immutable approved RC1 SHA. No deployment action was taken.
