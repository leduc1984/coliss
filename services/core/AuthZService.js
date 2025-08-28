/**
 * Unified Authentication and Authorization Service
 * Consolidates: routes/auth.js + routes/admin.js + dev-tools/api-gateway
 * ADR-001: Consolidate Authentication Systems
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { Pool } = require('pg');
const FeatureFlags = require('../../utils/FeatureFlags');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pokemon_mmo',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

class AuthZService {
  constructor() {
    // Scope-based permissions matrix
    this.SCOPES = {
      // Editor permissions
      'editor:map.write': ['admin', 'co_admin'],
      'editor:ui.write': ['admin'],
      'editor:monster.write': ['admin'],
      
      // Player management
      'player.ban': ['admin', 'co_admin'],
      'player.kick': ['admin', 'co_admin'],
      'player.mute': ['admin', 'co_admin', 'helper'],
      'player.teleport': ['admin', 'co_admin'],
      
      // Chat moderation
      'chat.moderate': ['admin', 'co_admin', 'helper'],
      'chat.announce': ['admin', 'co_admin'],
      'chat.clear': ['admin', 'co_admin'],
      
      // Server control
      'server.control': ['admin'],
      'server.shutdown': ['admin'],
      'admin.access': ['admin', 'co_admin'],
      
      // Battle system
      'battle.start': ['admin', 'co_admin', 'helper', 'user'],
      'battle.spectate': ['admin', 'co_admin', 'helper', 'user'],
      
      // Basic user permissions
      'user.login': ['admin', 'co_admin', 'helper', 'user'],
      'user.chat': ['admin', 'co_admin', 'helper', 'user']
    };
    
    this.ROLE_HIERARCHY = {
      'user': 1, 
      'helper': 2, 
      'co_admin': 3, 
      'admin': 4
    };
    
    // Audit event types
    this.AUDIT_EVENTS = {
      TOKEN_VALIDATED: 'token_validated',
      TOKEN_VALIDATION_FAILED: 'token_validation_failed',
      PERMISSION_DENIED: 'permission_denied',
      SCOPE_GRANTED: 'scope_granted',
      USER_LOGGED_IN: 'user_logged_in',
      USER_LOGGED_OUT: 'user_logged_out',
      PASSWORD_CHANGED: 'password_changed'
    };
  }

  /**
   * Check if user has permission for specific scope
   * @param {Object} user - User object with role property
   * @param {string} scope - Permission scope to check
   * @returns {boolean} - True if user has permission
   */
  can(user, scope) {
    if (!user?.role || !scope) {
      return false;
    }
    
    const allowedRoles = this.SCOPES[scope];
    if (!allowedRoles) {
      console.warn(`Unknown scope: ${scope}`);
      return false;
    }
    
    return allowedRoles.includes(user.role);
  }

  /**
   * Check if user has higher role than another user
   * @param {Object} user1 - First user
   * @param {Object} user2 - Second user 
   * @returns {boolean} - True if user1 has higher role
   */
  hasHigherRole(user1, user2) {
    const role1Level = this.ROLE_HIERARCHY[user1?.role] || 0;
    const role2Level = this.ROLE_HIERARCHY[user2?.role] || 0;
    return role1Level > role2Level;
  }

  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {string} - JWT token
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      issuer: 'pokemon-mmo',
      audience: 'game-client'
    });
  }

  /**
   * Validate JWT token and return user data
   * @param {string} token - JWT token to validate
   * @returns {Object} - User object from database
   */
  async validateToken(token) {
    try {
      // Verify JWT signature and expiration
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check token age (additional security)
      const tokenAge = Date.now() / 1000 - decoded.iat;
      if (tokenAge > 8 * 60 * 60) { // 8 hours
        throw new Error('Token expired');
      }
      
      const client = await pool.connect();
      
      try {
        // Get user from database
        const result = await client.query(
          `SELECT id, username, email, role, is_active, created_at, last_login
           FROM users 
           WHERE id = $1 AND is_active = true`,
          [decoded.userId]
        );
        
        if (!result.rows[0]) {
          throw new Error('User not found or inactive');
        }
        
        const user = result.rows[0];
        
        // Log successful authentication
        await this.logAuthEvent(user.id, this.AUDIT_EVENTS.TOKEN_VALIDATED, {
          userAgent: 'server',
          timestamp: new Date().toISOString(),
          tokenExp: decoded.exp
        });
        
        return user;
      } finally {
        client.release();
      }
    } catch (error) {
      await this.logAuthEvent(null, this.AUDIT_EVENTS.TOKEN_VALIDATION_FAILED, {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw new Error('Token validation failed: ' + error.message);
    }
  }

  /**
   * Authenticate user with username/password
   * @param {string} username - Username
   * @param {string} password - Password 
   * @returns {Object} - { user, token }
   */
  async authenticate(username, password) {
    // Input validation
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    if (!validator.isAlphanumeric(username.replace('_', '')) || username.length < 3) {
      throw new Error('Invalid username format');
    }

    const client = await pool.connect();
    
    try {
      // Get user with password hash
      const result = await client.query(
        `SELECT id, username, email, password, role, is_active, created_at, last_login
         FROM users 
         WHERE username = $1 AND is_active = true`,
        [username]
      );
      
      if (!result.rows[0]) {
        await this.logAuthEvent(null, 'login_failed', {
          username,
          reason: 'user_not_found',
          timestamp: new Date().toISOString()
        });
        throw new Error('Invalid credentials');
      }
      
      const user = result.rows[0];
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        await this.logAuthEvent(user.id, 'login_failed', {
          username,
          reason: 'invalid_password',
          timestamp: new Date().toISOString()
        });
        throw new Error('Invalid credentials');
      }
      
      // Update last login
      await client.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
      
      // Remove password from returned user object
      delete user.password;
      
      // Generate token
      const token = this.generateToken(user);
      
      // Log successful login
      await this.logAuthEvent(user.id, this.AUDIT_EVENTS.USER_LOGGED_IN, {
        username,
        timestamp: new Date().toISOString()
      });
      
      return { user, token };
    } finally {
      client.release();
    }
  }

  /**
   * Register new user
   * @param {string} username - Username
   * @param {string} email - Email
   * @param {string} password - Password
   * @returns {Object} - { user, token }
   */
  async register(username, email, password) {
    // Input validation
    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required');
    }

    if (!validator.isEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (!validator.isAlphanumeric(username.replace('_', '')) || username.length < 3) {
      throw new Error('Username must be at least 3 characters and alphanumeric');
    }

    // Password strength validation
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
      throw new Error('Password must contain uppercase, lowercase, digit, and special character');
    }

    const client = await pool.connect();
    
    try {
      // Check if username or email already exists
      const existingResult = await client.query(
        'SELECT username, email FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );
      
      if (existingResult.rows.length > 0) {
        const existing = existingResult.rows[0];
        if (existing.username === username) {
          throw new Error('Username already exists');
        }
        if (existing.email === email) {
          throw new Error('Email already exists');
        }
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Insert new user
      const insertResult = await client.query(
        `INSERT INTO users (username, email, password, role, is_active, created_at, last_login)
         VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id, username, email, role, is_active, created_at, last_login`,
        [username, email, hashedPassword, 'user']
      );
      
      const user = insertResult.rows[0];
      
      // Generate token
      const token = this.generateToken(user);
      
      // Log user registration
      await this.logAuthEvent(user.id, 'user_registered', {
        username,
        email,
        timestamp: new Date().toISOString()
      });
      
      return { user, token };
    } finally {
      client.release();
    }
  }

  /**
   * Express middleware to require authentication
   * @returns {Function} - Express middleware function
   */
  requireAuth() {
    return async (req, res, next) => {
      try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ 
            message: 'Access token required',
            code: 'TOKEN_MISSING'
          });
        }
        
        const user = await this.validateToken(token);
        req.user = user;
        next();
      } catch (error) {
        return res.status(401).json({ 
          message: 'Invalid token',
          code: 'TOKEN_INVALID',
          error: error.message
        });
      }
    };
  }

  /**
   * Express middleware to require specific scope
   * @param {string} scope - Required permission scope
   * @returns {Function} - Express middleware function
   */
  requireScope(scope) {
    return async (req, res, next) => {
      try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ 
            message: 'Access token required',
            requiredScope: scope,
            code: 'TOKEN_MISSING'
          });
        }
        
        const user = await this.validateToken(token);
        req.user = user;
        
        if (!this.can(user, scope)) {
          await this.logAuthEvent(user.id, this.AUDIT_EVENTS.PERMISSION_DENIED, {
            requiredScope: scope,
            userRole: user.role,
            timestamp: new Date().toISOString()
          });
          
          return res.status(403).json({ 
            message: `Insufficient permissions. Required scope: ${scope}`,
            userRole: user.role,
            requiredScope: scope,
            code: 'INSUFFICIENT_PERMISSIONS'
          });
        }
        
        next();
      } catch (error) {
        return res.status(401).json({ 
          message: 'Invalid token',
          code: 'TOKEN_INVALID',
          error: error.message
        });
      }
    };
  }

  /**
   * Log authentication events for audit trail
   * @param {number} userId - User ID (null for anonymous events)
   * @param {string} action - Action type
   * @param {Object} details - Additional details
   */
  async logAuthEvent(userId, action, details = {}) {
    try {
      const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO auth_audit_log (user_id, action, details, timestamp)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [userId, action, JSON.stringify(details)]
        );
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Failed to log auth event:', error.message);
      // Don't throw - audit logging should not break main functionality
    }
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Object} - User object
   */
  async getUserById(userId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, username, email, role, is_active, created_at, last_login
         FROM users 
         WHERE id = $1`,
        [userId]
      );
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Update user role (admin only)
   * @param {number} actorId - ID of user performing the action
   * @param {number} targetId - ID of user to update
   * @param {string} newRole - New role to assign
   */
  async updateUserRole(actorId, targetId, newRole) {
    if (!['user', 'helper', 'co_admin', 'admin'].includes(newRole)) {
      throw new Error('Invalid role');
    }

    const client = await pool.connect();
    try {
      // Get both users
      const [actor, target] = await Promise.all([
        this.getUserById(actorId),
        this.getUserById(targetId)
      ]);

      if (!actor || !target) {
        throw new Error('User not found');
      }

      // Check permissions
      if (!this.can(actor, 'admin.access')) {
        throw new Error('Insufficient permissions to change roles');
      }

      // Prevent self-demotion for admins
      if (actorId === targetId && actor.role === 'admin' && newRole !== 'admin') {
        throw new Error('Admins cannot demote themselves');
      }

      // Update role
      await client.query(
        'UPDATE users SET role = $1 WHERE id = $2',
        [newRole, targetId]
      );

      // Log role change
      await this.logAuthEvent(actorId, 'role_changed', {
        targetUserId: targetId,
        targetUsername: target.username,
        oldRole: target.role,
        newRole,
        timestamp: new Date().toISOString()
      });

      return { success: true, message: `User role updated to ${newRole}` };
    } finally {
      client.release();
    }
  }

  /**
   * Get system health status
   * @returns {Object} - Health status
   */
  async getHealthStatus() {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT COUNT(*) as user_count FROM users WHERE is_active = true');
        
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'connected',
          activeUsers: parseInt(result.rows[0].user_count),
          uptime: process.uptime()
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      };
    }
  }
}

// Export singleton instance
const authZService = new AuthZService();
module.exports = authZService;