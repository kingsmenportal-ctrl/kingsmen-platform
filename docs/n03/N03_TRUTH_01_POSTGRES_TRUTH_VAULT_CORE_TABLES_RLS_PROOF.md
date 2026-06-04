# N03-TRUTH-01 — PostgreSQL Truth Vault / Core Tables / RLS Boundary / Proof

Creates the first PostgreSQL truth vault boundary:
- PostgreSQL is authority
- candidate/core application/document/payment/evidence/audit/source/outcome tables are defined
- RLS/own-data boundary is declared
- provider mirrors cannot override truth
- candidate cannot mark paid/submitted/accepted
- productionReady remains false