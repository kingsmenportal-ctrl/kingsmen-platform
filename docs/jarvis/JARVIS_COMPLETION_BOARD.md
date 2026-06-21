# Jarvis Completion Board

## Purpose

The Jarvis Completion Board lets Kingsmen continue source-safe Jarvis build work when local Docker Desktop, Postgres, Redis, or the backend API are not available.

It does not mark Kingsmen production-ready. It does not bypass runtime proof. It does not execute local shell commands from the browser. It does not read raw provider secrets. It does not write directly to PostgreSQL or any provider.

## Route

```text
GET /api/jarvis/completion-board
```

## Source-safe coverage

The board indexes the current Jarvis completion lanes:

- Jarvis command surface
- Jarvis live index
- Jarvis completion board
- OpenClaw operator policy boundary
- Playwright scout and MAP fallback
- n8n thin relay
- GitHub tool connector
- Airtable human mirror
- Email primary channel
- WhatsApp urgent-only and SMS backup
- PayFast provider proof queue
- AI provider router
- Local Docker runtime blocker

## Runtime truth

The board is allowed to say that source wiring exists and that previous proof files exist, but production truth still requires the normal runtime gates:

- backend API reachable
- `postgres_truth_vault` storage mode
- command/audit evidence
- provider credentials outside Git
- redacted provider proof
- staging evidence capture
- founder approval for risky actions
- launch audit and launch gate

## Docker failure rule

Docker failure blocks local runtime proof only. It must not stop source construction, validators, route wiring, manifests, docs, UI panels, or provider boundary hardening.

## Validator

Run directly:

```powershell
node scripts\validators\validate-jarvis-completion-board.mjs
```

The npm alias can be added later if package updates are available in the active branch:

```powershell
npm run jarvis:validate:completion-board
```

## Permanent safety locks

- `productionReady=false`
- `publicLaunchAllowed=false`
- `dockerIndependentBuildAllowed=true`
- `rawSecretsReturned=false`
- `localShellExecuted=false`
- `directDatabaseAccessFromWeb=false`
- PostgreSQL Truth Vault remains authority
- Airtable remains mirror only
- n8n remains thin relay only
- Playwright remains scout/probe only
- WhatsApp remains urgent-only
- Email remains primary tracked communication channel
