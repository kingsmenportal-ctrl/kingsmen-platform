@echo off
setlocal
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-KingsmenLocalTruthVault.ps1" %*
set EXITCODE=%ERRORLEVEL%
if not "%EXITCODE%"=="0" (
  echo.
  echo KINGSMEN_LOCAL_TRUTH_VAULT_START_FAILED
  echo If the error says DOCKER_DAEMON_NOT_RUNNING, start Docker Desktop and wait until Docker is running, then rerun this command.
)
exit /b %EXITCODE%
