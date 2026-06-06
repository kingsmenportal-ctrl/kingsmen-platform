# BATCH 24 — Smallest Useful Control-Plane Proof Display Adapter

## Purpose

BATCH 24 creates the smallest useful Control Plane display adapter for Kingsmen proof status.

It reads the BATCH 23 Build Proof Centre read model and converts it into a founder-safe display adapter that a future Founder Control Plane can render.

## Scope

Local file display adapter only.

## Inputs

- reports/runtime/build-proof-centre-read-model.json
- reports/runtime/build-proof-centre-proof.json
- reports/validation/build-proof-centre-latest.json

## Outputs

- reports/control-plane/build-proof-centre-display-adapter.json
- reports/control-plane/build-proof-centre-display-adapter-preview.html
- reports/control-plane/build-proof-centre-display-adapter-proof.json
- reports/validation/control-plane-proof-display-adapter-latest.json

## Hard Boundaries

This batch does not:

- start Docker
- deploy to Oracle
- claim production readiness
- send email
- send WhatsApp
- process payments
- access candidate data
- access secrets
- modify runtime services
- add a large dashboard

## Founder Use

The founder can open the generated HTML preview locally to see BATCH 21 and BATCH 22 proof status through a simple Control Plane-style display.
