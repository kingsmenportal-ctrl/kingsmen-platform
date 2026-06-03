# BATCH 24 — Oracle Remote Dry-Run Readiness

BATCH 24 prepares a remote dry-run readiness plan for the Oracle Free / Oracle Lite VM.

This is not deployment.

## What this batch does

- Confirms BATCH 23 handoff gate exists and passed.
- Defines safe remote dry-run readiness checks.
- Defines required environment names.
- Creates a PowerShell readiness runner that checks local configuration only.
- Writes a local readiness report only when asked.
- Blocks SSH execution.
- Blocks SCP execution.
- Blocks OCI compute launch.
- Blocks production claims.

## Required environment names

These may be set later outside Git:

- ORACLE_VM_HOST
- ORACLE_VM_USER
- ORACLE_SSH_KEY_PATH
- KINGSMEN_REMOTE_PATH

## Dry-run plan for a later approved batch

A later approved batch may check:

- remote hostname
- Docker version
- Docker Compose version
- target folder existence
- disk/memory basics
- Git availability
- firewall readiness

BATCH 24 does not run those remote checks yet.

## Blocked in BATCH 24

- no remote command execution
- no file copy to Oracle
- no OCI launch
- no paid Oracle resource creation
- no public production URL
- no live database migration
- no payment
- no email sending
- no document upload runtime
- no official application submission
