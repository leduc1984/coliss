const bcrypt = require('bcryptjs');
const { pool } = require('./migrate');

const ensureAdminUser = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Ensuring admin user exists...');
    
    // Check if leduc user already exists
    const existingUser = await client.query(
      'SELECT id, username, role FROM users WHERE username = $1',
      ['leduc']
    );
    
    if (existingUser.rows.length > 0) {
      console.log('✅ Admin user "leduc" already exists');
      
      // Update to ensure admin role
      await client.query(
        'UPDATE users SET role = $1 WHERE username = $2',
        ['admin', 'leduc']
      );
      console.log('✅ Admin role confirmed for leduc');
      
      return existingUser.rows[0];
    }
    
    // Create admin user
    const passwordHash = await bcrypt.hash('Sansgenie1!', 12);
    
    const result = await client.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      ['leduc', 'leducgagnetommy@gmail.com', passwordHash, 'admin']
    );
    
    const newUser = result.rows[0];
    
    // Create default character
    await client.query(
      'INSERT INTO characters (user_id, name, current_map) VALUES ($1, $2, $3)',
      [newUser.id, 'leduc', 'slateport_city']
    );
    
    console.log('✅ Admin user "leduc" created successfully');
    console.log('📧 Email: leducgagnetommy@gmail.com');
    console.log('🔑 Password: Sansgenie1!');
    
    return newUser;
    
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error);
  } finally {
    client.release();
  }
};

if (require.main === module) {
  ensureAdminUser().then(() => {
    console.log('Admin user setup completed');
    process.exit(0);
  });
}

module.exports = { ensureAdminUser };