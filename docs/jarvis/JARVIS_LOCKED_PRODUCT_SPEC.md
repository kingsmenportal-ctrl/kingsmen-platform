# JARVIS LOCKED PRODUCT SPEC

Status: LOCKED
Owner: Kingsmen Commander / Founder
Purpose: Stop repeated drift, rebuild loops, black/white regressions, fake provider claims, vague Jarvis definitions, and incompatible architecture merges.

This file is the single source of truth for Jarvis. Every future Jarvis build must read this file before editing UI, scripts, providers, voice, agents, robots, tools, apps, deployment, docs, reports, or command runners.

This file exists because the previous build pattern failed: huge one-shot script -> partial result -> rejected result -> new huge script -> repeated drift. Future work must be smaller, spec-led, repo-led, and validation-gated.

---

## 1. Hard build law

No Jarvis rebuild may start from memory, vibes, an old screenshot, or a blank dashboard.

Required order:

1. Read this locked product spec.
2. Read the latest repo audit reports under `reports/jarvis/`.
3. Read the visual ban and premium proof files.
4. Verify current Git status.
5. Generate a small, checkable change plan.
6. Build only the missing verified piece.
7. Validate against this file before commit.
8. Do not deploy if validation fails.

Banned pattern:

- huge one-shot scripts without a stable spec
- rebuilding the whole system every time
- claiming provider/app/tool/robot connection without runtime proof
- UI that hides agents, robots, tools, apps, providers, N00-N20, evidence, voice, OpenClaw, or Playwright
- static fake dashboards
- placeholder, mock, demo, dummy, hardcoded, or sample operational claims
- drifting between incompatible architectures without explicit Commander decision

---

## 2. Permanent visual lock

Jarvis must never return to the rejected black/white wireframe style.

Banned visual terms and states:

- black-and-white Jarvis shell
- monochrome child-play UI
- static boxed wireframe dashboard
- `Static Live Surface + Jarvis Agent Function`
- `accepted Jarvis OS visual lock is active` as a footer on the rejected screen
- any layout that looks like the rejected screenshots instead of the premium command centre

Locked visual direction:

- premium futuristic command centre
- obsidian / deep navy / royal blue / electric cyan / warm gold
- cinematic central orb or command brain
- dense but clean executive dashboard
- glowing evidence, route, provider, command, and voice sections
- command-house feeling, not a plain chatbox
- live clickable systems, not a picture

The UI must visibly include:

- Agents
- Robots
- Tools
- Apps
- Providers
- N00-N20
- Evidence
- Voice
- OpenClaw
- Playwright
- Oracle Lite / Commander runtime boundary
- Founder command plane

---

## 3. Jarvis identity lock

Jarvis is the private Kingsmen Founder command intelligence.

Jarvis is not:

- a public candidate chatbot
- a marketing assistant
- a generic dashboard
- a static website
- a fake connected provider list

Jarvis must address the user as Commander or Sir when appropriate.

Required opening tone:

`Welcome to Kingsmen Command, Commander.`

Jarvis must be direct, professional, operational, and evidence-first.

---

## 4. Layout lock

Use the supplied futuristic command centre image only as visual and layout reference. Do not screenshot-match it. Jarvis must be implemented as a live, premium, wired command interface.

Locked panel arrangement:

- Top bar: Kingsmen crest/logo left, system online/proof status plus latest truth-sync date/time right.
- Left column: Commander profile card, Mission stats with four values from the status API only, Voice Link waveform, Candidate Operations snapshot, Route Universe map.
- Centre: JARVIS orb plus waveform, command input bar, Kingsmen Work Map N00-N20 grid, Live Execution Timeline, Active Incidents, Route Safety mini-map.
- Right column: OpenClaw Gateway, Playwright Scout, Oracle Lite Runtime, Provider Matrix grid, Founder Command Plane, Evidence & Proof Centre.
- Bottom: protocol/status strip.

Data law:

- Do not hardcode numbers copied from reference images.
- Every number shown in the UI must come from a real API payload or display `proof-needed`.
- Every provider, app, tool, robot, agent, route, or runtime status must come from a real API payload or display `adapter-gated`, `proof-needed`, or `blocked / proof-needed`.
- Never display `connected`, `live`, `online`, `verified`, or `complete` unless runtime evidence exists.
- The real implementation target is `apps/web/src/app/jarvis/JarvisHudClient.tsx`.
- Do not implement this layout in `jarvis-os.html` or any rejected static surface.
- The rejected black/white static Jarvis screen must never be treated as the accepted production surface.

---
## 5. Voice lock

Voice is mandatory. It is not decoration.

Required live voice features:

- visible voice section
- greet Commander button
- speak status button
- wake/listen button where browser support exists
- clear failure message when microphone or speech APIs are unavailable
- no fake voice success states

Required voice boundary:

`Jarvis will not fake voice, wake listening, microphone access, or speech output.`

---

## 6. Agents / robots / tools / apps lock

Jarvis must surface the command mesh as first-class systems.

Latest locked inventory baseline:

- Agents: 254
- Robots: 52
- Tools: 983
- Apps: 90

These systems must be visible in the Jarvis UI and in reports.

Required proof files:

- `reports/jarvis/JARVIS_AGENTS_ROBOTS_TOOLS_APPS_MATRIX_LATEST.md`
- `reports/jarvis/JARVIS_AGENTS_ROBOTS_TOOLS_APPS_MATRIX_LATEST.json`
- `reports/jarvis/JARVIS_AGENTS_ROBOTS_TOOLS_APPS_LIVE_BUILD_PROOF_LATEST.md`

Runtime rule:

