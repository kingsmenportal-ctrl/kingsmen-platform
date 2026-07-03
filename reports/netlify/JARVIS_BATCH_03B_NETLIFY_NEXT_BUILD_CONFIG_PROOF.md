# JARVIS BATCH 03B NETLIFY NEXT BUILD CONFIG PROOF

Generated: 2026-07-03
Branch: fix-netlify-next-production-build-20260703

Problem:
Production Netlify continued serving the old static Jarvis OS surface after the real wired Jarvis HUD was merged.

Root cause:
The root netlify.toml was configured to build the old static surface with node scripts/build-jarvis-os.cjs and publish dist.

Change:
Netlify is now configured to build the Next.js web app with npm run build, publish .next, and the Netlify Next plugin.

Runtime truth:
This config fix is required before production can serve the real wired Jarvis HUD.

No app, tool, robot or agent is claimed live without runtime proof.
