# STEP 01H2 - Layout Discovery Sort Repair

Created: 2026-06-14T10:15:02.0294844Z

Read-only: true
Live files modified: false

## Finding

A better styled source was found outside the live layout. Restore must be a separate explicit step from this exact source.

## BEST CANDIDATE

- Source: BACKUP:C:\Kingsmen\kingsmen-platform\backups\jarvis-step-01e2-parse-safe-before-rollback-20260614_025551
- Score: 189
- Plain page risk: False
- HUD exists: True
- CSS exists: True
- HUD bytes: 10784
- CSS bytes: 8601
- HUD SHA256: e21f448e9d7fa11f3a65389401169bf369b7ab0fd4e944cf3ed49ef0eeef0e5a
- CSS SHA256: 11119b3901f36bb4c9675a1b9ccefcf9e3504ca9c83a20f04d1f7cd9c755d17c
- Styles usage count: 30
- ClassName count: 29
- Reasons: imports JarvisHud.module.css; strong CSS module usage: 30; many className entries: 29; large styled CSS file: 8601 bytes

## Top candidates

### Candidate 1
- Source: BACKUP:C:\Kingsmen\kingsmen-platform\backups\jarvis-step-01e2-parse-safe-before-rollback-20260614_025551
- Score: 189
- Plain page risk: False
- HUD bytes: 10784
- CSS bytes: 8601
- Reasons: imports JarvisHud.module.css; strong CSS module usage: 30; many className entries: 29; large styled CSS file: 8601 bytes

### Candidate 2
- Source: BACKUP:C:\Kingsmen\kingsmen-platform\backups\jarvis-step-01e-visual-styles-20260614_024629
- Score: 99
- Plain page risk: True
- HUD bytes: 8385
- CSS bytes: 8445
- Reasons: no CSS module usage; many className entries: 44; large styled CSS file: 8445 bytes

### Candidate 3
- Source: LIVE_CURRENT
- Score: 99
- Plain page risk: True
- HUD bytes: 8385
- CSS bytes: 8445
- Reasons: no CSS module usage; many className entries: 44; large styled CSS file: 8445 bytes

### Candidate 4
- Source: BACKUP:C:\Kingsmen\kingsmen-platform\backups\jarvis-full-repo-build-20260612_065330
- Score: 45
- Plain page risk: True
- HUD bytes: 12495
- CSS bytes: 0
- Reasons: imports JarvisHud.module.css; strong CSS module usage: 43; many className entries: 40; missing or tiny CSS file

### Candidate 5
- Source: BACKUP:C:\Kingsmen\kingsmen-platform\backups\jarvis-full-repo-build-20260612_065928
- Score: -21
- Plain page risk: True
- HUD bytes: 8385
- CSS bytes: 0
- Reasons: no CSS module usage; many className entries: 44; missing or tiny CSS file

