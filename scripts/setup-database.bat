@echo off
echo 🎮 Pokemon MMO - Database Setup Script
echo =====================================
echo.

echo 🔍 Checking PostgreSQL installation...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL not found in PATH
    echo Please install PostgreSQL or add it to your PATH
    echo Download: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo ✅ PostgreSQL found!
echo.

echo 📋 Database Configuration Options:
echo 1. Use empty password (default PostgreSQL)
echo 2. Set custom password
echo 3. Create new database user
echo.

set /p choice="Choose option (1-3): "

if "%choice%"=="1" goto :empty_password
if "%choice%"=="2" goto :custom_password
if "%choice%"=="3" goto :new_user
goto :invalid_choice

:empty_password
echo.
echo 🔧 Testing connection with empty password...
psql -U postgres -h localhost -c "SELECT version();" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Connection failed with empty password
    echo Try option 2 or 3
    pause
    exit /b 1
)
echo ✅ Empty password works!
goto :create_database

:custom_password
echo.
set /p db_password="Enter your PostgreSQL password: "
echo.
echo 🔧 Testing connection...
set PGPASSWORD=%db_password%
psql -U postgres -h localhost -c "SELECT version();" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Connection failed with provided password
    pause
    exit /b 1
)
echo ✅ Password verified!
goto :create_database

:new_user
echo.
set /p new_user="Enter new username: "
set /p new_password="Enter new password: "
echo.
echo 🔧 Creating new user...
set PGPASSWORD=
psql -U postgres -h localhost -c "CREATE USER %new_user% WITH PASSWORD '%new_password%' CREATEDB;" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Failed to create user (user might already exist)
)
set PGPASSWORD=%new_password%
echo ✅ User setup complete!
goto :create_database

:create_database
echo.
echo 🗄️ Creating database 'pokemon_mmo'...
if "%choice%"=="1" (
    psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS pokemon_mmo;"
    psql -U postgres -h localhost -c "CREATE DATABASE pokemon_mmo;"
) else if "%choice%"=="2" (
    psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS pokemon_mmo;"
    psql -U postgres -h localhost -c "CREATE DATABASE pokemon_mmo;"
) else (
    psql -U %new_user% -h localhost -c "DROP DATABASE IF EXISTS pokemon_mmo;"
    psql -U %new_user% -h localhost -c "CREATE DATABASE pokemon_mmo;"
)

if %errorlevel% neq 0 (
    echo ❌ Failed to create database
    pause
    exit /b 1
)

echo ✅ Database 'pokemon_mmo' created successfully!
echo.

echo 📝 Updating .env file...
if "%choice%"=="1" (
    echo DB_PASSWORD= > temp_env.txt
) else if "%choice%"=="2" (
    echo DB_PASSWORD=%db_password% > temp_env.txt
) else (
    echo DB_USER=%new_user% > temp_env.txt
    echo DB_PASSWORD=%new_password% >> temp_env.txt
)

echo.
echo ✅ Database setup complete!
echo.
echo 🚀 You can now run: npm start
echo.
pause

:invalid_choice
echo ❌ Invalid choice
pause
exit /b 1