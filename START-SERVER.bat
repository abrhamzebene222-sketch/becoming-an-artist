@echo off
title Becoming an Artist server
cd /d "%~dp0server"
echo Starting Becoming an Artist on http://localhost:4000 ...
start "" http://localhost:4000
node src\index.js
pause
