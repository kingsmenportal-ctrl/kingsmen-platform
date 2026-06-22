# Jarvis Command Truth Vault Persistence

This proof locks Jarvis command execution to the real backend authority.

Jarvis must not execute local shell commands from the web app, must not write local proof files from the browser route, and must not connect directly to PostgreSQL from the web app. The production command path is:

1. `/jarvis` renders the founder/operator command surface.
2. `/api/jarvis/command` accepts only whitelisted `SAFE_READ` command IDs.
3. The web route converts the request into a backend command envelope.
4. The web route posts the envelope to backend `POST /api/commands`.
5. The backend applies command policy.
6. When `KINGSMEN_TRUTH_VAULT_MODE=postgres`, the backend persists the accepted command to PostgreSQL Truth Vault.
7. The backend records idempotency through `idempotency_keys`.
8. The backend records command evidence through `command_log`.
9. The backend records audit evidence through `audit_events` with `command.accepted`.

## No fake data rule

Jarvis command persistence is not considered live just because the UI is beautiful or the source validator passes. It becomes runtime-proven only when the backend health reports `storageMode: postgres_truth_vault` and a real Jarvis command is accepted through `/api/commands` with PostgreSQL evidence.

## no fake status

The UI may show `PENDING_POSTGRES_TRUTH_VAULT` until the backend is actually running with PostgreSQL Truth Vault enabled.

## no raw secrets

The Jarvis command surface must never return database URLs, service role keys, PayFast secrets, AI keys, token prefixes, key lengths, or raw provider credentials.

## Validation

Run:

```powershell
node scripts/validators/validate-jarvis-command-truth-vault-persistence.mjs
```

Then run a web build:

```powershell
npm --prefix apps/web run build
```

Runtime proof still requires a configured backend API and PostgreSQL Truth Vault.
