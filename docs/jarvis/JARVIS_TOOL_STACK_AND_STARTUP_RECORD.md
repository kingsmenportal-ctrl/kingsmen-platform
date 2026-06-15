# Jarvis Tool Stack and Startup Reality Record

Status: recorded after local CMD startup failure evidence.  
Repo: `kingsmenportal-ctrl/kingsmen-platform`  
Local path used by founder: `C:\Kingsmen\kingsmen-platform`

## Tool stack boundary

| Tool | Role inside Kingsmen/Jarvis | Decision |
|---|---|---|
| GitHub | Source control, commits, version history, deployment base | Core required |
| OpenJarvis | Personal-AI architecture reference: intelligence, engine, agents, tools/memory, learning | Reference only; do not blind-install as Kingsmen authority |
| OpenClaw | Autonomous assistant/runtime that can run tools, files, browser actions, messages | Dangerous unless locked behind Kingsmen policy gates |
| Playwright | Browser scout/probe for portals, links, forms, screenshots, status checks | Core required as controlled scout only |
| Hermes | Agent/messaging layer idea; exact project identity must be clarified before core adoption | Not core until verified and mapped |

Safe structure:

```text
Commander -> Jarvis Command Layer -> Kingsmen Backend State Machine -> Approved Tools
```

Unsafe structure:

```text
Commander -> OpenClaw/Hermes directly controlling everything
```

## Local startup evidence received

The founder ran:

```cmd
cd /d C:\Kingsmen\kingsmen-platform
git pull
scripts\windows\START_JARVIS_CMD.cmd
```

Observed failure:

```text
The system cannot find the path specified.
```

The founder then checked:

```cmd
dir scripts\windows
```

Observed output:

```text
Directory of C:\Kingsmen\kingsmen-platform\scripts
File Not Found
```

The founder then bypassed the script and ran:

```cmd
cd /d C:\Kingsmen\kingsmen-platform\apps\web
npm run dev
```

Observed failure:

```text
Error: listen EADDRINUSE: address already in use 127.0.0.1:3000
```

The founder then checked:

```cmd
netstat -ano | findstr :3000
```

Observed result:

```text
TCP    127.0.0.1:3000    0.0.0.0:0    LISTENING    8768
```

Meaning:

1. the old script path was not available in the local checkout at that moment;
2. the web app itself was present;
3. port 3000 was already occupied by PID `8768`;
4. Jarvis may already have been running, or another process was using the port.

## Repo repair completed

Root launcher:

```text
START_JARVIS.cmd
```

Compatibility launcher:

```text
scripts/windows/START_JARVIS_CMD.cmd
```

Clone/pull/start launcher:

```text
CLONE_AND_START_JARVIS.cmd
```

The root launcher is the authority. The compatibility launcher delegates to it.

## Correct founder command now

Use this from CMD:

```cmd
cd /d C:\Kingsmen\kingsmen-platform
git pull
dir START_JARVIS.cmd
START_JARVIS.cmd
```

Or one-step pull and start:

```cmd
cd /d C:\Kingsmen\kingsmen-platform
CLONE_AND_START_JARVIS.cmd
```

## If port 3000 is busy

Check:

```cmd
netstat -ano | findstr :3000
```

If the PID is an old stuck server and must be stopped:

```cmd
taskkill /F /PID 8768
```

Then run:

```cmd
START_JARVIS.cmd
```

If the root launcher detects port 3000 already listening, it opens:

```text
http://127.0.0.1:3000/jarvis
```

instead of starting a second server.

## Rule locked

Do not claim local success until the founder machine shows either:

- the Jarvis page opens at `/jarvis`; or
- CMD output proves the server is running/listening correctly.
