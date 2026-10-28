@echo off
REM Stop Smart Home dashboard backend (frees port 3001).
set FOUND=0
for /f "tokens=5" %%p in ('netstat -ano ^| findstr "127.0.0.1:3001.*LISTENING"') do (
  echo Stopping backend (PID %%p)...
  taskkill /PID %%p /F >nul
  set FOUND=1
)
if "%FOUND%"=="0" echo Backend is not running.
pause
