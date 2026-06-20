# Jarvis AI Tools Runtime Readiness

Jarvis AI, tools, apps, and agents must be production-real only when runtime proof exists.

This document locks the `/api/jarvis/ai-tools-runtime-readiness` route.

## Scope

The route reports readiness for:

- Backend Policy Boundary
- Truth Vault Command Evidence
- AI Provider Router
- GitHub Tool Connector
- n8n Thin Relay
- Airtable Human Mirror
- Email Primary Channel
- PayFast Sandbox Provider
- Playwright Scout
- OpenClaw Operator Boundary
- WhatsApp Urgent Only

## Hard rules

- no fake status
- no raw secrets
- no local shell execution from web
- no direct database access from web
- no direct provider calls from web
- backend policy remains authority
- PostgreSQL Truth Vault remains truth
- WhatsApp remains urgent-only
- Playwright remains scout/probe only
- Airtable remains mirror only

## Production boundary

The route may mark backend and Truth Vault live from backend health only. All other provider, tool, app, and agent entries must stay pending, source-ready, or deferred until separate runtime evidence proves them.
