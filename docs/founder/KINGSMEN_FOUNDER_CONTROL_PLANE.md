# Kingsmen Founder Control Plane

Production ready: **false**  
Public launch allowed: **false**  
Status: founder-visible control plane is source-built; deployed runtime proof still required.

## Purpose

The founder control plane shows the whole Kingsmen operating system in one place: N00-N20 modules, Jarvis routing, OpenClaw/operator queues, PayFast/finance, documents, route universe, communications, opportunity engine, incidents, validator commands, and launch blockers.

## Route

```text
/founder/control-plane
```

## Backend read model

```text
GET /api/founder/control-plane
```

The page reads the backend route when `KINGSMEN_API_BASE_URL` or `NEXT_PUBLIC_KINGSMEN_API_BASE_URL` is configured. If the backend URL is missing, the page shows a clearly marked source fallback and does not mutate system truth.

## What the founder sees

- Production-ready and public-launch status.
- N00-N20 module status.
- Authority doctrine: backend authority, PostgreSQL truth, Jarvis brain-router, OpenClaw operator, Airtable mirror, n8n thin relay, Playwright scout.
- Module owners and proof statuses.
- Validator commands and report paths.
- Launch blockers.
- Queues for launch gate, Jarvis build, payment proof, document vault proof, communications proof, and founder review.

## Safety rules

- The founder screen is read-only.
- It must not display raw secrets.
- It must not display private candidate documents.
- It must not hide launch blockers.
- It must not claim production readiness before runtime proof.
- Jarvis cannot use this screen to bypass founder approval.

## Source files

```text
apps/api/src/founder/founder-control-plane-read-model.ts
apps/api/src/founder/founder-control-plane-route.ts
apps/web/src/founder/founder-control-plane-client.ts
apps/web/src/founder/FounderControlPlane.tsx
apps/web/src/app/founder/control-plane/page.tsx
scripts/validators/validate-founder-control-plane.mjs
```

## Validation command

```bash
npm run founder:validate:control-plane
```

## Remaining runtime proof

1. Mount `/api/founder/control-plane` in the deployed API router if the current server entrypoint has not loaded the route descriptor.
2. Configure backend base URL outside source.
3. Add authenticated founder-only access.
4. Capture runtime screenshots of healthy, blocked, and proof-required states.
5. Run `npm run kingsmen:launch:gate` before any public launch claim.
