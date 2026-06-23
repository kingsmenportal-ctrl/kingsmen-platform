# Jarvis n8n Airtable GitHub Runtime Proof Gate

## Status

Source gate built. Runtime evidence not accepted. Production remains blocked.

## Route

```text
/api/jarvis/n8n-airtable-github-runtime-proof
```

## Founder page

```text
/founder/launch-control/jarvis-provider-tool-runtime-proof
```

## Purpose

This gate controls the final provider-tool runtime proof batch for:

- n8n thin relay.
- Airtable human mirror.
- GitHub tool connector.

The gate does not call provider tools. It defines the evidence that must be captured before the provider-tool batch can be accepted.

## Required evidence

### n8n

- Base URL, API key, and webhook secret stored outside Git.
- Backend-mediated command proof.
- Webhook signature or shared secret proof.
- No browser-to-n8n direct call.
- Truth Vault remains authority.
- Redacted runtime output.

### Airtable

- API key, base ID, and table name stored outside Git.
- Backend-only mirror write proof.
- Truth Vault source record proof.
- Reconciliation proof.
- Redacted Airtable metadata proof.

### GitHub

- Redacted repo metadata proof.
- Controlled connector action proof.
- No token exposure proof.
- Branch and PR context proof.
- Audit trail or connector action trace.

## Rejection rules

Reject the gate if:

- n8n writes directly to Truth Vault.
- n8n becomes authority.
- Airtable becomes authority.
- Browser routes write to Airtable directly.
- GitHub token is exposed.
- Connector writes occur without explicit instruction.
- Provider-tool evidence is unredacted.
- Runtime proof is only a static source route.

## Validation

```powershell
node scripts\validators\validate-jarvis-n8n-airtable-github-runtime-proof.mjs
```

Expected status:

```text
JARVIS_N8N_AIRTABLE_GITHUB_RUNTIME_PROOF_GATE_VALIDATED
passed: true
productionReady: false
publicLaunchAllowed: false
```
