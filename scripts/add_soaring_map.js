const { pool } = require('../database/migrate');

async function addSoaringMap() {
    const client = await pool.connect();
    
    try {
        // Add the soaring overworld map to the maps table
        await client.query(
            'INSERT INTO maps (name, file_path, spawn_x, spawn_y, spawn_z) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING;',
            ['soaring_overworld', 'assets/maps/soaring overworld/soaring.glb', 0, 5, 0]
        );
        
        console.log('Successfully added soaring_overworld map to database');
    } catch (error) {
        console.error('Error adding map to database:', error);
    } finally {
        client.release();
    }
}

// Run the function
if (require.main === module) {
    addSoaringMap().then(() => {
        console.log('Done');
        process.exit(0);
    });
}