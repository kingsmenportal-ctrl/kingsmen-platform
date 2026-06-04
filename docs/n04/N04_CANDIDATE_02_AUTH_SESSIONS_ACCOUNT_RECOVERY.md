# N04-CANDIDATE-02 — Candidate Auth / Sessions / Account Recovery Boundary

Creates the second candidate core boundary:
- candidate auth/session contract
- candidate own-account boundary
- account recovery contract
- session audit requirement
- service_role backend-only rule
- anon/browser access must be RLS/own-data only
- candidate cannot use auth/session to bypass paid/submitted/outcome/source authority
- productionReady remains false