@echo off
echo 🎮 Starting Pokemon MMO Server...

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 14+ and try again.
    pause
    exit /b 1
)

echo [SUCCESS] Node.js detected: 
node --version

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully
) else (
    echo [INFO] Dependencies already installed
)

:: Check if .env file exists
if not exist ".env" (
    echo [WARNING] .env file not found. Creating with default values...
    (
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=pokemon_mmo
        echo DB_USER=postgres
        echo DB_PASSWORD=password
        echo.
        echo # JWT Secret ^(change this in production!^)
        echo JWT_SECRET=your_super_secret_jwt_key_change_in_production_pokemon_mmo_2024
        echo.
        echo # Server Configuration
        echo PORT=3000
        echo NODE_ENV=development
        echo.
        echo # Game Configuration
        echo MAX_PLAYERS_PER_MAP=50
        echo CHAT_MESSAGE_LIMIT=100
        echo ADMIN_EMAILS=admin@pokemonmmo.com
    ) > .env
    echo [SUCCESS] .env file created with default values
    echo [WARNING] Please update the database credentials in .env file if needed
) else (
    echo [SUCCESS] .env file found
)

:: Run database migrations
echo [INFO] Running database migrations...
node database/migrate.js
if %errorlevel% neq 0 (
    echo [ERROR] Database migration failed. Please check your PostgreSQL connection.
    echo [INFO] Make sure PostgreSQL is running and the database 'pokemon_mmo' exists.
    pause
    exit /b 1
)
echo [SUCCESS] Database migrations completed

:: Start the server
echo [INFO] Starting Pokemon MMO server...
echo.
echo === Pokemon MMO Server ===
echo Game: http://localhost:3000
echo Map Editor: http://localhost:3000/pokemon-map-editor/
echo.
echo Press Ctrl+C to stop the server
echo.

:: Start the server with nodemon if available, otherwise use node
where nodemon >nul 2>&1
if %errorlevel% equ 0 (
    nodemon server.js
) else (
    node server.js
)

pause