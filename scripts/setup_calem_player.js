const { pool } = require('../database/migrate');
const bcrypt = require('bcryptjs');

async function setupCalemPlayer() {
    const client = await pool.connect();
    
    try {
        // Check if user "calem" exists
        const userResult = await client.query(
            'SELECT id FROM users WHERE username = $1',
            ['calem']
        );
        
        if (userResult.rows.length === 0) {
            console.log('User "calem" not found. Creating user...');
            
            // Create the user
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash('password123', saltRounds);
            
            const newUserResult = await client.query(
                'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
                ['calem', 'calem@example.com', hashedPassword, 'user']
            );
            
            const userId = newUserResult.rows[0].id;
            
            // Create character
            await client.query(
                'INSERT INTO characters (user_id, name, current_map) VALUES ($1, $2, $3)',
                [userId, 'calem', 'soaring_overworld']
            );
            
            console.log('Successfully created player "calem" with soaring_overworld map');
        } else {
            console.log('User "calem" already exists. Updating map...');
            
            const userId = userResult.rows[0].id;
            
            // Update user's current map in characters table
            await client.query(
                'UPDATE characters SET current_map = $1 WHERE user_id = $2',
                ['soaring_overworld', userId]
            );
            
            console.log('Successfully updated calem\'s starting map to soaring_overworld');
        }
    } catch (error) {
        console.error('Error setting up player:', error);
    } finally {
        client.release();
    }
}

// Run the function
if (require.main === module) {
    setupCalemPlayer().then(() => {
        console.log('Done');
        process.exit(0);
    });
}