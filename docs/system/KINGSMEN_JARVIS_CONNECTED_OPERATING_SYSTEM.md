# Kingsmen + Jarvis Connected Operating System

Production ready: **false**  
Public launch allowed: **false**  
Status: source spine built; runtime proofs and founder approval still required.

## Purpose

This batch connects the whole Kingsmen operating system, not PayFast alone. It gives Jarvis a safe brain-router map across N00-N20 while keeping the backend and PostgreSQL as authority.

## Authority rule

- Backend API is the authority for commands and policy.
- PostgreSQL is the truth vault.
- Jarvis is the brain/router, not the final authority and not a secret store.
- OpenClaw is an operator/worker and must act through approved policy and evidence.
- PowerShell is creator/scribe for controlled file generation and runtime proof packs.
- Airtable is mirror only.
- n8n is thin relay only.
- Playwright is scout/probe only; CAPTCHA, OTP, selector failure, portal down, or blocked portal creates MAP/manual fallback.
- Founder approval is required for payment live activation, refunds, legal launch, production risk, and public launch.

## Connected modules

The connected operating spine covers:

```text
N00 Constitution and doctrine
N01 Repository/runtime foundation
N02 Backend kernel and command bus
N03 PostgreSQL truth vault
N04 Candidate portal and support centre
N05 Document vault
N06 Route universe and application workbench
N07 Airtable mirror and source authority
N08 Founder control plane
N09 Communications centre
N10 Finance and PayFast
N11 AI decision engine and Destiny Map
N12 Governance, tribunal, audit, POPIA
N13 Observability, incidents, backups
N14 Integrations registry and secrets wiring
N15 Opportunity engine, SETA, QCTO, employer and skills routes
N16 Execution orchestrator, MAP and Phoenix fallback
N17 Founder caps, growth, finance control
N18 Public website and sales funnel
N19 Mobile PWA and accessibility
N20 Final assembly and launch gate
```

## Jarvis command boundary

Jarvis may safely route status checks, validators, candidate reads, document review queues, route recommendations, email notices, payment status reads, opportunity matching, MAP fallback, and safe build batches.

Jarvis may not:

- store raw secrets;
- mark a PayFast browser return as paid;
- approve refunds alone;
- send bulk WhatsApp marketing;
- force portal automation through CAPTCHA or OTP;
- launch publicly without the final gate and founder approval.

## Source files

```text
apps/api/src/system/kingsmen-operating-system-spine.ts
packages/jarvis-core/src/jarvis-kingsmen-system-bridge.ts
manifests/system/kingsmen-connected-operating-system-v1.json
scripts/validators/validate-kingsmen-connected-operating-system.mjs
```

## Validation command

```bash
npm run kingsmen:validate:connected-system
```

## Final launch command

```bash
npm run kingsmen:launch:gate
```

## Remaining proof before real public launch

The system can keep being built in GitHub, but public/live operation remains blocked until these external gates are done with evidence:

1. PR branch is synced and mergeable.
2. Runtime secrets are configured outside Git.
3. PostgreSQL/Supabase staging proof passes.
4. PayFast provider sandbox proof passes.
5. Communications provider staging proof passes.
6. Document vault storage proof passes.
7. Legal/privacy pages are reviewed and published.
8. Backup restore drill passes.
9. Founder final launch approval is recorded.
