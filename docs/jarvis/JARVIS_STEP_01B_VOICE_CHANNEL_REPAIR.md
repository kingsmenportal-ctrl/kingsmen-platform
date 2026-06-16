# KINGSMEN JARVIS STEP 01B - VOICE CHANNEL REPAIR

Status: INSTALLED
Installed at: 2026-06-14T08:45:20.9060949Z

## What the previous log proved

The listener started successfully, but the state showed:

- api_online: false
- total_speech_detected: 0
- total_recognized: 0
- total_wake: 0

That means the first failure is not the Jarvis layout. The voice channel is not receiving microphone speech yet, and the Jarvis API was not running on port 3000.

## What Step 01B repairs

- Rewrites command launchers as ASCII files so Windows CMD no longer prints BOM garbage.
- Adds speech recognizer listing.
- Adds microphone/audio device scan.
- Adds stronger voice capture logging.
- Adds a combined launcher that starts the Jarvis server and then starts voice capture.

## Files installed

- tools/jarvis/KINGSMEN_JARVIS_STEP_01B_VOICE_CHANNEL_REPAIR.ps1
- C:\Kingsmen\JARVIS_STEP_01B_VOICE_CHANNEL_REPAIR.cmd
- C:\Kingsmen\JARVIS_STEP_01B_VOICE_LOGS.cmd
- C:\Kingsmen\JARVIS_STEP_01B_START_SERVER_AND_VOICE.cmd
- reports/jarvis/steps/STEP_01B_VOICE_CHANNEL_REPAIR_PROOF.json

## Layout

JarvisHudClient.tsx was not changed.