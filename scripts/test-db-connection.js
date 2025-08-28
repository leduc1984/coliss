const { Pool } = require('pg');
require('dotenv').config();

// Test different PostgreSQL configurations
const testConfigurations = [
    {
        name: "Empty password (default)",
        config: {
            host: 'localhost',
            port: 5432,
            database: 'postgres', // Connect to default db first
            user: 'postgres',
            password: ''
        }
    },
    {
        name: "Password 'postgres'",
        config: {
            host: 'localhost',
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: 'postgres'
        }
    },
    {
        name: "Password 'password'",
        config: {
            host: 'localhost',
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: 'password'
        }
    },
    {
        name: "Password '123456'",
        config: {
            host: 'localhost',
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: '123456'
        }
    }
];

async function testConnection(config) {
    const pool = new Pool(config);
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT version()');
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        await pool.end();
        return false;
    }
}

async function findWorkingConfiguration() {
    console.log('🔍 Testing PostgreSQL connections...\n');
    
    for (const test of testConfigurations) {
        process.stdout.write(`Testing ${test.name}... `);
        
        const works = await testConnection(test.config);
        
        if (works) {
            console.log('✅ SUCCESS!');
            console.log('\n🎉 Working configuration found!');
            console.log('Update your .env file with:');
            console.log(`DB_USER=${test.config.user}`);
            console.log(`DB_PASSWORD=${test.config.password}`);
            console.log('\nNow creating pokemon_mmo database...');
            
            // Try to create the pokemon_mmo database
            try {
                const pool = new Pool({...test.config});
                const client = await pool.connect();
                
                // Check if database exists
                const dbCheck = await client.query(
                    "SELECT 1 FROM pg_database WHERE datname = 'pokemon_mmo'"
                );
                
                if (dbCheck.rows.length === 0) {
                    await client.query('CREATE DATABASE pokemon_mmo');
                    console.log('✅ Database pokemon_mmo created successfully!');
                } else {
                    console.log('ℹ️  Database pokemon_mmo already exists');
                }
                
                client.release();
                await pool.end();
                return test.config;
            } catch (dbError) {
                console.log('⚠️  Connection works but failed to create database:', dbError.message);
                return test.config;
            }
        } else {
            console.log('❌ Failed');
        }
    }
    
    console.log('\n❌ No working configuration found.');
    console.log('Please check your PostgreSQL installation or set a custom password.');
    return null;
}

// Run the test
findWorkingConfiguration().then(config => {
    if (config) {
        console.log('\n🚀 You can now run: npm start');
    } else {
        console.log('\n📋 Next steps:');
        console.log('1. Check if PostgreSQL is running');
        console.log('2. Reset PostgreSQL password');
        console.log('3. Run: scripts/setup-database.bat');
    }
    process.exit(0);
}).catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
});