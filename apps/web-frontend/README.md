# Kingsmen Portal Frontend Preview

A responsive, dependency-free static frontend built from the Kingsmen Frontend Prototype design overview.

## Included
- Public landing page and six pathway cards.
- Package overview using the current Kingsmen pricing/capacity contract.
- Destiny Map preview intake with client-side-only feedback.
- Responsive mobile navigation, accessible labels, focus states and reduced-motion support.
- Navy/gold visual tokens and South African context.

## Run locally
Open `index.html` in a modern browser. No build step or external runtime dependency is required. The Inter font is optional and loaded from Google Fonts; system UI fonts are the fallback.

## Important boundaries
This is a frontend preview only. It does not authenticate users, send intake data, persist candidate profiles, upload documents, process PayFast payments, or submit provider applications. No candidate information is transmitted. Do not present preview interactions as live backend capabilities.

The attached design overview also describes candidate dashboard, document verification, payment confirmation and staff review screens. Those flows are not represented here as operational screens because the static preview has no authenticated backend or real document/payment evidence. They should be added as authenticated, backend-backed routes rather than simulated as successful operations.

## Package contract reflected
Prices are stored/displayed in ZAR and match the Kingsmen canonical product contract:
- Foundational Accord R169.99 — 5 priority applications, 4 concurrent managed routes / 30-day capacity, 8 accommodation routes.
- Collegiate Ordinance R299.99 — 10, 8.
- Chancellor’s Writ R399.99 — 15, 10.
- Regency Mandate R469.99 — 15, 12.
- Artisan Charter R149.99 — 5, 3.
- Guildmasters Charter R199.99 — 8, 5.
- CV Revamp R49.99 — standalone service; 15 CV versions and 15 motivation letters target 3 business days, managed-route capacity 0.
- Free Destiny Map is a free preview and is not a paid plan.

Accommodation route inclusion applies to the six managed packages listed above; the CV service and free preview do not imply accommodation entitlements.
