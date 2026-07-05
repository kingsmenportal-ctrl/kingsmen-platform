# JARVIS REAL ROUTE RESTORED

Generated: 2026-07-05T16:50:54.3196842-07:00
Branch: complete-real-jarvis-route-20260705-164601

Problem:
- Live /jarvis was still showing generated/static Jarvis shell.
- Static generator could overwrite apps/web/src/app/jarvis/page.tsx with an iframe to /jarvis-os/jarvis-os.html.
- That bypassed the real wired JarvisHudClient.

Change:
- Restored apps/web/src/app/jarvis/page.tsx to render JarvisHudClient directly.
- Removed the generator line that overwrites /jarvis page.tsx.
- Kept static jarvis-os only as archive/reference, not the live /jarvis route.
- Kept Netlify config clean: apps/web base, apps/web/.next publish, lowercase @netlify/plugin-nextjs.
- No fake provider runtime claims added.

Validated:
- npm run build
- npm run jarvis:validate
- npm run jarvis:validate:core
- npm run web:validate:backend-boundary

Required live proof:
- /jarvis HTML must not contain iframe src="/jarvis-os/jarvis-os.html".
- /jarvis must render the real Next Jarvis surface.
