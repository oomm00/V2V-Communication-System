@echo off
echo ========================================
echo V2V Node Communication Test
echo ========================================
echo.
echo Starting two V2V nodes for communication test...
echo.
echo Node 1: Port 8080 -> sends to 127.0.0.1:8081
echo Node 2: Port 8081 -> sends to 127.0.0.1:8080
echo.
echo Each node will:
echo - Generate JSON hazard reports with timestamps
echo - Sign messages with cryptographic signatures
echo - Print received JSON messages
echo - Verify signature status
echo.
echo Press Ctrl+C to stop both nodes
echo ========================================
echo.

cd /d d:\v2v\node\src

start "V2V Node 1" cmd /k "v2v_node.exe --port 8080 --peer 127.0.0.1:8081"
timeout /t 2 /nobreak >nul
start "V2V Node 2" cmd /k "v2v_node.exe --port 8081 --peer 127.0.0.1:8080"

echo Both nodes started! Check the console windows for output.
echo.
pause
