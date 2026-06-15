# PJ44 — Jarvis UI/HUD Implementation

Status: Founder-locked build phase
Parent: PJ43 — Jarvis Runtime Implementation
Issue: #24

## Purpose

PJ44 upgrades the existing Jarvis page into a real Commander HUD.

The existing page already contains voice, speech synthesis, quick tools, output, camera/visual feed, and command execution. PJ44 keeps that working foundation and adds structured HUD surfaces required by PJ42.8.

## Core Law

Jarvis must not remain plain chat only.

Every meaningful Jarvis action must have a visual surface:

- command card,
- mission board entry,
- status chip,
- tool-use indicator,
- source-confidence chip,
- evidence drawer,
- approval placeholder,
- system panel,
- mobile Founder view.

## Existing Files Upgraded

- `apps/web/src/app/jarvis/JarvisAgentClient.tsx`
- `apps/web/src/app/jarvis/JarvisAgent.module.css`

## Required Commander HUD Surfaces

1. Commander wake header
2. Voice orb and voice state
3. Command deck
4. Mission board
5. Live command stream
6. Evidence drawer
7. Approval modal placeholder
8. Source confidence chips
9. System status panels
10. Mobile Founder layout

## Runtime Boundary

PJ44 is UI/HUD implementation only.

It must not bypass PJ43 runtime or PJ42 law. Real execution must still pass through the existing API and later PJ45 runtime wiring.

## Final Rule

The Jarvis page must feel like Kingsmen Command, not a plain chatbot.