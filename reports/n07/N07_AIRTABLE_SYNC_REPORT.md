# N07 â€” Airtable Sync

Status: Built and validation-ready.

## Purpose

N07 creates the Kingsmen Airtable Sync foundation.

Airtable is not the truth source. PostgreSQL remains the truth vault. Airtable is an operational mirror for founder/operator visibility, review queues, light notes, and controlled Airtable surfaces.

## What N07 adds

- 12-base Airtable registry
- Airtable sync target registry
- Field mapping foundation
- Sync outbox table
- Sync run ledger
- Airtable webhook receipt ledger
- Airtable client adapter
- Mirror-only sync policy
- Inbound webhook review boundary
- Runtime health check
- Operator UI panels for Airtable sync and outbox
- Migration runner
- N07 validator

## 12 base coverage

1. Kingsman Nexus-7
2. Kingsman Nexus (MSB)
3. Applications Hub
4. AI Engine
5. AI Decision & Orchestration Engine
6. System Operations
7. Automation Control
8. Communications Center
9. Programs & Intelligence
10. Kingsmen Financial Operations
11. Partner Ecosystem Directory
12. Document Vault

## Doctrine locked

- PostgreSQL remains truth.
- Airtable is mirror-only.
- Airtable does not orchestrate workflows.
- Airtable does not override backend state.
- Airtable does not store secrets.
- Airtable inbound edits require operator review.
- Airtable webhook events become receipts and review items, not direct state changes.
- All mirror writes use idempotency.
- Failed syncs move through retry/dead-letter handling.
- n8n remains a thin worker, not a brain.

## Runtime secrets

Real Airtable tokens and base IDs are intentionally not committed.

Expected runtime variables:
- AIRTABLE_API_KEY
- AIRTABLE_BASE_NEXUS_7
- AIRTABLE_BASE_NEXUS_MSB
- AIRTABLE_BASE_APPLICATIONS_HUB
- AIRTABLE_BASE_AI_ENGINE
- AIRTABLE_BASE_AI_DECISION_ORCHESTRATION
- AIRTABLE_BASE_SYSTEM_OPERATIONS
- AIRTABLE_BASE_AUTOMATION_CONTROL
- AIRTABLE_BASE_COMMUNICATIONS_CENTER
- AIRTABLE_BASE_PROGRAMS_INTELLIGENCE
- AIRTABLE_BASE_FINANCIAL_OPERATIONS
- AIRTABLE_BASE_PARTNER_ECOSYSTEM
- AIRTABLE_BASE_DOCUMENT_VAULT

## DB apply

Optional after validation:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Kingsmen\kingsmen-platform\scripts\db\Run-N07Migration.ps1
```

Requires:
- DATABASE_URL
- psql installed and available in PATH

## Next phase

N08 â€” Control Plane Foundation.