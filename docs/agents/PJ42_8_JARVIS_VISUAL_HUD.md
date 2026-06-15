# PJ42.8 — Jarvis Visual HUD

Status: Founder-locked build doctrine
Parent: PJ42.7 — Jarvis Live Data Router
Issue: #19

## Purpose

PJ42.8 creates the Visual HUD law and component contracts for Real Jarvis.

Jarvis must not remain a plain black-and-white chat screen. Jarvis must become a Kingsmen Commander interface that shows live state, evidence, risk, source confidence, approval requirements, mission progress, and next actions.

## Core Law

Jarvis must not remain plain chat only.

Every meaningful Jarvis action must have a visual surface: card, panel, modal, drawer, badge, timeline, or mission board entry.

## Master Visual Flow

```text
Commander Wake Screen
  -> Jarvis HUD Shell
  -> Commander Input Bar / Voice Orb
  -> Live Response Stream
  -> Intent / Command Card
  -> Tool Use Indicator
  -> Source Confidence Chip
  -> Evidence Drawer
  -> Approval Modal when required
  -> Mission Board / Timeline Entry
```

## Required Surfaces

- Commander wake screen
- Jarvis voice orb
- live response stream
- command cards
- mission board
- tool-use indicator
- source-confidence chips
- evidence drawer
- approval modal
- system health panel
- portal scout screenshot cards
- route intelligence panel
- finance health panel
- document pipeline panel
- mobile Founder view

## Visual Truth Rule

The UI must show whether something is:

- online,
- thinking,
- using tool,
- waiting for approval,
- verified,
- needs review,
- blocked,
- failed,
- completed,
- stale,
- conflicting.

## Founder Mobile Rule

The Founder must be able to use Jarvis from a phone with clear priority cards, approvals, digest, system health, and mission status.

## Final Rule

Jarvis must feel alive and command-grade, but every visual surface must still respect Kingsmen law, source confidence, evidence, and approval gates.