# NETLIFY TOML BOM FIX

Generated: 2026-07-05T13:08:49.4828722-07:00
Branch: fix-netlify-toml-bom-20260705-130845

Problem:
- Netlify rejected netlify.toml because character 65279 BOM existed at row 1.
- Plugin package casing was also normalized to @netlify/plugin-nextjs.

Change:
- Rewrote netlify.toml using UTF-8 without BOM.
- Kept base apps/web.
- Kept publish apps/web/.next.
- No Jarvis UI code changed.

Expected proof:
- Netlify config parser must no longer reject row 1.
- Deploy should build the Next app and publish the PR49 premium Jarvis surface.