`No app, tool, robot or agent is claimed live without runtime proof.`

---

## 7. Provider and app lock

Provider/app names are not proof of connection.

Every provider must be one of these states:

- not found in repo
- referenced only
- found, needs runtime proof
- runtime verified
- blocked / missing credentials

Required providers/apps to surface when present:

- GitHub
- Netlify
- Google Drive
- Gmail
- Google Calendar
- Airtable
- Neon
- Supabase
- Canva
- PayFast
- OpenAI
- AI Wisebase
- B12
- Norton
- Replit
- Catalyst
- Lovable
- Namecheap
- Softonic
- Vivin
- Voice Generator
- OpenClaw
- Playwright
- Oracle Lite

Never display `connected` unless the connector has runtime proof and credential boundary proof.

---

## 8. OpenClaw lock

OpenClaw is the command gateway.

Required functions:

- command registry
- policy gate
- tool router
- evidence ledger
- approval boundary
- safe action boundary

OpenClaw must never silently write files, run dangerous commands, bypass approval, or fake tool execution.

---

## 9. Playwright lock

Playwright is a scout/probe only.

Required boundary:

- no CAPTCHA bypass
- no OTP bypass
- no pretending portal submission succeeded
- blocked portal, selector drift, CAPTCHA, OTP, or portal outage must create MAP/manual/Phoenix fallback

Playwright must support route reality checks, not fake admissions execution.

---

## 10. Architecture lock

Kingsmen platform doctrine remains:

- PostgreSQL is truth
- Airtable is mirror only unless explicitly changed by Commander
- n8n is a thin wrapper only unless explicitly changed by Commander
- GitHub commits and validator reports are proof
- Oracle Lite / local Commander runtime is the execution boundary
- Netlify serves public/static web output only unless backed by real functions/adapters

If another tool/chat proposes Airtable as the actual truth store or n8n as the main system, it must be treated as a conflicting architecture proposal, not silently merged.

Architecture conflict rule:

- Do not merge the N-series/PostgreSQL/Next.js doctrine with an Airtable/n8n-as-truth architecture by accident.
- If Commander chooses Airtable/n8n as the new primary architecture, record it as a formal doctrine change first.
- Until that happens, PostgreSQL remains truth, Airtable remains mirror, and n8n remains thin wrapper.

---

## 10. N00-N20 module lock

Jarvis must not minimize Kingsmen to CAO only.

All N00-N20 modules must remain visible and navigable:

- N00 Constitution / Doctrine Lock
- N01 Foundation / Monorepo / Runtime
- N02 Backend API Kernel
- N03 Truth Vault / PostgreSQL
- N04 Candidate Core / Portal
- N05 Document Vault
- N06 Route Universe / Workbench
- N07 Airtable Sync / Human Mirror
- N08 Operator Command Room
- N09 Notifications
- N10 Finance
- N11 AI Decision Engine
- N12 Governance / Tribunal
- N13 Observability
- N14 Integrations Registry
- N15 Opportunity Engine
- N16 Execution Orchestrator
- N17 Founder Control Plane
- N18 Public Website
- N19 Mobile PWA
- N20 Final Integration

Each module view must eventually show:

- purpose
- files
- APIs
- validators
- reports
- missing work
- next safe command

---

## 11. Evidence lock

Every claim must link to evidence.

Required evidence reports include:

- full repo inventory
- provider connection matrix
- voice/greeting inventory
- OpenClaw/Playwright proof inventory
- agents/robots/tools/apps matrix
- fake/placeholder risk report
- premium command centre build proof

No operational claim is complete without proof.

---

## 12. Current locked Git baseline

Known verified commits:

- `3c3d4f8` â€” Replace rejected black white Jarvis with premium command centre
- `8677c61` â€” Seal Jarvis command mesh proof and matrix JSON
- `6b57b9f` â€” Surface Jarvis agents robots tools and apps command mesh
- `fea0507` â€” Build live Jarvis from registered repo inventory
- `1d328d4` â€” Force-register Jarvis audit JSON inventory

Known audit baseline:

- scanned files: 2734
- Jarvis files: 974
- Jarvis API route files: 73
- Jarvis core files: 144
- Jarvis script files: 285
- validator/report/evidence files: 1134
- total keyword hits: 146364

Known command mesh baseline:

- Agents: 254
- Robots: 52
- Tools: 983
- Apps: 90

---

## 13. Build gate checklist

Before any future Jarvis commit, verify:

- this spec was read
- current UI is not black/white wireframe
- premium command centre terms exist
- banned rejected terms do not exist
- Agents/Robots/Tools/Apps are visible
- Providers are proof-gated
- Voice is visible and failure-clear
- OpenClaw and Playwright boundaries are visible
- N00-N20 are visible
- Evidence links exist
- no fake connected claims exist
- no placeholder operational claims exist
- no incompatible architecture shift occurred without explicit Commander approval

If any item fails, do not deploy.

---

## 14. Future session start command

Every future AI, code assistant, GitHub task, Claude Code session, or manual build session must start with:

1. Read `docs/jarvis/JARVIS_LOCKED_PRODUCT_SPEC.md`.
2. Read `reports/jarvis/JARVIS_FULL_REPO_INVENTORY_LATEST.json`.
3. Read `reports/jarvis/JARVIS_AGENTS_ROBOTS_TOOLS_APPS_MATRIX_LATEST.json`.
4. Read `reports/jarvis/JARVIS_PREMIUM_COMMAND_CENTRE_BUILD_PROOF_LATEST.md`.
5. Run local validation before editing.

If those files are unavailable, stop and recover the spec first.

