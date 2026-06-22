# Jarvis Airtable Human Mirror Boundary

Jarvis may inspect Airtable readiness only as a human mirror boundary. Airtable is not the system of record.

## Route

`/api/jarvis/airtable-human-mirror-boundary`

The route reports whether the Airtable mirror values are configured, whether the backend boundary is reachable, and whether PostgreSQL Truth Vault remains the authority.

## Required configuration outside Git

- `KINGSMEN_AIRTABLE_BASE_ID`
- `KINGSMEN_AIRTABLE_API_KEY`
- `KINGSMEN_AIRTABLE_CANDIDATES_TABLE`

Fallback names accepted by the proof script include `AIRTABLE_BASE_ID`, `AIRTABLE_API_KEY`, `AIRTABLE_TOKEN`, `AIRTABLE_PERSONAL_ACCESS_TOKEN`, `AIRTABLE_CANDIDATES_TABLE`, and `AIRTABLE_TABLE_CANDIDATES`.

## Safety rules

- no fake status
- no raw secrets
- no provider credentials printed
- no direct provider calls from web
- no local shell execution from web
- no direct database access from web
- backend command envelope required
- PostgreSQL remains truth
- Airtable remains mirror only

## Runtime proof

Run the proof only after backend and web are running.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/staging/Invoke-KingsmenJarvisAirtableHumanMirrorBoundaryProof.ps1
```

The proof must create a redacted report at:

`reports/jarvis/jarvis-airtable-human-mirror-boundary-proof-latest.json`

This proof does not make Airtable live for production by itself. Production remains blocked until provider credentials, backend evidence, mirror health evidence, POPIA controls, and founder approval are complete.
