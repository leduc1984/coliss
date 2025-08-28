-- Pokemon MMO Database Setup
-- Execute these commands in psql or pgAdmin

-- 1. Connect to PostgreSQL as superuser (usually postgres)
-- psql -U postgres

-- 2. Create the database
DROP DATABASE IF EXISTS pokemon_mmo;
CREATE DATABASE pokemon_mmo;

-- 3. Optional: Create dedicated user for the application
CREATE USER pokemon_user WITH PASSWORD 'pokemon123!';
GRANT ALL PRIVILEGES ON DATABASE pokemon_mmo TO pokemon_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pokemon_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pokemon_user;
ALTER USER pokemon_user CREATEDB;

-- 4. Connect to the new database
\c pokemon_mmo;

-- 5. Create tables (this will be done automatically by the application)
-- The application will run database/migrate.js automatically

-- Configuration for .env file:
-- Option A (using postgres user with empty password):
-- DB_USER=postgres
-- DB_PASSWORD=

-- Option B (using postgres user with password):
-- DB_USER=postgres  
-- DB_PASSWORD=your_actual_password

-- Option C (using dedicated user):
-- DB_USER=pokemon_user
-- DB_PASSWORD=pokemon123!