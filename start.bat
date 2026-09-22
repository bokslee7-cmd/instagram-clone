@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================
echo   Instagram Clone - auto start
echo ============================================

where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] python not found. Please install Python 3.11+ and add it to PATH.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm not found. Please install Node.js and add it to PATH.
    pause
    exit /b 1
)

REM ---------------- Backend ----------------
cd backend

if not exist venv (
    echo.
    echo [Backend] creating virtual environment...
    python -m venv venv
)

if not exist .env (
    copy .env.example .env >nul
)

echo.
echo [Backend] installing dependencies, first run may take a while...
call venv\Scripts\python.exe -m pip install -q --disable-pip-version-check -r requirements.txt

echo.
echo [Backend] applying database migrations...
call venv\Scripts\python.exe -m alembic upgrade head

echo.
echo [Backend] checking seed data...
call venv\Scripts\python.exe seed.py

echo.
echo [Backend] starting server at http://localhost:8000
start "Instagram Backend (:8000)" cmd /k "venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

cd ..

REM ---------------- Frontend ----------------
cd frontend

if not exist node_modules (
    echo.
    echo [Frontend] installing packages, first run may take a few minutes...
    call npm install
)

echo.
echo [Frontend] starting dev server at http://localhost:5173
start "Instagram Frontend (:5173)" cmd /k "npm run dev"

cd ..

REM ---------------- Wait for frontend & open browser ----------------
echo.
echo Waiting for the frontend server to become ready...

set READY=0
for /l %%i in (1,1,60) do (
    curl -s -o nul -w "%%{http_code}" http://localhost:5173 > "%TEMP%\ig_status.txt" 2>nul
    set /p STATUS=<"%TEMP%\ig_status.txt"
    if "!STATUS!"=="200" (
        set READY=1
        goto :ready
    )
    timeout /t 1 /nobreak >nul
)

:ready
del "%TEMP%\ig_status.txt" >nul 2>nul

if "!READY!"=="1" (
    echo Server is ready. Opening browser...
) else (
    echo Timed out waiting for the server. Please refresh http://localhost:5173 manually.
)

start http://localhost:5173

echo.
echo ============================================
echo   Done!
echo   - Frontend      : http://localhost:5173
echo   - Backend  docs : http://localhost:8000/docs
echo   - Close the two new console windows to stop the servers.
echo ============================================
pause
