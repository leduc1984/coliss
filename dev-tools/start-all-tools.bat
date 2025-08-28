@echo off
title Pokemon MMO Development Tools Launcher
color 0A

echo.
echo    ======================================================
echo    🎮 Pokemon MMO Development Tools Suite Launcher
echo    ======================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

echo ✅ Node.js is installed: 
node --version

REM Check if npm is installed  
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ npm is installed:
npm --version

echo.
echo 🔍 Checking tool directories...

REM Check if tool directories exist
if not exist "ui-editor" (
    echo ❌ ui-editor directory not found
    pause
    exit /b 1
)
echo ✅ UI Editor directory found

if not exist "dialogue-editor" (
    echo ❌ dialogue-editor directory not found  
    pause
    exit /b 1
)
echo ✅ Dialogue Editor directory found

if not exist "monster-editor" (
    echo ❌ monster-editor directory not found
    pause
    exit /b 1
)
echo ✅ Monster Editor directory found

if not exist "admin-panel" (
    echo ❌ admin-panel directory not found
    pause
    exit /b 1
)
echo ✅ Admin Panel directory found

echo.
echo 📦 Installing dependencies if needed...

REM Install dependencies for each tool if needed
if not exist "ui-editor\node_modules" (
    echo Installing UI Editor dependencies...
    cd ui-editor
    call npm install
    cd ..
) else (
    echo ✅ UI Editor dependencies already installed
)

if not exist "dialogue-editor\node_modules" (
    echo Installing Dialogue Editor dependencies...
    cd dialogue-editor  
    call npm install
    cd ..
) else (
    echo ✅ Dialogue Editor dependencies already installed
)

if not exist "monster-editor\node_modules" (
    echo Installing Monster Editor dependencies...
    cd monster-editor
    call npm install  
    cd ..
) else (
    echo ✅ Monster Editor dependencies already installed
)

if not exist "admin-panel\node_modules" (
    echo Installing Admin Panel dependencies...
    cd admin-panel
    call npm install
    cd ..
) else (
    echo ✅ Admin Panel dependencies already installed
)

echo.
echo 🚀 Starting all development tools...
echo This will open 4 new command prompt windows.
echo.

REM Start UI Editor (port 3000)
echo Starting UI Editor on port 3000...
start "Pokemon MMO - UI Editor" cmd /k "cd ui-editor && npm start"
timeout /t 3 /nobreak >nul

REM Start Dialogue Editor (port 3001)
echo Starting Dialogue Editor on port 3001...
start "Pokemon MMO - Dialogue Editor" cmd /k "cd dialogue-editor && npm start"  
timeout /t 3 /nobreak >nul

REM Start Monster Editor (port 3002)
echo Starting Monster Editor on port 3002...
start "Pokemon MMO - Monster Editor" cmd /k "cd monster-editor && npm start"
timeout /t 3 /nobreak >nul

REM Start Admin Panel (port 3003)
echo Starting Admin Panel on port 3003...
start "Pokemon MMO - Admin Panel" cmd /k "cd admin-panel && npm start"

echo.
echo 🎉 All development tools are starting up!
echo.
echo Access URLs:
echo   🎨 UI Editor:       http://localhost:3000
echo   💬 Dialogue Editor: http://localhost:3001
echo   🦄 Monster Editor:  http://localhost:3002  
echo   👑 Admin Panel:     http://localhost:3003
echo.
echo Wait a few moments for all services to fully load.
echo Check each command prompt window for any startup errors.
echo.
echo To stop all services, close the individual command prompt windows.
echo.
pause