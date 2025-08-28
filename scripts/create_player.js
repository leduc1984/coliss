const { pool } = require('../database/migrate');
const bcrypt = require('bcryptjs');

async function createPlayer(username, email, password, mapName) {
    const client = await pool.connect();
    
    try {
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Create user
        const userResult = await client.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
            [username, email, hashedPassword, 'user']
        );
        
        const userId = userResult.rows[0].id;
        
        // Create character
        await client.query(
            'INSERT INTO characters (user_id, name, current_map) VALUES ($1, $2, $3)',
            [userId, username, mapName]
        );
        
        console.log(`Successfully created player ${username} with starting map ${mapName}`);
    } catch (error) {
        console.error('Error creating player:', error);
    } finally {
        client.release();
    }
}

// Run the function
if (require.main === module) {
    const username = process.argv[2] || 'caleb';
    const email = process.argv[3] || 'caleb@example.com';
    const password = process.argv[4] || 'password123';
    const mapName = process.argv[5] || 'castle_village';
    
    createPlayer(username, email, password, mapName).then(() => {
        console.log('Done');
        process.exit(0);
    });
}