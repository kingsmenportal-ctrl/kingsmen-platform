# Jarvis n8n Airtable GitHub Evidence Capture

## Status

Capture runner built. Evidence not accepted until real provider-tool credentials and accepted redacted evidence files are supplied.

## Runner

```powershell
node scripts\proof\capture-jarvis-n8n-airtable-github-evidence.mjs
```

## Report

```text
reports/jarvis/jarvis-n8n-airtable-github-evidence-capture-latest.json
```

## Validator

```powershell
node scripts\validators\validate-jarvis-n8n-airtable-github-evidence-capture.mjs
```

## Required environment names

n8n:

```text
KINGSMEN_N8N_BASE_URL
KINGSMEN_N8N_API_KEY
KINGSMEN_N8N_WEBHOOK_SECRET
```

Airtable:

```text
AIRTABLE_API_KEY
AIRTABLE_BASE_ID
AIRTABLE_KINGSMEN_TABLE
```

GitHub connector options:

```text
GITHUB_TOKEN
GITHUB_APP_ID
GITHUB_INSTALLATION_ID
```

The runner records presence booleans only. It does not print or return secret values.

## Required accepted evidence files

```text
JARVIS_N8N_THIN_RELAY_EVIDENCE_FILE
JARVIS_AIRTABLE_HUMAN_MIRROR_EVIDENCE_FILE
JARVIS_GITHUB_CONNECTOR_RUNTIME_EVIDENCE_FILE
```

Expected schemas:

```text
kingsmen.jarvis-n8n-thin-relay-evidence.v1
kingsmen.jarvis-airtable-human-mirror-evidence.v1
kingsmen.jarvis-github-connector-runtime-evidence.v1
```

## Non-negotiable locks

- n8n remains thin relay only.
- n8n may not become authority.
- n8n may not write Truth Vault directly.
- Airtable remains human mirror only.
- Airtable may not become authority.
- GitHub tokens may not be returned.
- Browser may not call provider tools directly.
- PostgreSQL Truth Vault remains authority.

## Launch effect

This runner can move the provider-tool proof from pending to accepted only when all checks pass. Until then:

```text
providerToolEvidenceAccepted: false
n8nThinRelayAccepted: false
airtableMirrorAccepted: false
githubConnectorAccepted: false
productionReady: false
publicLaunchAllowed: false
```
