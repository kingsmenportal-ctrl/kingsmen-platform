# JB004 — Combined Jarvis Stack and Startup Reality Record

Status: completed on `main`  
Purpose: combine the Kingsmen/Jarvis tool-stack checkpoint with the real Windows CMD startup failure record and final launcher repair.

## Tool-stack checkpoint

The Kingsmen/Jarvis stack is recorded as:

| Tool | Kingsmen/Jarvis role | Decision |
|---|---|---|
| GitHub | Source control, commits, version history, deployment base | Core required |
| OpenJarvis | Personal AI architecture/design reference | Reference only, not blind install |
| OpenClaw | Autonomous assistant/runtime pattern | Dangerous unless locked down; not direct authority |
| Playwright | Browser scout/probe for portals, links, forms, screenshots, and source status | Core required as scout only |
| Hermes | Ambiguous until exact repo/project is identified | Do not build as core until clarified |

Correct structure:

```text
Commander
  -> Jarvis Command Layer
  -> Kingsmen Backend State Machine
  -> Approved Tools
  -> Evidence Ledger
```

Rejected structure:

```text
Commander
  -> OpenClaw/Hermes directly controlling Kingsmen
```

Reason: autonomous agents with filesystem, browser, email, payment, or production access are too risky unless locked behind command registry, policy gate, approvals, and evidence.

## Local startup failure record

The real CMD transcript showed:

```text
cd /d C:\Kingsmen\kingsmen-platform
git pull
scripts\windows\START_JARVIS_CMD.cmd
The system cannot find the path specified.
```

Then the direct web app command worked far enough to prove the app folder exists:

```text
cd /d C:\Kingsmen\kingsmen-platform\apps\web
npm run dev
```

But Next could not bind to port 3000:

```text
Error: listen EADDRINUSE: address already in use 127.0.0.1:3000
```

Netstat proved the active listener:

```text
TCP 127.0.0.1:3000 LISTENING 8768
```

## Repair completed

Two launch paths are now valid:

```text
START_JARVIS.cmd
scripts\windows\START_JARVIS_CMD.cmd
```

The root launcher now detects when port 3000 is already listening, opens the existing Jarvis page, and does not start a second server.

The scripts/windows launcher now delegates to the root launcher so there is one startup logic path.

## Commander runbook

From CMD:

```cmd
cd /d C:\Kingsmen\kingsmen-platform
git pull
START_JARVIS.cmd
```

Old path also works after pull:

```cmd
scripts\windows\START_JARVIS_CMD.cmd
```

If port 3000 is occupied and the page is stale, stop the active process:

```cmd
netstat -ano | findstr :3000
taskkill /F /PID <PID>
START_JARVIS.cmd
```

For the exact recorded case:

```cmd
taskkill /F /PID 8768
START_JARVIS.cmd
```

## Acceptance

- Root launcher exists.
- scripts/windows compatibility launcher exists.
- Root launcher resolves `apps\web` from repo root.
- Root launcher opens `http://127.0.0.1:3000/jarvis`.
- Root launcher handles busy port 3000 safely.
- Missing scripts/windows path is no longer fatal after pull.
- OpenClaw/OpenJarvis/Hermes are not granted direct Kingsmen authority.
