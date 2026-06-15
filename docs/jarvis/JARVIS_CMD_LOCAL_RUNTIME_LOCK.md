# Jarvis CMD Local Runtime Lock

Authority: Commander pasted record, Issue #36.
Status: locked for local operations.

## Core local rule

When the Commander is using CMD, instructions must be CMD-safe.

Do not give PowerShell dot-source syntax as if it works in CMD.

## Correct CMD startup for Jarvis web app

Run in CMD:

```cmd
cd /d C:\Kingsmen\kingsmen-platform\apps\web
npm run dev
```

Then open:

```text
http://127.0.0.1:3000/jarvis
```

## Do not duplicate host and port

The package already defines the dev command with host and port. Do not add duplicate host and port flags to the same command.

## Port 3000 conflict rule

If the server fails with:

```text
EADDRINUSE: address already in use 127.0.0.1:3000
```

then port 3000 is already occupied. The next instruction must diagnose and clear the local port conflict before telling the Commander to open `/jarvis` again.

## Running PowerShell installer from CMD

Use CMD-safe PowerShell invocation:

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -File "%USERPROFILE%\Downloads\KINGSMEN_JARVIS_STEP_02F_COMMAND_PAGE_TYPE_FIX_AND_FINALIZE_BUILDER.ps1"
```

If it asks for Plan ID, press Enter unless the Commander provides a Plan ID.

## Wrong command captured from pasted record

This was wrong in CMD:

```cmd
. C:\Kingsmen\KINGSMEN_LOCAL_DATABASE_ENV.ps1
```

That syntax belongs to PowerShell, not CMD.

## Required proof after Builder Core step

Run in CMD:

```cmd
cd /d C:\Kingsmen\kingsmen-platform
git status --short
git log --oneline -5
```

The result must be reviewed before claiming Builder Core is preserved in GitHub.
