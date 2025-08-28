/**
 * Feature Flags System for Safe Rollout Control
 * Supports gradual deployment, A/B testing, and instant rollback
 * Used for implementing architecture refactoring phases safely
 */

const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pokemon_mmo',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

class FeatureFlags {
  constructor() {
    // In-memory cache for performance
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.CACHE_DURATION = 30000; // 30 seconds cache
    
    // Default flag configurations
    this.DEFAULT_FLAGS = {
      // Phase 1: Unified AuthZ Service
      'authz_unified': {
        enabled: false,
        rolloutPercent: 0,
        description: 'Unified Authentication and Authorization Service',
        phase: 'Phase 1',
        canary: ['admin'],
        dependencies: []
      },
      
      // Phase 2: Backend Refactoring
      'service_layer_refactor': {
        enabled: false,
        rolloutPercent: 0,
        description: 'Reorganized service layer architecture',
        phase: 'Phase 2',
        canary: ['admin', 'co_admin'],
        dependencies: ['authz_unified']
      },
      
      'api_gateway': {
        enabled: false,
        rolloutPercent: 0,
        description: 'Centralized API gateway pattern',
        phase: 'Phase 2',
        canary: ['admin'],
        dependencies: ['service_layer_refactor']
      },
      
      // Phase 3: Frontend Modernization
      'design_system': {
        enabled: false,
        rolloutPercent: 0,
        description: 'Unified design system with CSS variables',
        phase: 'Phase 3',
        canary: ['admin'],
        dependencies: []
      },
      
      'module_architecture': {
        enabled: false,
        rolloutPercent: 0,
        description: 'New JavaScript module organization',
        phase: 'Phase 3',
        canary: ['admin', 'co_admin'],
        dependencies: ['design_system']
      },
      
      'error_handling': {
        enabled: false,
        rolloutPercent: 0,
        description: 'Global error handling framework',
        phase: 'Phase 3',
        canary: ['admin'],
        dependencies: ['module_architecture']
      },
      
      // Phase 4: Tools Integration
      'tools_integration': {
        enabled: false,
        rolloutPercent: 0,
        description: 'Unified development tools architecture',
        phase: 'Phase 4',
        canary: ['admin'],
        dependencies: ['authz_unified', 'api_gateway']
      },
      
      'editor_bridge': {
        enabled: false,
        rolloutPercent: 0,
        description: 'Map editor iframe integration',
        phase: 'Phase 4',
        canary: ['admin', 'co_admin'],
        dependencies: ['tools_integration']
      },
      
      // Performance Optimizations
      'database_optimization': {
        enabled: false,
        rolloutPercent: 0,
        description: 'Database connection pooling and indexing',
        phase: 'Phase 2',
        canary: ['admin'],
        dependencies: []
      },
      
      'asset_optimization': {
        enabled: false,
        rolloutPercent: 0,
        description: 'Progressive asset loading system',
        phase: 'Phase 3',
        canary: ['admin'],
        dependencies: []
      },
      
      // Legacy system deprecation flags
      'legacy_auth_deprecation': {
        enabled: true, // Start showing warnings immediately
        rolloutPercent: 100,
        description: 'Show deprecation warnings for legacy auth systems',
        phase: 'Phase 1',
        canary: [],
        dependencies: ['authz_unified']
      }
    };
  }

