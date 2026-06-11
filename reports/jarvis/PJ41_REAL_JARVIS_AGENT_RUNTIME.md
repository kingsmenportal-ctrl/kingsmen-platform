# PJ41 Real Jarvis Agent Runtime

This replaces the dummy HUD with a real local Jarvis operator.

It adds:

- `/jarvis` real agent cockpit
- `/api/jarvis/agent` real tool runtime
- Browser voice input
- Browser speech response
- Visual feed toggle
- Chat-style command interface
- System status tool
- N20 validation tool
- Web build tool
- PostgreSQL database scan tool
- Route/API probe tool
- Git status tool
- Safe file creation tool
- Evidence log: `reports/jarvis/real-jarvis-agent-evidence.jsonl`
- Safe created files: `reports/jarvis/created`
- Launcher: `C:\Kingsmen\START_REAL_JARVIS.cmd`

This is still local and safe. It does not run arbitrary commands from speech. It maps founder messages to whitelisted tools.
