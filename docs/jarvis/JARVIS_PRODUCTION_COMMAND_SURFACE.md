# Jarvis Production Command Surface

Jarvis is now treated as a live Kingsmen command surface, not a local demo screen.

## What changed

- `/jarvis` renders `JarvisProductionCommandClient`.
- The page reads live status from `/api/jarvis/status`.
- The page sends command envelopes through `/api/jarvis/command`.
- The command deck is loaded from the live status API.
- The UI includes live status cards, command cards, voice context, visual feed, evidence drawer, and doctrine lock.
- The page does not substitute fake candidate, payment, route, AI, or operational data when backend status is unavailable.

## Production boundary

The production Jarvis surface must not execute local shell commands, call PostgreSQL directly from the browser/web route, or write local evidence files from the web page. Backend API and Truth Vault remain authority.

## Still required for real public production

- Backend API must be running and reachable from `KINGSMEN_BACKEND_BASE_URL`.
- Backend `/api/commands` must persist command envelopes and policy evidence to PostgreSQL Truth Vault.
- Runtime provider connections must be configured outside Git.
- PayFast provider sandbox staging evidence must pass before payments are considered real.
- Staging runtime evidence pack and final assembly bundle must pass before public launch.

## Validation

Run:

```powershell
npm run jarvis:validate:production
```

The validator checks the page, component, CSS, manifest, docs, and the safe API routes that the Jarvis production surface depends on.
