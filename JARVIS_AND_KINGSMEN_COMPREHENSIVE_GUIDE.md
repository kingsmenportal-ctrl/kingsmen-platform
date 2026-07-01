# Comprehensive Guide to Jarvis and Kingsmen Platform

**Generated:** 2026-07-01  
**Repository:** kingsmenportal-ctrl/kingsmen-platform  
**Status:** Live Build

---

## Table of Contents

1. [Kingsmen Platform Overview](#kingsmen-platform-overview)
2. [Jarvis System Architecture](#jarvis-system-architecture)
3. [Agent System (AGENTS-01)](#agents-01-agent-system)
4. [Core Components](#core-components)
5. [Launch Readiness](#launch-readiness)
6. [Technical Stack](#technical-stack)
7. [Commands and Scripts](#commands-and-scripts)
8. [Safety and Governance](#safety-and-governance)

---

## Kingsmen Platform Overview

### What is Kingsmen?

Kingsmen is being built as a **South African admissions, opportunities, document, finance, communications, and automation platform**. It is not a replacement for traditional education systems but rather a unified gateway helping candidates navigate multiple pathways:

- **Education paths** (universities, colleges)
- **TVET programs** (Technical & Vocational Education & Training)
- **SETA learnershipships** (Sector Education & Training Authorities)
- **Bursary opportunities**
- **Employment routes**
- **Package-based managed pathways**

### Core Purpose

Kingsmen serves South African candidates by:
1. Providing a **Free Destiny Map** public entry point (no data collection)
2. Managing candidate workflows through multiple opportunity paths
3. Handling document verification and management
4. Processing payments securely through PayFast sandbox
5. Maintaining communication channels (email-first, WhatsApp urgent-only)
6. Providing founder command intelligence via Jarvis

### Architecture Philosophy

**Authority Hierarchy:**
```
PostgreSQL Truth Vault (source of truth)
  ↓
Backend API state machine
  ↓
GitHub repository evidence
  ↓
Validators and boot-blockers
  ↓
Founder approval for production-risk actions
```

Jarvis operates **below** this hierarchy, never above it.

---

## Jarvis System Architecture

### Identity & Purpose

**Jarvis is the private command intelligence of Kingsmen.**

- Jarvis speaks **only to the Commander** (the Kingsmen founder)
- Jarvis is NOT customer support
- Jarvis is NOT a public chatbot
- Jarvis is a **private, evidence-backed, command-room intelligence system**

### Supreme Wake Rule

When the Commander says "Jarvis," the greeting must be:

> Welcome to Kingsmen Command, Commander. Jarvis is online. The command house is awake, your desk is prepared, and I stand ready to brief, inspect, report, search, repair, research, organise, or execute under Kingsmen doctrine.

### Voice Standard

Jarvis must sound like:
- A private chief-of-staff
- An old-world executive aide
- A command-room intelligence officer
- A discreet estate secretary
- A strategic operations advisor

**Proper address:** "Commander" or "Sir" (never "Boss," "Founder," "Bro," "Chief," "User," "Client")

### Jarvis V5 Command Standard

The **Kingsmen Jarvis V5 Commander Command Intelligence Standard** is **LOCKED** doctrine and belongs to the **Commander only**.

**Public access:** DENIED  
**Candidate access:** DENIED  
**Primary purpose:** Private command intelligence, personal assistance, research, reporting, inspection, repair, and controlled execution.

---

## AGENTS-01: Agent System

**Status:** BUILT_PENDING_VALIDATION  
**Production Ready:** false

### Permanent Agent Law

```
AI may recommend.
Scripts must validate.
Backend must enforce.
PowerShell and GitHub Actions must prove.
GitHub must preserve.
Founder must approve high-risk actions.
```

### Agent Classes

#### 1. Founder Command Agent
Receives founder commands and converts them into safe, allowlisted Kingsmen actions.

**Allowed:**
- Show status
- Read local reports
- Show provider boundaries
- Show next action
- Create action packet draft

**Not allowed:**
- Deploy to Oracle
- Send bulk email
- Enable payments
- Approve refunds
- Share candidate data
- Submit official applications
- Modify production secrets

#### 2. Doctrine Guardian Agent
Checks whether commands or modules violate Kingsmen doctrine.

**Must protect:**
- Oracle Lite discipline
- All six gates visible
- Package intensity not capability denial
- Email-first communication
- WhatsApp urgent-only
- Playwright probe-only
- MAP fallback
- No production claim without proof

#### 3. Provider Gate Agent
Checks whether a connected app/tool is:
- Visible
- Callable
- Sandbox-proven
- Controlled-live
- Blocked
- Disabled

**Critical:** No provider becomes production-safe only because it is connected.

#### 4. Proof Honesty Agent
Blocks false claims:
- productionReady=true without proof
- deployedToOracle=true without Oracle proof
- paymentsLive=true without payment proof
- emailRuntimeLive=true without COMMS proof
- officialSubmissionsLive=true without submission proof
- candidateOwnDataProof=true without RLS/browser proof

#### 5. Oracle Lite Agent
May check Oracle reports and prepare action packets.

**Must not:**
- Spend money
- Create paid resources
- Expose keys
- Deploy without founder approval and proof scripts

#### 6. Candidate Safety Agent
Protects candidates from:
- False guarantees
- Unverified source claims
- Unverified fee/deadline instructions
- Candidate data leakage
- Partner sharing without consent

#### 7. Finance Guard Agent
Protects:
- Payments
- Refunds
- Proof of payment
- Provider webhooks
- Package pricing

**Rule:** Backend/provider events must verify payment. Founder/operator approval required for refund exceptions.

#### 8. Communications Guard Agent
Enforces:
- Email-first (primary)
- WhatsApp urgent-only
- SMS backup-only
- No bulk WhatsApp reminders
- No unapproved outreach campaigns

---

## Core Components

### 1. Jarvis Core Library

**Location:** `packages/jarvis-core/src/`

#### Jarvis Policy Gate (`jarvis-policy-gate.ts`)
- Evaluates commands against Kingsmen doctrine
- Classifies risk levels
- Makes allow/block/approve decisions
- Authority levels: LEVEL_1 (read-only) → LEVEL_5 (production approval required)

**Production Terms:** production, prod, deploy, release, payment, refund, payfast, candidate submission, send message, bulk, delete, drop table, rotate secret, branch protection

**Blocked Terms:** bypass captcha, bypass otp, dump secrets, disable rls, remove approval gate, ignore doctrine, skip validators, force production without approval

#### Jarvis Tool Registry (`jarvis-tool-registry.ts`)
Trusted tool capability cards for:
- Repository validator (`jarvis.validator.repo`) - Trust Level 2, Staging write
- GitHub connector (`jarvis.connector.github`) - Trust Level 3, Staging write
- Airtable connector (`jarvis.connector.airtable`) - Trust Level 4, Production approval required
- n8n connector (`jarvis.connector.n8n`) - Trust Level 4, Production approval required
- PayFast connector (`jarvis.connector.payfast`) - Trust Level 4, Production approval required
- Browser Scout (`jarvis.browser.scout`) - Trust Level 2, Read-only

#### Evidence Ledger (`jarvis-evidence-ledger.ts`)
Tracks all Jarvis command events:
- Command receipt
- Policy decisions
- Tool plans
- Validator output
- Approvals and blocks

#### Repo Map (`jarvis-repo-map.ts`)
Intelligently selects repository context:
- Filters blocked files (.env, .git/, node_modules, secrets/, credentials/, .pem, .key, .p12, .pfx)
- Filters low-value files (dist/, coverage/, .next/, .cache/, .tsbuildinfo, .log)
- Scores files by relevance to module reference
- Returns safe summary of selected files

### 2. Deployable Backend API

**Location:** `apps/api/`

#### Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/health` | Runtime health check |
| GET | `/api/system/health` | API health, storage mode, Truth Vault status |
| POST | `/api/commands` | Validates, policy-checks, persists Kingsmen command envelope |
| POST | `/api/workflow/result` | Persists normalized worker result |
| POST | `/api/workflow-results` | Alias for workflow result intake |
| GET | `/api/candidates/:candidateId/status` | Candidate read model |
| GET | `/api/applications/:applicationId/workbench` | Application workbench read model |

#### Storage Modes
- **memory_development_only** - Default, for local development
- **postgres_truth_vault** - Production path, uses PostgreSQL/Supabase

#### Environment Variables
```powershell
PORT=8080
KINGSMEN_API_HOST=0.0.0.0
KINGSMEN_API_CORS_ORIGIN=*
KINGSMEN_TRUTH_VAULT_MODE=postgres  # or memory
KINGSMEN_DATABASE_URL=[set-outside-git]
KINGSMEN_DATABASE_SSL=true
DATABASE_URL=[fallback]
```

### 3. Web Application

**Location:** `apps/web/`

Built with **Next.js** (latest App Router). Provides:
- Candidate portal entry
- Free Destiny Map public surface
- Kingsmen admin interface
- Jarvis HUD console
- Backend boundary protection

**Key protection:** Web has no local shell, no local file writes, no direct database access from browser.

### 4. Contracts

**Location:** `packages/contracts/src/jarvis/`

TypeScript interfaces defining:
- JarvisCommandEnvelope
- JarvisAuthorityLevel (LEVEL_1 through LEVEL_5)
- JarvisDecision (ALLOW, DRY_RUN_ONLY, APPROVAL_REQUIRED, BLOCK)
- JarvisActionRisk (BLOCKED_UNSAFE, HIGH_PRODUCTION_RISK, HIGH_CONNECTOR_WRITE, etc.)
- JarvisToolCapabilityCard

---

## Launch Readiness

### Current Status

**Public launch is BLOCKED.**

The repository has source-level proof for:
- Backend API
- PostgreSQL/Supabase Truth Vault persistence
- Safe web-to-backend boundary
- PayFast sandbox boundary
- RLS/security
- Backup/restore
- Branch protection

### P0 Blockers (Must be fixed before public users)

1. **Protect `main` branch** - Source guard exists, GitHub protection must still be applied
2. **Prove Truth Vault persistence on staging** - Live staging run required
3. **Prove RLS/security in staging** - Hardening migration + candidate/operator/founder isolation
4. **Prove safe web-to-backend boundary in staging** - Deployed web app proof
5. **Prove PayFast sandbox + ITN** - Sandbox success/cancel/return/failure evidence
6. **Prove backup and restore** - Real staging restore drill
7. **Wire secrets outside git** - Masked runtime health evidence
8. **Prove communications provider boundary** - Email/WhatsApp/SMS provider proof
9. **Prove observability and incident handling** - Health/logs/queue/alerts/SEV runbook
10. **Publish privacy, consent, terms, and refund policy** - Published surfaces + founder review
11. **Capture staging runtime proof pack** - All redacted runtime evidence
12. **Capture final assembly evidence bundle** - Summary with SHA-256/status/review fields

### Launch Phases

1. **Repo lock** - Protect main, require validators
2. **Staging runtime** - API + web + PostgreSQL + command flow + proof pack
3. **Final assembly** - Collect evidence bundle, founder review
4. **Founder private beta** - Manual test candidates with evidence
5. **Paid pilot** - Only after PayFast, refunds, support, communications, legal, observability
6. **Public launch** - Only after every required gate opens

---

## Technical Stack

### Language Composition
- **JavaScript:** 35.1%
- **TypeScript:** 33.7%
- **HTML:** 22.2%
- **PowerShell:** 8.6%
- **CSS:** 0.3%
- **PLpgSQL:** 0.1%

### Frameworks & Runtime
- **Web:** Next.js (App Router, latest)
- **API:** Node.js 20+, CommonJS
- **Database:** PostgreSQL / Supabase (Truth Vault)
- **Payment:** PayFast (sandbox)
- **Automation:** n8n (thin worker)
- **Data Mirror:** Airtable (connector)
- **Cloud:** Oracle Lite (lightweight)
- **Browser Automation:** Playwright

### Key Dependencies
- **pg** - PostgreSQL client
- **playwright** - Browser automation
- **mammoth** - Document parsing (DOCX)
- **pdf-parse** - PDF parsing
- **react / react-dom** - UI framework

### Validators
Node.js/JavaScript validation scripts (`scripts/validators/`) check:
- Jarvis core invariants
- Live Jarvis connection
- API Truth Vault persistence
- Web backend boundary
- PayFast sandbox boundary
- PostgreSQL connectivity
- RLS/SQL isolation
- Launch readiness evidence
- Script library (v5 numbers 1-38)

---

## Commands and Scripts

### Jarvis Validation

```bash
npm test                                          # Core Jarvis validation
npm run jarvis:validate                           # Connected live validation
npm run jarvis:validate:core                      # Core invariants only
npm run jarvis:validate:live-pass-02              # Live pass 02
npm run jarvis:validate:live-pass-03              # Live pass 03
npm run jarvis:validate:v5:01-to-38               # Full v5 script library
npm run jarvis:credentials:scan                   # Credential readiness scan
npm run jarvis:activation:matrix                  # Module activation matrix
npm run jarvis:gates:evaluate                     # Gate evaluation
npm run jarvis:live:readiness                     # Live readiness check
npm run jarvis:switch:request                     # Simulate switch request
```

### API Commands

```bash
npm run api:build                                 # Build API package
npm run api:start                                 # Start API server
npm run api:validate                              # Validate Truth Vault persistence
```

### Web Commands

```bash
npm run web:validate:backend-boundary             # Validate safe boundary
```

### Kingsmen Launch Commands

```bash
npm run kingsmen:launch:audit                     # Audit report (non-blocking)
npm run kingsmen:launch:gate                      # Launch gate (boot-blocker)
```

### Payment Commands

```bash
npm run payments:prove:sandbox                    # PayFast sandbox proof
npm run payments:validate:sandbox                 # PayFast validation
```

### Security Commands

```bash
npm run security:prove:rls                        # Prove RLS/SQL isolation
npm run security:validate:rls                     # Validate RLS
npm run secrets:prove:wiring                      # Prove secrets wiring
npm run secrets:validate:wiring                   # Validate secrets
```

### PowerShell Scripts

**Creator Phase Execution:**
```powershell
.\scripts\KINGSMEN_CREATOR_PHASE.ps1 -Phase Help
.\scripts\KINGSMEN_CREATOR_PHASE.ps1 -Phase Doctor
.\scripts\KINGSMEN_CREATOR_PHASE.ps1 -Phase AuditExisting
.\scripts\KINGSMEN_CREATOR_PHASE.ps1 -Phase N09.3Complete
.\scripts\KINGSMEN_CREATOR_PHASE.ps1 -Phase Validate
.\scripts\KINGSMEN_CREATOR_PHASE.ps1 -Phase Report
```

**Oracle Lite Runtime:**
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\runtime\Start-KingsmenLite.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\runtime\Stop-KingsmenLite.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\runtime\Health-KingsmenLite.ps1
```

**Local AI Helpers:**
```powershell
.\scripts\tools\kingsmen-ai-fast.ps1 "your safe Kingsmen task"     # qwen2.5:0.5b
.\scripts\tools\kingsmen-ai-smart.ps1 "your safe Kingsmen task"    # qwen3.5:2b
```

---

## Safety and Governance

### Kingsmen Jarvis Guard

**Jarvis Guard** restricts what the local command brain can inspect:

**CAN inspect:**
- docs/
- manifests/
- reports/
- .claude/agents/
- .claude/commands/

**MUST NOT inspect:**
- .env
- .oci/
- .ssh/
- secrets/
- logs/
- Files containing: service_role, PayFast keys, Oracle private keys, GitHub tokens
- Candidate data
- Payment data
- Browser cookies
- Production credentials

**Job:** Map what is built, validated, planned, what proof is missing, what next safe batch should run.

### Jarvis Law Files (PJ42.1)

**Master Flow:**
```
Commander
  → Jarvis HUD
  → Dialogue Brain
  → Intent Router
  → Kingsmen Policy Gate
  → Tool Router
  → Evidence Ledger
  → Answer Composer
```

**Law Surfaces:**
1. **Permission Law** - Commander-only, never speak to candidates/public
2. **Memory Law** - Remember doctrine, decisions, outcomes; never store private data
3. **Live Data Law** - Use live data for unstable facts (deadlines, fees, status)
4. **Command Risk Law** - Every command has a risk level (safe_read → blocked)
5. **Visual HUD Law** - Proper visual HUD with cards, drawers, modals
6. **Evidence Law** - Every tool-backed answer creates evidence
7. **Validation Law** - Machine-readable law files and future validator confirmation

### Jarvis Memory Vault (PJ48)

**What Jarvis MAY remember:**
- Locked doctrine summaries
- Build decisions
- Phase completion summaries
- Command outcome summaries
- Source confidence summaries
- Public opportunity intelligence
- Incident summaries
- Visual product decisions
- Commander-approved preferences

**What Jarvis MUST NOT remember:**
- Raw candidate records
- Raw payment records
- Private document contents
- Authentication material
- Browser session material
- Private banking/card details
- Raw secret logs
- Unapproved personal data

### Payment Proof (PayFast Sandbox)

**Non-negotiable laws:**
- No live payments enabled by this proof
- No candidate charged by source-level proof scripts
- No PayFast merchant secret/passphrase/private key may be committed
- No paid status from return URL alone
- Paid status requires accepted ITN (Instant Transaction Notification) evidence
- ITN must verify: signature, amount, source, status, idempotency
- Duplicates and replays must be rejected
- Refunds require human review (no auto-approval)
- Payments/refunds communication is email-primary

**Required sandbox scenarios:**
- Complete ITN accepted only when signature/amount/source/idempotency valid
- Cancel navigation does not mark order as paid
- Return navigation shows pending (not paid) until ITN accepted
- Failed ITN is rejected
- Duplicate ITN is rejected idempotently
- Invalid signature rejected
- Amount mismatch rejected
- Replay rejects via idempotency key
- Refund remains pending until human approval

---

## Key Files & Locations

### Core Jarvis
- `packages/jarvis-core/src/jarvis-policy-gate.ts` - Policy decision engine
- `packages/jarvis-core/src/jarvis-tool-registry.ts` - Tool capability cards
- `packages/jarvis-core/src/jarvis-repo-map.ts` - Intelligent file selection
- `packages/jarvis-core/src/jarvis-evidence-ledger.ts` - Event tracking
- `packages/contracts/src/jarvis/` - TypeScript contracts

### Backend API
- `apps/api/src/server.ts` - HTTP server runtime
- `apps/api/src/api/` - API handlers
- `apps/api/src/models/` - Read model logic

### Web App
- `apps/web/src/app/` - Next.js app directory
- `apps/web/src/app/jarvis/JarvisHudClient.tsx` - Jarvis visual interface
- `apps/web/src/lib/kingsmen-backend-client.ts` - Backend communication

### Documentation
- `docs/agents/KINGSMEN_AGENT_SYSTEM.md` - Agent classes and laws
- `docs/jarvis/JARVIS_COMMAND_STANDARD.md` - Jarvis v5 command standard
- `docs/launch/KINGSMEN_LAUNCH_READINESS.md` - Launch blockers and phases
- `docs/finance/KINGSMEN_PAYMENT_PROOF.md` - PayFast sandbox boundary
- `docs/KINGSMEN_JARVIS_GUARD.md` - Data inspection restrictions

### Validators
- `scripts/validators/validate-jarvis-core.mjs` - Core Jarvis validation
- `scripts/validators/validate-kingsmen-launch-readiness-evidence-aware.mjs` - Launch gate
- `scripts/validators/validate-jarvis-v5-*.mjs` - v5 script library validators (01-38)

### PowerShell
- `KINGSMEN_CREATOR.ps1` - Main creator entry point
- `scripts/KINGSMEN_CREATOR_PHASE.ps1` - Phase execution logic
- `scripts/runtime/Start-KingsmenLite.ps1` - Oracle Lite start
- `scripts/tools/kingsmen-ai-fast.ps1` - Fast AI helper
- `scripts/tools/kingsmen-ai-smart.ps1` - Smart AI helper

---

## Summary

**Kingsmen Platform** is a comprehensive South African opportunity management system built on these principles:

1. **Evidence-First:** Nothing is claimed without proof
2. **Founder-Approved:** High-risk actions require founder approval
3. **Candidate-Safe:** Built with safeguards against false guarantees
4. **Provider-Boundary:** Connected tools don't become safe just by being connected
5. **Truth-Vault:** PostgreSQL is the source of truth, not Jarvis or scripts
6. **Founder-Command:** Jarvis is private command intelligence, not public AI

**Jarvis** is the elegant, professional interface through which the Kingsmen Founder commands the system—always respecting the layers of validation, backend enforcement, and governance that protect both the platform and its candidates.

The system is **currently in staged launch preparation** with strict P0 blockers preventing public access until all safety gates pass review and real staging evidence is captured.

---

*Document generated from repository analysis of kingsmenportal-ctrl/kingsmen-platform*
