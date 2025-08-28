const { pool } = require('../database/migrate');

async function setPlayerMap(username, mapName) {
    const client = await pool.connect();
    
    try {
        // Check if user exists
        const userResult = await client.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );
        
        if (userResult.rows.length === 0) {
            console.log(`User ${username} not found`);
            return;
        }
        
        const userId = userResult.rows[0].id;
        
        // Update user's current map in characters table
        const updateResult = await client.query(
            'UPDATE characters SET current_map = $1 WHERE user_id = $2',
            [mapName, userId]
        );
        
        // Also update in user_sessions if exists
        await client.query(
            'UPDATE user_sessions SET current_map = $1 WHERE user_id = $2',
            [mapName, userId]
        );
        
        console.log(`Successfully set ${username}'s starting map to ${mapName}`);
    } catch (error) {
        console.error('Error updating player map:', error);
    } finally {
        client.release();
    }
}

// Run the function
if (require.main === module) {
    const username = process.argv[2] || 'caleb';
    const mapName = process.argv[3] || 'castle_village';
    
    setPlayerMap(username, mapName).then(() => {
        console.log('Done');
        process.exit(0);
    });
}