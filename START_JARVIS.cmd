@echo off
setlocal

echo ===============================================================
echo  KINGSMEN JARVIS - CMD STARTER
echo ===============================================================

set "ROOT=%~dp0"
set "WEB=%ROOT%apps\web"

if not exist "%WEB%\package.json" (
  echo ERROR: Could not find apps\web\package.json.
  echo Repo root expected at: %ROOT%
  echo Web folder expected at: %WEB%
  exit /b 1
)

echo Repo: %ROOT%
echo Web : %WEB%
echo URL : http://127.0.0.1:3000/jarvis
echo.
echo If port 3000 is already busy, close the old server first.
echo.

start "" "http://127.0.0.1:3000/jarvis"
cd /d "%WEB%"
npm run dev
