# N07-AIRTABLE-03 — Base/Table Mapping / Mirror Transforms / Provider Health Read Model

Creates the Airtable base/table mapping and provider health boundary:
- maps 12 Airtable bases to mirror-safe table groups
- defines mirror transform contracts
- strips forbidden truth-authority fields from Airtable payloads
- blocks raw documents, secrets, service_role, private proof payloads, and candidate identity sharing without consent
- creates Airtable provider health read model
- health check cannot claim live provider status without proof
- productionReady remains false