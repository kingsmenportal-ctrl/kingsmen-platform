# Kingsmen frontend product slice — 2026-11-03

## Scope

This change brings the uploaded static frontend prototype's package-selection concept into the existing Next.js application rather than publishing a disconnected HTML microsite.

Implemented:
- Added `/packages/` as a native Next.js route under `apps/web/src/app/packages/page.tsx`.
- Linked the homepage navigation to the package catalogue.
- Replaced the prototype's legacy and inconsistent prices/products with the canonical seven paid-product contract.
- Kept Free Destiny Map separate from paid products.
- Displayed priority application volume separately from concurrent managed-route capacity.
- Made all six pathway discovery access explicit across service plans.
- Added the CV Revamp standalone service terms and the conditional +2 route bonus rule.
- Added copy that distinguishes plan selection from payment settlement and entitlement activation.

## Canonical product data represented

| Product | Price (ZAR) | Priority applications | Concurrent managed-route capacity |
|---|---:|---:|---:|
| Foundational Accord | R169.99 | 5 | 4 |
| Collegiate Ordinance | R299.99 | 10 | 8 |
| Chancellor's Writ | R399.99 | 15 | 10 |
| Regency Mandate | R469.99 | 15 | 12 |
| Artisan Charter | R149.99 | 5 | 3 |
| Guildmasters Charter | R199.99 | 8 | 5 |
| CV Revamp | R49.99 | Standalone service | 0 |

Foundational Accord includes 8 accommodation routes. Accommodation support is presented as included with paid plans. CV Revamp represents 15 CV versions and 15 motivation letters with a target turnaround of 3 business days; its +2 route bonus is conditional on verified ownership and an eligible upgrade. The Free Destiny Map remains a separate R0 product.

## Deliberate integration boundaries

This page does not create an order, initiate a PayFast transaction, grant entitlements, or claim a payment has settled. Its plan-selection links pass the selected plan ID to the existing candidate workbench route; the server must validate the plan and enforce entitlements. Do not treat query-string values as trusted pricing or authority.

No credentials, candidate data, document content, or payment secrets are stored in the page. Document upload, provider-confirmed application receipt, and staff review must remain on authenticated routes with server-side authorization.

## Verification status

- Source inspection: complete for the uploaded eight-file HTML/CSS prototype and the existing Next.js homepage and candidate dashboard.
- Repository change: committed on a feature branch; not merged into `main`.
- Build, CI, staging deployment, and authenticated runtime verification: pending; must be reported only from actual build/deploy/runtime evidence.
