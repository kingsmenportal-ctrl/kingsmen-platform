# PJ38 Real Jarvis HUD

This replaces the previous static Jarvis shell with a real founder/operator HUD:

- full-screen Jarvis-style cockpit
- central animated Jarvis orb
- typed command input
- browser speech recognition input where supported
- optional camera/visual feed panel
- OpenClaw grip check mode
- live command result panel
- database-backed status cards
- safe whitelisted command API
- evidence log at reports/jarvis/jarvis-command-evidence.jsonl

Boundary:
- Jarvis surfaces truth and runs safe read/check commands.
- Backend state machine remains authority.
- Risky actions stay blocked until backend command bus + policy/evidence approval are wired.
