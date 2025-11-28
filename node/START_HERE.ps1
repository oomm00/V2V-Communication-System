# V2V Socket.IO Server Launcher
# Run this in PowerShell (NOT MSYS/MINGW)

Write-Host "===================================" -ForegroundColor Green
Write-Host "V2V Socket.IO Server + Simulator" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""

# Start server in background
Write-Host "Starting server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm start"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Starting vehicle simulator..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the simulator" -ForegroundColor Cyan
Write-Host ""

npm run sim

