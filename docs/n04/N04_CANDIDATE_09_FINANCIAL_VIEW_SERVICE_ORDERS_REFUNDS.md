# N04-CANDIDATE-09 — Financial View / Service Orders / Payment Status / Refund Visibility

Creates the candidate financial visibility boundary:
- candidate can view service orders, package, payment status, and refund status
- candidate cannot mark paid
- return_url cannot mark paid
- payment status requires verified webhook or manual finance review
- refund request is visible but not auto-approved
- official Kingsmen package prices are preserved
- CV Revamp upgrade bonus rule is preserved
- productionReady remains false