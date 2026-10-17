# N10 Closeout — Packages, Payments & Refunds

Status: implementation batch committed for review; production readiness false.

Implemented: migration 0064; canonical package pricing in ZAR minor units; candidate-scoped service orders and refund requests; payment event records; finance-only manual payment review requiring hashed evidence metadata; restricted reviewer UI; append-only finance audit trigger; source validator and contract test; module documentation.

Safety boundary: no payment provider is connected. Order creation does not charge money. Payment status is not set by the candidate. Manual confirmation records evidence metadata but does not independently authenticate a bank or provider statement; operational reviewer policy must validate the evidence locator/hash. Refund approval does not execute a refund. Recording completion requires settlement reference/evidence locator/SHA-256 metadata, but remains a finance assertion and does not independently prove settlement.

Validation commands are committed but not run in this connected GitHub-only session. Migration is not applied. Full application build, live staging isolation tests, gateway integration, webhook signature verification, reconciliation and entitlement fulfillment are still required before release.
