# Candidate Experience live end-to-end test

## Purpose

This is an opt-in staging test runner for the candidate profile, opportunity feed, application workbench, private-document status and identity-review status APIs. It supplements source validators; it does not turn source assertions into end-to-end evidence.

It never signs in, creates an Auth user, links a candidate identity, uploads a document, submits a provider application, creates a reviewer decision or initiates a payment. The test does not delete records or audit history.

## Safety gate

The runner is inert unless `KINGSMEN_CANDIDATE_E2E=1` is set. Use only the Kingsmen staging Netlify site or a preview for that same site, over HTTPS. Use an explicitly designated staging test identity—not a real candidate account—and keep credentials in your approved local secret store or CI secrets, never in the repository.

Required variables:

- `KINGSMEN_CANDIDATE_E2E=1`
- `KINGSMEN_STAGING_BASE_URL=https://kingsmen-portal-staging.netlify.app` (or that site's HTTPS deploy-preview URL)
- `KINGSMEN_STAGING_CANDIDATE_ACCESS_TOKEN` — short-lived bearer token for the dedicated Auth test account
- `KINGSMEN_CANDIDATE_E2E_MODE=roundtrip` for an existing dedicated test candidate, or `bootstrap` for one-time creation of a test profile
- `KINGSMEN_STAGING_EXPECTED_CANDIDATE_REFERENCE` — exact known reference for roundtrip; the literal `NEW` is required for bootstrap
- For roundtrip only: `KINGSMEN_STAGING_SUPABASE_URL=https://euhubhhnumtibbyufghm.supabase.co` and `KINGSMEN_STAGING_ANON_KEY`

## Run an update/save/reload test

Use a dedicated staging candidate whose identity link is already verified, whose reference is known, and whose consent is already ACTIVE. The harness checks those preconditions before the first write. It then saves a unique marker to one optional text field, reads the profile back in a separate request, restores the original profile and preferences, and reads again to verify restoration. The original value is restored even when the assertion fails. If restoration cannot be verified, the harness fails with a critical warning.

Run:

```sh
npm run candidate:experience:live-e2e
```

The script also checks that profile, application, document and identity-review APIs reject unauthenticated access (HTTP 401); reads the authenticated application workbench and private-document / identity-review statuses; calls the authenticated N15 candidate feed; and validates that any returned listing has an HTTPS official link, source evidence and a valid source-check timestamp. An honestly empty, verified opportunity feed is acceptable; it is not proof ingestion is complete.

## One-time new-profile bootstrap test

Use a separate, confirmed-email Supabase Auth test account with no identity link and no existing Kingsmen profile. The bootstrap path creates a persistent candidate and records consent; it deliberately leaves the candidate identity pending review and does not delete the resulting candidate or audit trail. Run this only when that account is intentionally designated for that permanent test record:

```sh
KINGSMEN_CANDIDATE_E2E=1 \
KINGSMEN_CANDIDATE_E2E_MODE=bootstrap \
KINGSMEN_STAGING_EXPECTED_CANDIDATE_REFERENCE=NEW \
KINGSMEN_STAGING_TEST_DISPLAY_NAME="Kingsmen E2E Test Account" \
KINGSMEN_STAGING_BASE_URL=https://kingsmen-portal-staging.netlify.app \
KINGSMEN_STAGING_CANDIDATE_ACCESS_TOKEN="set-in-secret-store" \
npm run candidate:experience:live-e2e
```

Supply the token via a secret store in actual use; the example placeholder must not be copied into source control. Bootstrap mode does not run the verified-identity application/feed/document checks because a newly created link is intentionally pending human review.

## What this test proves—and does not prove

A successful roundtrip run is evidence for the tested identity and deployment at the time of execution. It is not Candidate A/B isolation proof, not reviewer-authority proof, not evidence that an opportunity exists, and not evidence that an external institution received an application. A CI source validator does not replace this live run.

The runner does not change Supabase schema or migration history. It does not deploy the site. Deployment proof still requires the Netlify deploy ID and exact published commit SHA to match the reviewed GitHub commit.
