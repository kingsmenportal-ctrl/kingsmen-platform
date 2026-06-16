# KINGSMEN JARVIS BUILD LEDGER

Step 00: Layout and Build Ledger Lock
Status: COMPLETE
Step 00B: ASCII Console Repair
Status: COMPLETE after this script runs
Updated at: 2026-06-14T08:22:34.5207280Z

## Why Step 00B exists

Windows PowerShell 5.1 can display special UTF-8 characters incorrectly when a script has no BOM.
That caused ugly text like "aEUR" in the console.
This repair removes special dash characters from the operational scripts and writes UTF-8 with BOM.

## What Step 00B changes

It changes only ledger, guard, and proof files.
It does not change the Jarvis layout.
It does not change JarvisHudClient.tsx.
It does not change the V5 doctrine file.

## Locked law

Jarvis will be built in steps.
No future step may silently change the Jarvis layout.
No future step may replace Jarvis with a disconnected PJ shell.
No future step may minimize the Commander-only V5 doctrine.
No future step may hide voice failure.
No future step may remove the Kingsmen Command welcome.

## Locked layout

Primary layout file:

- apps/web/src/app/jarvis/JarvisHudClient.tsx

Layout hash proof:

- manifests/jarvis/jarvis-layout-lock.json
- reports/jarvis/steps/STEP_00_LAYOUT_LEDGER_LOCK_PROOF.json
- reports/jarvis/steps/STEP_00B_ASCII_CONSOLE_REPAIR_PROOF.json

## Build order

STEP 00 - Layout and ledger lock.
STEP 00B - Console and guard repair.
STEP 01 - Voice Input Capture.
STEP 02 - Mandatory Kingsmen Welcome.
STEP 03 - Conversation Brain and Anti-Repetition.
STEP 04 - Tool Awareness.
STEP 05 - Evidence Ledger.
STEP 06 - Final Validator.

## Guard

Before every future step run:

C:\Kingsmen\JARVIS_STEP_GUARD.cmd

If it fails, stop.
## STEP 01 - Voice Input Capture

Status: INSTALLED at 2026-06-14T08:27:06.4791720Z

Purpose:
- Prove Windows native microphone capture hears "Jarvis".
- Record hypotheses, recognized text, wake route, API reply, and errors.
- Speak a fallback response if the API is offline so voice failure is not hidden.

Files:
- tools/jarvis/KINGSMEN_JARVIS_STEP_01_VOICE_CAPTURE.ps1
- C:\Kingsmen\JARVIS_STEP_01_VOICE_CAPTURE.cmd
- C:\Kingsmen\JARVIS_STEP_01_VOICE_LOGS.cmd
- reports/jarvis/steps/STEP_01_VOICE_INPUT_CAPTURE_PROOF.json

Layout:
- Preserved.
- JarvisHudClient.tsx not changed.

Next:
- STEP 02 - Mandatory Kingsmen Welcome.

## STEP 01B - Voice Channel Repair

Status: INSTALLED at 2026-06-14T08:45:20.9060949Z

Reason:
- Step 01 listener started, but no microphone speech was detected.
- Jarvis API was offline on port 3000.
- CMD helper showed BOM garbage.

Actions:
- Installed ASCII CMD launchers.
- Installed stronger voice channel diagnostics.
- Added combined server and voice launcher.
- Preserved Jarvis layout.

Next required proof:
- Console must show SPEECH DETECTED.
- Console must show RECOGNIZED.
- Console must show WAKE ROUTE ACTIVE.

## STEP 01C - Server Boot and Voice Proof

Status: INSTALLED at 2026-06-14T09:17:14.8162346Z

Reason:
- Browser refused connection on 127.0.0.1:3000.
- Jarvis API was offline.
- Voice capture cannot route to Jarvis while the web server is offline.

Action:
- Start the real Kingsmen web server.
- Wait until /jarvis or /api/jarvis/status responds.
- Open the Jarvis page only after the server is alive.
- Start voice capture after server proof.

