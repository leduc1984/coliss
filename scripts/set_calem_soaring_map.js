const { pool } = require('../database/migrate');

async function setCalemSoaringMap() {
    const client = await pool.connect();
    
    try {
        // Check if user "calem" exists
        const userResult = await client.query(
            'SELECT id FROM users WHERE username = $1',
            ['calem']
        );
        
        if (userResult.rows.length === 0) {
            console.log('User "calem" not found. Please create the user first.');
            return;
        }
        
        const userId = userResult.rows[0].id;
        
        // Update user's current map in characters table
        const updateResult = await client.query(
            'UPDATE characters SET current_map = $1 WHERE user_id = $2',
            ['soaring_overworld', userId]
        );
        
        // Also update in user_sessions if exists
        await client.query(
            'UPDATE user_sessions SET current_map = $1 WHERE user_id = $2',
            ['soaring_overworld', userId]
        );
        
        console.log('Successfully set calem\'s starting map to soaring_overworld');
    } catch (error) {
        console.error('Error updating player map:', error);
    } finally {
        client.release();
    }
}

// Run the function
if (require.main === module) {
    setCalemSoaringMap().then(() => {
        console.log('Done');
        process.exit(0);
    });
}