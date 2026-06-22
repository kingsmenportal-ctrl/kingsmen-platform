# Jarvis OpenClaw Operator Policy Boundary

## Purpose

Jarvis may coordinate OpenClaw as an operator surface, but OpenClaw is not the final authority. The backend command outbox remains automation authority and PostgreSQL Truth Vault remains system truth.

## Route

`/api/jarvis/openclaw-operator-policy-boundary`

## Command envelope

`OPENCLAW_OPERATOR_POLICY_CHECK`

The command must pass through `/api/jarvis/command` and then the backend command boundary. The web route may not execute shell commands, write local files, call providers directly, or write PostgreSQL directly.

## Non-negotiable rules

- OpenClaw operator only.
- Backend command outbox remains automation authority.
- PostgreSQL Truth Vault remains system truth.
- OpenClaw may not become authority.
- OpenClaw may not bypass policy.
- OpenClaw may not execute risky actions without founder approval.
- OpenClaw may not write Truth Vault directly.
- OpenClaw may not access raw secrets.
- OpenClaw may not change payments.
- OpenClaw may not submit portals without MAP/Phoenix/manual fallback policy.
- Operator evidence ledger required.
- Founder approval required for risky actions.
- No raw secrets.
- No direct provider calls from web.
- Backend command envelope required.

## Runtime proof

Run:

```powershell
npm run jarvis:runtime:openclaw-operator-policy
```

The proof writes:

`reports/jarvis/jarvis-openclaw-operator-policy-boundary-proof-latest.json`

## Launch stance

This boundary never marks Kingsmen production-ready or public-launch-ready on its own. It only proves that OpenClaw is governed by backend policy, Truth Vault evidence, and founder approval boundaries.
