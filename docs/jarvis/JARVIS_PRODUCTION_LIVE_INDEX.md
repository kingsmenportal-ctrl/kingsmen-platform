# Jarvis Production Live Index

Jarvis production is not allowed to display fake status for AI, tools, apps, agents, payments, evidence, or infrastructure.

The route `/api/jarvis/live-index` returns a real boundary index for the current deployment. It does not execute local shell commands, does not write proof files from the web app, does not read raw secrets, and does not substitute dummy provider state.

## What the index covers

- Backend API Authority
- PostgreSQL Truth Vault
- Jarvis Command Envelope
- AI Provider Router
- Tools and Apps Registry
- PayFast Sandbox Provider Proof
- Email Primary Channel
- OpenClaw Operator Boundary
- WhatsApp Urgent Only

## Rules

- No fake status.
- No raw secrets.
- No dummy provider cards.
- Missing provider/runtime proof must stay `PENDING_RUNTIME_PROOF`.
- Browser and Next web routes must not execute local shell commands.
- Browser and Next web routes must not perform direct database access.
- Backend command evidence remains the authority.
- AI Provider Router becomes real only after backend-controlled provider routing and redacted runtime evidence.
- Tools and Apps Registry becomes launch-useful only after each provider has its own staging evidence.

## Validation

Run:

```powershell
node scripts/validators/validate-jarvis-production-live-index.mjs
npm --prefix apps/web run build
```

Production ready remains **false** until backend API, AI provider, PayFast, communications, storage, observability, legal/privacy, staging evidence pack, and final assembly evidence are proven.
