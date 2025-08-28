const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'co-admin', 'helper', 'user')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Characters table
    await client.query(`
      CREATE TABLE IF NOT EXISTS characters (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        sprite_type VARCHAR(20) DEFAULT 'male',
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        position_x FLOAT DEFAULT 0,
        position_y FLOAT DEFAULT 0,
        position_z FLOAT DEFAULT 0,
        current_map VARCHAR(100) DEFAULT 'slateport_city',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Chat messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        channel VARCHAR(50) DEFAULT 'global',
        is_command BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Maps table
    await client.query(`
      CREATE TABLE IF NOT EXISTS maps (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        spawn_x FLOAT DEFAULT 0,
        spawn_y FLOAT DEFAULT 0,
        spawn_z FLOAT DEFAULT 0,
        max_players INTEGER DEFAULT 50,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Pokemon encounters table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pokemon_encounters (
        id SERIAL PRIMARY KEY,
        map_name VARCHAR(100) NOT NULL,
        zone_name VARCHAR(100) NOT NULL,
        pokemon_id INTEGER NOT NULL,
        min_level INTEGER DEFAULT 1,
        max_level INTEGER DEFAULT 5,
        encounter_rate FLOAT DEFAULT 0.1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User sessions table (for active players)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
        socket_id VARCHAR(100) NOT NULL,
        current_map VARCHAR(100) NOT NULL,
        position_x FLOAT DEFAULT 0,
        position_y FLOAT DEFAULT 0,
        position_z FLOAT DEFAULT 0,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes for performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_socket_id ON user_sessions(socket_id);');

    console.log('✅ Database tables created successfully');
    
    // Insert default maps
    await client.query(`
      INSERT INTO maps (name, file_path, spawn_x, spawn_y, spawn_z) VALUES 
      ('house_inside', 'assets/maps/male_house_inside/house.glb', 0, 0, 0),
      ('slateport_city', 'assets/maps/Slateport City/Slateport City.glb', 0, 1, 0)
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log('✅ Default maps inserted');
    
    // Exécuter les tables de bataille
    console.log('🔄 Creating battle system tables...');
    await createBattleTables(client);
    console.log('✅ Battle system tables created successfully');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    client.release();
  }
};

/**
 * Crée les tables pour le système de bataille
 */
const createBattleTables = async (client) => {
  try {
    const battleTablesSQL = fs.readFileSync(
      path.join(__dirname, 'battle_tables.sql'), 
      'utf8'
    );
    
    // Exécuter le script SQL des tables de bataille
    await client.query(battleTablesSQL);
    
    console.log('✅ Battle tables created from battle_tables.sql');
    
  } catch (error) {
    console.error('❌ Error creating battle tables:', error);
    throw error;
  }
};

module.exports = { pool, createTables, createBattleTables };

if (require.main === module) {
  createTables().then(() => {
    console.log('Migration completed');
    process.exit(0);
  });
}