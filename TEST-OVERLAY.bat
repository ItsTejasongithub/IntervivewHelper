@echo off
echo ========================================
echo Testing Always-On-Top Solution
echo ========================================
echo.

REM Kill any existing Chrome app windows
taskkill /F /IM chrome.exe /FI "WINDOWTITLE eq localhost:5173" 2>nul

echo Starting PowerShell helper...
start "Always-On-Top Helper" powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0keep-on-top.ps1"

timeout /t 3 /nobreak > nul

echo Launching Chrome app...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173 --window-size=450,700 --window-position=970,20

echo.
echo ========================================
echo Testing Instructions:
echo ========================================
echo.
echo 1. Chrome window should appear on the right
echo 2. Open any other app (Word, Zoom, etc.)
echo 3. Click on that app
echo 4. The AI Assistant should STAY on top!
echo.
echo If it works, you'll see it floating above everything
echo.
echo Press any key to close everything...
pause > nul

REM Clean up
taskkill /F /IM powershell.exe /FI "WINDOWTITLE eq Always-On-Top Helper*" 2>nul
taskkill /F /IM chrome.exe /FI "WINDOWTITLE eq localhost:5173" 2>nul

echo.
echo Done! Did it stay on top? (Yes/No)
echo.
pause
