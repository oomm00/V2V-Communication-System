@echo off
echo ===================================
echo V2V Socket.IO Server + Simulator
echo ===================================
echo.

echo Starting server in background...
start powershell -NoExit -Command "cd /d %~dp0; npm start"

timeout /t 3

echo.
echo Starting vehicle simulator...
echo Press Ctrl+C to stop
echo.

npm run sim

