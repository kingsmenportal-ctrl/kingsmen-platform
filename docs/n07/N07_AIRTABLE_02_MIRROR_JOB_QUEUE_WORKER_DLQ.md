# N07-AIRTABLE-02 — Mirror Job Schema / Queue Worker / DLQ Persistence Boundary

Creates the Airtable mirror job execution boundary:
- mirror job schema declaration
- queue job contract
- DLQ persistence boundary
- mirror worker policy
- retry discipline
- idempotency key boundary
- provider missing credentials degrade gracefully
- no Airtable truth authority
- Oracle Lite/free-tier worker limits enforced
- productionReady remains false