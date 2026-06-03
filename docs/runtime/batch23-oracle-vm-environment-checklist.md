# BATCH 23 — Oracle VM Environment Checklist / Remote Handoff Runner

BATCH 23 prepares the Oracle Lite VM environment handoff.

This is not deployment.

## What this batch creates

- Oracle VM environment checklist.
- SSH readiness boundary.
- Remote Docker Compose handoff plan.
- Required environment variable names.
- No-secrets-in-repo rule.
- Readiness runner shell that writes a local report only.
- Validator proving this batch does not deploy or claim production.

## Required local values later

These must be provided outside Git:

- ORACLE_VM_HOST
- ORACLE_VM_USER
- ORACLE_SSH_KEY_PATH
- KINGSMEN_REMOTE_PATH

## Explicitly blocked in BATCH 23

- No `oci compute instance launch`.
- No paid Oracle resource creation.
- No public production claim.
- No live database migration.
- No live payment/email/document/application action.
- No secrets committed to repo.

## Handoff target

Prepare for a later approved batch that can copy the repo to the Oracle Free/Lite VM and run Docker Compose under strict validation.
