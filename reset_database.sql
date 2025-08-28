-- Pokemon MMO Database Reset Script
-- This script will completely reset the database

-- Connect as superuser (postgres) and run this script

-- Step 1: Terminate all connections to the database
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'pokemon_mmo'
  AND pid <> pg_backend_pid();

-- Step 2: Drop the database if it exists
DROP DATABASE IF EXISTS pokemon_mmo;

-- Step 3: Create a fresh database
CREATE DATABASE pokemon_mmo
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Step 4: Grant privileges
GRANT ALL PRIVILEGES ON DATABASE pokemon_mmo TO postgres;

-- Display success message
\echo 'Pokemon MMO database has been reset successfully!'
\echo 'You can now run: node database/migrate.js'