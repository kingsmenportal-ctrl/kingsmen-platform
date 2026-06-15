@echo off
setlocal

echo ===============================================================
echo  KINGSMEN JARVIS - CMD STARTER
echo ===============================================================

set "ROOT=%~dp0"
set "WEB=%ROOT%apps\web"
set "URL=http://127.0.0.1:3000/jarvis"

if not exist "%WEB%\package.json" (
  echo ERROR: Could not find apps\web\package.json.
  echo Repo root expected at: %ROOT%
  echo Web folder expected at: %WEB%
  exit /b 1
)

echo Repo: %ROOT%
echo Web : %WEB%
echo URL : %URL%
echo.

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:"127\.0\.0\.1:3000 .*LISTENING"') do (
  echo Port 3000 is already in use by PID %%P.
  echo Opening existing Jarvis session instead of starting a second server.
  echo To stop it manually, run: taskkill /F /PID %%P
  start "" "%URL%"
  exit /b 0
)

echo Starting Jarvis dev server...
echo.
start "" "%URL%"
cd /d "%WEB%"
npm run dev
