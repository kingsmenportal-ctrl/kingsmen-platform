# Jarvis Command Runtime Truth Vault Proof

## Purpose

This proof turns the Jarvis command surface from source-ready into runtime-evidence-ready.

It verifies that `/api/jarvis/command` is only a web proxy boundary, that it sends a command envelope to the backend `POST /api/commands`, and that a configured backend running `KINGSMEN_TRUTH_VAULT_MODE=postgres` persists evidence in PostgreSQL Truth Vault.

## Runtime proof command

```powershell
npm run jarvis:runtime:command-proof
```

The script writes the masked runtime report to:

```text
reports/jarvis/jarvis-command-runtime-proof-latest.json
```

## Required runtime evidence

The report must prove all of the following before this gate can be treated as complete:

- backend health is reachable
- Jarvis live index is reachable
- Jarvis command POST is accepted
- backend storage mode is `postgres_truth_vault`
- `command_log` contains the accepted command
- `audit_events` contains `command.accepted` evidence
- `idempotency_keys` contains the completed idempotency key
- no fake status
- no raw secrets
- no local shell execution from the web route
- no direct database access from the web route

## Non-negotiable boundary

The web route may call the backend API only. It must not run PowerShell, call Docker, use `pg`, write local evidence files, or invent provider/candidate/payment/AI/tool status.

Production ready remains **false** until full staging evidence, PayFast provider sandbox proof, final assembly evidence, and founder approval are complete.
