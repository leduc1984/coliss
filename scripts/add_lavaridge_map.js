const { pool } = require('../database/migrate');

async function addLavaridgeMap() {
    const client = await pool.connect();
    
    try {
        // Add the Lavaridge Town map to the maps table
        await client.query(
            'INSERT INTO maps (name, file_path, spawn_x, spawn_y, spawn_z) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING;',
            ['lavaridge_town', 'assets/maps/Lavaridge Town/Lavaridge Town.glb', 0, 1, 0]
        );
        
        console.log('Successfully added Lavaridge Town map to database');
    } catch (error) {
        console.error('Error adding map to database:', error);
    } finally {
        client.release();
    }
}

// Run the function
if (require.main === module) {
    addLavaridgeMap().then(() => {
        console.log('Done');
        process.exit(0);
    });
}