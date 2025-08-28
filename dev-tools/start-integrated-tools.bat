@echo off
setlocal enabledelayedexpansion

REM Pokemon MMO Development Tools - Integrated Startup Script (Windows)
REM This script starts all development tools with full integration

title Pokemon MMO Development Tools - Integrated Startup

echo.
echo ================================
echo ^🚀 Pokemon MMO Development Tools
echo ================================
echo.

REM Create necessary directories
if not exist "logs" mkdir logs
if not exist "backups" mkdir backups

echo ^📋 Checking Prerequisites...

REM Check for Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ^❌ Docker is not installed or not in PATH
    echo Please install Docker Desktop and try again
    pause
    exit /b 1
)
echo ^✅ Docker found

REM Check for Docker Compose
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ^❌ Docker Compose is not installed or not in PATH
    echo Please install Docker Compose and try again
    pause
    exit /b 1
)
echo ^✅ Docker Compose found

REM Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ^❌ Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)
echo ^✅ Node.js found

REM Check for npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ^❌ npm is not installed or not in PATH
    echo Please install npm and try again
    pause
    exit /b 1
)
echo ^✅ npm found

echo.
echo ^🔧 Environment Setup...

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo ^⚠️ Creating .env file with default values...
    (
        echo # Database Configuration
        echo DB_PASSWORD=pokemon123
        echo.
        echo # JWT Configuration  
        echo JWT_SECRET=dev-secret-key-change-in-production
        echo.
        echo # Grafana Configuration
        echo GRAFANA_PASSWORD=admin123
        echo.
        echo # Development Mode
        echo NODE_ENV=development
    ) > .env
    echo ^✅ .env file created
) else (
    echo ^✅ .env file exists
)

echo.
echo ^🏗️ Building and Starting Services...

REM Start infrastructure services first
echo ^📊 Starting infrastructure services...
docker-compose -f docker-compose.integration.yml up -d postgres redis

REM Wait for database to be ready
echo ^⏳ Waiting for database to be ready...
:wait_db
timeout /t 2 /nobreak >nul
docker-compose -f docker-compose.integration.yml exec postgres pg_isready -U postgres >nul 2>&1
if %errorlevel% neq 0 goto wait_db
echo ^✅ Database is ready

REM Start API Gateway
echo ^🔌 Starting API Gateway...
docker-compose -f docker-compose.integration.yml up -d api-gateway

REM Wait for API Gateway to be ready
echo ^⏳ Waiting for API Gateway to be ready...
:wait_api
timeout /t 2 /nobreak >nul
curl -f http://localhost:3001/api/health >nul 2>&1
if %errorlevel% neq 0 goto wait_api
echo ^✅ API Gateway is ready

echo.
echo ^📦 Installing Dependencies...

REM Install dependencies for all tools
set "tools=ui-editor dialogue-editor monster-editor admin-panel"
for %%t in (%tools%) do (
    if exist "%%t" (
        echo Installing dependencies for %%t...
        cd %%t
        start /min cmd /c "npm install"
        cd ..
    )
)

REM Wait a bit for installations to start
timeout /t 5 /nobreak >nul
echo ^✅ Dependencies installation started

echo.
echo ^🛠️ Starting Development Tools...

REM Start development tools
for %%t in (%tools%) do (
    if exist "%%t" (
        echo Starting %%t...
        docker-compose -f docker-compose.integration.yml up -d %%t
    )
)

echo.
echo ^📊 Starting Monitoring Services...
docker-compose -f docker-compose.integration.yml up -d prometheus grafana

echo ^🔗 Starting NGINX load balancer...
docker-compose -f docker-compose.integration.yml up -d nginx

echo ^💾 Starting backup service...
docker-compose -f docker-compose.integration.yml up -d backup

echo.
echo ^🏥 Running Health Checks...

REM Give services time to start
timeout /t 10 /nobreak >nul

set "all_healthy=1"

echo Checking UI Editor...
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ^✅ UI Editor is healthy
) else (
    echo ^❌ UI Editor is not responding
    set "all_healthy=0"
)

echo Checking Dialogue Editor...
curl -f http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ^✅ Dialogue Editor is healthy
) else (
    echo ^❌ Dialogue Editor is not responding
    set "all_healthy=0"
)

echo Checking Monster Editor...
curl -f http://localhost:3002 >nul 2>&1
if %errorlevel% equ 0 (
    echo ^✅ Monster Editor is healthy
) else (
    echo ^❌ Monster Editor is not responding
    set "all_healthy=0"
)

echo Checking Admin Panel...
curl -f http://localhost:3003 >nul 2>&1
if %errorlevel% equ 0 (
    echo ^✅ Admin Panel is healthy
) else (
    echo ^❌ Admin Panel is not responding
    set "all_healthy=0"
)

echo Checking API Gateway...
curl -f http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ^✅ API Gateway is healthy
) else (
    echo ^❌ API Gateway is not responding
    set "all_healthy=0"
)

echo.
echo ========================================
echo ^🎉 Startup Complete!
echo ========================================

if "!all_healthy!"=="1" (
    echo ^✅ All services are healthy and ready!
) else (
    echo ^⚠️ Some services may need more time to start up
)

echo.
echo ^🌐 Access URLs:
echo • UI Editor:         http://localhost:3000
echo • Dialogue Editor:   http://localhost:3001  
echo • Monster Editor:    http://localhost:3002
echo • Admin Panel:       http://localhost:3003
echo • API Gateway:       http://localhost:3001
echo • Prometheus:        http://localhost:9090
echo • Grafana:          http://localhost:3001 (admin/admin123)

echo.
echo ^📁 Important Directories:
echo • Logs:              %cd%\logs
echo • Backups:           %cd%\backups
echo • Configuration:     %cd%\.env

echo.
echo ^🔧 Management Commands:
echo • View logs:         docker-compose -f docker-compose.integration.yml logs -f [service]
echo • Stop all:          docker-compose -f docker-compose.integration.yml down
echo • Restart service:   docker-compose -f docker-compose.integration.yml restart [service]
echo • View status:       docker-compose -f docker-compose.integration.yml ps

echo.
echo ^✅ Pokemon MMO Development Tools are now running with full integration!
echo ^💡 Check the INTEGRATION_GUIDE.md for detailed usage instructions

REM Create stop script
(
    echo @echo off
    echo echo ^🛑 Stopping Pokemon MMO Development Tools...
    echo docker-compose -f docker-compose.integration.yml down
    echo echo ^✅ All services stopped successfully!
    echo pause
) > stop-integrated-tools.bat

echo.
echo ^✅ Stop script created: stop-integrated-tools.bat

echo.
echo Press any key to open all tools in your browser...
pause >nul

REM Open all tools in browser
start http://localhost:3000
start http://localhost:3001
start http://localhost:3002
start http://localhost:3003

echo.
echo ^🚀 All tools are now open in your browser!
echo.
pause