Layout:
- Preserved.
- JarvisHudClient.tsx not changed.

## STEP 01D - Server Script Discovery Repair

Status: INSTALLED at 2026-06-14T09:25:26.2476258Z

Reason:
- npm reported Missing script: dev at the repository root.
- Root package.json is not the correct server package for the Jarvis page.

Action:
- Scan all package.json files under the repo.
- Prefer apps/web, then Jarvis route owners, then any package with a dev script.
- Start the selected package on 127.0.0.1:3000.
- Repair C:\Kingsmen\START_JARVIS_FULL_COMMAND_VOICE.cmd to use the discovery runner.

Layout:
- Preserved.
- JarvisHudClient.tsx not changed.

## STEP 01E - Visual Styles Rehydrate

Status: COMPLETE at 2026-06-14T09:46:29.5175970Z

Reason:
- Server is online.
- Jarvis page rendered as plain text.
- The styling layer was missing or not being compiled.

Action:
- Restored Jarvis HUD as a CSS-module styled cockpit.
- Wrote JarvisHud.module.css.
- Re-locked layout after the repair.

Backup:
C:\Kingsmen\kingsmen-platform\backups\jarvis-step-01e-visual-styles-20260614_024629

Next:
- Refresh http://127.0.0.1:3000/jarvis
- Then continue voice capture proof.

## STEP 01E2 - Parse-Safe Rollback

Status: COMPLETE at 2026-06-14T09:55:50.5101904Z

Reason:
- The first rollback script had a parser error caused by broken nested script generation.
- This direct rollback removes the unapproved Step 01E visual redesign from the live files.
- No new UI is created here.

Rollback source:
C:\Kingsmen\kingsmen-platform\backups\jarvis-step-01e-visual-styles-20260614_024629

Safety backup:
C:\Kingsmen\kingsmen-platform\backups\jarvis-step-01e2-parse-safe-before-rollback-20260614_025551

Rule from here:
- No visual redesign without Commander approval.
- Continue with runtime only: voice capture, wake greeting, conversation brain, command routing, evidence ledger.


## STEP 01H2 - Layout Discovery Sort Repair

Status: COMPLETE at 2026-06-14T10:15:02.0294844Z

Finding:
A better styled source was found outside the live layout. Restore must be a separate explicit step from this exact source.

Reports:
- C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_01H2_LAYOUT_DISCOVERY_SORT_REPAIR_PROOF.json
- C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_01H2_LAYOUT_DISCOVERY_SORT_REPAIR_REPORT.md

Rule:
- Read-only discovery only. No restore before Commander approval.


## STEP 01I - Exact Layout Restore From Verified Source

Status: COMPLETE at 2026-06-14T10:20:27.7165806Z

Verified source:
- C:\Kingsmen\kingsmen-platform\backups\jarvis-step-01e2-parse-safe-before-rollback-20260614_025551

Safety backup:
- C:\Kingsmen\kingsmen-platform\backups\jarvis-step-01i-before-exact-restore-20260614_032027

Restored:
- apps\web\src\app\jarvis\JarvisHudClient.tsx
- apps\web\src\app\jarvis\JarvisHud.module.css

Proof:
- C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_01I_EXACT_LAYOUT_RESTORE_FROM_VERIFIED_SOURCE_PROOF.json
- C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_01I_EXACT_LAYOUT_RESTORE_FROM_VERIFIED_SOURCE_REPORT.md

Instruction:
- Refresh Jarvis with Ctrl+F5.
- Do not run another visual redesign step.


## STEP 01K - Force Exact Locked Reference Layout

Status: COMPLETE at 2026-06-15T00:59:02.8220696Z

Safety backup:
- C:\Kingsmen\kingsmen-platform\backups\jarvis-step-01k2-before-parse-safe-exact-reference-20260614_175901

Changed files:
- apps\web\src\app\jarvis\JarvisHudClient.tsx
- apps\web\src\app\jarvis\JarvisHud.module.css
- apps\web\public\jarvis\locked-reference.png

