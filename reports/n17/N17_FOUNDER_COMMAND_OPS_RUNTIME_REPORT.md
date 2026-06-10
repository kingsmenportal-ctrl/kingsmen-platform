# N17 â€” Founder Control Plane / Command Ops Runtime

Status: Built and validation-ready.

N17 creates the Kingsmen founder/operator command side. This is your side of the platform: command cockpit, daily briefs, phone control, escalation handling, watchlist, command decisions, and audit.

Founder Control Plane is not a second backend.

Core routing:
- Read-only inspection routes to N08 control plane read models.
- Reports and briefs route to N13 observability.
- Risky or state-moving commands route through N12 governance.
- Execution commands route through N16 orchestrator.
- W24 command envelopes route through W17 before N16 worker dispatch.

Created:
- founder runtime config
- founder operator profiles
- founder command catalog
- founder command requests
- founder command results
- founder daily briefs
- founder watchlist
- founder escalation threads
- founder decision log
- founder mobile cards
- founder ops audit events
- runtime example
- API command catalog
- API founder command policy
- API founder command router
- API founder brief builder
- API founder mobile cockpit
- API founder decision log
- API founder read model
- UI command center
- UI phone cockpit
- UI brief panel
- UI escalation panel
- UI decision log panel
- DB migration runner
- N17 validator

Hard blocked:
- no state-machine bypass
- no direct official submission from founder panel
- no direct refund payout from founder panel
- no final fraud/privacy decision without governance
- no fake official status
- no silent override
- no command without evidence

Founder can:
- inspect
- prioritize
- pause
- resume
- approve
- reject
- escalate
- request MAP
- request Phoenix fallback
- request document/source/finance/comms review
- build morning/midday/evening/incident/weekly/monthly briefs

Daily briefs include:
- system health
- queue
- finance
- documents
- matching
- Playwright/MAP
- incidents
- capacity
- urgent candidates

Phone cockpit rule:
Every card must show cause, reason, current risk, next action, and fix path.

Comms doctrine:
Email remains primary. WhatsApp remains urgent-only.

Capacity doctrine:
Oracle Lite 500 active-candidate cap controls throughput only, not national capability or user dignity.

Optional DB apply:
powershell -ExecutionPolicy Bypass -File C:\Kingsmen\kingsmen-platform\scripts\db\Run-N17Migration.ps1

Next:
N18 - Public Website / Route House Front Door.