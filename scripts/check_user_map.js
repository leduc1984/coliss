const { pool } = require('../database/migrate');

async function checkUserMap(username) {
    const client = await pool.connect();
    
    try {
        const result = await client.query(
            'SELECT u.username, c.current_map FROM users u JOIN characters c ON u.id = c.user_id WHERE u.username = $1',
            [username]
        );
        
        if (result.rows.length > 0) {
            console.log(`User ${username} is set to start on map: ${result.rows[0].current_map}`);
        } else {
            console.log(`User ${username} not found`);
        }
    } catch (error) {
        console.error('Error checking user map:', error);
    } finally {
        client.release();
    }
}

// Run the function
if (require.main === module) {
    const username = process.argv[2] || 'calem';
    checkUserMap(username).then(() => {
        console.log('Done');
        process.exit(0);
    });
}