# Staging RLS API boundary probe

This is a **read-only PostgREST authorization probe** for the five staging tables identified by the 25 November 2026 security review:

- `candidate_credentials`
- `candidate_sessions`
- `evidence_ledger`
- `route_sources`
- `workflow_runs`

It sends only bounded `GET` requests to the fixed staging project `euhubhhnumtibbyufghm`. It never performs inserts, updates, deletes, or RPC calls; does not use a service-role key; requests only minimal non-secret columns; and writes a redacted report without tokens, row identifiers, or response bodies.

## Tests

Run the offline contract tests (mocked PostgREST; no network calls):

```bash
node scripts/staging/test-live-rls-api-boundary.mjs
```

Run the live probe only after approved, non-production test actors and fixture rows already exist in staging:

```bash
node scripts/staging/probe-live-rls-api-boundary.mjs
```

The live run writes `reports/security/rls-api-boundary-probe-latest.json`. Missing credentials/fixtures block the run; missing fixture rows are failures, not successful denials. No fixture rows are created by this tool. The current staging audit found no candidate/application test data, so a successful live run cannot be claimed until a separately approved fixture setup is completed.

## Required environment

Set these in a protected local environment or repository Actions secrets. Never commit values.

- `KINGSMEN_STAGING_SUPABASE_URL` — must be exactly `https://euhubhhnumtibbyufghm.supabase.co`.
- `KINGSMEN_STAGING_SUPABASE_ANON_KEY`
- `KINGSMEN_RLS_CANDIDATE_A_JWT`, `KINGSMEN_RLS_CANDIDATE_B_JWT`
- `KINGSMEN_RLS_OPERATOR_JWT`, `KINGSMEN_RLS_FOUNDER_JWT`
- `KINGSMEN_RLS_CANDIDATE_A_ID`, `KINGSMEN_RLS_CANDIDATE_B_ID`
- `KINGSMEN_RLS_SESSION_A_ID`, `KINGSMEN_RLS_SESSION_B_ID`
- `KINGSMEN_RLS_EVIDENCE_SAFE_A_ID`, `KINGSMEN_RLS_EVIDENCE_SAFE_B_ID`
- `KINGSMEN_RLS_EVIDENCE_PROTECTED_A_ID`, `KINGSMEN_RLS_EVIDENCE_PROTECTED_B_ID`
- `KINGSMEN_RLS_WORKFLOW_A_ID`, `KINGSMEN_RLS_WORKFLOW_B_ID`
- `KINGSMEN_RLS_ROUTE_SOURCE_VERIFIED_ID`, `KINGSMEN_RLS_ROUTE_SOURCE_UNVERIFIED_ID`, `KINGSMEN_RLS_ROUTE_SOURCE_LOW_CONFIDENCE_ID`

The candidate A/B IDs and all row IDs except session IDs must be UUIDs. Each ID must identify an existing approved fixture row. The probe requires founder/operator visibility of protected fixture rows to confirm the rows exist; if the fixtures or actor claims are not correct, the probe fails rather than producing false-positive isolation evidence.

## Expected access assertions

| Table fixture | Anonymous | Candidate A | Candidate B | Operator / founder |
|---|---|---|---|---|
| Candidate credential rows | Deny | Deny | Deny | Allow minimal `candidate_id` projection |
| Candidate A/B session | Deny | Own row only | Own row only | Allow minimal row projection |
| Safe evidence | Deny | Own candidate's row only | Own candidate's row only | Allow minimal row projection |
| Protected evidence | Deny | Deny | Deny | Allow minimal row projection |
| Workflow run | Deny | Own candidate's row only | Own candidate's row only | Allow minimal row projection |
| Verified, A-band source | Allow | Allow | Allow | Allow |
| Unverified or low-confidence source | Deny | Deny | Deny | Allow |

This matrix is derived from the currently observed staging policies and is intended to detect regressions. Reconfirm it after any policy/grant change. It does not replace migration provenance review, controlled fixture lifecycle, backup/restore proof, or the overall release gates.
