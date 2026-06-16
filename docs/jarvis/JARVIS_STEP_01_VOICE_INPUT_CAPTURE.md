# KINGSMEN JARVIS STEP 01 - VOICE INPUT CAPTURE

Status: INSTALLED
Installed at: 2026-06-14T08:27:06.4791720Z

## Purpose

This step proves that the local Windows microphone and speech engine can hear the Commander say "Jarvis".

## What this step changes

- tools/jarvis/KINGSMEN_JARVIS_STEP_01_VOICE_CAPTURE.ps1
- C:\Kingsmen\JARVIS_STEP_01_VOICE_CAPTURE.cmd
- C:\Kingsmen\JARVIS_STEP_01_VOICE_LOGS.cmd
- reports/jarvis/steps/STEP_01_VOICE_INPUT_CAPTURE_PROOF.json

## What this step does not change

- It does not change apps/web/src/app/jarvis/JarvisHudClient.tsx.
- It does not change the locked visual layout.
- It does not change the V5 doctrine script.
- It does not create a disconnected PJ shell.

## How to test

Run:

C:\Kingsmen\JARVIS_STEP_01_VOICE_CAPTURE.cmd

Then say:

Jarvis

Expected result:

- The console shows SPEECH DETECTED.
- The console shows RECOGNIZED.
- The console shows WAKE ROUTE ACTIVE.
- Jarvis speaks a reply.
- Events are recorded in reports/jarvis/runtime/STEP_01_NATIVE_VOICE_CAPTURE_EVENTS.jsonl.

If the API is offline, voice capture still speaks a fallback line so the microphone is proven.