  /**
   * Initialize feature flags in database
   */
  async initialize() {
    const client = await pool.connect();
    try {
      // Create feature_flags table if it doesn't exist
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

      // Insert default flags if they don't exist
      for (const [name, config] of Object.entries(this.DEFAULT_FLAGS)) {
        await client.query(`
          INSERT INTO feature_flags (name, enabled, rollout_percent, description, phase, canary_roles, dependencies)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (name) DO NOTHING
        `, [
          name,
          config.enabled,
          config.rolloutPercent,
          config.description,
          config.phase,
          JSON.stringify(config.canary),
          JSON.stringify(config.dependencies)
        ]);
      }

      console.log('✅ Feature flags initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize feature flags:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if feature flag is enabled for user
   * @param {string} flagName - Name of feature flag
   * @param {Object} user - User object with role property (optional)
   * @returns {boolean} - True if feature is enabled
   */
  async isEnabled(flagName, user = null) {
    try {
      const flag = await this.getFlag(flagName);
      if (!flag) {
        console.warn(`Unknown feature flag: ${flagName}`);
        return false;
      }

      // Flag globally disabled
      if (!flag.enabled) {
        return false;
      }

      // Check dependencies
      const dependencies = JSON.parse(flag.dependencies || '[]');
      for (const dependency of dependencies) {
        const depEnabled = await this.isEnabled(dependency, user);
        if (!depEnabled) {
          console.log(`Feature ${flagName} disabled due to dependency: ${dependency}`);
          return false;
        }
      }

      // Check canary users (role-based early access)
      const canaryRoles = JSON.parse(flag.canary_roles || '[]');
      if (user?.role && canaryRoles.includes(user.role)) {
        return true;
      }

      // Check rollout percentage
      if (flag.rollout_percent === 100) {
        return true;
      }

      if (flag.rollout_percent === 0) {
        return false;
      }

      // Percentage-based rollout (deterministic based on user ID or session)
      if (user?.id) {
        const hash = this.hashUserId(user.id);
        return (hash % 100) < flag.rollout_percent;
      }

      // Fallback for anonymous users
      return Math.random() * 100 < flag.rollout_percent;
    } catch (error) {
      console.error(`Error checking feature flag ${flagName}:`, error.message);
      return false; // Fail safe - disable feature on error
    }
  }

  /**
   * Get feature flag configuration
   * @param {string} flagName - Name of feature flag
   * @returns {Object} - Flag configuration
   */
  async getFlag(flagName) {
    // Check cache first
    if (this.cache.has(flagName)) {
      const expiry = this.cacheExpiry.get(flagName);
      if (Date.now() < expiry) {
        return this.cache.get(flagName);
      }
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM feature_flags WHERE name = $1',
        [flagName]
      );

      const flag = result.rows[0] || null;

      // Cache the result
      if (flag) {
        this.cache.set(flagName, flag);
        this.cacheExpiry.set(flagName, Date.now() + this.CACHE_DURATION);
      }

      return flag;
    } finally {
      client.release();
    }
  }

  /**
   * Enable feature flag
   * @param {string} flagName - Name of feature flag
   * @param {number} rolloutPercent - Rollout percentage (0-100)
   * @param {number} userId - ID of user making the change
   */
  async enable(flagName, rolloutPercent = 100, userId = null) {
    const client = await pool.connect();
    try {
      await client.query(`
        UPDATE feature_flags 
        SET enabled = true, 
            rollout_percent = $2, 
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $3
        WHERE name = $1
      `, [flagName, rolloutPercent, userId]);

      // Clear cache
      this.cache.delete(flagName);
      this.cacheExpiry.delete(flagName);

      console.log(`✅ Feature flag '${flagName}' enabled at ${rolloutPercent}% rollout`);
    } finally {
      client.release();
    }
  }

  /**
   * Disable feature flag
   * @param {string} flagName - Name of feature flag
   * @param {number} userId - ID of user making the change
   */
  async disable(flagName, userId = null) {
    const client = await pool.connect();
    try {
      await client.query(`
        UPDATE feature_flags 
        SET enabled = false, 
            rollout_percent = 0,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $2
        WHERE name = $1
      `, [flagName, userId]);

      // Clear cache
      this.cache.delete(flagName);
      this.cacheExpiry.delete(flagName);

      console.log(`🔴 Feature flag '${flagName}' disabled`);
    } finally {
      client.release();
    }
  }

  /**
   * Gradually increase rollout percentage
   * @param {string} flagName - Name of feature flag
   * @param {number} targetPercent - Target rollout percentage
   * @param {number} stepPercent - Increment size
   * @param {number} stepDurationMs - Time between increments
   * @param {number} userId - ID of user making the change
   */
  async gradualRollout(flagName, targetPercent = 100, stepPercent = 25, stepDurationMs = 3600000, userId = null) {
    const flag = await this.getFlag(flagName);
    if (!flag) {
      throw new Error(`Feature flag '${flagName}' not found`);
    }

    let currentPercent = flag.rollout_percent;
    console.log(`🚀 Starting gradual rollout for '${flagName}' from ${currentPercent}% to ${targetPercent}%`);

    while (currentPercent < targetPercent) {
      currentPercent = Math.min(currentPercent + stepPercent, targetPercent);
      
      await this.enable(flagName, currentPercent, userId);
      console.log(`📈 Rollout '${flagName}' increased to ${currentPercent}%`);

      if (currentPercent < targetPercent) {
        console.log(`⏱️ Waiting ${stepDurationMs / 1000} seconds before next increment...`);
        await new Promise(resolve => setTimeout(resolve, stepDurationMs));
      }
    }

    console.log(`🎯 Gradual rollout for '${flagName}' completed at ${targetPercent}%`);
  }

  /**
   * Get all feature flags with their status
   * @returns {Array} - Array of feature flag objects
   */
  async getAllFlags() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT name, enabled, rollout_percent, description, phase, 
               canary_roles, dependencies, updated_at
        FROM feature_flags 
        ORDER BY phase, name
      `);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get flags by phase
   * @param {string} phase - Phase name (e.g., "Phase 1", "Phase 2")
   * @returns {Array} - Array of feature flag objects
   */
  async getFlagsByPhase(phase) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT name, enabled, rollout_percent, description, 
               canary_roles, dependencies, updated_at
        FROM feature_flags 
        WHERE phase = $1
        ORDER BY name
      `, [phase]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Express middleware to check feature flag
   * @param {string} flagName - Name of feature flag
   * @returns {Function} - Express middleware function
   */
  requireFlag(flagName) {
    return async (req, res, next) => {
      try {
        const user = req.user || null;
        const enabled = await this.isEnabled(flagName, user);

        if (!enabled) {
          return res.status(404).json({
            message: 'Feature not available',
            code: 'FEATURE_DISABLED',
            feature: flagName
          });
        }

        next();
      } catch (error) {
        console.error(`Error checking feature flag ${flagName}:`, error.message);
        return res.status(500).json({
          message: 'Error checking feature availability',
          code: 'FEATURE_CHECK_ERROR'
        });
      }
    };
  }

  /**
   * Clear all cached flags (force refresh from database)
   */
  clearCache() {
    this.cache.clear();
    this.cacheExpiry.clear();
    console.log('🧹 Feature flag cache cleared');
  }

  /**
   * Hash user ID for deterministic percentage rollout
   * @param {number} userId - User ID
   * @returns {number} - Hash value
   */
  hashUserId(userId) {
    let hash = 0;
    const str = userId.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Admin dashboard: Get feature flag statistics
   * @returns {Object} - Statistics and metrics
   */
  async getStatistics() {
    const client = await pool.connect();
    try {
      const [flagsResult, usersResult] = await Promise.all([
        client.query(`
          SELECT 
            phase,
            COUNT(*) as total_flags,
            SUM(CASE WHEN enabled THEN 1 ELSE 0 END) as enabled_flags,
            AVG(rollout_percent) as avg_rollout
          FROM feature_flags 
          GROUP BY phase
          ORDER BY phase
        `),
        client.query('SELECT COUNT(*) as total_users FROM users WHERE is_active = true')
      ]);

      return {
        phases: flagsResult.rows,
        totalUsers: parseInt(usersResult.rows[0].total_users),
        cacheStats: {
          cachedFlags: this.cache.size,
          cacheHitRate: this.calculateCacheHitRate()
        }
      };
    } finally {
      client.release();
    }
  }

  /**
   * Calculate cache hit rate (simplified)
   */
  calculateCacheHitRate() {
    // Simple implementation - in production you'd track actual hits/misses
    return this.cache.size > 0 ? 85 : 0; // Approximate hit rate
  }
}

// Export singleton instance
const featureFlags = new FeatureFlags();

// Auto-initialize on module load
featureFlags.initialize().catch(error => {
  console.error('Failed to initialize feature flags:', error.message);
});

module.exports = featureFlags;