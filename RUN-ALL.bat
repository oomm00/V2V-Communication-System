@echo off
cd /d "%~dp0"

start "Blockchain" cmd /k "npx hardhat node"
timeout /t 8 /nobreak >nul

start "Backend" cmd /k "cd node && node server.js"
timeout /t 5 /nobreak >nul

start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

start "Simulator" cmd /k "python node\scripts\simulator.py"

start http://localhost:5173
