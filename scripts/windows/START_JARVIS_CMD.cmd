@echo off
setlocal EnableExtensions
title Kingsmen Jarvis CMD Launcher

set "ROOT=C:\Kingsmen\kingsmen-platform"
set "WEB=%ROOT%\apps\web"
set "HOST=127.0.0.1"
set "PORT=3000"
set "URL=http://%HOST%:%PORT%/jarvis"

echo ===============================================================
echo  KINGSMEN JARVIS - CMD STARTER
echo ===============================================================
echo.

if not exist "%WEB%\package.json" (
  echo ERROR: Web app package.json not found.
  echo Expected: %WEB%\package.json
  echo.
  pause
  exit /b 1
)

cd /d "%WEB%"

echo Target folder:
echo %CD%
echo.

echo Opening Jarvis page:
echo %URL%
start "" "%URL%"
echo.

echo Starting local Next server...
echo If port 3000 is busy, close the old terminal running npm run dev and run this file again.
echo.

call npm run dev

echo.
echo Jarvis server stopped.
pause
