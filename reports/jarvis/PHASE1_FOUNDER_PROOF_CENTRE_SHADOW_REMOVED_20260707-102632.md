# PHASE 1 - FOUNDER PROOF CENTRE SHADOW REMOVED

Generated: 2026-07-07T10:47:29.3125265-07:00
Branch: remove-founder-proof-centre-shadow-20260707-095008

Problem:
- Shadow-file audit found apps/web/public/founder/proof-centre/index.html.
- A real Next route already exists at apps/web/src/app/founder/proof-centre/page.tsx.
- The public static index could silently shadow the real route.

Change:
- Deleted apps/web/public/founder/proof-centre/index.html.
- Patched proof/validator scripts so they reference the real Next route.
- Staged deletion before git ls-files audit.
- Confirmed no public index.html route shadows remain outside allowed report paths.

Validated:
- npm run build
- node scripts/validators/validate-founder-proof-centre-page-wiring.mjs
- npm run jarvis:validate
- npm run jarvis:validate:core
- npm run web:validate:backend-boundary
