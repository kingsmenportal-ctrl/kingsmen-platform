# PJ45 — Jarvis API Runtime Wiring

Status: Founder-locked implementation phase
Issue: #25

## Purpose

PJ45 connects the PJ43 Jarvis runtime to the existing web API routes.

The current Jarvis API already performs useful local checks and records evidence. PJ45 keeps that behavior and adds a governed kernel response object for the HUD.

## Existing API Surfaces

- `/api/jarvis/agent`
- `/api/jarvis/command`

## Required Runtime Metadata

Every governed Jarvis API response should include:

- intent
- command
- policy
- adapter route
- source confidence
- evidence
- answer

## API Flow

```text
HTTP Request
  -> Normalize Body
  -> PJ45 API Bridge
  -> PJ43 Runtime Kernel
  -> Existing Safe Tool Result
  -> Evidence Record
  -> JSON Response
  -> Visual HUD
```

## Completion Rule

PJ45 is complete when the API route can call the PJ43 kernel and return kernel metadata while preserving existing Jarvis API behavior.