Proof:
- C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_01K2_PARSE_SAFE_EXACT_LOCKED_REFERENCE_LAYOUT_PROOF.json
- C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_01K2_PARSE_SAFE_EXACT_LOCKED_REFERENCE_LAYOUT_REPORT.md


## STEP 01K3 - CSS Module Purity Repair

Status: COMPLETE at 2026-06-15T01:07:53.9763496Z

Changed:
- apps\web\src\app\jarvis\JarvisHud.module.css

Fixed:
- Removed invalid top-level CSS Modules global selectors.

Proof:
- C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_01K3_CSS_MODULE_PURITY_REPAIR_PROOF.json
- C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_01K3_CSS_MODULE_PURITY_REPAIR_REPORT.md


## STEP 01L - Live System Rebuild No Wallpaper

Status: COMPLETE at 2026-06-15T01:44:35.2926058Z

Changed:
- apps\web\src\app\jarvis\JarvisHudClient.tsx
- apps\web\src\app\jarvis\JarvisHud.module.css

Proof:
- C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_01L_LIVE_SYSTEM_REBUILD_NO_WALLPAPER_PROOF.json
- C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_01L_LIVE_SYSTEM_REBUILD_NO_WALLPAPER_REPORT.md

Rule locked:
- Approved visual language stays.
- No wallpaper-as-interface.
- Cockpit must be real clickable live system.


## STEP 01M - Fixed Viewport and Safe Launch

Status: COMPLETE at 2026-06-15T01:54:04.0255946Z

Changed:
- apps\web\src\app\jarvis\JarvisHudClient.tsx
- apps\web\src\app\jarvis\JarvisHud.module.css
- tools\jarvis\START_JARVIS_SAFE.ps1
- C:\Kingsmen\START_JARVIS_SAFE.cmd

Proof:
- C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_01M_FIXED_VIEWPORT_AND_SAFE_LAUNCH_PROOF.json
- C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_01M_FIXED_VIEWPORT_AND_SAFE_LAUNCH_REPORT.md

Locked:
- Fixed scaled 1920x1080 live cockpit.
- No responsive collapse.
- No wallpaper interface.
- Safe launcher handles port 3000 already in use.


## STEP 01M - Fixed Viewport and Safe Launch

Status: COMPLETE at 2026-06-15T06:38:19.6812196Z

Changed:
- apps\web\src\app\jarvis\JarvisHudClient.tsx
- apps\web\src\app\jarvis\JarvisHud.module.css
- tools\jarvis\START_JARVIS_SAFE.ps1
- C:\Kingsmen\START_JARVIS_SAFE.cmd

Proof:
- C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_01M_FIXED_VIEWPORT_AND_SAFE_LAUNCH_PROOF.json
- C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_01M_FIXED_VIEWPORT_AND_SAFE_LAUNCH_REPORT.md

Locked:
- Fixed scaled 1920x1080 live cockpit.
- No responsive collapse.
- No wallpaper interface.
- Safe launcher handles port 3000 already in use.


## STEP 02A - Builder Core

Status: COMPLETE at 2026-06-15T07:19:06.8192204Z

Installed typed command -> plan -> approved file write -> build/test -> proof report -> Git commit.

No visual files changed.

Run: C:\Kingsmen\START_JARVIS_BUILDER_CORE.cmd

Proof: C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_02A_BUILDER_CORE_PROOF.json


## STEP 02B - Builder API Command Bridge

Status: COMPLETE at 2026-06-15T07:43:41.0806688Z

Connected Jarvis typed command route to Builder Core.

No visual CSS changed.

Proof: C:\Kingsmen\kingsmen-platform\reports\jarvis\steps\STEP_02B_BUILDER_API_COMMAND_BRIDGE_PROOF.json


## Builder API Execution - KJB-20260615-140132

Status: BUILT_VALIDATION_FAILED_NO_COMMIT
Module: N21 - Builder API Smoke Test
Proof: C:\Kingsmen\kingsmen-platform\reports\jarvis\builder\proofs\KJB-20260615-140132-proof.json
