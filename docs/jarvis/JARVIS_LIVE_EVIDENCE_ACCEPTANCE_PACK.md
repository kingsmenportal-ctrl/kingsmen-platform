# Jarvis Live Evidence Acceptance Pack

## Status

Source-ready. Evidence not accepted yet. Production remains blocked.

## Purpose

This pack is the final evidence consolidation layer before release review. It is not a new Jarvis feature layer. It is the acceptance bridge for the real runtime, provider, payment, provider-tool, and security evidence reports.

## Surfaces

- `/api/jarvis/live-evidence-acceptance-pack`
- `/founder/launch-control/jarvis-live-evidence-acceptance-pack`
- `scripts/proof/accept-jarvis-live-evidence-pack.mjs`
- `scripts/validators/validate-jarvis-live-evidence-acceptance-pack.mjs`

## Required capture reports

- `reports/jarvis/jarvis-docker-truth-vault-runtime-evidence-capture-latest.json`
- `reports/jarvis/jarvis-ai-email-provider-live-evidence-capture-latest.json`
- `reports/jarvis/jarvis-payfast-accepted-itn-evidence-capture-latest.json`
- `reports/jarvis/jarvis-n8n-airtable-github-evidence-capture-latest.json`
- `reports/jarvis/jarvis-branch-protection-final-launch-audit-evidence-capture-latest.json`

## Runner

```powershell
node scripts\proof\accept-jarvis-live-evidence-pack.mjs
```

Output:

```text
reports/jarvis/jarvis-live-evidence-acceptance-pack-latest.json
```

## Safety rules

The acceptance pack must not:

- print raw secrets,
- return provider keys,
- mark production ready from missing evidence,
- mark paid status from return/cancel URLs,
- bypass branch protection or founder approval,
- query Truth Vault from browser code.

## Expected decision states

Before evidence is accepted:

```text
BLOCK_LAUNCH__EVIDENCE_NOT_ACCEPTED
```

After all evidence is accepted:

```text
READY_FOR_FINAL_RELEASE_REVIEW
```

Even after all evidence is accepted, this pack does not auto-launch. It sends Jarvis to final release review and founder launch approval.
