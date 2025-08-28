const fs = require('fs');
const path = require('path');

// Check if the soaring overworld map file exists
const mapPath = path.join(__dirname, 'pokemon-map-editor', 'assets', 'maps', 'soaring overworld', 'soaring.glb');

if (fs.existsSync(mapPath)) {
    const stats = fs.statSync(mapPath);
    console.log(`✅ Soaring overworld map found:`);
    console.log(`   Path: ${mapPath}`);
    console.log(`   Size: ${stats.size} bytes (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
} else {
    console.log(`❌ Soaring overworld map not found at: ${mapPath}`);
}

// Check if the map is in the database
const { pool } = require('./database/migrate');

async function checkMapInDatabase() {
    const client = await pool.connect();
    
    try {
        const result = await client.query(
            'SELECT * FROM maps WHERE name = $1',
            ['soaring_overworld']
        );
        
        if (result.rows.length > 0) {
            console.log(`✅ Soaring overworld map found in database:`);
            console.log(`   Name: ${result.rows[0].name}`);
            console.log(`   File Path: ${result.rows[0].file_path}`);
            console.log(`   Spawn Position: (${result.rows[0].spawn_x}, ${result.rows[0].spawn_y}, ${result.rows[0].spawn_z})`);
        } else {
            console.log(`❌ Soaring overworld map not found in database`);
        }
    } catch (error) {
        console.error('Error checking database:', error);
    } finally {
        client.release();
    }
}

checkMapInDatabase().then(() => {
    console.log('Database check completed');
    process.exit(0);
});