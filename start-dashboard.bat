@echo off
REM Smart Home dashboard - one click start.
REM Frees port 3001, starts backend, waits until healthy, opens browser.
cd /d %~dp0

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found. Install Node 20+ from https://nodejs.org/ then run again.
  pause
  exit /b 1
)

for /f "tokens=5" %%p in ('netstat -ano ^| findstr "127.0.0.1:3001.*LISTENING"') do (
  echo Stopping old backend (PID %%p)...
  taskkill /PID %%p /F >nul 2>&1
)

if not exist backend\node_modules (
  echo First run: installing backend dependencies...
  cd backend
  call npm install
  cd /d %~dp0
)

if not exist "%USERPROFILE%\.cache\ms-playwright" (
  if not exist "C:\Users\%USERNAME%\AppData\Local\ms-playwright" (
    echo Installing browser binaries (one time, ~120MB)...
    cd backend
    call npx playwright install chromium
    cd /d %~dp0
  )
)

start "smarthome-backend" /min node backend/src/run.js
echo Waiting for backend to be ready...
for /L %%i in (1,1,30) do (
  powershell -NoProfile -Command "try { Invoke-WebRequest http://127.0.0.1:3001/api/devices -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
  if not errorlevel 1 goto :up
  timeout /t 2 /nobreak >nul
)
echo Backend did not start within 60s. Check the smarthome-backend window for errors.
pause
exit /b 1

:up
start "" "http://127.0.0.1:3001/"
echo.
echo Dashboard: http://127.0.0.1:3001/
echo Backend runs minimized (window title "smarthome-backend"). Close that window to stop.
pause
