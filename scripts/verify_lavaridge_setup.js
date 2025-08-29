const { pool } = require('../database/migrate');

async function verifySetup() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Verifying Lavaridge Town setup...\n');
        
        // Check if user "calem" exists
        const userResult = await client.query(
            'SELECT id, username, role FROM users WHERE username = $1',
            ['calem']
        );
        
        if (userResult.rows.length === 0) {
            console.log('❌ User "calem" not found');
            return;
        }
        
        const user = userResult.rows[0];
        console.log(`✅ User "calem" found:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role}`);
        
        // Check character and map
        const charResult = await client.query(
            'SELECT name, current_map FROM characters WHERE user_id = $1',
            [user.id]
        );
        
        if (charResult.rows.length === 0) {
            console.log('❌ Character for user "calem" not found');
            return;
        }
        
        const character = charResult.rows[0];
        console.log(`✅ Character found:`);
        console.log(`   Name: ${character.name}`);
        console.log(`   Current Map: ${character.current_map}`);
        
        // Check if the map exists in the database
        const mapResult = await client.query(
            'SELECT name, file_path, spawn_x, spawn_y, spawn_z FROM maps WHERE name = $1',
            [character.current_map]
        );
        
        if (mapResult.rows.length === 0) {
            console.log(`❌ Map "${character.current_map}" not found in database`);
            return;
        }
        
        const map = mapResult.rows[0];
        console.log(`✅ Map "${map.name}" found in database:`);
        console.log(`   File Path: ${map.file_path}`);
        console.log(`   Spawn Position: (${map.spawn_x}, ${map.spawn_y}, ${map.spawn_z})`);
        
        // Check if the map file exists
        const fs = require('fs');
        const path = require('path');
        // Fix the path - remove the duplicate 'assets' part
        const mapFilePath = path.join(__dirname, '..', 'pokemon-map-editor', map.file_path);
        
        if (fs.existsSync(mapFilePath)) {
            const stats = fs.statSync(mapFilePath);
            console.log(`✅ Map file exists:`);
            console.log(`   Path: ${mapFilePath}`);
            console.log(`   Size: ${stats.size} bytes (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        } else {
            console.log(`❌ Map file not found at: ${mapFilePath}`);
        }
        
        console.log('\n🎉 Setup verification completed successfully!');
        console.log(`🎮 Player "calem" is ready to start in the "${map.name}" map`);
        
    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        client.release();
    }
}

verifySetup().then(() => {
    process.exit(0);
});