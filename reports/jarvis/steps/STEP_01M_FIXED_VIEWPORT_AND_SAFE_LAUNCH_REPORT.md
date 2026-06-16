# STEP 01M - Fixed Viewport and Safe Launch

Created: 2026-06-15T06:38:19.6812196Z

Status: COMPLETE

Changed files:
- apps\web\src\app\jarvis\JarvisHudClient.tsx
- apps\web\src\app\jarvis\JarvisHud.module.css
- tools\jarvis\START_JARVIS_SAFE.ps1
- C:\Kingsmen\START_JARVIS_SAFE.cmd

Fixes:
- EADDRINUSE means the server is already running; the safe launcher opens it instead of starting a duplicate.
- The cockpit is no longer allowed to collapse into mobile/stacked layout.
- The visual system is live DOM, not a wallpaper.

Run:
C:\Kingsmen\START_JARVIS_SAFE.cmd

