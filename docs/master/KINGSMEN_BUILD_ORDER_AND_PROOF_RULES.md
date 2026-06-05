# KINGSMEN BUILD ORDER AND PROOF RULES

Module: MASTER-INDEX-01  
Production Ready: false

## Build Rule

Build wide enough to cover the whole business.  
Validate narrow enough to prove the current layer.  
Do not move forward on fake proof.

## Required Proof For Every Layer

Every real layer must have:
- docs
- manifest
- contract/policy/code when needed
- proof script
- validator
- report
- commit
- pushed Git state where possible

## Production Claim Boundary

The following claims are blocked unless proof exists:
- productionReady=true
- deployedToOracle=true
- publicHttpsReady=true
- paymentsLive=true
- emailRuntimeLive=true
- officialSubmissionsLive=true
- candidateOwnDataProof=true
- partnerConsentSharing=true
- oraclePaidResourcesEnabled=true

## Current Next Order

1. MASTER-INDEX-01 — current build
2. BATCH 21C — GitHub Actions Docker Runtime Proof
3. BATCH 22 — Docker Runtime Health Hardening / Oracle Lite VM Handoff Preparation
4. ORACLE-01/02 — Oracle access proof
5. ORACLE-03/04 — Terraform Free VM scaffold and VM creation proof
6. ORACLE-05/06 — SSH + Docker install and controlled Oracle runtime deployment
7. PUBLIC-GATE-01 — Nginx / HTTPS / public URL readiness
8. COMMS-01 — Gmail email-first runtime gate
9. PAYMENTS-01/02 — payment sandbox and provider webhook proof
10. N20.5 — end-to-end interaction proof
