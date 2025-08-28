/**
 * Database Migration Script for Unified AuthZ Service
 * ADR-001: Consolidate Authentication Systems
 * 
 * This script migrates the database schema to support the unified
 * authentication and authorization system with scope-based permissions.
 * 
 * Usage:
 *   node scripts/migrate-auth-unified.js --dry-run    # Preview changes
 *   node scripts/migrate-auth-unified.js --execute    # Execute migration
 *   node scripts/migrate-auth-unified.js --rollback   # Rollback changes
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pokemon_mmo',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

class AuthMigration {
  constructor() {
    this.migrationId = `authz_unified_${Date.now()}`;
    this.backupPath = path.join(__dirname, '..', 'backups');
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }

  /**
   * Create database backup before migration
   */
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupPath, `backup_${timestamp}.sql`);
    
    console.log('🔄 Creating database backup...');
    
    try {
      // Try pg_dump first, fallback to SQL export if it fails
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      const dumpCommand = `pg_dump -h ${process.env.DB_HOST || 'localhost'} -U ${process.env.DB_USER || 'postgres'} -d ${process.env.DB_NAME || 'pokemon_mmo'} -f "${backupFile}"`;
      
      try {
        await execPromise(dumpCommand);
        console.log(`✅ Backup created with pg_dump: ${backupFile}`);
        return backupFile;
      } catch (pgDumpError) {
        console.log('⚠️ pg_dump failed, creating SQL-based backup...');
        return await this.createSQLBackup(backupFile);
      }
    } catch (error) {
      console.error('❌ Backup creation failed:', error.message);
      throw new Error('Cannot proceed without backup');
    }
  }

  /**
   * Create backup using SQL queries (fallback method)
   */
  async createSQLBackup(backupFile) {
    const client = await pool.connect();
    
    try {
      console.log('📝 Creating SQL-based backup...');
      
      // Get table schemas and data
      const tables = ['users', 'characters', 'chat_messages', 'maps', 'pokemon_encounters', 'user_sessions'];
      let backupSQL = `-- Database backup created at ${new Date().toISOString()}\n\n`;
      
      for (const table of tables) {
        try {
          // Check if table exists
          const tableExists = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            )
          `, [table]);
          
          if (tableExists.rows[0].exists) {
            // Export table data
            const result = await client.query(`SELECT * FROM ${table}`);
            
            if (result.rows.length > 0) {
              backupSQL += `-- Backup for table: ${table}\n`;
              backupSQL += `DELETE FROM ${table};\n`;
              
              // Add INSERT statements
              for (const row of result.rows) {
                const columns = Object.keys(row).join(', ');
                const values = Object.values(row).map(val => 
                  val === null ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`
                ).join(', ');
                backupSQL += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
              }
              backupSQL += `\n`;
            }
          }
        } catch (tableError) {
          console.log(`⚠️ Could not backup table ${table}: ${tableError.message}`);
        }
      }
      
      // Write backup to file
      fs.writeFileSync(backupFile, backupSQL);
      console.log(`✅ SQL backup created: ${backupFile}`);
      
      return backupFile;
    } finally {
      client.release();
    }
  }

  /**
   * Check current database state
   */
  async checkCurrentState() {
    const client = await pool.connect();
    
    try {
      console.log('🔍 Checking current database state...');
      
      // Check if tables already exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('user_permissions', 'auth_audit_log', 'feature_flags')
      `);
      
      const existingTables = tablesResult.rows.map(row => row.table_name);
      
      // Check users table structure
      const usersResult = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);
      
      // Check for existing auth-related data
      const authDataResult = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as user_count,
          (SELECT COUNT(*) FROM users WHERE role IS NOT NULL) as users_with_roles
      `);
      
      return {
        existingTables,
        usersStructure: usersResult.rows,
        authData: authDataResult.rows[0],
        migrationNeeded: !existingTables.includes('user_permissions')
      };
    } finally {
      client.release();
    }
  }

  /**
   * Execute database migration
   */
  async executeMigration() {
    const client = await pool.connect();
    
    try {
      console.log('🚀 Starting database migration...');
      
      // Start transaction
      await client.query('BEGIN');
      
      // 1. Create user_permissions table
      console.log('📝 Creating user_permissions table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_permissions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          scope VARCHAR(100) NOT NULL,
          granted_by INTEGER REFERENCES users(id),
          granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NULL,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          UNIQUE(user_id, scope)
        )
      `);
      
      // Add indexes for performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_permissions_scope ON user_permissions(scope);
        CREATE INDEX IF NOT EXISTS idx_user_permissions_expires_at ON user_permissions(expires_at) WHERE expires_at IS NOT NULL;
      `);
      
      // 2. Create auth_audit_log table
      console.log('📝 Creating auth_audit_log table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS auth_audit_log (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          action VARCHAR(50) NOT NULL,
          details JSONB DEFAULT '{}'::jsonb,
          ip_address INET,
          user_agent TEXT,
          session_id VARCHAR(255),
          success BOOLEAN DEFAULT true,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          CHECK (action IN (
            'token_validated', 'token_validation_failed', 'permission_denied',
            'scope_granted', 'user_logged_in', 'user_logged_out', 
            'password_changed', 'role_changed', 'user_registered',
            'login_failed'
          ))
        )
      `);
      
      // Add indexes for audit log
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON auth_audit_log(user_id);
        CREATE INDEX IF NOT EXISTS idx_auth_audit_log_timestamp ON auth_audit_log(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_auth_audit_log_action ON auth_audit_log(action);
        CREATE INDEX IF NOT EXISTS idx_auth_audit_log_success ON auth_audit_log(success, timestamp DESC);
      `);
      
      // 3. Create feature_flags table (if not exists from FeatureFlags.js)
      console.log('📝 Creating feature_flags table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS feature_flags (
          name VARCHAR(100) PRIMARY KEY,
          enabled BOOLEAN DEFAULT false,
          rollout_percent INTEGER DEFAULT 0 CHECK (rollout_percent >= 0 AND rollout_percent <= 100),
          description TEXT,
          phase VARCHAR(50),
          canary_roles JSONB DEFAULT '[]'::jsonb,
          dependencies JSONB DEFAULT '[]'::jsonb,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_by INTEGER REFERENCES users(id)
        )
      `);
      
      // 4. Ensure users table has required columns
      console.log('📝 Updating users table structure...');
      
      // Add is_active column if missing
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
      `);
      
      // Add last_login column if missing
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
      `);
      
      // Ensure role column exists and has proper constraints
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'
      `);
      
      // Add constraint for role values
      await client.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.check_constraints 
            WHERE constraint_name = 'users_role_check'
          ) THEN
            ALTER TABLE users 
            ADD CONSTRAINT users_role_check 
            CHECK (role IN ('user', 'helper', 'co_admin', 'admin'));
          END IF;
        END $$
      `);
      
      // 5. Create migration tracking table
      console.log('📝 Creating migration tracking...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          migration_id VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          executed_by VARCHAR(50),
          rollback_sql TEXT
        )
      `);
      
      // Record this migration
      await client.query(`
        INSERT INTO schema_migrations (migration_id, description, executed_by, rollback_sql)
        VALUES ($1, $2, $3, $4)
      `, [
        this.migrationId,
        'Unified AuthZ Service - Phase 1 Architecture Refactoring',
        'system',
        this.generateRollbackSQL()
      ]);
      
      // 6. Initialize default data
      console.log('📝 Initializing default data...');
      
      // Ensure admin user exists with proper role
      const adminResult = await client.query(`
        UPDATE users 
        SET role = 'admin', is_active = true 
        WHERE username = 'leduc'
        RETURNING id, username, role
      `);
      
      if (adminResult.rows.length > 0) {
        console.log(`✅ Admin user 'leduc' configured with admin role`);
        
        // Grant all scopes to admin
        const adminScopes = [
          'editor:map.write', 'editor:ui.write', 'editor:monster.write',
          'player.ban', 'player.kick', 'player.mute', 'player.teleport',
          'chat.moderate', 'chat.announce', 'chat.clear',
          'server.control', 'server.shutdown', 'admin.access'
        ];
        
        for (const scope of adminScopes) {
          await client.query(`
            INSERT INTO user_permissions (user_id, scope, granted_by)
            VALUES ($1, $2, $1)
            ON CONFLICT (user_id, scope) DO NOTHING
          `, [adminResult.rows[0].id, scope]);
        }
        
        console.log(`✅ Granted ${adminScopes.length} scopes to admin user`);
      }
      
      // Update existing users to have 'user' role if null
      const updatedUsersResult = await client.query(`
        UPDATE users 
        SET role = 'user', is_active = true 
        WHERE role IS NULL OR role = ''
        RETURNING COUNT(*)
      `);
      
      if (updatedUsersResult.rows[0] && updatedUsersResult.rows[0].count > 0) {
        console.log(`✅ Updated ${updatedUsersResult.rows[0].count} users with default 'user' role`);
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('✅ Database migration completed successfully!');
      
      // Log migration event
      await this.logMigrationEvent('migration_completed', {
        migrationId: this.migrationId,
        tablesCreated: ['user_permissions', 'auth_audit_log', 'feature_flags', 'schema_migrations'],
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('❌ Migration failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Perform dry run to show what changes will be made
   */
  async dryRun() {
    console.log('🔍 DRY RUN - Preview of migration changes:\n');
    
    const state = await this.checkCurrentState();
    
    console.log('Current State:');
    console.log(`- User count: ${state.authData.user_count}`);
    console.log(`- Users with roles: ${state.authData.users_with_roles}`);
    console.log(`- Existing tables: ${state.existingTables.join(', ') || 'none'}`);
    console.log(`- Migration needed: ${state.migrationNeeded ? 'YES' : 'NO'}\n`);
    
    if (state.migrationNeeded) {
      console.log('Tables to be created:');
      console.log('- user_permissions (with indexes)');
      console.log('- auth_audit_log (with indexes)');
      console.log('- feature_flags');
      console.log('- schema_migrations');
      
      console.log('\nColumns to be added to users table:');
      console.log('- is_active (BOOLEAN, default true)');
      console.log('- last_login (TIMESTAMP)');
      console.log('- role constraint (user, helper, co_admin, admin)');
      
      console.log('\nData initialization:');
      console.log('- Set admin role for user "leduc"');
      console.log('- Grant all scopes to admin user');
      console.log('- Set default "user" role for existing users');
      
      console.log('\nSafety measures:');
      console.log('- Full database backup before execution');
      console.log('- Transaction rollback on any error');
      console.log('- Migration tracking for rollback capability');
    } else {
      console.log('✅ Database already up to date - no migration needed');
    }
    
    console.log('\n🚀 To execute migration: node scripts/migrate-auth-unified.js --execute');
  }

  /**
   * Rollback the migration
   */
  async rollback() {
    const client = await pool.connect();
    
    try {
      console.log('🔄 Rolling back migration...');
      
      await client.query('BEGIN');
      
      // Get rollback SQL for this migration
      const rollbackResult = await client.query(`
        SELECT rollback_sql 
        FROM schema_migrations 
        WHERE migration_id = $1
      `, [this.migrationId]);
      
      if (rollbackResult.rows.length === 0) {
        throw new Error('Migration not found in schema_migrations table');
      }
      
      // Execute rollback SQL
      const rollbackSQL = rollbackResult.rows[0].rollback_sql;
      if (rollbackSQL) {
        await client.query(rollbackSQL);
      }
      
      // Remove migration record
      await client.query(`
        DELETE FROM schema_migrations 
        WHERE migration_id = $1
      `, [this.migrationId]);
      
      await client.query('COMMIT');
      
      console.log('✅ Migration rolled back successfully');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Rollback failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate rollback SQL
   */
  generateRollbackSQL() {
    return `
      DROP TABLE IF EXISTS user_permissions;
      DROP TABLE IF EXISTS auth_audit_log;
      DROP TABLE IF EXISTS feature_flags;
      ALTER TABLE users DROP COLUMN IF EXISTS is_active;
      ALTER TABLE users DROP COLUMN IF EXISTS last_login;
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    `;
  }

  /**
   * Log migration events
   */
  async logMigrationEvent(event, details) {
    try {
      const client = await pool.connect();
      try {
        await client.query(`
          INSERT INTO auth_audit_log (user_id, action, details, timestamp)
          VALUES (NULL, $1, $2, CURRENT_TIMESTAMP)
        `, [event, JSON.stringify(details)]);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Failed to log migration event:', error.message);
    }
  }

  /**
   * Verify migration success
   */
  async verify() {
    const client = await pool.connect();
    
    try {
      console.log('🔍 Verifying migration...');
      
      // Check all tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('user_permissions', 'auth_audit_log', 'feature_flags', 'schema_migrations')
      `);
      
      const expectedTables = ['user_permissions', 'auth_audit_log', 'feature_flags', 'schema_migrations'];
      const existingTables = tablesResult.rows.map(row => row.table_name);
      
      for (const table of expectedTables) {
        if (existingTables.includes(table)) {
          console.log(`✅ Table ${table} exists`);
        } else {
          console.log(`❌ Table ${table} missing`);
        }
      }
      
      // Check admin user configuration
      const adminResult = await client.query(`
        SELECT username, role, is_active 
        FROM users 
        WHERE username = 'leduc'
      `);
      
      if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0];
        console.log(`✅ Admin user: ${admin.username}, role: ${admin.role}, active: ${admin.is_active}`);
      } else {
        console.log('⚠️ Admin user "leduc" not found');
      }
      
      // Check permissions granted
      const permissionsResult = await client.query(`
        SELECT COUNT(*) as permission_count 
        FROM user_permissions up
        JOIN users u ON up.user_id = u.id
        WHERE u.username = 'leduc'
      `);
      
      console.log(`✅ Admin permissions granted: ${permissionsResult.rows[0].permission_count}`);
      
      // Check migration record
      const migrationResult = await client.query(`
        SELECT migration_id, executed_at 
        FROM schema_migrations 
        WHERE migration_id = $1
      `, [this.migrationId]);
      
      if (migrationResult.rows.length > 0) {
        console.log(`✅ Migration recorded: ${migrationResult.rows[0].executed_at}`);
      } else {
        console.log('❌ Migration record not found');
      }
      
      console.log('\n🎉 Migration verification completed!');
      
    } finally {
      client.release();
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const migration = new AuthMigration();
  
  try {
    switch (command) {
      case '--dry-run':
        await migration.dryRun();
        break;
        
      case '--execute':
        console.log('🚀 Executing AuthZ Service Database Migration');
        console.log('📋 ADR-001: Consolidate Authentication Systems\n');
        
        // Create backup first
        await migration.createBackup();
        
        // Execute migration
        await migration.executeMigration();
        
        // Verify success
        await migration.verify();
        
        console.log('\n✅ Migration completed successfully!');
        console.log('🔧 Next steps:');
        console.log('  1. Test AuthZ service functionality');
        console.log('  2. Enable feature flags gradually');
        console.log('  3. Update legacy routes to use new AuthZ service');
        break;
        
      case '--rollback':
        await migration.rollback();
        break;
        
      case '--verify':
        await migration.verify();
        break;
        
      default:
        console.log('Usage:');
        console.log('  node scripts/migrate-auth-unified.js --dry-run    # Preview changes');
        console.log('  node scripts/migrate-auth-unified.js --execute    # Execute migration');
        console.log('  node scripts/migrate-auth-unified.js --rollback   # Rollback changes');
        console.log('  node scripts/migrate-auth-unified.js --verify     # Verify migration');
        process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = AuthMigration;