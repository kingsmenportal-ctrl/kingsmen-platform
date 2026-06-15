# JB-003 CMD Startup Repair

Commander reported that earlier scripts do not work.

This repair changes the rule:

- use CMD-first startup when Commander is in CMD
- do not give PowerShell dot-source syntax for CMD
- start Jarvis from the real web app folder
- keep the route fixed at `http://127.0.0.1:3000/jarvis`
- do not claim local success until Commander shows the output

## Main launcher

Use:

```cmd
cd /d C:\Kingsmen\kingsmen-platform
scripts\windows\START_JARVIS_CMD.cmd
```

The launcher checks for:

```text
C:\Kingsmen\kingsmen-platform\apps\web\package.json
```

Then it opens:

```text
http://127.0.0.1:3000/jarvis
```

Then it runs:

```cmd
npm run dev
```

## If the browser says connection refused

That means the Next server is not running yet or stopped with an error.

Check the CMD window where `npm run dev` is running.

## If CMD says the port is already in use

That means another terminal or process is already holding port 3000.

Close the older terminal that is already running the web app, then run the launcher again.

## Do not use this in CMD

```cmd
. C:\Kingsmen\KINGSMEN_LOCAL_DATABASE_ENV.ps1
```

That is PowerShell syntax, not CMD syntax.

## Proof required

After running the launcher, proof must show one of these:

```text
Ready
Local: http://127.0.0.1:3000
```

or a real error message that can be repaired.
