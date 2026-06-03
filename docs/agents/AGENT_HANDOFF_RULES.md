# AGENT HANDOFF RULES

## Build handoff

AI reasoning agent -> PowerShell build agent -> validator agent -> GitHub proof -> founder review if high risk.

## Runtime handoff

Candidate action -> backend command bus -> policy check -> database/audit -> report/read model.

## Provider handoff

Provider visible -> provider map -> tool gate -> validator -> proof report -> founder approval if high risk -> runtime enablement later.

## Failure handoff

Failure -> incident explanation -> candidate-safe message if needed -> report -> repair command -> validator -> Git commit.
