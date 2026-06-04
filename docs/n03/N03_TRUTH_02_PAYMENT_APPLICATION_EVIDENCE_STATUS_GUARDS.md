# N03-TRUTH-02 — Payment / Application / Evidence Status Transition Guards

Creates the second PostgreSQL truth boundary:
- payment status cannot be changed from browser/return_url alone
- application cannot be marked submitted without proof
- outcome cannot be verified without proof
- public success story requires proof and consent
- partner sharing requires consent and founder/high-risk approval
- source confidence cannot be changed by candidate
- all status changes require audit context
- productionReady remains false