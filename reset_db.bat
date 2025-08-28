@echo off
echo 🔄 Resetting Pokemon MMO Database...

echo [INFO] Stopping any running Node.js servers...
taskkill /F /IM node.exe >nul 2>&1

echo [INFO] Connecting to PostgreSQL and resetting database...
psql -U postgres -f reset_database.sql

if %errorlevel% neq 0 (
    echo [ERROR] Failed to reset database. Make sure PostgreSQL is running and you have admin rights.
    echo [INFO] You can also run manually:
    echo   psql -U postgres -c "DROP DATABASE IF EXISTS pokemon_mmo; CREATE DATABASE pokemon_mmo;"
    pause
    exit /b 1
)

echo [SUCCESS] Database reset successfully!

echo [INFO] Running database migrations...
node database/migrate.js

if %errorlevel% neq 0 (
    echo [ERROR] Failed to run migrations.
    pause
    exit /b 1
)

echo [SUCCESS] Database setup complete!
echo [INFO] You can now run: start.bat
echo.
pause