@echo off
setlocal

echo ===============================================================
echo  KINGSMEN JARVIS - CLONE/PULL AND START
echo ===============================================================

set "ROOT=%~dp0"
set "STARTER=%ROOT%START_JARVIS.cmd"

if not exist "%ROOT%.git" (
  echo ERROR: This folder is not a Git clone.
  echo Expected repo root: %ROOT%
  echo.
  echo Clone first with:
  echo git clone https://github.com/kingsmenportal-ctrl/kingsmen-platform.git C:\Kingsmen\kingsmen-platform
  exit /b 1
)

if not exist "%STARTER%" (
  echo ERROR: Root launcher missing: %STARTER%
  echo Run: git pull
  exit /b 1
)

echo Repo root: %ROOT%
echo Pulling latest main...
git pull
if errorlevel 1 (
  echo ERROR: git pull failed. Fix Git output above before starting Jarvis.
  exit /b 1
)

echo.
echo Starting Jarvis through root launcher...
call "%STARTER%"
