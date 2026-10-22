@echo off
rem ============================================================
rem  Xiaoya Academy - Windows launcher
rem  Double click this file to start.
rem ============================================================
setlocal
cd /d "%~dp0"
set PORT=8123

where py >nul 2>nul
if %errorlevel%==0 goto USE_PY

where python >nul 2>nul
if %errorlevel%==0 goto USE_PYTHON

where node >nul 2>nul
if %errorlevel%==0 goto USE_NODE

goto USE_FILE

:USE_PY
echo.
echo   Starting Xiaoya Academy on http://127.0.0.1:%PORT%/
echo   Close this window to stop the server.
echo.
start "" "http://127.0.0.1:%PORT%/"
py -m http.server %PORT% --bind 127.0.0.1
goto END

:USE_PYTHON
echo.
echo   Starting Xiaoya Academy on http://127.0.0.1:%PORT%/
echo   Close this window to stop the server.
echo.
start "" "http://127.0.0.1:%PORT%/"
python -m http.server %PORT% --bind 127.0.0.1
goto END

:USE_NODE
echo.
echo   Starting Xiaoya Academy with Node.js...
echo.
node server.js
goto END

:USE_FILE
echo.
echo   Python / Node.js not found. Opening index.html directly.
echo   Tip: install Python 3 or Node.js for more reliable local storage.
echo.
start "" "index.html"

:END
echo.
echo   Server stopped.
pause
