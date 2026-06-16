# KINGSMEN JARVIS STEP 01D - SERVER SCRIPT DISCOVERY REPAIR

Status: INSTALLED
Installed at: 2026-06-14T09:25:26.2476258Z

## Why Step 01D exists

Step 01C tried to start the server from the repository root with:

npm run dev

The local root package.json does not have a dev script, so npm returned:

Missing script: dev

That means the launcher was pointing at the wrong package folder. The next correct repair is to scan all package.json files and start the folder that actually owns the Jarvis web app.

## What this step changes

- tools/jarvis/KINGSMEN_JARVIS_STEP_01D_SERVER_SCRIPT_DISCOVERY_REPAIR.ps1
- C:\Kingsmen\JARVIS_STEP_01D_SERVER_SCRIPT_DISCOVERY_REPAIR.cmd
- C:\Kingsmen\JARVIS_STEP_01D_LOGS.cmd
- C:\Kingsmen\START_JARVIS_FULL_COMMAND_VOICE.cmd
- reports/jarvis/steps/STEP_01D_SERVER_SCRIPT_DISCOVERY_REPAIR.json

## What this step does not change

- It does not change JarvisHudClient.tsx.
- It does not change the locked visual layout.
- It does not minimize the Jarvis doctrine.
- It does not create another disconnected PJ shell.

## Test command

C:\Kingsmen\JARVIS_STEP_01D_SERVER_SCRIPT_DISCOVERY_REPAIR.cmd