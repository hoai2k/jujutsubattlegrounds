@echo off
rem ============================================================
rem   CURSED ARENA - localhost launcher (Windows)
rem   Double-click this file, or run  play.cmd  from a terminal.
rem   Installs dependencies on first run, starts the dev server
rem   on http://localhost:5173 and opens your browser.
rem ============================================================
setlocal
cd /d "%~dp0"

echo.
echo   ==========================================
echo     CURSED ARENA
echo     http://localhost:5173
echo   ==========================================
echo.

rem --- Node present? ------------------------------------------------
where node >nul 2>nul
if errorlevel 1 goto no_node

rem --- Already running? Just open a tab instead of failing on the port.
rem     (no "-p tcp" here: that filter returns nothing on some Windows builds,
rem      and vite may be listening on the IPv6 loopback [::1] only)
netstat -ano | findstr /r /c:":5173 .*LISTENING" >nul 2>nul
if not errorlevel 1 goto already_running

rem --- First run: install dependencies -------------------------------
if not exist "node_modules" (
  echo   Installing dependencies ^(first run only, this may take a minute^)...
  echo.
  call npm install
  if errorlevel 1 goto install_failed
  echo.
)

echo   Game    http://localhost:5173
echo   Viewer  http://localhost:5173/#viewer
echo.
echo   Press Ctrl+C in this window to stop the server.
echo.
call npm run start
goto done

:already_running
echo   A server is already listening on port 5173.
echo   Opening the game in your browser...
start "" "http://localhost:5173"
rem brief pause so the message is readable when double-clicked
timeout /t 2 >nul 2>nul
exit /b 0

:no_node
echo   ERROR: Node.js was not found on your PATH.
echo   Install Node 18 or newer from https://nodejs.org and run this again.
echo.
pause
exit /b 1

:install_failed
echo.
echo   ERROR: "npm install" failed - see the messages above.
echo.
pause
exit /b 1

:done
echo.
echo   Server stopped.
pause
