const { pool } = require('./migrate');

const updateUserSessions = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Updating user_sessions table...');
    
    // Drop existing table and recreate with unique constraint
    await client.query('DROP TABLE IF EXISTS user_sessions CASCADE;');
    
    // Recreate with unique constraint
    await client.query(`
      CREATE TABLE user_sessions (
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
    
    // Add index for performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_socket_id ON user_sessions(socket_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);');
    
    console.log('✅ user_sessions table updated with unique constraint');
    
  } catch (error) {
    console.error('❌ Error updating user_sessions table:', error);
  } finally {
    client.release();
  }
};

if (require.main === module) {
  updateUserSessions().then(() => {
    console.log('Database update completed');
    process.exit(0);
  });
}

module.exports = { updateUserSessions };