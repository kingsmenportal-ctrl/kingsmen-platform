# N02-KERNEL-02 — Idempotency / Audit Context / Queue Dispatch Boundary

Creates the second backend kernel boundary:
- idempotency contract
- audit context contract
- queue dispatch contract
- command dispatch must carry audit context
- duplicate command protection exists
- productionReady remains false