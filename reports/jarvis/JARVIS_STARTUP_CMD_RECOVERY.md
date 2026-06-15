# Jarvis CMD Recovery Report

Status: committed to `main`.

## Local evidence

Founder machine showed:

```text
scripts\windows\START_JARVIS_CMD.cmd
The system cannot find the path specified.
```

Then:

```text
dir scripts\windows
File Not Found
```

Then direct web start showed:

```text
Error: listen EADDRINUSE: address already in use 127.0.0.1:3000
```

And:

```text
127.0.0.1:3000 LISTENING PID 8768
```

## Repo-side completion

The repo now includes:

```text
START_JARVIS.cmd
CLONE_AND_START_JARVIS.cmd
scripts/windows/START_JARVIS_CMD.cmd
docs/jarvis/JARVIS_TOOL_STACK_AND_STARTUP_RECORD.md
manifests/jarvis/jarvis-startup-reality-record.json
reports/jarvis/JARVIS_STARTUP_CMD_RECOVERY.md
```

## Correct local path

Use root launcher first:

```cmd
cd /d C:\Kingsmen\kingsmen-platform
git pull
START_JARVIS.cmd
```

Or pull and start:

```cmd
cd /d C:\Kingsmen\kingsmen-platform
CLONE_AND_START_JARVIS.cmd
```

## Busy port rule

If port `3000` is already listening, the root launcher opens the existing Jarvis page instead of starting another server.

## Rule

Do not keep trying `scripts\windows\START_JARVIS_CMD.cmd` if the local checkout does not show that folder. Use the root launcher.
