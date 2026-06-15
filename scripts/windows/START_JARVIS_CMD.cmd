@echo off
setlocal

rem Compatibility launcher for old command path:
rem scripts\windows\START_JARVIS_CMD.cmd
rem It delegates to the root-level START_JARVIS.cmd so all Jarvis startup logic lives in one place.

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "ROOT=%%~fI"
set "ROOT_STARTER=%ROOT%\START_JARVIS.cmd"

echo ===============================================================
echo  KINGSMEN JARVIS - WINDOWS COMPATIBILITY STARTER
echo ===============================================================
echo Repo root: %ROOT%
echo Delegates: %ROOT_STARTER%
echo.

if not exist "%ROOT_STARTER%" (
  echo ERROR: Could not find root START_JARVIS.cmd.
  echo Expected: %ROOT_STARTER%
  echo Current script: %~f0
  exit /b 1
)

call "%ROOT_STARTER%"
