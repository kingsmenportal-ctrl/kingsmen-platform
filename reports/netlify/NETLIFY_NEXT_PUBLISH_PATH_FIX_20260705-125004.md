# NETLIFY NEXT PUBLISH PATH FIX

Generated: 2026-07-05T12:50:14.4015673-07:00
Branch: fix-netlify-next-publish-path-20260705-125004

Problem:
- Netlify built apps/web successfully.
- @netlify/plugin-nextjs failed because publish resolved to repo-root .next.
- Correct publish output is apps/web/.next.

Change:
- netlify.toml publish changed from .next to apps/web/.next.
- No Jarvis UI code changed.
- PR49 remains the active premium Jarvis layout commit.

Required proof:
- Netlify deploy must no longer resolve publish to C:\Kingsmen\kingsmen-platform-claude\.next.
- Live /jarvis must not contain Static Live Surface or Jarvis Agent Function.
