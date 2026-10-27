@echo off
REM Smart Home dashboard - one click start
REM Opens the dashboard and runs the backend. Close this window to stop.
cd /d %~dp0
echo Starting backend...
start /min "smarthome-backend" node backend/src/run.js
timeout /t 5 /nobreak >nul
start "" "http://127.0.0.1:3001/"
echo.
echo Dashboard should now be open at http://127.0.0.1:3001/
echo Backend runs minimized (window title: smarthome-backend).
echo To stop everything: close the minimized backend window too.
pause
