@echo off
setlocal
title Liberty POS Launcher

:: Ensure we are in the correct directory
cd /d "%~dp0"

echo ==========================================
echo      LIBERTY POS - SYSTEM LAUNCHER
echo ==========================================

:: 1. Initialize Database Client
echo.
echo [1/3] Initializing Database Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [WARNING] Prisma generate failed. Continuing...
)

:: 2. Check/Create Build
echo.
echo [2/3] Checking Production Build...
if not exist ".next" (
    echo Build not found. Creating new build...
    echo This may take a few minutes...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Build failed!
        pause
        exit /b 1
    )
) else (
    echo Existing build found.
)

:: 3. Start Server & Launch Browser
echo.
echo [3/3] Starting Application...

:: Check if port 3000 is busy
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo Server is already running.
) else (
    echo Starting server process...
    start "Liberty POS Server" /min cmd /c "npm start"
    
    echo Waiting for server to initialize...
    timeout /t 5 >nul
)

echo Launching User Interface...
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
) else (
    start msedge --app=http://localhost:3000
)

echo.
echo Done! Closing launcher...
timeout /t 3 >nul
exit
