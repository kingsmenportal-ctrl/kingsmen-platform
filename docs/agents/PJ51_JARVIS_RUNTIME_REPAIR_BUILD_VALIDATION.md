# PJ51 — Jarvis Runtime Repair and Build Validation

Status: Founder-locked build doctrine
Parent: PJ50 — Jarvis Kernel Smoke Tests
Issue: #31

## Purpose

PJ51 creates the repair and validation layer for the Jarvis runtime implementation.

PJ43 through PJ50 created runtime modules, API routes, HUD wiring, connector stubs, memory vault helpers, orchestrator planning, and smoke tests. PJ51 exists to stop the project from claiming readiness before those pieces are checked together.

## Core Law

Jarvis runtime is not ready because files exist.

Jarvis runtime becomes ready only when required files exist, exports are consistent, smoke routes exist, build commands are known, deferred repairs are tracked, and validators can produce evidence.

## Validation Scope

PJ51 checks:

- PJ43 runtime module presence
- runtime index exports
- kernel route presence
- smoke route presence
- smoke helper presence
- connector registry presence
- memory vault presence
- orchestrator presence
- package build script presence
- deferred hardening items
- validator scripts already created

## Build Readiness Rule

Build readiness must be reported honestly:

- ready_for_local_build_check
- repair_required_before_build
- validator_missing
- route_missing
- export_missing
- deferred_item_open

## Deferred Repair Rule

If a file was blocked or deferred in earlier phases, PJ51 must record it. PJ51 must not pretend deferred hardening is complete.

## Evidence Rule

PJ51 validation output must list:

- checked files
- missing files
- checked exports
- missing exports
- package build command status
- smoke route status
- deferred repair items
- next safe action

## Final Rule

PJ51 turns Jarvis from assembled modules into a validated runtime repair target.