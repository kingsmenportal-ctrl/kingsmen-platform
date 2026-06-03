# BATCH 26 — Approved Oracle Remote Read-Only Checks

BATCH 26 creates the first approved Oracle VM read-only check runner.

This is not production deployment.

## Allowed only with explicit approval

The runner must require:

- `-ApprovedReadOnly`

Without this flag, it must not run SSH.

## Read-only checks allowed

- remote hostname
- Docker version
- Docker Compose version
- Git version
- disk space
- memory
- target folder existence

## Still blocked

- no file copy to Oracle
- no Docker Compose up/down
- no container start
- no deployment
- no OCI compute launch
- no paid Oracle resource creation
- no public production URL claim
- no database migration
- no payment
- no email sending
- no document upload runtime
- no official application submission
- no secrets committed to repo

## Required environment names

These must be supplied outside Git:

- ORACLE_VM_HOST
- ORACLE_VM_USER
- ORACLE_SSH_KEY_PATH
- KINGSMEN_REMOTE_PATH
