@echo off
cd /d "%~dp0"
start "" /min node scripts\server.js
timeout /t 2 /nobreak >nul
start "" http://localhost:4173/
