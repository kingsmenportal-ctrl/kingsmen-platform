@echo off
title KINGSMEN JARVIS NEXT SERVER - DO NOT CLOSE
cd /d "C:\Kingsmen\kingsmen-platform\apps\web"
echo ===============================================================
echo KINGSMEN JARVIS NEXT SERVER - DO NOT CLOSE THIS WINDOW
echo ===============================================================
echo URL: http://127.0.0.1:3000/jarvis
echo.
npm run dev -- -H 127.0.0.1 -p 3000
