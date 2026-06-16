# Kingsmen Jarvis Builder API Command Bridge

Status: INSTALLED

This bridge connects the Jarvis typed command route to Builder Core.

## Commander cockpit flow

1. Commander types a build command in Jarvis:

   Jarvis, create Kingsmen module N21 Founder Command Digest

2. Jarvis creates a plan only.

3. No files are written until Commander types:

   approve KJB-yyyyMMdd-HHmmss

4. After approval, Jarvis writes only the planned safe files, runs validation, creates proof, and attempts a staged Git commit.

## API routes

- POST /api/jarvis/command
- GET /api/jarvis/builder
- POST /api/jarvis/builder

## Safe write boundary

- docs/kingsmen/modules/
- manifests/kingsmen/modules/
- reports/jarvis/builder/module-proofs/

## Blocked

- silent writes
- arbitrary filesystem writes
- public/candidate exposure
- visual CSS edits
- commit after validation failure

## Smoke test

C:\Kingsmen\JARVIS_BUILDER_API_SMOKE_TEST.cmd