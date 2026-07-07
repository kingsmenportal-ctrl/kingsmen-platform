# JARVIS PUBLIC ROUTE SHADOW REMOVED

Generated: 2026-07-06T22:45:30.8195561-07:00
Branch: remove-public-jarvis-index-shadow-20260706-224013

Problem:
- /jarvis page.tsx was restored to JarvisHudClient, but live /jarvis still showed generated/static shell.
- Cause: apps/web/public/jarvis/index.html shadows the real Next app route at /jarvis.

Change:
- Deleted apps/web/public/jarvis/index.html.
- Kept apps/web/public/jarvis/reports available.
- Kept jarvis-os as archive/reference only.
- Protected generator from recreating public/jarvis/index.html.
- Confirmed apps/web/src/app/jarvis/page.tsx renders JarvisHudClient and not an iframe.

Validated:
- npm run build
- npm run jarvis:validate
- npm run jarvis:validate:core
- npm run web:validate:backend-boundary

Required live proof:
- /jarvis must not contain Premium Command House.
- /jarvis must not contain No black/white shell.
- /jarvis must not contain /jarvis-os/jarvis-os.html iframe.
