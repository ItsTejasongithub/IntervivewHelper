@echo off
echo Starting AI Interview Assistant...
echo.

REM Start the backend server
start /B cmd /c "cd /d %~dp0 && npm run server"

REM Wait 2 seconds for server to start
timeout /t 2 /nobreak > nul

REM Start Vite dev server
start /B cmd /c "cd /d %~dp0 && npm run dev"

REM Wait 5 seconds for Vite to be ready
echo Waiting for servers to start...
timeout /t 5 /nobreak > nul

REM Launch PowerShell helper to keep window on top (native Windows solution)
echo Starting Always-On-Top helper...
start "Always-On-Top Helper" powershell -ExecutionPolicy Bypass -NoProfile -WindowStyle Minimized -File "%~dp0keep-on-top.ps1"

REM Wait 2 seconds for helper to start
timeout /t 2 /nobreak > nul

REM Launch Chrome in app mode
echo Launching AI Interview Assistant...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173 --window-size=450,700 --window-position=970,20

echo.
echo ========================================
echo AI Interview Assistant is now running!
echo ========================================
echo.
echo Features:
echo - ✓ Transparency slider in Settings (30-100%%)
echo - ✓ Drag window to reposition
echo - ✓ TRULY stays on top (powered by PowerShell)
echo - ✓ Works over Zoom/Teams/Meet
echo.
echo To stop:
echo   1. Close the Chrome app window
echo   2. Close "Always-On-Top Helper" window
echo   3. Close this window or press Ctrl+C
echo ========================================
pause
