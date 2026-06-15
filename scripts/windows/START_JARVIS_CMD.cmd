@echo off
setlocal EnableExtensions
title Kingsmen Jarvis CMD Launcher

for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"
set "WEB=%ROOT%\apps\web"
set "HOST=127.0.0.1"
set "PORT=3000"
set "URL=http://%HOST%:%PORT%/jarvis"

echo ===============================================================
echo  KINGSMEN JARVIS - CMD STARTER
echo ===============================================================
echo Repo root: %ROOT%
echo Web app : %WEB%
echo.

if not exist "%ROOT%\.git" (
  echo ERROR: This launcher must run from inside the Kingsmen repo checkout.
  echo Expected repo root: %ROOT%
  echo.
  pause
  exit /b 1
)

if not exist "%WEB%\package.json" (
  echo ERROR: Web app package.json not found.
  echo Expected: %WEB%\package.json
  echo.
  echo Run this to inspect your folders:
  echo dir "%ROOT%"
  echo dir "%ROOT%\apps"
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found in CMD PATH.
  echo Install Node.js or reopen CMD after Node installation.
  echo.
  pause
  exit /b 1
)

cd /d "%WEB%"
if errorlevel 1 (
  echo ERROR: Could not enter web app folder.
  echo Folder: %WEB%
  echo.
  pause
  exit /b 1
)

echo Current folder:
echo %CD%
echo.

echo Opening Jarvis page:
echo %URL%
start "" "%URL%"
echo.

echo Starting local Next server...
echo If port 3000 is busy, close the old terminal running npm run dev, then run again.
echo.

call npm run dev

echo.
echo Jarvis server stopped.
pause
