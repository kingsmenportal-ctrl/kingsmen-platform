# Live Public Repo Adapters

This folder contains Kingsmen-owned adapter wrappers/contracts for public repo integrations.

The adapters do not make public repos the Kingsmen authority.
They define safe inputs, blocked inputs, evidence outputs, and review boundaries.

Current live adapters:

- `DoclingAdapter.contract.ts`
- `DoclingSmartIntakeAdapter.ts`
- `PlaywrightScoutGateway.contract.ts`

Live services/routes using these adapters:

- `/api/documents/extract`
- `/api/jarvis/public-repos/docling-smart-intake`
- `/api/routes/scout`
- `/api/jarvis/public-repos/playwright-scout`

Next queued adapter:

- `JarvisWakeWordService`
