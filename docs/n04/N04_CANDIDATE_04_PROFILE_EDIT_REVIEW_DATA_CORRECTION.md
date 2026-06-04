# N04-CANDIDATE-04 — Profile Edit Review / Candidate Data Correction Boundary

Creates the candidate profile correction boundary:
- candidate can request profile corrections
- sensitive identity/contact changes require review
- correction creates audit and POPIA access log
- old value is not silently overwritten without trace
- candidate cannot use profile edits to bypass truth authority
- candidate cannot change payment/submission/outcome/source-confidence status
- productionReady remains false