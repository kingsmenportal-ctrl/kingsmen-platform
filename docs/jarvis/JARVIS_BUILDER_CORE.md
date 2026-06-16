# Kingsmen Jarvis Builder Core

Status: INSTALLED

This is the Commander-only Builder Core for Jarvis.

It provides the first safe build gate:

Typed command -> plan -> approved file write -> build/test -> proof report -> Git commit.

## What this core can do now

- Accept a typed build command in the local Builder Core window.
- Create a plan without writing files.
- Show proposed files before writing.
- Require exact approval phrase before writing.
- Write only inside controlled Kingsmen Builder Core boundaries.
- Run available app validation scripts.
- Produce a proof report.
- Commit only staged Builder Core output files.

## Allowed write boundaries

- docs/kingsmen/modules/
- manifests/kingsmen/modules/
- reports/jarvis/builder/module-proofs/

## Blocked

- No candidate-facing output.
- No public website changes.
- No Jarvis visual changes.
- No arbitrary filesystem paths.
- No silent writes.
- No Git commit when validation fails.

## How to run

C:\Kingsmen\START_JARVIS_BUILDER_CORE.cmd

## Commands

plan Jarvis, create Kingsmen module N21 Founder Command Digest

approve KJB-yyyyMMdd-HHmmss

status

exit

## Doctrine

Jarvis may build only through Commander-approved plans. Every build must leave evidence.